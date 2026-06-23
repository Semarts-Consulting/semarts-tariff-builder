import { describe, expect, it } from "vitest";
import {
  defaultReconciliationThresholds,
  reconcileSubmeterConsumptionToBoundary
} from "@/lib/submeter-reconciliation";
import type {
  HalfHourlyImportRow,
  SiteSubmeterRecord,
  SubmeterConsumptionRecord
} from "@/types/project";

function boundary(overrides: Partial<HalfHourlyImportRow> = {}): HalfHourlyImportRow {
  return {
    id: overrides.id ?? "boundary-1",
    mpan: overrides.mpan ?? "1234567890123",
    date: overrides.date ?? "2026-04-01",
    totalKwh: overrides.totalKwh ?? 100,
    settlementPeriodKwh: overrides.settlementPeriodKwh ?? Array.from({ length: 48 }, () => 2),
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: "",
    ...overrides
  };
}

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
    rowFingerprint: "",
    ...overrides
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
    consumptionValue: overrides.consumptionValue ?? 99,
    unit: "kWh",
    sourceType: "Manual",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: "",
    validationStatus: "Pending review",
    ...overrides
  };
}

describe("submeter reconciliation", () => {
  it("reconciles boundary meter imports to valid submeter consumption", () => {
    const result = reconcileSubmeterConsumptionToBoundary({
      boundaryMeterRows: [boundary({ totalKwh: 100 })],
      submeterRows: [submeter()],
      consumptionRows: [consumption({ consumptionValue: 99 })]
    });

    expect(result.boundaryMeterImportTotalKwh).toBe(100);
    expect(result.totalSubmeterConsumptionKwh).toBe(99);
    expect(result.varianceKwh).toBe(1);
    expect(result.variancePercent).toBe(1);
    expect(result.status).toBe("Green");
    expect(result.thresholds).toEqual(defaultReconciliationThresholds);
    expect(result.auditTrace.map((entry) => entry.label)).toContain(
      "Reconciliation variance"
    );
  });

  it("reports amber and red variance using configurable thresholds", () => {
    const amber = reconcileSubmeterConsumptionToBoundary({
      boundaryMeterRows: [boundary({ totalKwh: 100 })],
      submeterRows: [submeter()],
      consumptionRows: [consumption({ consumptionValue: 98 })]
    });
    const red = reconcileSubmeterConsumptionToBoundary({
      boundaryMeterRows: [boundary({ totalKwh: 100 })],
      submeterRows: [submeter()],
      consumptionRows: [consumption({ consumptionValue: 95 })]
    });

    expect(amber.status).toBe("Amber");
    expect(red.status).toBe("Red");
  });

  it("returns exclusion reasons without hiding invalid records", () => {
    const result = reconcileSubmeterConsumptionToBoundary({
      boundaryMeterRows: [boundary({ id: "bad-boundary", totalKwh: -1 })],
      submeterRows: [submeter()],
      consumptionRows: [
        consumption({ id: "missing-meter", meter: "" }),
        consumption({ id: "unknown-meter", meter: "UNKNOWN" }),
        consumption({ id: "bad-period", periodStart: "2026-05-01", periodEnd: "2026-04-01" }),
        consumption({ id: "negative", consumptionValue: -5 })
      ]
    });

    expect(result.excludedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "bad-boundary", reason: "Invalid boundary import" }),
        expect.objectContaining({ id: "missing-meter", reason: "Missing meter" }),
        expect.objectContaining({ id: "unknown-meter", reason: "Unknown meter" }),
        expect.objectContaining({ id: "bad-period", reason: "Invalid period" }),
        expect.objectContaining({ id: "negative", reason: "Negative consumption" })
      ])
    );
  });

  it("identifies over-recorded and under-recorded consumption", () => {
    const under = reconcileSubmeterConsumptionToBoundary({
      boundaryMeterRows: [boundary({ totalKwh: 100 })],
      submeterRows: [submeter()],
      consumptionRows: [consumption({ consumptionValue: 90 })]
    });
    const over = reconcileSubmeterConsumptionToBoundary({
      boundaryMeterRows: [boundary({ totalKwh: 100 })],
      submeterRows: [submeter()],
      consumptionRows: [consumption({ consumptionValue: 110 })]
    });

    expect(under.underRecordedConsumptionKwh).toBe(10);
    expect(under.unknownInternalUsageKwh).toBe(10);
    expect(under.overRecordedConsumptionKwh).toBe(0);
    expect(over.underRecordedConsumptionKwh).toBe(0);
    expect(over.overRecordedConsumptionKwh).toBe(10);
  });
});
