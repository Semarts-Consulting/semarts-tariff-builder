import type {
  SiteSubmeterRecord,
  SubmeterConsumptionFormat,
  SubmeterConsumptionRecord
} from "@/types/project";

export type ExpectedConsumptionPeriod = {
  format: SubmeterConsumptionFormat;
  periodStart: string;
  periodEnd: string;
};

export type ConsumptionCoverageMeterResult = {
  meter: string;
  location: string;
  responsibility: SiteSubmeterRecord["responsibility"];
  expectedPeriodCount: number;
  coveredPeriodCount: number;
  missingPeriods: ExpectedConsumptionPeriod[];
  duplicatePeriods: ExpectedConsumptionPeriod[];
};

export type ConsumptionCoverageReview = {
  meterResults: ConsumptionCoverageMeterResult[];
  unknownMeterRecordIds: string[];
  totalMissingPeriods: number;
  totalDuplicatePeriods: number;
  isComplete: boolean;
};

export function createMonthlyExpectedConsumptionPeriods({
  startMonth,
  endMonth
}: {
  startMonth: string;
  endMonth: string;
}): ExpectedConsumptionPeriod[] {
  const start = parseMonthStart(startMonth);
  const end = parseMonthStart(endMonth);

  if (!start || !end || end < start) {
    return [];
  }

  const periods: ExpectedConsumptionPeriod[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));

  while (cursor <= end) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd = new Date(Date.UTC(year, month + 1, 0));

    periods.push({
      format: "Monthly",
      periodStart: toIsoDate(monthStart),
      periodEnd: toIsoDate(monthEnd)
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return periods;
}

export function reviewConsumptionPeriodCoverage({
  submeters,
  consumptionRows,
  expectedPeriods
}: {
  submeters: SiteSubmeterRecord[];
  consumptionRows: SubmeterConsumptionRecord[];
  expectedPeriods: ExpectedConsumptionPeriod[];
}): ConsumptionCoverageReview {
  const submeterByMeter = new Map(
    submeters
      .filter((row) => row.meter.trim())
      .map((row) => [row.meter.trim(), row])
  );
  const unknownMeterRecordIds = consumptionRows
    .filter((row) => row.meter.trim() && !submeterByMeter.has(row.meter.trim()))
    .map((row) => row.id);
  const meterResults = submeters
    .filter((row) => row.meter.trim())
    .map<ConsumptionCoverageMeterResult>((submeter) => {
      const meterRows = consumptionRows.filter((row) => row.meter.trim() === submeter.meter.trim());
      const missingPeriods: ExpectedConsumptionPeriod[] = [];
      const duplicatePeriods: ExpectedConsumptionPeriod[] = [];

      expectedPeriods.forEach((period) => {
        const matchingRows = meterRows.filter(
          (row) =>
            row.format === period.format &&
            row.periodStart === period.periodStart &&
            row.periodEnd === period.periodEnd
        );

        if (matchingRows.length === 0) {
          missingPeriods.push(period);
        } else if (matchingRows.length > 1) {
          duplicatePeriods.push(period);
        }
      });

      return {
        meter: submeter.meter,
        location: submeter.location,
        responsibility: submeter.responsibility,
        expectedPeriodCount: expectedPeriods.length,
        coveredPeriodCount: expectedPeriods.length - missingPeriods.length,
        missingPeriods,
        duplicatePeriods
      };
    });
  const totalMissingPeriods = meterResults.reduce(
    (total, row) => total + row.missingPeriods.length,
    0
  );
  const totalDuplicatePeriods = meterResults.reduce(
    (total, row) => total + row.duplicatePeriods.length,
    0
  );

  return {
    meterResults,
    unknownMeterRecordIds,
    totalMissingPeriods,
    totalDuplicatePeriods,
    isComplete:
      totalMissingPeriods === 0 &&
      totalDuplicatePeriods === 0 &&
      unknownMeterRecordIds.length === 0
  };
}

function parseMonthStart(value: string) {
  const match = /^(\d{4})-(\d{2})/.exec(value.trim());

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, 1));
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}
