import { describe, expect, it } from "vitest";
import {
  adaptUtilityHubReferenceDataSelector,
  type UtilityHubReferenceDataSelectorItem
} from "@/lib/utilityhub-reference-data-selector-adapter";
import type { UtilityHubSelectorEnvelope } from "@/lib/utilityhub-customer-site-selector-adapter";

const retrievedAt = "2026-06-25T21:50:00.000Z";

const referenceData: UtilityHubReferenceDataSelectorItem = {
  referenceDataId: "tlm-2025-01",
  referenceDataType: "tlm",
  displayName: "Transmission Loss Multipliers January 2025",
  periodStart: "2025-01-01",
  periodEnd: "2025-01-31",
  coverageStatus: "partial",
  validationStatus: "review_required",
  validationIssueCount: 2,
  source: "UtilityHub shared reference data",
  sourceVersion: "utilityhub:reference-data-123",
  lastUpdatedAt: retrievedAt,
  provenance: {
    sourceSystem: "utilityhub",
    sourceRecordId: "reference-data:tlm-2025-01",
    sourceVersion: "utilityhub:reference-data-123",
    snapshotId: "reference-data-123",
    retrievedAt,
    lastUpdatedAt: retrievedAt
  }
};

function envelope(
  overrides: Partial<UtilityHubSelectorEnvelope<UtilityHubReferenceDataSelectorItem>> = {}
): UtilityHubSelectorEnvelope<UtilityHubReferenceDataSelectorItem> {
  return {
    contractVersion: "utilityhub-tariff-selectors.v1",
    state: "available",
    permissionStatus: "allowed",
    retrievedAt,
    items: [referenceData],
    ...overrides
  };
}

describe("UtilityHub reference data selector adapter", () => {
  it("maps reference data records into evidence options", () => {
    const result = adaptUtilityHubReferenceDataSelector(envelope());

    expect(result.status).toBe("ready");
    expect(result.validationIssueCount).toBe(2);
    expect(result.incompleteCoverageCount).toBe(1);
    expect(result.options[0]).toMatchObject({
      referenceDataType: "tlm",
      sourceVersion: "utilityhub:reference-data-123",
      snapshotId: "reference-data-123"
    });
  });

  it("keeps empty, unavailable and access-denied states explicit", () => {
    expect(adaptUtilityHubReferenceDataSelector(envelope({ state: "empty", items: [] })).status).toBe(
      "empty"
    );
    expect(
      adaptUtilityHubReferenceDataSelector(
        envelope({ state: "unavailable", items: [], message: "Selector unavailable." })
      )
    ).toMatchObject({ status: "unavailable", options: [] });
    expect(
      adaptUtilityHubReferenceDataSelector(
        envelope({ state: "access_denied", permissionStatus: "denied", items: [] })
      )
    ).toMatchObject({ status: "access-denied", options: [] });
  });
});
