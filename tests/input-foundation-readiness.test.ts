import { describe, expect, it } from "vitest";
import { summariseInputFoundationReadiness } from "@/lib/input-foundation-readiness";
import type { Project } from "@/types/project";

const readyProject: Project = {
  id: "project",
  name: "2026 tariffs",
  tariffModelName: "POTLL Tariffs",
  networkName: "POTLL private network",
  utilityHubCustomerId: "customer-1",
  utilityHubSiteId: "site-1",
  tariffYear: 2026,
  referencePeriodStart: "2025-01-01",
  referencePeriodEnd: "2025-12-31",
  effectiveDate: "2026-04-01",
  billingPeriod: "Monthly",
  customerClasses: ["LV"],
  inputReadinessStatus: "in-progress",
  status: "Draft",
  lastUpdated: "24 June 2026"
};

describe("input foundation readiness", () => {
  it("reports ready when model, year, UtilityHub references and customer classes exist", () => {
    const summary = summariseInputFoundationReadiness(readyProject);

    expect(summary.status).toBe("Ready for input selection");
    expect(summary.checks).toEqual([]);
  });

  it("reports setup errors before required tariff-year fields exist", () => {
    const summary = summariseInputFoundationReadiness({
      ...readyProject,
      tariffModelName: "",
      name: "",
      networkName: "",
      tariffYear: 0,
      customerClasses: []
    });

    expect(summary.status).toBe("Needs setup");
    expect(summary.errorCount).toBe(4);
  });

  it("reports UtilityHub reference warnings without blocking local setup", () => {
    const summary = summariseInputFoundationReadiness({
      ...readyProject,
      utilityHubCustomerId: "",
      utilityHubSiteId: "",
      referencePeriodStart: "",
      referencePeriodEnd: ""
    });

    expect(summary.status).toBe("Needs UtilityHub references");
    expect(summary.warningCount).toBe(3);
  });
});
