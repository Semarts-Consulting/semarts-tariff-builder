import type {
  SupplyReferenceCandidateStatus,
  SupplyReferenceLossCandidate,
  SupplyReferenceSourceDocument,
  SupplyReferenceTouCandidate
} from "@/types/project";

export const supplyReferenceTouCandidateHeaders = [
  "Distributor ID",
  "Charging Year",
  "Band Name",
  "Days of Week",
  "Bank Holidays",
  "Months",
  "Start Time",
  "End Time",
  "Source Reference",
  "Confidence"
] as const;

export const supplyReferenceLossCandidateHeaders = [
  "Distributor ID",
  "Charging Year",
  "Voltage",
  "Loss Factor Name",
  "Loss Percent",
  "Loss Multiplier",
  "Source Reference",
  "Confidence"
] as const;

type CellValue = string | number | boolean | Date | typeof Date | null;
type SheetRows = CellValue[][];

type ParseResult = {
  sourceDocument: SupplyReferenceSourceDocument;
  touCandidates: SupplyReferenceTouCandidate[];
  lossCandidates: SupplyReferenceLossCandidate[];
  errors: string[];
};

export type SupplyReferenceExtractionSummary = {
  sourceDocumentCount: number;
  touCandidateCount: number;
  lossCandidateCount: number;
  approvedTouCandidateCount: number;
  approvedLossCandidateCount: number;
  rejectedCandidateCount: number;
  needsReviewCandidateCount: number;
};

const validBandNames = ["Red", "Amber", "Green", "Super Red", "Day", "Night"] as const;
const validVoltages = ["EHV", "HV", "LV", "Metering"] as const;
const validDaysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
] as const;
const validMonths = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

function normaliseText(value: CellValue) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normaliseNumber(value: CellValue) {
  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(normaliseText(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normaliseConfidence(value: CellValue) {
  const parsed = normaliseNumber(value);
  return Math.max(0, Math.min(1, parsed > 1 ? parsed / 100 : parsed));
}

function splitList(value: CellValue) {
  return normaliseText(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createExtractionId(prefix: string, sourceDocumentId: string, rowNumber: number) {
  return `${prefix}-${sourceDocumentId}-${rowNumber}`;
}

function isValidValue<T extends readonly string[]>(
  value: string,
  validValues: T
): value is T[number] {
  return validValues.includes(value);
}

function parseBankHolidayValue(value: CellValue) {
  const text = normaliseText(value).toLowerCase();
  return text === "included" || text === "include" || text === "yes" || text === "true";
}

function validateListValues(
  values: string[],
  validValues: readonly string[],
  label: string,
  rowNumber: number
) {
  const invalidValues = values.filter((value) => !validValues.includes(value));

  return invalidValues.map(
    (value) => `${label} row ${rowNumber}: "${value}" is not a recognised value.`
  );
}

function filterValidValues<T extends readonly string[]>(
  values: string[],
  validValues: T
): T[number][] {
  return values.filter((value): value is T[number] => isValidValue(value, validValues));
}

function parseTouRows(
  rows: SheetRows,
  sourceDocumentId: string,
  sourceFileName: string
) {
  const candidates: SupplyReferenceTouCandidate[] = [];
  const errors: string[] = [];

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const distributorId = normaliseText(row[0]);
    const chargingYear = normaliseText(row[1]);
    const bandName = normaliseText(row[2]);
    const daysOfWeek = splitList(row[3]);
    const months = splitList(row[5]);
    const startTime = normaliseText(row[6]);
    const endTime = normaliseText(row[7]);

    if (!distributorId && !chargingYear && !bandName) {
      return;
    }

    if (!/^\d{2}$/.test(distributorId)) {
      errors.push(`TOU row ${rowNumber}: distributor ID must be two digits.`);
    }

    if (!chargingYear) {
      errors.push(`TOU row ${rowNumber}: charging year is required.`);
    }

    if (!isValidValue(bandName, validBandNames)) {
      errors.push(`TOU row ${rowNumber}: band name is not recognised.`);
      return;
    }

    errors.push(...validateListValues(daysOfWeek, validDaysOfWeek, "TOU", rowNumber));
    errors.push(...validateListValues(months, validMonths, "TOU", rowNumber));

    if (!startTime || !endTime) {
      errors.push(`TOU row ${rowNumber}: start time and end time are required.`);
    }

    candidates.push({
      id: createExtractionId("tou", sourceDocumentId, rowNumber),
      sourceDocumentId,
      distributorId,
      chargingYear,
      bandName,
      daysOfWeek: filterValidValues(daysOfWeek, validDaysOfWeek),
      appliesOnBankHolidays: parseBankHolidayValue(row[4]),
      months: filterValidValues(months, validMonths),
      startTime,
      endTime,
      sourceReference: normaliseText(row[8]) || sourceFileName,
      confidence: normaliseConfidence(row[9]),
      status: "Extracted"
    });
  });

  return { candidates, errors };
}

function parseLossRows(
  rows: SheetRows,
  sourceDocumentId: string,
  sourceFileName: string
) {
  const candidates: SupplyReferenceLossCandidate[] = [];
  const errors: string[] = [];

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const distributorId = normaliseText(row[0]);
    const chargingYear = normaliseText(row[1]);
    const voltage = normaliseText(row[2]);
    const lossFactorName = normaliseText(row[3]);

    if (!distributorId && !chargingYear && !voltage && !lossFactorName) {
      return;
    }

    if (!/^\d{2}$/.test(distributorId)) {
      errors.push(`Loss row ${rowNumber}: distributor ID must be two digits.`);
    }

    if (!chargingYear) {
      errors.push(`Loss row ${rowNumber}: charging year is required.`);
    }

    if (!isValidValue(voltage, validVoltages)) {
      errors.push(`Loss row ${rowNumber}: voltage is not recognised.`);
      return;
    }

    if (!lossFactorName) {
      errors.push(`Loss row ${rowNumber}: loss factor name is required.`);
    }

    candidates.push({
      id: createExtractionId("loss", sourceDocumentId, rowNumber),
      sourceDocumentId,
      distributorId,
      chargingYear,
      voltage,
      lossFactorName,
      lossPercent: normaliseNumber(row[4]),
      lossMultiplier: normaliseNumber(row[5]),
      sourceReference: normaliseText(row[6]) || sourceFileName,
      confidence: normaliseConfidence(row[7]),
      status: "Extracted"
    });
  });

  return { candidates, errors };
}

export function parseSupplyReferenceExtractionWorkbook({
  fileName,
  uploadedAt,
  touRows,
  lossRows
}: {
  fileName: string;
  uploadedAt: string;
  touRows: SheetRows;
  lossRows: SheetRows;
}): ParseResult {
  const sourceDocumentId = `reference-source-${Date.now().toString(36)}`;
  const parsedTouRows = parseTouRows(touRows, sourceDocumentId, fileName);
  const parsedLossRows = parseLossRows(lossRows, sourceDocumentId, fileName);
  const firstTou = parsedTouRows.candidates[0];
  const firstLoss = parsedLossRows.candidates[0];
  const distributorId = firstTou?.distributorId ?? firstLoss?.distributorId ?? "";
  const chargingYear = firstTou?.chargingYear ?? firstLoss?.chargingYear ?? "";

  return {
    sourceDocument: {
      id: sourceDocumentId,
      distributorId,
      chargingYear,
      title: fileName,
      sourceUrl: "",
      fileName,
      fileType: "Excel",
      extractionStatus: "Extracted",
      extractionNotes: "Imported from Semarts extraction staging template.",
      uploadedAt
    },
    touCandidates: parsedTouRows.candidates,
    lossCandidates: parsedLossRows.candidates,
    errors: [...parsedTouRows.errors, ...parsedLossRows.errors]
  };
}

function countByStatus<T extends { status: SupplyReferenceCandidateStatus }>(
  rows: T[],
  status: SupplyReferenceCandidateStatus
) {
  return rows.filter((row) => row.status === status).length;
}

export function getSupplyReferenceExtractionSummary({
  sourceDocuments,
  touCandidates,
  lossCandidates
}: {
  sourceDocuments: SupplyReferenceSourceDocument[];
  touCandidates: SupplyReferenceTouCandidate[];
  lossCandidates: SupplyReferenceLossCandidate[];
}): SupplyReferenceExtractionSummary {
  return {
    sourceDocumentCount: sourceDocuments.length,
    touCandidateCount: touCandidates.length,
    lossCandidateCount: lossCandidates.length,
    approvedTouCandidateCount: countByStatus(touCandidates, "Approved"),
    approvedLossCandidateCount: countByStatus(lossCandidates, "Approved"),
    rejectedCandidateCount:
      countByStatus(touCandidates, "Rejected") + countByStatus(lossCandidates, "Rejected"),
    needsReviewCandidateCount:
      countByStatus(touCandidates, "Needs review") +
      countByStatus(lossCandidates, "Needs review") +
      countByStatus(touCandidates, "Extracted") +
      countByStatus(lossCandidates, "Extracted")
  };
}
