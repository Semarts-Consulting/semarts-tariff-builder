import { describe, expect, it } from "vitest";
import {
  adaptUtilityHubMonthlyConsumptionSelector,
  type UtilityHubMonthlyConsumptionSelectorItem
} from "@/lib/utilityhub-monthly-consumption-selector-adapter";
import type { UtilityHubSelectorEnvelope } from "@/lib/utilityhub-customer-site-selector-adapter";

const retrievedAt = "2026-06-25T21:30:00.000Z";

const monthlySummary: UtilityHubMonthlyConsumptionSelectorItem = {
  meterId: "meter-1",
  periodStart: "2025-01-01",
  periodEnd: "2025-01-31",
  monthLabel: "January 2025",
  importKwh: 10000,
  exportKwh: 250,
  readingCoverageStatus: "partial",
  readingSource: "calculated_summary",
  sourceVersion: "utilityhub:monthly-consumption-123",
  calculatedAt: retrievedAt,
  validationStatus: "review_required",
  validationIssues: [
    {
      code: "partial-coverage",
      severity: "warning",
      message: "One day is missing readings."
    }
  ],
  provenance: {
    sourceSystem: "utilityhub",
    sourceRecordId: "monthly:meter-1:2025-01",
    sourceVersion: "utilityhub:monthly-consumption-123",
    snapshotId: "monthly-consumption-123",
    retrievedAt,
    lastUpdatedAt: retrievedAt
  }
};

function envelope(
  overrides: Partial<UtilityHubSelectorEnvelope<UtilityHubMonthlyConsumptionSelectorItem>> = {}
): UtilityHubSelectorEnvelope<UtilityHubMonthlyConsumptionSelectorItem> {
  return {
    contractVersion: "utilityhub-tariff-selectors.v1",
    state: "available",
    permissionStatus: "allowed",
    retrievedAt,
    items: [monthlySummary],
    ...overrides
  };
}

describe("UtilityHub monthly consumption selector adapter", () => {
  it("maps monthly summaries into evidence options and totals", () => {
    const result = adaptUtilityHubMonthlyConsumptionSelector(envelope());

    expect(result.status).toBe("ready");
    expect(result.totalImportKwh).toBe(10000);
    expect(result.totalExportKwh).toBe(250);
    expect(result.totalNetKwh).toBe(9750);
    expect(result.validationIssueCount).toBe(1);
    expect(result.incompleteCoverageCount).toBe(1);
    expect(result.options[0]).toMatchObject({
      meterId: "meter-1",
      monthLabel: "January 2025",
      sourceVersion: "utilityhub:monthly-consumption-123",
      snapshotId: "monthly-consumption-123"
    });
  });

  it("keeps empty, unavailable and access-denied states explicit", () => {
    expect(
      adaptUtilityHubMonthlyConsumptionSelector(envelope({ state: "empty", items: [] })).status
    ).toBe("empty");
    expect(
      adaptUtilityHubMonthlyConsumptionSelector(
        envelope({ state: "unavailable", items: [], message: "Selector unavailable." })
      )
    ).toMatchObject({ status: "unavailable", options: [] });
    expect(
      adaptUtilityHubMonthlyConsumptionSelector(
        envelope({ state: "access_denied", permissionStatus: "denied", items: [] })
      )
    ).toMatchObject({ status: "access-denied", options: [] });
  });
});
