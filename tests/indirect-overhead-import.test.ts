import { describe, expect, it } from "vitest";
import {
  createIndirectOverheadFingerprint,
  indirectOverheadHeaders,
  mergeIndirectOverheadRows,
  parseIndirectOverheadRows,
  validateIndirectOverheadHeaders
} from "@/lib/indirect-overhead-import";
import type { IndirectOverheadInput } from "@/types/project";

function createWorkbookRow(overrides: Partial<{
  description: string;
  annualCost: number | string;
}> = {}) {
  return [overrides.description ?? "Finance overhead", overrides.annualCost ?? 18000];
}

function createOverheadRow(
  overrides: Partial<IndirectOverheadInput> = {}
): IndirectOverheadInput {
  const baseRow = {
    description: overrides.description ?? "Finance overhead",
    annualCost: overrides.annualCost ?? 18000
  };

  return {
    id: overrides.id ?? "overhead-1",
    ...baseRow,
    comment: overrides.comment ?? "",
    sourceFileName: overrides.sourceFileName ?? "overheads.xlsx",
    uploadedAt: overrides.uploadedAt ?? "2026-06-21T10:00:00.000Z",
    importBatchId: overrides.importBatchId ?? "overhead-batch-1",
    rowFingerprint: overrides.rowFingerprint ?? createIndirectOverheadFingerprint(baseRow)
  };
}

describe("indirect overhead import", () => {
  it("validates the expected template headers", () => {
    expect(validateIndirectOverheadHeaders(indirectOverheadHeaders)).toBe(true);
    expect(validateIndirectOverheadHeaders([" description ", "ANNUAL COST"])).toBe(true);
    expect(validateIndirectOverheadHeaders(["Annual Cost", "Description"])).toBe(false);
  });

  it("parses valid workbook rows", () => {
    const result = parseIndirectOverheadRows(
      [indirectOverheadHeaders, createWorkbookRow({ annualCost: "18,000" })],
      "overheads.xlsx",
      "2026-06-21T10:00:00.000Z",
      "overhead-batch-1"
    );

    expect(result.errors).toEqual([]);
    expect(result.parsedRows).toHaveLength(1);
    expect(result.parsedRows[0]).toMatchObject({
      description: "Finance overhead",
      annualCost: 18000,
      comment: "",
      sourceFileName: "overheads.xlsx",
      importBatchId: "overhead-batch-1"
    });
  });

  it("skips blank workbook rows while preserving later validation row numbers", () => {
    const result = parseIndirectOverheadRows(
      [
        indirectOverheadHeaders,
        ["", ""],
        createWorkbookRow({ description: "", annualCost: "not a number" }),
        createWorkbookRow({ description: "Insurance overhead", annualCost: "9,500.25" })
      ],
      "overheads.xlsx",
      "2026-06-21T10:00:00.000Z",
      "overhead-batch-1"
    );

    expect(result.parsedRows).toHaveLength(1);
    expect(result.parsedRows[0]).toMatchObject({
      description: "Insurance overhead",
      annualCost: 9500.25
    });
    expect(result.errors).toContain("Row 3: Description is required.");
    expect(result.errors).toContain("Row 3: Annual Cost must be zero or greater.");
  });

  it("returns row-level errors without importing invalid rows", () => {
    const result = parseIndirectOverheadRows(
      [
        indirectOverheadHeaders,
        createWorkbookRow({ description: "", annualCost: -1 }),
        createWorkbookRow({ description: "Bad numeric", annualCost: "not a number" })
      ],
      "overheads.xlsx",
      "2026-06-21T10:00:00.000Z",
      "overhead-batch-1"
    );

    expect(result.parsedRows).toHaveLength(0);
    expect(result.errors).toContain("Row 2: Description is required.");
    expect(result.errors).toContain("Row 2: Annual Cost must be zero or greater.");
    expect(result.errors).toContain("Row 3: Annual Cost must be zero or greater.");
  });

  it("replaces changed rows by description while skipping identical duplicates", () => {
    const existingRow = createOverheadRow();
    const duplicateRow = createOverheadRow({ id: "overhead-2" });
    const replacementRow = createOverheadRow({
      id: "overhead-3",
      annualCost: 22000
    });

    const result = mergeIndirectOverheadRows([existingRow], [duplicateRow, replacementRow]);

    expect(result.added).toBe(0);
    expect(result.replaced).toBe(1);
    expect(result.skippedDuplicates).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.annualCost).toBe(22000);
  });
});
