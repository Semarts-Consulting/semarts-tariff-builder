import { describe, expect, it } from "vitest";
import {
  boundaryMeterHeaders,
  createBoundaryMeterFingerprint,
  getBoundaryMeterRowReview,
  getBoundaryMeterSummary,
  mergeBoundaryMeterRows,
  parseBoundaryMeterRows,
  validateBoundaryHeaders
} from "@/lib/boundary-meter-import";
import type { HalfHourlyImportRow } from "@/types/project";

function createWorkbookRow(overrides: Partial<{
  mpan: string;
  date: unknown;
  totalKwh: number;
  periods: number[];
}> = {}) {
  const periods = overrides.periods ?? Array.from({ length: 48 }, () => 1);

  return [
    overrides.mpan ?? "1234567890123",
    overrides.date ?? "2026-04-01",
    overrides.totalKwh ?? 48,
    ...periods
  ];
}

function createImportRow(overrides: Partial<HalfHourlyImportRow> = {}): HalfHourlyImportRow {
  const baseRow = {
    mpan: overrides.mpan ?? "1234567890123",
    date: overrides.date ?? "2026-04-01",
    totalKwh: overrides.totalKwh ?? 48,
    settlementPeriodKwh: overrides.settlementPeriodKwh ?? Array.from({ length: 48 }, () => 1)
  };

  return {
    id: overrides.id ?? "row-1",
    ...baseRow,
    sourceFileName: overrides.sourceFileName ?? "hh.xlsx",
    uploadedAt: overrides.uploadedAt ?? "2026-06-21T10:00:00.000Z",
    importBatchId: overrides.importBatchId ?? "batch-1",
    rowFingerprint: overrides.rowFingerprint ?? createBoundaryMeterFingerprint(baseRow)
  };
}

describe("boundary meter import", () => {
  it("validates the expected template headers", () => {
    expect(validateBoundaryHeaders(boundaryMeterHeaders)).toBe(true);
    expect(
      validateBoundaryHeaders([
        " mpan ",
        "DATE",
        " total kwh ",
        ...Array.from({ length: 48 }, (_, index) => ` ${index + 1} `)
      ])
    ).toBe(true);
    expect(validateBoundaryHeaders(["Date", "MPAN", "Total kWh"])).toBe(false);
  });

  it("parses valid workbook rows and normalises Excel serial dates", () => {
    const result = parseBoundaryMeterRows(
      [boundaryMeterHeaders, createWorkbookRow({ date: "2026-04-01" }), createWorkbookRow({ date: 46114 })],
      "hh.xlsx",
      "2026-06-21T10:00:00.000Z",
      "batch-1"
    );

    expect(result.errors).toEqual([]);
    expect(result.parsedRows).toHaveLength(2);
    expect(result.parsedRows[0]).toMatchObject({
      mpan: "1234567890123",
      date: "2026-04-01",
      totalKwh: 48,
      sourceFileName: "hh.xlsx",
      importBatchId: "batch-1"
    });
    expect(result.parsedRows[1]?.date).toBe("2026-04-02");
  });

  it("skips blank workbook rows while preserving later validation row numbers", () => {
    const result = parseBoundaryMeterRows(
      [
        boundaryMeterHeaders,
        ["", "", "", ...Array.from({ length: 48 }, () => "")],
        createWorkbookRow({ mpan: "", totalKwh: Number.NaN }),
        createWorkbookRow({ mpan: "1234567890123", totalKwh: 48 })
      ],
      "hh.xlsx",
      "2026-06-21T10:00:00.000Z",
      "batch-1"
    );

    expect(result.parsedRows).toHaveLength(1);
    expect(result.parsedRows[0]).toMatchObject({
      mpan: "1234567890123",
      totalKwh: 48
    });
    expect(result.errors).toContain("Row 3: MPAN is required.");
    expect(result.errors).toContain("Row 3: Total kWh must be numeric.");
  });

  it("returns row-level errors while preserving existing short-row import behavior", () => {
    const result = parseBoundaryMeterRows(
      [
        boundaryMeterHeaders,
        createWorkbookRow({ mpan: "", totalKwh: Number.NaN }),
        ["1234567890123", "2026-04-01", 48, ...Array.from({ length: 47 }, () => 1)]
      ],
      "hh.xlsx",
      "2026-06-21T10:00:00.000Z",
      "batch-1"
    );

    expect(result.parsedRows).toHaveLength(1);
    expect(result.parsedRows[0]).toMatchObject({
      mpan: "1234567890123",
      date: "2026-04-01",
      totalKwh: 48,
      settlementPeriodKwh: Array.from({ length: 47 }, () => 1)
    });
    expect(result.errors).toContain("Row 2: MPAN is required.");
    expect(result.errors).toContain("Row 2: Total kWh must be numeric.");
    expect(result.errors).toContain("Row 3: settlement periods 1 to 48 must all be numeric.");
  });

  it("replaces changed rows by MPAN and date while skipping identical duplicates", () => {
    const existingRow = createImportRow();
    const duplicateRow = createImportRow({ id: "row-2" });
    const replacementRow = createImportRow({
      id: "row-3",
      totalKwh: 96,
      settlementPeriodKwh: Array.from({ length: 48 }, () => 2)
    });

    const result = mergeBoundaryMeterRows(existingRow ? [existingRow] : [], [
      duplicateRow,
      replacementRow
    ]);

    expect(result.added).toBe(0);
    expect(result.replaced).toBe(1);
    expect(result.skippedDuplicates).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.totalKwh).toBe(96);
  });

  it("reports reconciliation variance without blocking parsed rows", () => {
    const row = createImportRow({ totalKwh: 50 });
    const summary = getBoundaryMeterSummary([row]);
    const review = getBoundaryMeterRowReview(row);

    expect(summary.hasIssues).toBe(true);
    expect(summary.variance).toBe(2);
    expect(review.status).toBe("Variance");
    expect(review.periodSum).toBe(48);
  });
});
