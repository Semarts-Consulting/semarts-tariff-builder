import { describe, expect, it } from "vitest";
import { adaptUtilityHubBoundaryMeterSelector } from "@/lib/utilityhub-boundary-meter-selector-adapter";
import type { UtilityHubSelectorEnvelope } from "@/lib/utilityhub-customer-site-selector-adapter";
import type { UtilityHubMeterSelectorItem } from "@/lib/utilityhub-meter-selector-adapter";

const retrievedAt = "2026-06-25T21:40:00.000Z";

function meter(
  meterId: string,
  boundaryMeterCandidate: boolean
): UtilityHubMeterSelectorItem {
  return {
    meterId,
    meterReference: meterId,
    meterDisplayName: meterId,
    utilityType: "Electricity",
    supplyPointId: "supply-point-1",
    customerId: "customer-1",
    siteId: "site-1",
    locationLabel: "Main intake",
    meterRole: boundaryMeterCandidate ? "boundary" : "tenant",
    meterStatus: "Active",
    effectiveFrom: "2026-01-01",
    boundaryMeterCandidate,
    sourceVersion: "utilityhub:meter-selector-123",
    lastUpdatedAt: retrievedAt,
    validationStatus: "valid",
    validationIssueCount: 0,
    provenance: {
      sourceSystem: "utilityhub",
      sourceRecordId: `meter:${meterId}`,
      sourceVersion: "utilityhub:meter-selector-123",
      snapshotId: "meter-selector-123",
      retrievedAt,
      lastUpdatedAt: retrievedAt
    }
  };
}

function envelope(
  items: UtilityHubMeterSelectorItem[],
  overrides: Partial<UtilityHubSelectorEnvelope<UtilityHubMeterSelectorItem>> = {}
): UtilityHubSelectorEnvelope<UtilityHubMeterSelectorItem> {
  return {
    contractVersion: "utilityhub-tariff-selectors.v1",
    state: "available",
    permissionStatus: "allowed",
    retrievedAt,
    items,
    ...overrides
  };
}

describe("UtilityHub boundary meter selector adapter", () => {
  it("filters meter selector records to boundary candidates only", () => {
    const result = adaptUtilityHubBoundaryMeterSelector(
      envelope([meter("boundary-1", true), meter("tenant-1", false)])
    );

    expect(result.status).toBe("ready");
    expect(result.options).toHaveLength(1);
    expect(result.options[0]?.meterId).toBe("boundary-1");
  });

  it("reports empty when no boundary candidates exist", () => {
    const result = adaptUtilityHubBoundaryMeterSelector(envelope([meter("tenant-1", false)]));

    expect(result.status).toBe("empty");
    expect(result.options).toHaveLength(0);
  });
});
