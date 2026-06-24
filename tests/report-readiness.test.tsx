/**
 * @vitest-environment jsdom
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsSummary } from "@/components/ReportsSummary";
import {
  reportReadinessScenarios,
  type ReportReadinessScenario
} from "@/tests/fixtures/report-readiness";

type RenderedReport = {
  container: HTMLDivElement;
  root: Root;
};

const mockState = vi.hoisted((): {
  scenariosByProjectId: Map<string, ReportReadinessScenario>;
} => ({
  scenariosByProjectId: new Map()
}));

vi.mock("@/lib/project-storage", () => ({
  getProjectById: (projectId: string) => mockState.scenariosByProjectId.get(projectId)?.project,
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

const renderedReports: RenderedReport[] = [];

function getText(container: HTMLElement) {
  return container.textContent ?? "";
}

function getButton(container: HTMLElement, label: string) {
  const button = Array.from(container.querySelectorAll("button")).find((candidate) =>
    candidate.textContent?.includes(label)
  );

  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  return button;
}

async function renderReport(projectId: string) {
  const container = document.createElement("div");
  const root = createRoot(container);
  document.body.appendChild(container);
  renderedReports.push({ container, root });

  await act(async () => {
    root.render(<ReportsSummary projectId={projectId} />);
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
  renderedReports.splice(0).forEach(({ container, root }) => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });
  vi.restoreAllMocks();
});

describe("ReportsSummary readiness regression coverage", () => {
  it("renders ready report status, financial totals, and audit evidence", async () => {
    const container = await renderReport("report-ready-project");
    const text = getText(container);

    expect(text).toContain("Report readiness");
    expect(text).toContain("Ready for review");
    expect(text).toContain("Recoverable cost");
    expect(text).toContain("£12,500.00");
    expect(text).toContain("Allocated cost");
    expect(text).toContain("Revenue variance: £0.00");
    expect(text).toContain("Tariff schedule");
    expect(text).toContain("Ready report project");
    expect(text).toContain("Calculation audit trace");
    expect(text).toContain("Network standing charge recoverable cost");
    expect(text).toContain("annualAmount * recoverablePercent / 100");
    expect(text).toContain("Source row: cost-standing-network");
  });

  it("renders supply evidence without changing network tariff totals", async () => {
    const container = await renderReport("report-ready-project");
    const text = getText(container);

    expect(text).toContain("Supply evidence only");
    expect(text).toContain("Not tariff-impacting");
    expect(text).toContain(
      "They do not change network revenue requirement, recoverable cost, revenue recovery, or tariff rates"
    );
    expect(text).toContain("Supplier standing charge");
    expect(text).toContain("Supplier unit charge");
    expect(text).toContain("Transmission pass-through");
    expect(text).toContain("Evidence only; excluded from network tariff recovery totals.");
    expect(text).toContain("Supply energy p/kWh evidence");
    expect(text).toContain("Supply energy p/kWh evidence is ready for review.");
    expect(text).toContain("Recorded base total");
    expect(text).toContain("Before customer-specific loss application");
    expect(text).toContain("Needs volume data");
    expect(text).toContain("Fixed evidence annual amount");
    expect(text).toContain("19,596.00");
    expect(text).toContain("Pass-through evidence amount");
    expect(text).toContain("0.00");
    expect(text).toContain("Revenue requirement");
    expect(text).toContain("12,500.00");
    expect(text).toContain("Revenue variance:");
  });

  it("renders submeter reconciliation and loss evidence without changing tariff totals", async () => {
    const container = await renderReport("report-ready-project");
    const text = getText(container);

    expect(text).toContain("Submeter and loss evidence only");
    expect(text).toContain("Not tariff-impacting");
    expect(text).toContain(
      "They do not change the aggregate customer-class tariff inputs, network revenue requirement, tariff rates, or report totals"
    );
    expect(text).toContain("Boundary to submeter reconciliation");
    expect(text).toContain("Boundary import total:");
    expect(text).toContain("Included submeter total:");
    expect(text).toContain("Reconciliation status");
    expect(text).toContain("Loss adjustment evidence");
    expect(text).toContain("Raw HH consumption:");
    expect(text).toContain("Loss-adjusted HH consumption:");
    expect(text).toContain("Monthly consumption coverage");
    expect(text).toContain("Missing meter-periods:");
    expect(text).toContain("Unknown meter records:");
    expect(text).toContain("Consumption aggregation evidence");
    expect(text).toContain("Meter groups:");
    expect(text).toContain("Tenant groups:");
    expect(text).toContain("Utilityhub hierarchy mapping evidence");
    expect(text).toContain("Mapped submeters:");
    expect(text).toContain("Unmapped locations:");
    expect(text).toContain("Responsibility category evidence");
    expect(text).toContain("Tenant");
    expect(text).toContain("Plant Room");
    expect(text).toContain("Evidence warnings");
    expect(text).toContain("Submeter consumption UNKNOWN: Unknown meter.");
    expect(text).toContain("Missing TLM for 2026-04-01 settlement period 48.");
    expect(text).toContain("Revenue requirement");
    expect(text).toContain("12,500.00");
    expect(text).toContain("Revenue variance:");
  });

  it("renders asset evidence without changing tariff totals", async () => {
    const container = await renderReport("report-ready-project");
    const text = getText(container);

    expect(text).toContain("Asset evidence only");
    expect(text).toContain("Total value");
    expect(text).toContain("Chargeable value");
    expect(text).toContain("Asset readiness messages");
    expect(text).toContain("Value by voltage");
    expect(text).toContain("25,000 asset value is non-chargeable or evidence-only.");
    expect(text).toContain("Revenue requirement");
    expect(text).toContain("12,500.00");
    expect(text).toContain("Revenue variance:");
  });

  it("renders methodology cost evidence without changing tariff totals", async () => {
    const container = await renderReport("report-ready-project");
    const text = getText(container);

    expect(text).toContain("Methodology cost evidence only");
    expect(text).toContain(
      "They do not change the current recoverable cost pools, allocation, revenue requirement, tariff rates, report totals or export outputs"
    );
    expect(text).toContain("Ready for review");
    expect(text).toContain("Direct annual evidence");
    expect(text).toContain("£20,000.00");
    expect(text).toContain("Employee weighted FTE");
    expect(text).toContain("Overhead annual evidence");
    expect(text).toContain("£6,000.00");
    expect(text).toContain("Cost evidence categories");
    expect(text).toContain("Operations, Security");
    expect(text).toContain("Revenue requirement");
    expect(text).toContain("12,500.00");
    expect(text).toContain("Revenue variance:");
  });


  it("renders non-ready status, validation severity labels, and revenue variance", async () => {
    const container = await renderReport("report-non-ready-project");
    const text = getText(container);

    expect(text).toContain("Needs correction");
    expect(text).toContain("Warning");
    expect(text).toContain("Error");
    expect(text).toContain("Allocation method was created automatically");
    expect(text).toContain("Allocation class shares must total 100%.");
    expect(text).toContain("Allocation methods require at least one customer-class share.");
    expect(text).toContain("Revenue variance");
    expect(text).toContain("Variance £4,500.00.");
    expect(text).toContain("Allocated cost: £8,000.00");
    expect(text).toContain("Recoverable cost: £12,500.00");
    expect(text).toContain("Revenue recovered: No");
  });

  it("calls browser print from the report action", async () => {
    const printMock = vi.fn();
    const focusMock = vi.fn();
    Object.defineProperty(window, "print", {
      configurable: true,
      value: printMock
    });
    Object.defineProperty(window, "focus", {
      configurable: true,
      value: focusMock
    });

    const container = await renderReport("report-ready-project");

    await act(async () => {
      getButton(container, "Print / save PDF").dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
    });

    expect(focusMock).toHaveBeenCalledOnce();
    expect(printMock).toHaveBeenCalledOnce();
    expect(getText(container)).toContain("Opening print dialog");
  });

  it("downloads rendered HTML containing stakeholder report content", async () => {
    let downloadedBlob: Blob | undefined;
    let downloadedFileName = "";
    const createObjectUrlMock = vi.fn((blob: Blob) => {
      downloadedBlob = blob;
      return "blob:report-readiness";
    });
    const revokeObjectUrlMock = vi.fn();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrlMock
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrlMock
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function click(
      this: HTMLAnchorElement
    ) {
      downloadedFileName = this.download;
    });

    const container = await renderReport("report-ready-project");

    await act(async () => {
      getButton(container, "Download HTML").dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
    });

    expect(createObjectUrlMock).toHaveBeenCalledOnce();
    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:report-readiness");
    expect(downloadedFileName).toBe("report-ready-project-tariff-report.html");
    expect(downloadedBlob).toBeDefined();

    const html = await downloadedBlob?.text();
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Ready report project tariff report");
    expect(html).toContain("Tariff methodology report");
    expect(html).toContain("Ready for review");
    expect(html).toContain("Tariff schedule");
    expect(html).toContain("Calculation audit trace");
    expect(html).toContain("Supply evidence only");
    expect(html).toContain("Not tariff-impacting");
    expect(html).toContain("Supplier standing charge");
    expect(html).toContain("Submeter and loss evidence only");
    expect(html).toContain("Boundary to submeter reconciliation");
    expect(html).toContain("Loss adjustment evidence");
    expect(html).toContain("Monthly consumption coverage");
    expect(html).toContain("Utilityhub hierarchy mapping evidence");
    expect(html).toContain("Asset evidence only");
    expect(html).toContain("Asset readiness messages");
    expect(html).toContain("Methodology cost evidence only");
    expect(html).toContain("Cost evidence readiness");
  });

  it("downloads non-ready HTML containing readiness issues and revenue variance", async () => {
    let downloadedBlob: Blob | undefined;
    let downloadedFileName = "";
    const createObjectUrlMock = vi.fn((blob: Blob) => {
      downloadedBlob = blob;
      return "blob:non-ready-report";
    });
    const revokeObjectUrlMock = vi.fn();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrlMock
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectUrlMock
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function click(
      this: HTMLAnchorElement
    ) {
      downloadedFileName = this.download;
    });

    const container = await renderReport("report-non-ready-project");

    await act(async () => {
      getButton(container, "Download HTML").dispatchEvent(
        new MouseEvent("click", { bubbles: true })
      );
    });

    expect(createObjectUrlMock).toHaveBeenCalledOnce();
    expect(revokeObjectUrlMock).toHaveBeenCalledWith("blob:non-ready-report");
    expect(downloadedFileName).toBe("report-non-ready-project-tariff-report.html");
    expect(downloadedBlob).toBeDefined();

    const html = await downloadedBlob?.text();
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("Non-ready report project tariff report");
    expect(html).toContain("Needs correction");
    expect(html).toContain("Readiness items");
    expect(html).toContain("Revenue variance");
    expect(html).toContain("Allocation method was created automatically");
    expect(html).toContain("Allocation class shares must total 100%.");
    expect(html).toContain("Allocation methods require at least one customer-class share.");
    expect(html).toContain("Revenue recovered: No");
  });
});
