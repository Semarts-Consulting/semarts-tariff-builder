import { describe, expect, it } from "vitest";
import { calculateLossAdjustedHalfHourlyConsumption } from "@/lib/loss-adjusted-consumption";
import type {
  SubmeterConsumptionRecord,
  TransmissionLossMultiplierInput
} from "@/types/project";

function consumption(
  overrides: Partial<SubmeterConsumptionRecord> = {}
): SubmeterConsumptionRecord {
  return {
    id: overrides.id ?? "hh-1",
    meter: overrides.meter ?? "MTR-001",
    format: overrides.format ?? "Half-hourly",
    periodStart: overrides.periodStart ?? "2026-04-01",
    periodEnd: overrides.periodEnd ?? "2026-04-01",
    consumptionValue: overrides.consumptionValue ?? 48,
    unit: "kWh",
    sourceType: "Manual",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: "",
    validationStatus: "Pending review",
    settlementPeriodKwh: overrides.settlementPeriodKwh ?? Array.from({ length: 48 }, () => 1),
    ...overrides
  };
}

function tlm(
  settlementPeriod: number,
  overrides: Partial<TransmissionLossMultiplierInput> = {}
): TransmissionLossMultiplierInput {
  return {
    id: overrides.id ?? `tlm-${settlementPeriod}`,
    settlementDate: overrides.settlementDate ?? "2026-04-01",
    settlementPeriod,
    transmissionLossMultiplier: overrides.transmissionLossMultiplier ?? 1.02,
    gspGroup: overrides.gspGroup ?? "",
    effectiveFromDate: "2026-04-01",
    source: "test",
    retrievedAt: "2026-06-23T08:00:00.000Z",
    version: "",
    importBatchId: "",
    rowFingerprint: "",
    ...overrides
  };
}

describe("loss-adjusted consumption", () => {
  it("applies TLMs to half-hourly consumption while preserving raw values", () => {
    const result = calculateLossAdjustedHalfHourlyConsumption({
      consumptionRows: [consumption()],
      multipliers: Array.from({ length: 48 }, (_, index) => tlm(index + 1))
    });

    expect(result.warnings).toEqual([]);
    expect(result.adjustedPeriods).toHaveLength(48);
    expect(result.rawConsumptionKwh).toBe(48);
    expect(result.lossAdjustedConsumptionKwh).toBeCloseTo(48.96);
    expect(result.auditTrace[0]).toMatchObject({
      formula: "rawConsumptionKwh * transmissionLossMultiplier",
      rawConsumptionKwh: 1,
      multiplier: 1.02,
      lossAdjustedConsumptionKwh: 1.02,
      sourceRowIds: ["hh-1", "tlm-1"]
    });
  });

  it("returns warnings for missing multipliers without approximation", () => {
    const result = calculateLossAdjustedHalfHourlyConsumption({
      consumptionRows: [consumption()],
      multipliers: Array.from({ length: 47 }, (_, index) => tlm(index + 1))
    });

    expect(result.adjustedPeriods).toHaveLength(47);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: "Missing Transmission Loss Multiplier",
        settlementPeriod: 48
      })
    );
  });

  it("does not apply TLMs to non-half-hourly records", () => {
    const result = calculateLossAdjustedHalfHourlyConsumption({
      consumptionRows: [
        consumption({
          format: "Monthly",
          settlementPeriodKwh: undefined
        })
      ],
      multipliers: Array.from({ length: 48 }, (_, index) => tlm(index + 1))
    });

    expect(result.adjustedPeriods).toEqual([]);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: "Unsupported consumption format"
      })
    );
  });

  it("does not adjust invalid half-hourly records", () => {
    const result = calculateLossAdjustedHalfHourlyConsumption({
      consumptionRows: [consumption({ settlementPeriodKwh: [1, 2] })],
      multipliers: Array.from({ length: 48 }, (_, index) => tlm(index + 1))
    });

    expect(result.adjustedPeriods).toEqual([]);
    expect(result.warnings).toContainEqual(
      expect.objectContaining({
        code: "Invalid half-hourly period count"
      })
    );
  });
});
