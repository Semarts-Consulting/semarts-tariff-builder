import {
  createImportedRowId,
  parseRequiredImportNumber,
  validateImportHeaders
} from "@/lib/import-utils";
import type {
  SiteSubmeterRecord,
  SiteSubmeterResponsibility,
  SubmeterConsumptionFormat,
  SubmeterConsumptionRecord,
  SubmeterConsumptionValidationStatus,
  TransmissionLossMultiplierInput
} from "@/types/project";

export const siteSubmeterResponsibilities: SiteSubmeterResponsibility[] = [
  "Tenant",
  "Network Operator",
  "Landlord",
  "Shared Asset",
  "EV Asset",
  "Plant Room",
  "Infrastructure",
  "Other Internal Use"
];

export const consumptionFormats: SubmeterConsumptionFormat[] = [
  "Half-hourly",
  "Monthly",
  "Quarterly",
  "Annual"
];

export const siteSubmeterHeaders = [
  "Meter",
  "Location",
  "Responsibility",
  "Tenant Name",
  "Notes"
];

export const submeterConsumptionHeaders = [
  "Meter",
  "Format",
  "Period Start",
  "Period End",
  "Consumption kWh",
  "Source Type",
  ...Array.from({ length: 48 }, (_, index) => `SP${index + 1}`)
];

export type SiteSubmeterValidationIssue = {
  code:
    | "Missing meter"
    | "Missing location"
    | "Duplicate meter"
    | "Invalid responsibility"
    | "Missing tenant name";
  severity: "Error" | "Warning";
  message: string;
  rowId?: string;
  meter?: string;
};

export type SubmeterConsumptionValidationIssue = {
  code:
    | "Missing meter reference"
    | "Unknown meter"
    | "Missing consumption value"
    | "Negative consumption value"
    | "Duplicate consumption record"
    | "Overlapping consumption period"
    | "Invalid date range"
    | "Incorrect half-hourly settlement periods";
  severity: "Error" | "Warning";
  message: string;
  rowId?: string;
  meter?: string;
};

export type TlmValidationIssue = {
  code: "Missing Transmission Loss Multiplier" | "Invalid Transmission Loss Multiplier";
  severity: "Error" | "Warning";
  message: string;
  settlementDate?: string;
  settlementPeriod?: number;
  gspGroup?: string;
};

export type SiteSubmeterParseResult = {
  parsedRows: SiteSubmeterRecord[];
  errors: string[];
};

export type SubmeterConsumptionParseResult = {
  parsedRows: SubmeterConsumptionRecord[];
  errors: string[];
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

function normaliseResponsibility(value: unknown): SiteSubmeterResponsibility {
  const text = normaliseText(value);
  const matched = siteSubmeterResponsibilities.find(
    (responsibility) => responsibility.toLowerCase() === text.toLowerCase()
  );

  return matched ?? "Other Internal Use";
}

function isKnownResponsibility(value: unknown) {
  const text = normaliseText(value);

  return siteSubmeterResponsibilities.some(
    (responsibility) => responsibility.toLowerCase() === text.toLowerCase()
  );
}

function normaliseConsumptionFormat(value: unknown): SubmeterConsumptionFormat {
  const text = normaliseText(value);
  const matched = consumptionFormats.find(
    (format) => format.toLowerCase() === text.toLowerCase()
  );

  return matched ?? "Annual";
}

function isKnownConsumptionFormat(value: unknown) {
  const text = normaliseText(value);

  return consumptionFormats.some((format) => format.toLowerCase() === text.toLowerCase());
}

function isValidDateText(value: string) {
  const parsed = new Date(value);

  return value.trim() !== "" && !Number.isNaN(parsed.getTime());
}

export function createSiteSubmeterFingerprint(
  row: Pick<SiteSubmeterRecord, "meter" | "location" | "responsibility" | "tenantName">
) {
  return [row.meter, row.location, row.responsibility, row.tenantName].join("|");
}

export function createSubmeterConsumptionFingerprint(
  row: Pick<
    SubmeterConsumptionRecord,
    "meter" | "format" | "periodStart" | "periodEnd" | "consumptionValue" | "settlementPeriodKwh"
  >
) {
  return [
    row.meter,
    row.format,
    row.periodStart,
    row.periodEnd,
    row.consumptionValue,
    ...(row.settlementPeriodKwh ?? [])
  ].join("|");
}

export function createSubmeterImportBatchId(prefix = "submeter") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function validateSiteSubmeterHeaders(headerRow: unknown[]) {
  return validateImportHeaders(siteSubmeterHeaders, headerRow);
}

export function validateSubmeterConsumptionHeaders(headerRow: unknown[]) {
  return validateImportHeaders(submeterConsumptionHeaders, headerRow);
}

export function parseSiteSubmeterRows(
  rows: unknown[][],
  sourceFileName: string,
  uploadedAt: string,
  importBatchId: string
): SiteSubmeterParseResult {
  const parsedRows: SiteSubmeterRecord[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateSiteSubmeterHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: [
        "The selected file does not match the submeter register headers: Meter, Location, Responsibility, Tenant Name, Notes."
      ]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const excelRowNumber = index + 2;
    const hasValues = row.some((value) => normaliseText(value) !== "");

    if (!hasValues) {
      return;
    }

    const baseRow = {
      meter: normaliseText(row[0]),
      location: normaliseText(row[1]),
      responsibility: normaliseResponsibility(row[2]),
      tenantName: normaliseText(row[3])
    };

    if (!baseRow.meter) {
      errors.push(`Row ${excelRowNumber}: Meter is required.`);
    }

    if (!baseRow.location) {
      errors.push(`Row ${excelRowNumber}: Location is required.`);
    }

    if (!isKnownResponsibility(row[2])) {
      errors.push(`Row ${excelRowNumber}: Responsibility is invalid.`);
    }

    if (baseRow.responsibility === "Tenant" && !baseRow.tenantName) {
      errors.push(`Row ${excelRowNumber}: Tenant name is required for tenant meters.`);
    }

    if (!baseRow.meter || !baseRow.location) {
      return;
    }

    parsedRows.push({
      id: createImportedRowId("site-submeter", parsedRows.length + 1),
      ...baseRow,
      notes: normaliseText(row[4]),
      sourceFileName,
      uploadedAt,
      importBatchId,
      rowFingerprint: createSiteSubmeterFingerprint(baseRow)
    });
  });

  return { parsedRows, errors };
}

export function parseSubmeterConsumptionRows(
  rows: unknown[][],
  sourceFileName: string,
  uploadedAt: string,
  importBatchId: string
): SubmeterConsumptionParseResult {
  const parsedRows: SubmeterConsumptionRecord[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateSubmeterConsumptionHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: [
        "The selected file does not match the consumption headers: Meter, Format, Period Start, Period End, Consumption kWh, Source Type, SP1 to SP48."
      ]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const excelRowNumber = index + 2;
    const hasValues = row.some((value) => normaliseText(value) !== "");

    if (!hasValues) {
      return;
    }

    const format = normaliseConsumptionFormat(row[1]);
    const consumptionValue = parseRequiredImportNumber(row[4]);
    const settlementPeriodKwh =
      format === "Half-hourly" ? row.slice(6, 54).map(parseRequiredImportNumber) : undefined;

    if (!normaliseText(row[0])) {
      errors.push(`Row ${excelRowNumber}: Meter is required.`);
    }

    if (!normaliseDate(row[2]) || !normaliseDate(row[3])) {
      errors.push(`Row ${excelRowNumber}: Period start and end are required.`);
    }

    if (!isKnownConsumptionFormat(row[1])) {
      errors.push(`Row ${excelRowNumber}: Format is invalid.`);
    }

    if (consumptionValue === null) {
      errors.push(`Row ${excelRowNumber}: Consumption kWh must be numeric.`);
    }

    if (settlementPeriodKwh && settlementPeriodKwh.some((value) => value === null)) {
      errors.push(`Row ${excelRowNumber}: half-hourly rows must include numeric SP1 to SP48 values.`);
    }

    if (!normaliseText(row[0]) || consumptionValue === null) {
      return;
    }

    const numericSettlementPeriods = settlementPeriodKwh?.map((value) => value ?? 0);
    const baseRow = {
      meter: normaliseText(row[0]),
      format,
      periodStart: normaliseDate(row[2]),
      periodEnd: normaliseDate(row[3]),
      consumptionValue,
      settlementPeriodKwh: numericSettlementPeriods
    };

    parsedRows.push({
      id: createImportedRowId("submeter-consumption", parsedRows.length + 1),
      ...baseRow,
      unit: "kWh",
      sourceType: normaliseText(row[5]) || "Manual import",
      sourceFileName,
      uploadedAt,
      importBatchId,
      validationStatus: "Pending review",
      rowFingerprint: createSubmeterConsumptionFingerprint(baseRow)
    });
  });

  return { parsedRows, errors };
}

export function validateSiteSubmeters(
  rows: SiteSubmeterRecord[]
): SiteSubmeterValidationIssue[] {
  const issues: SiteSubmeterValidationIssue[] = [];
  const meterCounts = new Map<string, number>();

  rows.forEach((row) => {
    const meter = row.meter.trim();

    if (!meter) {
      issues.push({
        code: "Missing meter",
        severity: "Error",
        message: "Submeter register rows require a meter identifier.",
        rowId: row.id
      });
    }

    if (!row.location.trim()) {
      issues.push({
        code: "Missing location",
        severity: "Error",
        message: "Submeter register rows require a location.",
        rowId: row.id,
        meter
      });
    }

    if (!siteSubmeterResponsibilities.includes(row.responsibility)) {
      issues.push({
        code: "Invalid responsibility",
        severity: "Error",
        message: "Submeter responsibility must use an approved category.",
        rowId: row.id,
        meter
      });
    }

    if (row.responsibility === "Tenant" && !row.tenantName.trim()) {
      issues.push({
        code: "Missing tenant name",
        severity: "Error",
        message: "Tenant submeters require a tenant name.",
        rowId: row.id,
        meter
      });
    }

    if (meter) {
      meterCounts.set(meter, (meterCounts.get(meter) ?? 0) + 1);
    }
  });

  meterCounts.forEach((count, meter) => {
    if (count > 1) {
      issues.push({
        code: "Duplicate meter",
        severity: "Error",
        message: `Meter ${meter} appears more than once in the submeter register.`,
        meter
      });
    }
  });

  return issues;
}

function recordsOverlap(first: SubmeterConsumptionRecord, second: SubmeterConsumptionRecord) {
  return first.periodStart <= second.periodEnd && second.periodStart <= first.periodEnd;
}

export function validateSubmeterConsumption(
  rows: SubmeterConsumptionRecord[],
  submeters: SiteSubmeterRecord[]
): SubmeterConsumptionValidationIssue[] {
  const issues: SubmeterConsumptionValidationIssue[] = [];
  const meterIds = new Set(submeters.map((row) => row.meter.trim()).filter(Boolean));
  const seenKeys = new Set<string>();

  rows.forEach((row) => {
    const meter = row.meter.trim();
    const key = `${meter}::${row.format}::${row.periodStart}::${row.periodEnd}`;

    if (!meter) {
      issues.push({
        code: "Missing meter reference",
        severity: "Error",
        message: "Consumption records require a meter reference.",
        rowId: row.id
      });
    } else if (!meterIds.has(meter)) {
      issues.push({
        code: "Unknown meter",
        severity: "Error",
        message: `Meter ${meter} does not exist in the site submeter register.`,
        rowId: row.id,
        meter
      });
    }

    if (!Number.isFinite(row.consumptionValue)) {
      issues.push({
        code: "Missing consumption value",
        severity: "Error",
        message: "Consumption records require a numeric consumption value.",
        rowId: row.id,
        meter
      });
    } else if (row.consumptionValue < 0) {
      issues.push({
        code: "Negative consumption value",
        severity: "Error",
        message: "Consumption records cannot be negative.",
        rowId: row.id,
        meter
      });
    }

    if (
      !isValidDateText(row.periodStart) ||
      !isValidDateText(row.periodEnd) ||
      new Date(row.periodEnd) < new Date(row.periodStart)
    ) {
      issues.push({
        code: "Invalid date range",
        severity: "Error",
        message: "Consumption period end must be on or after the start date.",
        rowId: row.id,
        meter
      });
    }

    if (seenKeys.has(key)) {
      issues.push({
        code: "Duplicate consumption record",
        severity: "Error",
        message: "Duplicate consumption record for the same meter, format, and period.",
        rowId: row.id,
        meter
      });
    }
    seenKeys.add(key);

    if (row.format === "Half-hourly" && row.settlementPeriodKwh?.length !== 48) {
      issues.push({
        code: "Incorrect half-hourly settlement periods",
        severity: "Error",
        message: "Half-hourly consumption requires 48 settlement periods per day.",
        rowId: row.id,
        meter
      });
    }
  });

  rows.forEach((row, index) => {
    rows.slice(index + 1).forEach((candidate) => {
      if (
        row.id !== candidate.id &&
        row.meter &&
        row.meter === candidate.meter &&
        isValidDateText(row.periodStart) &&
        isValidDateText(row.periodEnd) &&
        isValidDateText(candidate.periodStart) &&
        isValidDateText(candidate.periodEnd) &&
        recordsOverlap(row, candidate)
      ) {
        issues.push({
          code: "Overlapping consumption period",
          severity: "Warning",
          message: `Consumption periods overlap for meter ${row.meter}.`,
          rowId: candidate.id,
          meter: row.meter
        });
      }
    });
  });

  return issues;
}

export function getConsumptionTotalByMeter(rows: SubmeterConsumptionRecord[]) {
  const totals = new Map<string, number>();

  rows.forEach((row) => {
    totals.set(row.meter, (totals.get(row.meter) ?? 0) + row.consumptionValue);
  });

  return Array.from(totals.entries()).map(([meter, totalKwh]) => ({ meter, totalKwh }));
}

export function validateRequiredTransmissionLossMultipliers(
  consumptionRows: SubmeterConsumptionRecord[],
  multipliers: TransmissionLossMultiplierInput[],
  gspGroup = ""
): TlmValidationIssue[] {
  const issues: TlmValidationIssue[] = [];
  const available = new Set(
    multipliers.map((row) =>
      [row.settlementDate, row.settlementPeriod, row.gspGroup || ""].join("::")
    )
  );

  consumptionRows
    .filter((row) => row.format === "Half-hourly")
    .forEach((row) => {
      for (let period = 1; period <= 48; period += 1) {
        const key = [row.periodStart, period, gspGroup].join("::");
        const fallbackKey = [row.periodStart, period, ""].join("::");

        if (!available.has(key) && !available.has(fallbackKey)) {
          issues.push({
            code: "Missing Transmission Loss Multiplier",
            severity: "Warning",
            message: `Missing TLM for ${row.periodStart} settlement period ${period}.`,
            settlementDate: row.periodStart,
            settlementPeriod: period,
            gspGroup
          });
        }
      }
    });

  return issues;
}

export function createSiteSubmeterRecord(): SiteSubmeterRecord {
  const baseRow = {
    meter: "",
    location: "",
    responsibility: "Tenant" as SiteSubmeterResponsibility,
    tenantName: ""
  };

  return {
    id: createImportedRowId("site-submeter", 1),
    ...baseRow,
    notes: "",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: createSiteSubmeterFingerprint(baseRow)
  };
}

export function createSubmeterConsumptionRecord(): SubmeterConsumptionRecord {
  const baseRow = {
    meter: "",
    format: "Monthly" as SubmeterConsumptionFormat,
    periodStart: "",
    periodEnd: "",
    consumptionValue: 0,
    settlementPeriodKwh: undefined
  };

  return {
    id: createImportedRowId("submeter-consumption", 1),
    ...baseRow,
    unit: "kWh",
    sourceType: "Manual",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    validationStatus: "Pending review" as SubmeterConsumptionValidationStatus,
    rowFingerprint: createSubmeterConsumptionFingerprint(baseRow)
  };
}
