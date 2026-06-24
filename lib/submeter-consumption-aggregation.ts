import type { SiteSubmeterRecord, SubmeterConsumptionRecord } from "@/types/project";

export type SubmeterConsumptionAggregationGroup =
  | "Meter"
  | "Location"
  | "Responsibility"
  | "Tenant";

export type SubmeterConsumptionAggregationRow = {
  key: string;
  label: string;
  group: SubmeterConsumptionAggregationGroup;
  consumptionKwh: number;
  recordCount: number;
  meterCount: number;
  meters: string[];
};

export type SubmeterConsumptionAggregationResult = {
  byMeter: SubmeterConsumptionAggregationRow[];
  byLocation: SubmeterConsumptionAggregationRow[];
  byResponsibility: SubmeterConsumptionAggregationRow[];
  byTenant: SubmeterConsumptionAggregationRow[];
  unknownMeterRecords: SubmeterConsumptionRecord[];
};

type AggregationAccumulator = {
  consumptionKwh: number;
  recordCount: number;
  meters: Set<string>;
};

function normaliseKey(value: string) {
  return value.trim();
}

function addToGroup(
  groups: Map<string, AggregationAccumulator>,
  groupKey: string,
  meter: string,
  consumptionKwh: number
) {
  const existing = groups.get(groupKey) ?? {
    consumptionKwh: 0,
    recordCount: 0,
    meters: new Set<string>()
  };

  existing.consumptionKwh += consumptionKwh;
  existing.recordCount += 1;

  if (meter.trim()) {
    existing.meters.add(meter.trim());
  }

  groups.set(groupKey, existing);
}

function toRows(
  group: SubmeterConsumptionAggregationGroup,
  groups: Map<string, AggregationAccumulator>
): SubmeterConsumptionAggregationRow[] {
  return Array.from(groups.entries())
    .map(([key, value]) => ({
      key,
      label: key,
      group,
      consumptionKwh: value.consumptionKwh,
      recordCount: value.recordCount,
      meterCount: value.meters.size,
      meters: Array.from(value.meters).sort()
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function aggregateSubmeterConsumption({
  submeters,
  consumptionRows
}: {
  submeters: SiteSubmeterRecord[];
  consumptionRows: SubmeterConsumptionRecord[];
}): SubmeterConsumptionAggregationResult {
  const submeterByMeter = new Map(
    submeters
      .filter((submeter) => submeter.meter.trim())
      .map((submeter) => [submeter.meter.trim(), submeter])
  );
  const meterGroups = new Map<string, AggregationAccumulator>();
  const locationGroups = new Map<string, AggregationAccumulator>();
  const responsibilityGroups = new Map<string, AggregationAccumulator>();
  const tenantGroups = new Map<string, AggregationAccumulator>();
  const unknownMeterRecords: SubmeterConsumptionRecord[] = [];

  consumptionRows.forEach((row) => {
    const meter = normaliseKey(row.meter);
    const submeter = submeterByMeter.get(meter);

    if (!submeter) {
      unknownMeterRecords.push(row);
      return;
    }

    addToGroup(meterGroups, meter, meter, row.consumptionValue);
    addToGroup(locationGroups, submeter.location || "Unmapped location", meter, row.consumptionValue);
    addToGroup(responsibilityGroups, submeter.responsibility, meter, row.consumptionValue);

    if (submeter.responsibility === "Tenant") {
      addToGroup(tenantGroups, submeter.tenantName || "Unmapped tenant", meter, row.consumptionValue);
    }
  });

  return {
    byMeter: toRows("Meter", meterGroups),
    byLocation: toRows("Location", locationGroups),
    byResponsibility: toRows("Responsibility", responsibilityGroups),
    byTenant: toRows("Tenant", tenantGroups),
    unknownMeterRecords
  };
}
