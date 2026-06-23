import type {
  SubmeterConsumptionRecord,
  TransmissionLossMultiplierInput
} from "@/types/project";

export type LossAdjustedConsumptionWarning = {
  code:
    | "Missing Transmission Loss Multiplier"
    | "Unsupported consumption format"
    | "Invalid half-hourly period count";
  message: string;
  rowId: string;
  meter: string;
  settlementDate?: string;
  settlementPeriod?: number;
};

export type LossAdjustedSettlementPeriod = {
  rowId: string;
  meter: string;
  settlementDate: string;
  settlementPeriod: number;
  rawConsumptionKwh: number;
  transmissionLossMultiplier: number;
  lossAdjustedConsumptionKwh: number;
  multiplierSourceRowId: string;
};

export type LossAdjustmentTraceEntry = {
  label: string;
  formula: string;
  rawConsumptionKwh: number;
  multiplier: number;
  lossAdjustedConsumptionKwh: number;
  sourceRowIds: string[];
};

export type LossAdjustedConsumptionResult = {
  adjustedPeriods: LossAdjustedSettlementPeriod[];
  rawConsumptionKwh: number;
  lossAdjustedConsumptionKwh: number;
  warnings: LossAdjustedConsumptionWarning[];
  auditTrace: LossAdjustmentTraceEntry[];
};

function multiplierKey(settlementDate: string, settlementPeriod: number, gspGroup: string) {
  return [settlementDate, settlementPeriod, gspGroup].join("::");
}

export function calculateLossAdjustedHalfHourlyConsumption({
  consumptionRows,
  multipliers,
  gspGroup = ""
}: {
  consumptionRows: SubmeterConsumptionRecord[];
  multipliers: TransmissionLossMultiplierInput[];
  gspGroup?: string;
}): LossAdjustedConsumptionResult {
  const warnings: LossAdjustedConsumptionWarning[] = [];
  const multiplierByKey = new Map(
    multipliers.map((row) => [
      multiplierKey(row.settlementDate, row.settlementPeriod, row.gspGroup),
      row
    ])
  );
  const adjustedPeriods: LossAdjustedSettlementPeriod[] = [];

  consumptionRows.forEach((row) => {
    if (row.format !== "Half-hourly") {
      warnings.push({
        code: "Unsupported consumption format",
        message:
          "Transmission Loss Multipliers are not applied to non-half-hourly consumption without an approved profiling approach.",
        rowId: row.id,
        meter: row.meter
      });
      return;
    }

    if (row.settlementPeriodKwh?.length !== 48) {
      warnings.push({
        code: "Invalid half-hourly period count",
        message: "Loss adjustment requires exactly 48 half-hourly settlement periods.",
        rowId: row.id,
        meter: row.meter
      });
      return;
    }

    row.settlementPeriodKwh.forEach((rawConsumptionKwh, index) => {
      const settlementPeriod = index + 1;
      const multiplier =
        multiplierByKey.get(multiplierKey(row.periodStart, settlementPeriod, gspGroup)) ??
        multiplierByKey.get(multiplierKey(row.periodStart, settlementPeriod, ""));

      if (!multiplier) {
        warnings.push({
          code: "Missing Transmission Loss Multiplier",
          message: `Missing TLM for ${row.periodStart} settlement period ${settlementPeriod}.`,
          rowId: row.id,
          meter: row.meter,
          settlementDate: row.periodStart,
          settlementPeriod
        });
        return;
      }

      adjustedPeriods.push({
        rowId: row.id,
        meter: row.meter,
        settlementDate: row.periodStart,
        settlementPeriod,
        rawConsumptionKwh,
        transmissionLossMultiplier: multiplier.transmissionLossMultiplier,
        lossAdjustedConsumptionKwh: rawConsumptionKwh * multiplier.transmissionLossMultiplier,
        multiplierSourceRowId: multiplier.id
      });
    });
  });

  const rawConsumptionKwh = adjustedPeriods.reduce(
    (total, row) => total + row.rawConsumptionKwh,
    0
  );
  const lossAdjustedConsumptionKwh = adjustedPeriods.reduce(
    (total, row) => total + row.lossAdjustedConsumptionKwh,
    0
  );

  return {
    adjustedPeriods,
    rawConsumptionKwh,
    lossAdjustedConsumptionKwh,
    warnings,
    auditTrace: adjustedPeriods.map((row) => ({
      label: `${row.meter} ${row.settlementDate} SP${row.settlementPeriod} loss adjustment`,
      formula: "rawConsumptionKwh * transmissionLossMultiplier",
      rawConsumptionKwh: row.rawConsumptionKwh,
      multiplier: row.transmissionLossMultiplier,
      lossAdjustedConsumptionKwh: row.lossAdjustedConsumptionKwh,
      sourceRowIds: [row.rowId, row.multiplierSourceRowId]
    }))
  };
}
