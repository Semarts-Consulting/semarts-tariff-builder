import type {
  HalfHourlyImportRow,
  SiteSubmeterRecord,
  SubmeterConsumptionRecord
} from "@/types/project";

export type ReconciliationStatus = "Green" | "Amber" | "Red" | "No boundary data";

export type ReconciliationThresholds = {
  greenPercent: number;
  amberPercent: number;
};

export type ReconciliationExclusionReason =
  | "Missing meter"
  | "Unknown meter"
  | "Invalid period"
  | "Missing consumption"
  | "Negative consumption"
  | "Invalid boundary import";

export type ReconciliationExcludedRecord = {
  id: string;
  source: "Boundary meter" | "Submeter consumption";
  reference: string;
  reason: ReconciliationExclusionReason;
};

export type ReconciliationIncludedSubmeterRecord = {
  id: string;
  meter: string;
  location: string;
  responsibility: SiteSubmeterRecord["responsibility"];
  format: SubmeterConsumptionRecord["format"];
  periodStart: string;
  periodEnd: string;
  consumptionKwh: number;
};

export type SubmeterReconciliationTraceEntry = {
  label: string;
  formula: string;
  value: number;
  unit: "kWh" | "Percent" | "Records";
  sourceRowIds: string[];
};

export type SubmeterReconciliationResult = {
  boundaryMeterImportTotalKwh: number;
  totalSubmeterConsumptionKwh: number;
  underRecordedConsumptionKwh: number;
  overRecordedConsumptionKwh: number;
  unknownInternalUsageKwh: number;
  varianceKwh: number;
  variancePercent: number;
  status: ReconciliationStatus;
  thresholds: ReconciliationThresholds;
  includedSubmeterRecords: ReconciliationIncludedSubmeterRecord[];
  excludedRecords: ReconciliationExcludedRecord[];
  auditTrace: SubmeterReconciliationTraceEntry[];
};

export const defaultReconciliationThresholds: ReconciliationThresholds = {
  greenPercent: 1,
  amberPercent: 3
};

function isValidDateText(value: string) {
  const parsed = new Date(value);

  return value.trim() !== "" && !Number.isNaN(parsed.getTime());
}

function absoluteVariancePercent(varianceKwh: number, boundaryTotalKwh: number) {
  return boundaryTotalKwh > 0 ? (Math.abs(varianceKwh) / boundaryTotalKwh) * 100 : 0;
}

function statusForVariance(
  variancePercent: number,
  boundaryTotalKwh: number,
  thresholds: ReconciliationThresholds
): ReconciliationStatus {
  if (boundaryTotalKwh <= 0) {
    return "No boundary data";
  }

  if (variancePercent <= thresholds.greenPercent) {
    return "Green";
  }

  if (variancePercent <= thresholds.amberPercent) {
    return "Amber";
  }

  return "Red";
}

export function reconcileSubmeterConsumptionToBoundary({
  boundaryMeterRows,
  submeterRows,
  consumptionRows,
  thresholds = defaultReconciliationThresholds
}: {
  boundaryMeterRows: HalfHourlyImportRow[];
  submeterRows: SiteSubmeterRecord[];
  consumptionRows: SubmeterConsumptionRecord[];
  thresholds?: ReconciliationThresholds;
}): SubmeterReconciliationResult {
  const excludedRecords: ReconciliationExcludedRecord[] = [];
  const submeterByMeter = new Map(
    submeterRows
      .filter((row) => row.meter.trim())
      .map((row) => [row.meter.trim(), row])
  );
  const validBoundaryRows = boundaryMeterRows.filter((row) => {
    if (!Number.isFinite(row.totalKwh) || row.totalKwh < 0) {
      excludedRecords.push({
        id: row.id,
        source: "Boundary meter",
        reference: row.mpan,
        reason: "Invalid boundary import"
      });
      return false;
    }

    return true;
  });
  const boundaryMeterImportTotalKwh = validBoundaryRows.reduce(
    (total, row) => total + row.totalKwh,
    0
  );
  const includedSubmeterRecords: ReconciliationIncludedSubmeterRecord[] = [];

  consumptionRows.forEach((row) => {
    const meter = row.meter.trim();
    const submeter = submeterByMeter.get(meter);

    if (!meter) {
      excludedRecords.push({
        id: row.id,
        source: "Submeter consumption",
        reference: row.meter,
        reason: "Missing meter"
      });
      return;
    }

    if (!submeter) {
      excludedRecords.push({
        id: row.id,
        source: "Submeter consumption",
        reference: meter,
        reason: "Unknown meter"
      });
      return;
    }

    if (
      !isValidDateText(row.periodStart) ||
      !isValidDateText(row.periodEnd) ||
      new Date(row.periodEnd) < new Date(row.periodStart)
    ) {
      excludedRecords.push({
        id: row.id,
        source: "Submeter consumption",
        reference: meter,
        reason: "Invalid period"
      });
      return;
    }

    if (!Number.isFinite(row.consumptionValue)) {
      excludedRecords.push({
        id: row.id,
        source: "Submeter consumption",
        reference: meter,
        reason: "Missing consumption"
      });
      return;
    }

    if (row.consumptionValue < 0) {
      excludedRecords.push({
        id: row.id,
        source: "Submeter consumption",
        reference: meter,
        reason: "Negative consumption"
      });
      return;
    }

    includedSubmeterRecords.push({
      id: row.id,
      meter,
      location: submeter.location,
      responsibility: submeter.responsibility,
      format: row.format,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      consumptionKwh: row.consumptionValue
    });
  });

  const totalSubmeterConsumptionKwh = includedSubmeterRecords.reduce(
    (total, row) => total + row.consumptionKwh,
    0
  );
  const varianceKwh = boundaryMeterImportTotalKwh - totalSubmeterConsumptionKwh;
  const variancePercent = absoluteVariancePercent(varianceKwh, boundaryMeterImportTotalKwh);
  const underRecordedConsumptionKwh = Math.max(varianceKwh, 0);
  const overRecordedConsumptionKwh = Math.max(-varianceKwh, 0);
  const unknownInternalUsageKwh = underRecordedConsumptionKwh;

  return {
    boundaryMeterImportTotalKwh,
    totalSubmeterConsumptionKwh,
    underRecordedConsumptionKwh,
    overRecordedConsumptionKwh,
    unknownInternalUsageKwh,
    varianceKwh,
    variancePercent,
    status: statusForVariance(variancePercent, boundaryMeterImportTotalKwh, thresholds),
    thresholds,
    includedSubmeterRecords,
    excludedRecords,
    auditTrace: [
      {
        label: "Boundary meter import total",
        formula: "sum(validBoundaryRows.totalKwh)",
        value: boundaryMeterImportTotalKwh,
        unit: "kWh",
        sourceRowIds: validBoundaryRows.map((row) => row.id)
      },
      {
        label: "Included submeter consumption",
        formula: "sum(includedSubmeterRecords.consumptionKwh)",
        value: totalSubmeterConsumptionKwh,
        unit: "kWh",
        sourceRowIds: includedSubmeterRecords.map((row) => row.id)
      },
      {
        label: "Reconciliation variance",
        formula: "boundaryMeterImportTotalKwh - totalSubmeterConsumptionKwh",
        value: varianceKwh,
        unit: "kWh",
        sourceRowIds: [
          ...validBoundaryRows.map((row) => row.id),
          ...includedSubmeterRecords.map((row) => row.id)
        ]
      },
      {
        label: "Reconciliation variance percent",
        formula: "abs(varianceKwh) / boundaryMeterImportTotalKwh * 100",
        value: variancePercent,
        unit: "Percent",
        sourceRowIds: []
      }
    ]
  };
}
