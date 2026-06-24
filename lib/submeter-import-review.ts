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
      .map((row) => [row.meter.trim(), row])
  );

  return importedRows.flatMap((row) => {
    const existing = existingByMeter.get(row.meter.trim());

    return existing
      ? [
          {
            code: "Duplicate meter",
            message: `Imported meter ${row.meter} already exists in the submeter register.`,
            existingRowId: existing.id,
            importedRowId: row.id
          }
        ]
      : [];
  });
}

export function findSubmeterConsumptionImportConflicts({
  existingRows,
  importedRows
}: {
  existingRows: SubmeterConsumptionRecord[];
  importedRows: SubmeterConsumptionRecord[];
}): ImportConflict[] {
  const existingByKey = new Map(existingRows.map((row) => [consumptionKey(row), row]));

  return importedRows.flatMap((row) => {
    const existing = existingByKey.get(consumptionKey(row));

    return existing
      ? [
          {
            code: "Duplicate consumption period",
            message: `Imported ${row.format.toLowerCase()} consumption for ${row.meter} overlaps an existing record for ${row.periodStart} to ${row.periodEnd}.`,
            existingRowId: existing.id,
            importedRowId: row.id
          }
        ]
      : [];
  });
}

export function findTransmissionLossMultiplierImportConflicts({
  existingRows,
  importedRows
}: {
  existingRows: TransmissionLossMultiplierInput[];
  importedRows: TransmissionLossMultiplierInput[];
}): ImportConflict[] {
  const existingByKey = new Map(existingRows.map((row) => [tlmKey(row), row]));

  return importedRows.flatMap((row) => {
    const existing = existingByKey.get(tlmKey(row));

    return existing
      ? [
          {
            code: "Duplicate TLM period",
            message: `Imported TLM for ${row.settlementDate} SP${row.settlementPeriod} ${row.gspGroup || "default GSP"} already exists.`,
            existingRowId: existing.id,
            importedRowId: row.id
          }
        ]
      : [];
  });
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
  return [row.meter, row.format, row.periodStart, row.periodEnd].join("::");
}

function tlmKey(row: TransmissionLossMultiplierInput) {
  return [row.settlementDate, row.settlementPeriod, row.gspGroup].join("::");
}
