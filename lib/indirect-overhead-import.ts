import {
  createImportedRowId,
  parseRequiredImportNumber,
  validateImportHeaders
} from "@/lib/import-utils";
import type { IndirectOverheadInput } from "@/types/project";

export const indirectOverheadHeaders = ["Description", "Annual Cost"];

export type IndirectOverheadParseResult = {
  parsedRows: IndirectOverheadInput[];
  errors: string[];
};

export type IndirectOverheadMergeResult = {
  rows: IndirectOverheadInput[];
  added: number;
  replaced: number;
  skippedDuplicates: number;
};

export function createIndirectOverheadImportBatchId() {
  return `indirect-overhead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function validateIndirectOverheadHeaders(headerRow: unknown[]) {
  return validateImportHeaders(indirectOverheadHeaders, headerRow);
}

export function createIndirectOverheadKey(row: Pick<IndirectOverheadInput, "description">) {
  return row.description.trim().toLowerCase();
}

export function createIndirectOverheadFingerprint(
  row: Pick<IndirectOverheadInput, "description" | "annualCost">
) {
  return [row.description, row.annualCost]
    .map((value) => String(value).trim().toLowerCase())
    .join("|");
}

export function parseIndirectOverheadRows(
  rows: unknown[][],
  sourceFileName: string,
  uploadedAt: string,
  importBatchId: string
): IndirectOverheadParseResult {
  const parsedRows: IndirectOverheadInput[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateIndirectOverheadHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: ["The selected workbook does not match the indirect overhead template headers."]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const excelRowNumber = index + 2;
    const hasValues = row.some((value) => String(value ?? "").trim() !== "");

    if (!hasValues) {
      return;
    }

    const description = String(row[0] ?? "").trim();
    const annualCost = parseRequiredImportNumber(row[1]);

    if (!description) {
      errors.push(`Row ${excelRowNumber}: Description is required.`);
    }

    if (annualCost === null || annualCost < 0) {
      errors.push(`Row ${excelRowNumber}: Annual Cost must be zero or greater.`);
    }

    if (!description || annualCost === null || annualCost < 0) {
      return;
    }

    const baseRow = {
      description,
      annualCost
    };

    parsedRows.push({
      id: createImportedRowId("indirect-overhead-import", parsedRows.length + 1),
      ...baseRow,
      comment: "",
      sourceFileName,
      uploadedAt,
      importBatchId,
      rowFingerprint: createIndirectOverheadFingerprint(baseRow)
    });
  });

  return { parsedRows, errors };
}

export function mergeIndirectOverheadRows(
  existingRows: IndirectOverheadInput[],
  incomingRows: IndirectOverheadInput[]
): IndirectOverheadMergeResult {
  const byKey = new Map(existingRows.map((row) => [createIndirectOverheadKey(row), row]));
  const seenIncomingFingerprints = new Set<string>();
  let added = 0;
  let replaced = 0;
  let skippedDuplicates = 0;

  incomingRows.forEach((row) => {
    const key = createIndirectOverheadKey(row);
    const fingerprint = row.rowFingerprint || createIndirectOverheadFingerprint(row);
    const existing = byKey.get(key);

    if (seenIncomingFingerprints.has(fingerprint)) {
      skippedDuplicates += 1;
      return;
    }

    seenIncomingFingerprints.add(fingerprint);

    if (
      existing &&
      (existing.rowFingerprint || createIndirectOverheadFingerprint(existing)) === fingerprint
    ) {
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
