import { describe, expect, it } from "vitest";
import {
  createDefaultInputSelectionScaffold,
  summariseInputSelectionReadiness
} from "@/lib/input-selection-readiness";
import type { Project, TariffYearInputSelection } from "@/types/project";

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

describe("input selection readiness", () => {
  it("creates evidence-only default scaffolding without tariff-driving selections", () => {
    const scaffold = createDefaultInputSelectionScaffold(project);

    expect(scaffold).toHaveLength(4);
    expect(scaffold.every((selection) => selection.tariffUse === "evidence-only")).toBe(true);
    expect(scaffold.some((selection) => selection.tariffUse === "tariff-driving")).toBe(false);
  });

  it("summarises default scaffold as needing review", () => {
    const summary = summariseInputSelectionReadiness(createDefaultInputSelectionScaffold(project));

    expect(summary.status).toBe("Needs review");
    expect(summary.groupSummaries).toHaveLength(4);
    expect(summary.groupSummaries[0]).toMatchObject({
      group: "customer-site-context",
      selectedCount: 1,
      evidenceOnlyCount: 1,
      tariffDrivingCount: 0
    });
  });

  it("flags blocked selections", () => {
    const selections: TariffYearInputSelection[] = [
      {
        ...createDefaultInputSelectionScaffold(project)[0],
        selectionStatus: "blocked",
        tariffUse: "blocked"
      }
    ];

    expect(summariseInputSelectionReadiness(selections).status).toBe("Blocked");
  });

  it("surfaces tariff-driving selections for explicit review", () => {
    const selections: TariffYearInputSelection[] = createDefaultInputSelectionScaffold(project).map(
      (selection) =>
        selection.group === "meter-consumption"
          ? {
              ...selection,
              selectionStatus: "selected",
              reviewStatus: "accepted",
              tariffUse: "tariff-driving"
            }
          : selection
    );

    const meterSummary = summariseInputSelectionReadiness(selections).groupSummaries.find(
      (summary) => summary.group === "meter-consumption"
    );

    expect(meterSummary?.tariffDrivingCount).toBe(1);
    expect(meterSummary?.messages).toContain("Tariff-driving input exists and must have owner sign-off.");
  });
});
