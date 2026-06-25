import { describe, expect, it } from "vitest";
import { getCustomerSiteSelectorResult } from "@/lib/customer-site-selector-service";
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

describe("customer/site selector service boundary", () => {
  it("uses the local contract envelope mode before live UtilityHub calls are approved", () => {
    const result = getCustomerSiteSelectorResult(project);

    expect(result.mode).toBe("local-contract-envelope");
    expect(result.status).toBe("empty");
  });

  it("returns selected evidence from manual UtilityHub references", () => {
    const result = getCustomerSiteSelectorResult({
      ...project,
      utilityHubCustomerId: "customer-1",
      utilityHubSiteId: "site-1"
    });

    expect(result.mode).toBe("local-contract-envelope");
    expect(result.status).toBe("ready");
    expect(result.selectedOption).toMatchObject({
      customerId: "customer-1",
      siteId: "site-1"
    });
  });
});
