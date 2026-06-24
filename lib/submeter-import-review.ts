import type {
  SiteSubmeterRecord,
  SubmeterConsumptionRecord,
  TransmissionLossMultiplierInput
} from "@/types/project";

export type ImportConflict = {
  code: "Duplicate meter" | "Duplicate consumption period" | "Duplicate TLM period";
  message: string;
  existingRowId: string;
  importedRowId: string;
};

export type ImportConflictSummary = {
  totalConflicts: number;
  duplicateMeterCount: number;
  duplicateConsumptionPeriodCount: number;
  duplicateTlmPeriodCount: number;
  status: "No conflicts" | "Needs review";
};

export function findSubmeterRegisterImportConflicts({
  existingRows,
  importedRows
}: {
  existingRows: SiteSubmeterRecord[];
  importedRows: SiteSubmeterRecord[];
}): ImportConflict[] {
  const existingByMeter = new Map(
    existingRows
      .filter((row) => row.meter.trim())
      .map((row) => [normaliseImportKeyPart(row.meter), row])
  );
  const importedByMeter = new Map<string, SiteSubmeterRecord>();
  const conflicts: ImportConflict[] = [];

  importedRows.forEach((row) => {
    const meterKey = normaliseImportKeyPart(row.meter);
    if (!meterKey) return;

    const existing = existingByMeter.get(meterKey);
    if (existing) {
      conflicts.push({
        code: "Duplicate meter",
        message: `Imported meter ${existing.meter.trim()} already exists in the submeter register.`,
        existingRowId: existing.id,
        importedRowId: row.id
      });
    }

    const earlierImport = importedByMeter.get(meterKey);
    if (earlierImport) {
      conflicts.push({
        code: "Duplicate meter",
        message: `Imported meter ${row.meter.trim()} appears more than once in this import.`,
        existingRowId: earlierImport.id,
        importedRowId: row.id
      });
      return;
    }

    importedByMeter.set(meterKey, row);
  });

  return conflicts;
}

export function findSubmeterConsumptionImportConflicts({
  existingRows,
  importedRows
}: {
  existingRows: SubmeterConsumptionRecord[];
  importedRows: SubmeterConsumptionRecord[];
}): ImportConflict[] {
  const existingByKey = new Map(existingRows.map((row) => [consumptionKey(row), row]));
  const importedByKey = new Map<string, SubmeterConsumptionRecord>();
  const conflicts: ImportConflict[] = [];

  importedRows.forEach((row) => {
    const key = consumptionKey(row);
    const existing = existingByKey.get(key);

    if (existing) {
      conflicts.push({
        code: "Duplicate consumption period",
        message: `Imported ${row.format.toLowerCase()} consumption for ${row.meter.trim()} overlaps an existing record for ${row.periodStart} to ${row.periodEnd}.`,
        existingRowId: existing.id,
        importedRowId: row.id
      });
    }

    const earlierImport = importedByKey.get(key);
    if (earlierImport) {
      conflicts.push({
        code: "Duplicate consumption period",
        message: `Imported ${row.format.toLowerCase()} consumption for ${row.meter.trim()} appears more than once in this import for ${row.periodStart} to ${row.periodEnd}.`,
        existingRowId: earlierImport.id,
        importedRowId: row.id
      });
      return;
    }

    importedByKey.set(key, row);
  });

  return conflicts;
}

export function findTransmissionLossMultiplierImportConflicts({
  existingRows,
  importedRows
}: {
  existingRows: TransmissionLossMultiplierInput[];
  importedRows: TransmissionLossMultiplierInput[];
}): ImportConflict[] {
  const existingByKey = new Map(existingRows.map((row) => [tlmKey(row), row]));
  const importedByKey = new Map<string, TransmissionLossMultiplierInput>();
  const conflicts: ImportConflict[] = [];

  importedRows.forEach((row) => {
    const existing = existingByKey.get(tlmKey(row));

    if (existing) {
      conflicts.push({
        code: "Duplicate TLM period",
        message: `Imported TLM for ${row.settlementDate} SP${row.settlementPeriod} ${row.gspGroup || "default GSP"} already exists.`,
        existingRowId: existing.id,
        importedRowId: row.id
      });
    }

    const key = tlmKey(row);
    const earlierImport = importedByKey.get(key);
    if (earlierImport) {
      conflicts.push({
        code: "Duplicate TLM period",
        message: `Imported TLM for ${row.settlementDate} SP${row.settlementPeriod} ${row.gspGroup || "default GSP"} appears more than once in this import.`,
        existingRowId: earlierImport.id,
        importedRowId: row.id
      });
      return;
    }

    importedByKey.set(key, row);
  });

  return conflicts;
}

export function createImportConflictMessages(conflicts: ImportConflict[]) {
  return conflicts.map((conflict) => conflict.message);
}

export function createImportReviewMessages(conflicts: ImportConflict[]) {
  const summary = summariseImportConflicts(conflicts);

  if (summary.status === "No conflicts") {
    return [];
  }

  return [
    `Import review found ${summary.totalConflicts} possible duplicate record${summary.totalConflicts === 1 ? "" : "s"}.`,
    ...createImportConflictMessages(conflicts)
  ];
}

export function summariseImportConflicts(conflicts: ImportConflict[]): ImportConflictSummary {
  return {
    totalConflicts: conflicts.length,
    duplicateMeterCount: conflicts.filter((conflict) => conflict.code === "Duplicate meter").length,
    duplicateConsumptionPeriodCount: conflicts.filter(
      (conflict) => conflict.code === "Duplicate consumption period"
    ).length,
    duplicateTlmPeriodCount: conflicts.filter(
      (conflict) => conflict.code === "Duplicate TLM period"
    ).length,
    status: conflicts.length > 0 ? "Needs review" : "No conflicts"
  };
}

function consumptionKey(row: SubmeterConsumptionRecord) {
  return [
    normaliseImportKeyPart(row.meter),
    normaliseImportKeyPart(row.format),
    row.periodStart,
    row.periodEnd
  ].join("::");
}

function tlmKey(row: TransmissionLossMultiplierInput) {
  return [
    row.settlementDate,
    row.settlementPeriod,
    normaliseImportKeyPart(row.gspGroup || "default GSP")
  ].join("::");
}

function normaliseImportKeyPart(value: string) {
  return value.trim().toLowerCase();
}
