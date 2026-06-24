import { describe, expect, it } from "vitest";
import { aggregateSubmeterConsumption } from "@/lib/submeter-consumption-aggregation";
import type { SiteSubmeterRecord, SubmeterConsumptionRecord } from "@/types/project";

function submeter(overrides: Partial<SiteSubmeterRecord> = {}): SiteSubmeterRecord {
  return {
    id: overrides.id ?? "submeter-1",
    meter: overrides.meter ?? "MTR-001",
    location: overrides.location ?? "Terminal",
    responsibility: overrides.responsibility ?? "Tenant",
    tenantName: overrides.tenantName ?? "Tenant A",
    notes: "",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: ""
  };
}

function consumption(
  overrides: Partial<SubmeterConsumptionRecord> = {}
): SubmeterConsumptionRecord {
  return {
    id: overrides.id ?? "consumption-1",
    meter: overrides.meter ?? "MTR-001",
    format: overrides.format ?? "Monthly",
    periodStart: overrides.periodStart ?? "2026-04-01",
    periodEnd: overrides.periodEnd ?? "2026-04-30",
    consumptionValue: overrides.consumptionValue ?? 100,
    unit: "kWh",
    sourceType: "",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: "",
    validationStatus: "Validated"
  };
}

describe("submeter consumption aggregation", () => {
  it("aggregates consumption by meter, location, responsibility and tenant", () => {
    const result = aggregateSubmeterConsumption({
      submeters: [
        submeter({ meter: "MTR-001", location: "Terminal", tenantName: "Tenant A" }),
        submeter({
          id: "submeter-2",
          meter: "MTR-002",
          location: "Plant room",
          responsibility: "Plant Room",
          tenantName: ""
        })
      ],
      consumptionRows: [
        consumption({ id: "consumption-1", meter: "MTR-001", consumptionValue: 100 }),
        consumption({ id: "consumption-2", meter: "MTR-001", consumptionValue: 50 }),
        consumption({ id: "consumption-3", meter: "MTR-002", consumptionValue: 25 })
      ]
    });

    expect(result.byMeter).toEqual([
      expect.objectContaining({ key: "MTR-001", consumptionKwh: 150, recordCount: 2 }),
      expect.objectContaining({ key: "MTR-002", consumptionKwh: 25, recordCount: 1 })
    ]);
    expect(result.byLocation).toEqual([
      expect.objectContaining({ key: "Plant room", consumptionKwh: 25 }),
      expect.objectContaining({ key: "Terminal", consumptionKwh: 150 })
    ]);
    expect(result.byResponsibility).toEqual([
      expect.objectContaining({ key: "Plant Room", consumptionKwh: 25 }),
      expect.objectContaining({ key: "Tenant", consumptionKwh: 150 })
    ]);
    expect(result.byTenant).toEqual([
      expect.objectContaining({ key: "Tenant A", consumptionKwh: 150 })
    ]);
  });

  it("keeps unknown meter records out of grouped totals", () => {
    const result = aggregateSubmeterConsumption({
      submeters: [submeter()],
      consumptionRows: [
        consumption({ meter: "MTR-001", consumptionValue: 100 }),
        consumption({ id: "unknown", meter: "UNKNOWN", consumptionValue: 20 })
      ]
    });

    expect(result.byMeter).toEqual([
      expect.objectContaining({ key: "MTR-001", consumptionKwh: 100 })
    ]);
    expect(result.unknownMeterRecords.map((row) => row.id)).toEqual(["unknown"]);
  });
});
