/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TariffCalculationsSummary } from "@/components/TariffCalculationsSummary";
import {
  reportReadinessScenarios,
  type ReportReadinessScenario
} from "@/tests/fixtures/report-readiness";

type RenderedSummary = {
  container: HTMLDivElement;
  root: Root;
};

const mockState = vi.hoisted((): {
  scenariosByProjectId: Map<string, ReportReadinessScenario>;
} => ({
  scenariosByProjectId: new Map()
}));

vi.mock("@/lib/project-storage", () => ({
  getProjectDataInputs: (projectId: string) =>
    mockState.scenariosByProjectId.get(projectId)?.dataInputs,
  getProjectCostPools: (projectId: string) =>
    mockState.scenariosByProjectId.get(projectId)?.costPools,
  getProjectAllocationMethods: (projectId: string) =>
    mockState.scenariosByProjectId.get(projectId)?.allocationMethods,
  getProjectMethodologyInputs: (projectId: string) =>
    mockState.scenariosByProjectId.get(projectId)?.methodologyInputs,
  getSupplyReferenceData: () => reportReadinessScenarios[0].supplyReferenceData,
  getDnoNetworkAreaForMpan: () => undefined
}));

vi.mock("@/lib/supabase-sync", () => ({
  loadSupplyReferenceDataFromSupabase: vi.fn(async () => null)
}));

const renderedSummaries: RenderedSummary[] = [];

function getText(container: HTMLElement) {
  return container.textContent ?? "";
}

async function renderSummary(projectId: string) {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  renderedSummaries.push({ container, root });

  await act(async () => {
    root.render(<TariffCalculationsSummary projectId={projectId} />);
  });

  await act(async () => {
    await Promise.resolve();
  });

  return container;
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  mockState.scenariosByProjectId = new Map(
    reportReadinessScenarios.map((scenario) => [scenario.project.id, scenario])
  );
});

afterEach(() => {
  renderedSummaries.splice(0).forEach(({ container, root }) => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });
  vi.restoreAllMocks();
});

describe("TariffCalculationsSummary supply energy application", () => {
  it("renders supply energy application controls as preview until explicitly applied", async () => {
    const container = await renderSummary("report-ready-project");
    const text = getText(container);

    expect(text).toContain("Supply energy / kWh application");
    expect(text).toContain("Apply to tariff");
    expect(text).toContain("Site meter p/kWh");
    expect(text).toContain("Private loss multiplier");
    expect(text).toContain("Customer p/kWh");
    expect(text).toContain("Preview only");

    const applyToggle = container.querySelector<HTMLInputElement>("input[type='checkbox']");

    expect(applyToggle).not.toBeNull();

    await act(async () => {
      applyToggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(getText(container)).toContain("Included");
  });
});
