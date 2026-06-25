import { describe, expect, it } from "vitest";
import { createLocalCustomerSiteSelectorEnvelope } from "@/lib/customer-site-selector-local-envelope";
import type { Project } from "@/types/project";

const project: Project = {
  id: "project",
  name: "2026 tariffs",
  tariffModelName: "POTLL Tariffs",
  networkName: "POTLL private network",
  tariffYear: 2026,
  effectiveDate: "2026-04-01",
  billingPeriod: "Monthly",
  customerClasses: ["LV"],
  status: "Draft",
  lastUpdated: "24 June 2026"
};

describe("local customer/site selector envelope", () => {
  it("returns an empty contract envelope before UtilityHub references exist", () => {
    const envelope = createLocalCustomerSiteSelectorEnvelope(project, "2026-06-25T20:00:00.000Z");

    expect(envelope).toMatchObject({
      contractVersion: "utilityhub-tariff-selectors.v1",
      state: "empty",
      permissionStatus: "allowed",
      items: []
    });
  });

  it("returns a read-only contract-shaped selector item from manual references", () => {
    const envelope = createLocalCustomerSiteSelectorEnvelope(
      {
        ...project,
        utilityHubCustomerId: "customer-1",
        utilityHubSiteId: "site-1"
      },
      "2026-06-25T20:00:00.000Z"
    );

    expect(envelope.state).toBe("available");
    expect(envelope.items[0]).toMatchObject({
      customerId: "customer-1",
      siteId: "site-1",
      permissionStatus: "read_only",
      sourceVersion: "tariff-builder-local:project:2026"
    });
  });
});
