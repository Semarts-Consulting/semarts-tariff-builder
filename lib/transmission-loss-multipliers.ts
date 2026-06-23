import {
  createImportedRowId,
  parseRequiredImportNumber,
  validateImportHeaders
} from "@/lib/import-utils";
import type { TransmissionLossMultiplierInput } from "@/types/project";

export const transmissionLossMultiplierHeaders = [
  "Settlement Date",
  "Settlement Period",
  "Transmission Loss Multiplier",
  "GSP Group",
  "Effective From Date",
  "Source",
  "Retrieved At",
  "Version"
];

export type TransmissionLossMultiplierParseResult = {
  parsedRows: TransmissionLossMultiplierInput[];
  errors: string[];
};

export type TransmissionLossMultiplierValidationIssue = {
  code:
    | "Missing settlement date"
    | "Invalid settlement period"
    | "Invalid Transmission Loss Multiplier";
  severity: "Error" | "Warning";
  message: string;
  rowId?: string;
  settlementDate?: string;
  settlementPeriod?: number;
};

type ElexonTransmissionLossMultiplierJsonRow = {
  settlementDate?: string;
  settlementPeriod?: number;
  transmissionLossMultiplier?: number;
  gspGroup?: string;
  effectiveFromDate?: string;
  source?: string;
  retrievedAt?: string;
  version?: string;
};

function normaliseText(value: unknown) {
  return String(value ?? "").trim();
}

function normaliseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = normaliseText(value);
  const parsed = new Date(text);

  return text && !Number.isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : text;
}

export function createTransmissionLossMultiplierFingerprint(
  row: Pick<
    TransmissionLossMultiplierInput,
    "settlementDate" | "settlementPeriod" | "transmissionLossMultiplier" | "gspGroup" | "version"
  >
) {
  return [
    row.settlementDate,
    row.settlementPeriod,
    row.transmissionLossMultiplier,
    row.gspGroup,
    row.version
  ].join("|");
}

export function createTransmissionLossMultiplierImportBatchId() {
  return `tlm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTransmissionLossMultiplierInput(): TransmissionLossMultiplierInput {
  const baseRow = {
    settlementDate: "",
    settlementPeriod: 1,
    transmissionLossMultiplier: 1,
    gspGroup: "",
    effectiveFromDate: "",
    source: "Manual",
    retrievedAt: new Date().toISOString(),
    version: ""
  };

  return {
    id: createImportedRowId("tlm", 1),
    ...baseRow,
    importBatchId: "",
    rowFingerprint: createTransmissionLossMultiplierFingerprint(baseRow)
  };
}

export function validateTransmissionLossMultipliers(
  rows: TransmissionLossMultiplierInput[]
): TransmissionLossMultiplierValidationIssue[] {
  const issues: TransmissionLossMultiplierValidationIssue[] = [];

  rows.forEach((row) => {
    if (!row.settlementDate.trim()) {
      issues.push({
        code: "Missing settlement date",
        severity: "Error",
        message: "Transmission Loss Multiplier rows require a settlement date.",
        rowId: row.id
      });
    }

    if (!Number.isInteger(row.settlementPeriod) || row.settlementPeriod < 1 || row.settlementPeriod > 50) {
      issues.push({
        code: "Invalid settlement period",
        severity: "Error",
        message: "Transmission Loss Multiplier settlement period must be between 1 and 50.",
        rowId: row.id,
        settlementDate: row.settlementDate,
        settlementPeriod: row.settlementPeriod
      });
    }

    if (
      !Number.isFinite(row.transmissionLossMultiplier) ||
      row.transmissionLossMultiplier <= 0
    ) {
      issues.push({
        code: "Invalid Transmission Loss Multiplier",
        severity: "Error",
        message: "Transmission Loss Multiplier must be a positive number.",
        rowId: row.id,
        settlementDate: row.settlementDate,
        settlementPeriod: row.settlementPeriod
      });
    }
  });

  return issues;
}

export function validateTransmissionLossMultiplierHeaders(headerRow: unknown[]) {
  return validateImportHeaders(transmissionLossMultiplierHeaders, headerRow);
}

export function parseTransmissionLossMultiplierRows(
  rows: unknown[][],
  importBatchId: string
): TransmissionLossMultiplierParseResult {
  const parsedRows: TransmissionLossMultiplierInput[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateTransmissionLossMultiplierHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: [
        "The selected file does not match the TLM headers: Settlement Date, Settlement Period, Transmission Loss Multiplier, GSP Group, Effective From Date, Source, Retrieved At, Version."
      ]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const excelRowNumber = index + 2;
    const hasValues = row.some((value) => normaliseText(value) !== "");

    if (!hasValues) {
      return;
    }

    const settlementDate = normaliseDate(row[0]);
    const settlementPeriod = parseRequiredImportNumber(row[1]);
    const multiplier = parseRequiredImportNumber(row[2]);

    if (!settlementDate) {
      errors.push(`Row ${excelRowNumber}: Settlement date is required.`);
    }

    if (settlementPeriod === null || settlementPeriod < 1 || settlementPeriod > 50) {
      errors.push(`Row ${excelRowNumber}: Settlement period must be between 1 and 50.`);
    }

    if (multiplier === null || multiplier <= 0) {
      errors.push(`Row ${excelRowNumber}: Transmission loss multiplier must be positive.`);
    }

    if (!settlementDate || settlementPeriod === null || multiplier === null || multiplier <= 0) {
      return;
    }

    const baseRow = {
      settlementDate,
      settlementPeriod,
      transmissionLossMultiplier: multiplier,
      gspGroup: normaliseText(row[3]),
      effectiveFromDate: normaliseDate(row[4]),
      source: normaliseText(row[5]) || "Elexon structured import",
      retrievedAt: normaliseText(row[6]) || new Date().toISOString(),
      version: normaliseText(row[7])
    };

    parsedRows.push({
      id: createImportedRowId("tlm", parsedRows.length + 1),
      ...baseRow,
      importBatchId,
      rowFingerprint: createTransmissionLossMultiplierFingerprint(baseRow)
    });
  });

  return { parsedRows, errors };
}

export function parseTransmissionLossMultiplierJson(
  rows: ElexonTransmissionLossMultiplierJsonRow[],
  importBatchId: string,
  retrievedAt = new Date().toISOString()
): TransmissionLossMultiplierParseResult {
  const tableRows = [
    transmissionLossMultiplierHeaders,
    ...rows.map((row) => [
      row.settlementDate ?? "",
      row.settlementPeriod ?? "",
      row.transmissionLossMultiplier ?? "",
      row.gspGroup ?? "",
      row.effectiveFromDate ?? row.settlementDate ?? "",
      row.source ?? "Elexon structured JSON",
      row.retrievedAt ?? retrievedAt,
      row.version ?? ""
    ])
  ];

  return parseTransmissionLossMultiplierRows(tableRows, importBatchId);
}

export async function refreshTransmissionLossMultipliersFromJson(
  endpointUrl: string,
  fetchImpl: typeof fetch = fetch
) {
  const response = await fetchImpl(endpointUrl);

  if (!response.ok) {
    throw new Error(`Transmission Loss Multiplier refresh failed: ${response.status}`);
  }

  const payload: unknown = await response.json();
  const rows = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload !== null && "data" in payload
      ? (payload as { data?: unknown }).data
      : [];

  if (!Array.isArray(rows)) {
    throw new Error("Transmission Loss Multiplier response did not contain an array.");
  }

  return parseTransmissionLossMultiplierJson(
    rows as ElexonTransmissionLossMultiplierJsonRow[],
    createTransmissionLossMultiplierImportBatchId()
  );
}
