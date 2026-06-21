import {
  createImportedRowId,
  parseRequiredImportNumber,
  validateImportHeaders
} from "@/lib/import-utils";
import type { EmployeeCostInput, EmployeeRoleType } from "@/types/project";

export const employeeCostHeaders = ["Role", "Role Type", "FTE", "% Time"];

export const roleTypes: EmployeeRoleType[] = [
  "Exco",
  "Director",
  "Head",
  "Senior Manager",
  "Manager",
  "Colleague"
];

export type EmployeeCostParseResult = {
  parsedRows: EmployeeCostInput[];
  errors: string[];
};

export type EmployeeCostMergeResult = {
  rows: EmployeeCostInput[];
  added: number;
  replaced: number;
  skippedDuplicates: number;
};

export function createEmployeeCostImportBatchId() {
  return `employee-cost-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function validateEmployeeCostHeaders(headerRow: unknown[]) {
  return validateImportHeaders(employeeCostHeaders, headerRow);
}

export function parseEmployeeRoleType(value: unknown): EmployeeRoleType | null {
  const text = String(value ?? "").trim();

  return roleTypes.includes(text as EmployeeRoleType) ? (text as EmployeeRoleType) : null;
}

export function createEmployeeCostKey(row: Pick<EmployeeCostInput, "role" | "roleType">) {
  return [row.role, row.roleType]
    .map((value) => String(value).trim().toLowerCase())
    .join("::");
}

export function createEmployeeCostFingerprint(
  row: Pick<EmployeeCostInput, "role" | "roleType" | "fte" | "timePercent">
) {
  return [row.role, row.roleType, row.fte, row.timePercent]
    .map((value) => String(value).trim().toLowerCase())
    .join("|");
}

export function parseEmployeeCostRows(
  rows: unknown[][],
  sourceFileName: string,
  uploadedAt: string,
  importBatchId: string
): EmployeeCostParseResult {
  const parsedRows: EmployeeCostInput[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateEmployeeCostHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: ["The selected workbook does not match the employee cost template headers."]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const excelRowNumber = index + 2;
    const hasValues = row.some((value) => String(value ?? "").trim() !== "");

    if (!hasValues) {
      return;
    }

    const role = String(row[0] ?? "").trim();
    const roleType = parseEmployeeRoleType(row[1]);
    const fte = parseRequiredImportNumber(row[2]);
    const timePercent = parseRequiredImportNumber(row[3]);

    if (!role) {
      errors.push(`Row ${excelRowNumber}: Role is required.`);
    }

    if (!roleType) {
      errors.push(`Row ${excelRowNumber}: Role Type must be ${roleTypes.join(", ")}.`);
    }

    if (fte === null || fte < 0) {
      errors.push(`Row ${excelRowNumber}: FTE must be zero or greater.`);
    }

    if (timePercent === null || timePercent < 0 || timePercent > 100) {
      errors.push(`Row ${excelRowNumber}: % Time must be between 0 and 100.`);
    }

    if (
      !role ||
      !roleType ||
      fte === null ||
      fte < 0 ||
      timePercent === null ||
      timePercent < 0 ||
      timePercent > 100
    ) {
      return;
    }

    const baseRow = {
      role,
      roleType,
      fte,
      timePercent
    };

    parsedRows.push({
      id: createImportedRowId("employee-cost-import", parsedRows.length + 1),
      ...baseRow,
      comment: "",
      sourceFileName,
      uploadedAt,
      importBatchId,
      rowFingerprint: createEmployeeCostFingerprint(baseRow)
    });
  });

  return { parsedRows, errors };
}

export function mergeEmployeeCostRows(
  existingRows: EmployeeCostInput[],
  incomingRows: EmployeeCostInput[]
): EmployeeCostMergeResult {
  const byKey = new Map(existingRows.map((row) => [createEmployeeCostKey(row), row]));
  const seenIncomingFingerprints = new Set<string>();
  let added = 0;
  let replaced = 0;
  let skippedDuplicates = 0;

  incomingRows.forEach((row) => {
    const key = createEmployeeCostKey(row);
    const fingerprint = row.rowFingerprint || createEmployeeCostFingerprint(row);
    const existing = byKey.get(key);

    if (seenIncomingFingerprints.has(fingerprint)) {
      skippedDuplicates += 1;
      return;
    }

    seenIncomingFingerprints.add(fingerprint);

    if (existing && (existing.rowFingerprint || createEmployeeCostFingerprint(existing)) === fingerprint) {
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
    rows: Array.from(byKey.values()).sort((a, b) => a.role.localeCompare(b.role)),
    added,
    replaced,
    skippedDuplicates
  };
}
