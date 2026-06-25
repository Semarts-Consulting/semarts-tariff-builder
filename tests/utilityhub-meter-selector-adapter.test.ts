import { describe, expect, it } from "vitest";
import {
  adaptUtilityHubMeterSelector,
  type UtilityHubMeterSelectorItem
} from "@/lib/utilityhub-meter-selector-adapter";
import type { UtilityHubSelectorEnvelope } from "@/lib/utilityhub-customer-site-selector-adapter";

const retrievedAt = "2026-06-25T21:00:00.000Z";

const meter: UtilityHubMeterSelectorItem = {
  meterId: "meter-1",
  meterReference: "MTR-001",
  meterDisplayName: "Main boundary meter",
  utilityType: "Electricity",
  supplyPointId: "supply-point-1",
  customerId: "customer-1",
  siteId: "site-1",
  locationLabel: "POTLL / Main intake",
  meterRole: "boundary",
  responsibilityCategory: "Network Operator",
  meterStatus: "Active",
  effectiveFrom: "2026-01-01",
  boundaryMeterCandidate: true,
  sourceVersion: "utilityhub:meter-selector-123",
  lastUpdatedAt: retrievedAt,
  validationStatus: "review_required",
  validationIssueCount: 1,
  provenance: {
    sourceSystem: "utilityhub",
    sourceRecordId: "meter:meter-1",
    sourceVersion: "utilityhub:meter-selector-123",
    snapshotId: "meter-selector-123",
    retrievedAt,
    lastUpdatedAt: retrievedAt
  }
};

function envelope(
  overrides: Partial<UtilityHubSelectorEnvelope<UtilityHubMeterSelectorItem>> = {}
): UtilityHubSelectorEnvelope<UtilityHubMeterSelectorItem> {
  return {
    contractVersion: "utilityhub-tariff-selectors.v1",
    state: "available",
    permissionStatus: "allowed",
    retrievedAt,
    items: [meter],
    ...overrides
  };
}

describe("UtilityHub meter selector adapter", () => {
  it("maps available UtilityHub meters into evidence options", () => {
    const result = adaptUtilityHubMeterSelector(envelope());

    expect(result.status).toBe("ready");
    expect(result.validationIssueCount).toBe(1);
    expect(result.boundaryMeterCandidateCount).toBe(1);
    expect(result.options[0]).toMatchObject({
      meterId: "meter-1",
      meterReference: "MTR-001",
      meterRole: "boundary",
      boundaryMeterCandidate: true,
      sourceVersion: "utilityhub:meter-selector-123",
      snapshotId: "meter-selector-123"
    });
  });

  it("keeps empty, unavailable and access-denied states explicit", () => {
    expect(adaptUtilityHubMeterSelector(envelope({ state: "empty", items: [] })).status).toBe(
      "empty"
    );
    expect(
      adaptUtilityHubMeterSelector(
        envelope({ state: "unavailable", items: [], message: "Selector unavailable." })
      )
    ).toMatchObject({ status: "unavailable", options: [] });
    expect(
      adaptUtilityHubMeterSelector(
        envelope({ state: "access_denied", permissionStatus: "denied", items: [] })
      )
    ).toMatchObject({ status: "access-denied", options: [] });
  });

  it("preserves validation state without making meters tariff-driving", () => {
    const result = adaptUtilityHubMeterSelector(envelope());

    expect(result.options[0]?.validationStatus).toBe("review_required");
    expect(result.message).toBe("UtilityHub meter selector records are available as evidence.");
  });
});
