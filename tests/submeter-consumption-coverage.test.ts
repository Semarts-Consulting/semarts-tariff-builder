import { describe, expect, it } from "vitest";
import {
  createMonthlyExpectedConsumptionPeriods,
  reviewConsumptionPeriodCoverage
} from "@/lib/submeter-consumption-coverage";
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
    consumptionValue: 100,
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

describe("submeter consumption coverage", () => {
  it("creates expected monthly periods across a date range", () => {
    expect(
      createMonthlyExpectedConsumptionPeriods({
        startMonth: "2026-04",
        endMonth: "2026-06"
      })
    ).toEqual([
      { format: "Monthly", periodStart: "2026-04-01", periodEnd: "2026-04-30" },
      { format: "Monthly", periodStart: "2026-05-01", periodEnd: "2026-05-31" },
      { format: "Monthly", periodStart: "2026-06-01", periodEnd: "2026-06-30" }
    ]);
  });

  it("identifies missing periods, duplicates and unknown meters", () => {
    const review = reviewConsumptionPeriodCoverage({
      submeters: [
        submeter({ meter: "MTR-001" }),
        submeter({ id: "submeter-2", meter: "MTR-002", responsibility: "Plant Room" })
      ],
      consumptionRows: [
        consumption({ id: "april-a", meter: "MTR-001" }),
        consumption({ id: "april-b", meter: "MTR-001" }),
        consumption({
          id: "unknown",
          meter: "MTR-UNKNOWN",
          periodStart: "2026-05-01",
          periodEnd: "2026-05-31"
        })
      ],
      expectedPeriods: createMonthlyExpectedConsumptionPeriods({
        startMonth: "2026-04",
        endMonth: "2026-05"
      })
    });

    expect(review.isComplete).toBe(false);
    expect(review.totalMissingPeriods).toBe(3);
    expect(review.totalDuplicatePeriods).toBe(1);
    expect(review.unknownMeterRecordIds).toEqual(["unknown"]);
    expect(review.meterResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          meter: "MTR-001",
          coveredPeriodCount: 1,
          duplicatePeriods: [
            { format: "Monthly", periodStart: "2026-04-01", periodEnd: "2026-04-30" }
          ]
        }),
        expect.objectContaining({
          meter: "MTR-002",
          coveredPeriodCount: 0
        })
      ])
    );
  });
});
