import { describe, expect, it } from "vitest";
import { createDefaultInputSelectionScaffold } from "@/lib/input-selection-readiness";
import { summariseUtilityHubSelectorReadiness } from "@/lib/utilityhub-selector-readiness";
import type { Project } from "@/types/project";

const project: Project = {
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

describe("UtilityHub selector readiness", () => {
  it("shows contract-ready unavailable states before live service integration", () => {
    const summary = summariseUtilityHubSelectorReadiness(project);

    expect(summary.status).toBe("Contract ready");
    expect(summary.contractReadyCount).toBe(5);
    expect(summary.liveServiceConnectedCount).toBe(0);
    expect(summary.items.every((item) => item.status === "awaiting-service")).toBe(true);
  });

  it("keeps default customer/site evidence non-tariff-impacting", () => {
    const summary = summariseUtilityHubSelectorReadiness({
      ...project,
      inputSelections: createDefaultInputSelectionScaffold(project)
    });

    expect(summary.status).toBe("Selected evidence present");
    expect(summary.selectedEvidenceCount).toBe(1);
    expect(summary.tariffDrivingCount).toBe(0);
    expect(summary.items.find((item) => item.key === "customer-site-context")).toMatchObject({
      status: "selected-evidence",
      tariffDrivingCount: 0
    });
  });

  it("blocks if selected UtilityHub data has become tariff-driving", () => {
    const scaffold = createDefaultInputSelectionScaffold(project).map((selection) =>
      selection.group === "customer-site-context"
        ? { ...selection, tariffUse: "tariff-driving" as const }
        : selection
    );

    const summary = summariseUtilityHubSelectorReadiness({
      ...project,
      inputSelections: scaffold
    });

    expect(summary.status).toBe("Blocked");
    expect(summary.tariffDrivingCount).toBe(1);
    expect(summary.items[0].message).toContain("owner sign-off");
  });
});
