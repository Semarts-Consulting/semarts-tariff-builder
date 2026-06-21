import {
  createImportedRowId,
  parseRequiredImportNumber,
  validateImportHeaders
} from "@/lib/import-utils";
import type { DirectCostInput } from "@/types/project";

export const directCostHeaders = ["Description", "Cost by Type", "Annual Value"];

export type DirectCostParseResult = {
  parsedRows: DirectCostInput[];
  errors: string[];
};

export type DirectCostMergeResult = {
  rows: DirectCostInput[];
  added: number;
  replaced: number;
  skippedDuplicates: number;
};

export function createDirectCostImportBatchId() {
  return `direct-cost-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function validateDirectCostHeaders(headerRow: unknown[]) {
  return validateImportHeaders(directCostHeaders, headerRow);
}

export function createDirectCostKey(row: Pick<DirectCostInput, "description" | "costByType">) {
  return [row.description, row.costByType]
    .map((value) => String(value).trim().toLowerCase())
    .join("::");
}

export function createDirectCostFingerprint(
  row: Pick<DirectCostInput, "description" | "costByType" | "annualValue">
) {
  return [row.description, row.costByType, row.annualValue]
    .map((value) => String(value).trim().toLowerCase())
    .join("|");
}

export function parseDirectCostRows(
  rows: unknown[][],
  sourceFileName: string,
  uploadedAt: string,
  importBatchId: string
): DirectCostParseResult {
  const parsedRows: DirectCostInput[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateDirectCostHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: ["The selected workbook does not match the direct cost template headers."]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const excelRowNumber = index + 2;
    const hasValues = row.some((value) => String(value ?? "").trim() !== "");

    if (!hasValues) {
      return;
    }

    const description = String(row[0] ?? "").trim();
    const costByType = String(row[1] ?? "").trim();
    const annualValue = parseRequiredImportNumber(row[2]);

    if (!description) {
      errors.push(`Row ${excelRowNumber}: Description is required.`);
    }

    if (!costByType) {
      errors.push(`Row ${excelRowNumber}: Cost by Type is required.`);
    }

    if (annualValue === null || annualValue < 0) {
      errors.push(`Row ${excelRowNumber}: Annual Value must be zero or greater.`);
    }

    if (!description || !costByType || annualValue === null || annualValue < 0) {
      return;
    }

    const baseRow = {
      description,
      costByType,
      annualValue
    };

    parsedRows.push({
      id: createImportedRowId("direct-cost-import", parsedRows.length + 1),
      ...baseRow,
      comment: "",
      sourceFileName,
      uploadedAt,
      importBatchId,
      rowFingerprint: createDirectCostFingerprint(baseRow)
    });
  });

  return { parsedRows, errors };
}

export function mergeDirectCostRows(
  existingRows: DirectCostInput[],
  incomingRows: DirectCostInput[]
): DirectCostMergeResult {
  const byKey = new Map(existingRows.map((row) => [createDirectCostKey(row), row]));
  const seenIncomingFingerprints = new Set<string>();
  let added = 0;
  let replaced = 0;
  let skippedDuplicates = 0;

  incomingRows.forEach((row) => {
    const key = createDirectCostKey(row);
    const fingerprint = row.rowFingerprint || createDirectCostFingerprint(row);
    const existing = byKey.get(key);

    if (seenIncomingFingerprints.has(fingerprint)) {
      skippedDuplicates += 1;
      return;
    }

    seenIncomingFingerprints.add(fingerprint);

    if (existing && (existing.rowFingerprint || createDirectCostFingerprint(existing)) === fingerprint) {
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
    rows: Array.from(byKey.values()).sort((a, b) => a.description.localeCompare(b.description)),
    added,
    replaced,
    skippedDuplicates
  };
}
