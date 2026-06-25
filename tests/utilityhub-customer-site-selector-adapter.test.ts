import { describe, expect, it } from "vitest";
import {
  adaptUtilityHubCustomerSiteSelector,
  type UtilityHubCustomerSiteContextItem,
  type UtilityHubSelectorEnvelope
} from "@/lib/utilityhub-customer-site-selector-adapter";

const retrievedAt = "2026-06-25T20:00:00.000Z";

const item: UtilityHubCustomerSiteContextItem = {
  customerId: "customer-1",
  customerName: "Port of Tilbury",
  siteId: "site-1",
  siteName: "Tilbury private network",
  areaName: "London",
  buildingName: "Main intake",
  status: "Active",
  effectiveFrom: "2026-01-01",
  permissionStatus: "allowed",
  sourceVersion: "utilityhub:tariff-selector-123",
  lastUpdatedAt: retrievedAt,
  provenance: {
    sourceSystem: "utilityhub",
    sourceRecordId: "site:site-1",
    sourceVersion: "utilityhub:tariff-selector-123",
    snapshotId: "tariff-selector-123",
    retrievedAt,
    lastUpdatedAt: retrievedAt
  }
};

function envelope(
  overrides: Partial<UtilityHubSelectorEnvelope<UtilityHubCustomerSiteContextItem>> = {}
): UtilityHubSelectorEnvelope<UtilityHubCustomerSiteContextItem> {
  return {
    contractVersion: "utilityhub-tariff-selectors.v1",
    state: "available",
    permissionStatus: "allowed",
    retrievedAt,
    items: [item],
    ...overrides
  };
}

describe("UtilityHub customer/site selector adapter", () => {
  it("maps available UtilityHub records into Tariff Builder selector options", () => {
    const result = adaptUtilityHubCustomerSiteSelector(envelope(), {
      utilityHubCustomerId: "customer-1",
      utilityHubSiteId: "site-1"
    });

    expect(result.status).toBe("ready");
    expect(result.selectedOption).toMatchObject({
      customerId: "customer-1",
      siteId: "site-1",
      sourceVersion: "utilityhub:tariff-selector-123",
      snapshotId: "tariff-selector-123"
    });
    expect(result.options[0]?.hierarchyLabel).toBe(
      "Port of Tilbury / London / Tilbury private network / Main intake"
    );
  });

  it("keeps available records as options when the project has not selected one", () => {
    const result = adaptUtilityHubCustomerSiteSelector(envelope(), {});

    expect(result.status).toBe("ready");
    expect(result.selectedOption).toBeUndefined();
    expect(result.message).toBe("UtilityHub customer/site options are available for review.");
  });

  it("maps empty, unavailable and access denied states without leaking options", () => {
    expect(
      adaptUtilityHubCustomerSiteSelector(envelope({ state: "empty", items: [] }), {}).status
    ).toBe("empty");
    expect(
      adaptUtilityHubCustomerSiteSelector(
        envelope({ state: "unavailable", items: [], message: "Selector not connected." }),
        {}
      )
    ).toMatchObject({ status: "unavailable", options: [] });
    expect(
      adaptUtilityHubCustomerSiteSelector(
        envelope({ state: "access_denied", permissionStatus: "denied", items: [] }),
        {}
      )
    ).toMatchObject({ status: "access-denied", options: [] });
  });
});
