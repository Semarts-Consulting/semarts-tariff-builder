import { parseRequiredImportNumber, validateImportHeaders } from "@/lib/import-utils";
import type { HalfHourlyImportRow } from "@/types/project";

export const boundaryMeterHeaders = [
  "MPAN",
  "Date",
  "Total kWh",
  ...Array.from({ length: 48 }, (_, index) => String(index + 1))
];

export type BoundaryMeterParseResult = {
  parsedRows: HalfHourlyImportRow[];
  errors: string[];
};

export type BoundaryMeterMergeResult = {
  rows: HalfHourlyImportRow[];
  added: number;
  replaced: number;
  skippedDuplicates: number;
};

export type BoundaryMeterSummary = {
  rowCount: number;
  mpanCount: number;
  firstDate: string;
  lastDate: string;
  expectedPeriodCount: number;
  actualPeriodCount: number;
  invalidPeriodValues: number;
  duplicateKeys: number;
  totalFromRows: number;
  totalFromHalfHours: number;
  variance: number;
  hasIssues: boolean;
};

export type BoundaryMeterRowReview = {
  periodSum: number;
  invalidPeriods: number;
  variance: number;
  status: "Healthy" | "Invalid periods" | "Variance";
};

export type BoundaryMeterUploadBatch = BoundaryMeterSummary & {
  batchId: string;
  rows: HalfHourlyImportRow[];
  fileName: string;
  uploadedAt: string;
};

function normaliseMpan(value: unknown) {
  return String(value ?? "").trim();
}

function excelSerialDateToIso(value: number) {
  const excelEpoch = Date.UTC(1899, 11, 30);
  const parsed = new Date(excelEpoch + value * 24 * 60 * 60 * 1000);

  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function normaliseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    return excelSerialDateToIso(value);
  }

  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return text;
}

export function createBoundaryMeterFingerprint(
  row: Pick<HalfHourlyImportRow, "mpan" | "date" | "totalKwh" | "settlementPeriodKwh">
) {
  return [row.mpan, row.date, row.totalKwh, ...row.settlementPeriodKwh].join("|");
}

export function createBoundaryMeterKey(row: Pick<HalfHourlyImportRow, "mpan" | "date">) {
  return `${row.mpan}::${row.date}`;
}

export function createBoundaryMeterImportBatchId() {
  return `hh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function validateBoundaryHeaders(headerRow: unknown[]) {
  return validateImportHeaders(boundaryMeterHeaders, headerRow);
}

export function parseBoundaryMeterRows(
  rows: unknown[][],
  sourceFileName: string,
  uploadedAt: string,
  importBatchId: string
): BoundaryMeterParseResult {
  const parsedRows: HalfHourlyImportRow[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateBoundaryHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: [
        "The selected workbook does not match the template headers: MPAN, Date, Total kWh, 1 to 48."
      ]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const excelRowNumber = index + 2;
    const hasValues = row.some((value) => String(value ?? "").trim() !== "");

    if (!hasValues) {
      return;
    }

    const mpan = normaliseMpan(row[0]);
    const date = normaliseDate(row[1]);
    const totalKwh = parseRequiredImportNumber(row[2]);
    const settlementPeriodKwh = row.slice(3, 51).map(parseRequiredImportNumber);

    if (!mpan) {
      errors.push(`Row ${excelRowNumber}: MPAN is required.`);
    }

    if (!date) {
      errors.push(`Row ${excelRowNumber}: Date is required.`);
    }

    if (totalKwh === null) {
      errors.push(`Row ${excelRowNumber}: Total kWh must be numeric.`);
    }

    if (settlementPeriodKwh.length !== 48 || settlementPeriodKwh.some((value) => value === null)) {
      errors.push(`Row ${excelRowNumber}: settlement periods 1 to 48 must all be numeric.`);
    }

    if (
      !mpan ||
      !date ||
      totalKwh === null ||
      settlementPeriodKwh.some((value) => value === null)
    ) {
      return;
    }

    const numericSettlementPeriods = settlementPeriodKwh.map((value) => value ?? 0);
    const baseRow = {
      mpan,
      date,
      totalKwh,
      settlementPeriodKwh: numericSettlementPeriods
    };

    parsedRows.push({
      id: `${importBatchId}-${parsedRows.length + 1}`,
      ...baseRow,
      sourceFileName,
      uploadedAt,
      importBatchId,
      rowFingerprint: createBoundaryMeterFingerprint(baseRow)
    });
  });

  return { parsedRows, errors };
}

export function mergeBoundaryMeterRows(
  existingRows: HalfHourlyImportRow[],
  incomingRows: HalfHourlyImportRow[]
): BoundaryMeterMergeResult {
  const byKey = new Map(existingRows.map((row) => [createBoundaryMeterKey(row), row]));
  const seenIncomingFingerprints = new Set<string>();
  let added = 0;
  let replaced = 0;
  let skippedDuplicates = 0;

  incomingRows.forEach((row) => {
    const key = createBoundaryMeterKey(row);
    const existing = byKey.get(key);

    if (seenIncomingFingerprints.has(row.rowFingerprint)) {
      skippedDuplicates += 1;
      return;
    }

    seenIncomingFingerprints.add(row.rowFingerprint);

    if (existing?.rowFingerprint === row.rowFingerprint) {
      skippedDuplicates += 1;
      return;
    }

    if (existing) {
      replaced += 1;
    } else {
      added += 1;
    }

    byKey.set(key, row);
  });

  return {
    rows: Array.from(byKey.values()).sort((a, b) =>
      `${a.mpan}${a.date}`.localeCompare(`${b.mpan}${b.date}`)
    ),
    added,
    replaced,
    skippedDuplicates
  };
}

export function getBoundaryMeterSummary(rows: HalfHourlyImportRow[]): BoundaryMeterSummary {
  const dates = rows.map((row) => row.date).filter(Boolean).sort();
  const mpans = new Set(rows.map((row) => row.mpan).filter(Boolean));
  const rowKeys = new Set<string>();
  let duplicateKeys = 0;
  let actualPeriodCount = 0;
  let invalidPeriodValues = 0;
  let totalFromRows = 0;
  let totalFromHalfHours = 0;

  rows.forEach((row) => {
    const key = createBoundaryMeterKey(row);

    if (rowKeys.has(key)) {
      duplicateKeys += 1;
    }

    rowKeys.add(key);
    totalFromRows += row.totalKwh;

    row.settlementPeriodKwh.forEach((periodValue) => {
      if (Number.isFinite(periodValue)) {
        actualPeriodCount += 1;
        totalFromHalfHours += periodValue;
      } else {
        invalidPeriodValues += 1;
      }
    });

    if (row.settlementPeriodKwh.length < 48) {
      invalidPeriodValues += 48 - row.settlementPeriodKwh.length;
    }
  });

  const expectedPeriodCount = rows.length * 48;
  const variance = totalFromRows - totalFromHalfHours;

  return {
    rowCount: rows.length,
    mpanCount: mpans.size,
    firstDate: dates[0] ?? "",
    lastDate: dates[dates.length - 1] ?? "",
    expectedPeriodCount,
    actualPeriodCount,
    invalidPeriodValues,
    duplicateKeys,
    totalFromRows,
    totalFromHalfHours,
    variance,
    hasIssues:
      invalidPeriodValues > 0 ||
      duplicateKeys > 0 ||
      actualPeriodCount !== expectedPeriodCount ||
      Math.abs(variance) > 0.01
  };
}

export function getBoundaryMeterRowReview(row: HalfHourlyImportRow): BoundaryMeterRowReview {
  const periodSum = row.settlementPeriodKwh.reduce(
    (total, periodValue) => total + (Number.isFinite(periodValue) ? periodValue : 0),
    0
  );
  const invalidPeriods =
    row.settlementPeriodKwh.filter((periodValue) => !Number.isFinite(periodValue)).length +
    Math.max(48 - row.settlementPeriodKwh.length, 0);
  const variance = row.totalKwh - periodSum;
  const status =
    invalidPeriods > 0 ? "Invalid periods" : Math.abs(variance) > 0.01 ? "Variance" : "Healthy";

  return {
    periodSum,
    invalidPeriods,
    variance,
    status
  };
}

export function getBoundaryMeterUploadBatches(
  rows: HalfHourlyImportRow[]
): BoundaryMeterUploadBatch[] {
  const batches = new Map<string, HalfHourlyImportRow[]>();

  rows.forEach((row) => {
    const key = row.importBatchId || "unknown";
    const currentRows = batches.get(key) ?? [];
    currentRows.push(row);
    batches.set(key, currentRows);
  });

  return Array.from(batches.entries())
    .map(([batchId, batchRows]) => {
      const summary = getBoundaryMeterSummary(batchRows);
      const latestRow = [...batchRows].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];

      return {
        batchId,
        rows: batchRows,
        fileName: latestRow?.sourceFileName || "Unknown file",
        uploadedAt: latestRow?.uploadedAt || "",
        ...summary
      };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}
