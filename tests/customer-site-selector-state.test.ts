import { describe, expect, it } from "vitest";
import { summariseCustomerSiteSelectorState } from "@/lib/customer-site-selector-state";
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

describe("customer/site selector state", () => {
  it("shows awaiting live selector when no references exist", () => {
    const summary = summariseCustomerSiteSelectorState(project);

    expect(summary.status).toBe("Awaiting live selector");
    expect(summary.hasCustomerReference).toBe(false);
    expect(summary.hasSiteReference).toBe(false);
    expect(summary.messages).toContain(
      "UtilityHub selector contract is available, but live selection is not connected in Tariff Builder yet."
    );
  });

  it("reports partial manual references", () => {
    const summary = summariseCustomerSiteSelectorState({
      ...project,
      utilityHubCustomerId: "customer-1"
    });

    expect(summary.status).toBe("Ready for manual references");
    expect(summary.hasCustomerReference).toBe(true);
    expect(summary.hasSiteReference).toBe(false);
  });

  it("reports ready for review when both manual references exist", () => {
    const summary = summariseCustomerSiteSelectorState({
      ...project,
      utilityHubCustomerId: "customer-1",
      utilityHubSiteId: "site-1"
    });

    expect(summary.status).toBe("Ready for review");
    expect(summary.messages).toContain(
      "Manual UtilityHub references are present and should be reviewed against UtilityHub."
    );
  });
});
