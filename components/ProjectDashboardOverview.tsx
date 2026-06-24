"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calculateTariffs } from "@/lib/calculation-engine";
import { summariseInputFoundationReadiness } from "@/lib/input-foundation-readiness";
import {
  createDefaultInputSelectionScaffold,
  summariseInputSelectionReadiness
} from "@/lib/input-selection-readiness";
import { projectSections } from "@/lib/sample-data";
import {
  getProjectById,
  getProjectAllocationMethods,
  getProjectCostPools,
  getProjectDataInputs
} from "@/lib/project-storage";
import type {
  Project,
  ProjectAllocationMethods,
  ProjectCostPools,
  ProjectDataInputs,
  TariffCalculationResult
} from "@/types/project";

type ProjectDashboardOverviewProps = {
  projectId: string;
};

type DashboardState = {
  project: Project | null;
  dataInputs: ProjectDataInputs | null;
  costPools: ProjectCostPools | null;
  allocationMethods: ProjectAllocationMethods | null;
  calculation: TariffCalculationResult | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0
  }).format(value);
}

function isComplete(value: boolean) {
  return value ? "Ready" : "Needs input";
}

export function ProjectDashboardOverview({ projectId }: ProjectDashboardOverviewProps) {
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    project: null,
    dataInputs: null,
    costPools: null,
    allocationMethods: null,
    calculation: null
  });

  useEffect(() => {
    const project = getProjectById(projectId);
    const dataInputs = getProjectDataInputs(projectId);
    const costPools = getProjectCostPools(projectId);
    const allocationMethods = getProjectAllocationMethods(projectId);
    const calculation = calculateTariffs({
      projectId,
      dataInputRows: dataInputs.rows,
      costPoolRows: costPools.rows,
      allocationRows: allocationMethods.rows
    });

    setDashboardState({
      project,
      dataInputs,
      costPools,
      allocationMethods,
      calculation
    });
  }, [projectId]);

  const totals = useMemo(() => {
    const dataRows = dashboardState.dataInputs?.rows ?? [];
    const costRows = dashboardState.costPools?.rows ?? [];
    const allocationRows = dashboardState.allocationMethods?.rows ?? [];
    const calculation = dashboardState.calculation;
    const customers = dataRows.reduce((total, row) => total + row.customerCount, 0);
    const annualKwh = dataRows.reduce((total, row) => total + row.annualKwh, 0);
    const grossCosts = costRows.reduce((total, row) => total + row.annualAmount, 0);
    const hasDataInputs = customers > 0 || annualKwh > 0;
    const hasCostPools = costRows.some((row) => row.annualAmount > 0);
    const hasAllocations =
      allocationRows.length > 0 && (calculation?.unbalancedAllocationCount ?? 0) === 0;
    const hasCalculations = (calculation?.allocatedCost ?? 0) > 0;

    return {
      customers,
      annualKwh,
      grossCosts,
      revenueRequirement: calculation?.revenueRequirement ?? 0,
      allocatedCost: calculation?.allocatedCost ?? 0,
      variance: calculation?.unallocatedCost ?? 0,
      unbalancedRows: calculation?.unbalancedAllocationCount ?? 0,
      completedSteps: [hasDataInputs, hasCostPools, hasAllocations, hasCalculations].filter(Boolean)
        .length
    };
  }, [dashboardState]);

  const sectionStatusByHref = {
    settings: "Ready",
    "data-inputs": isComplete(totals.customers > 0 || totals.annualKwh > 0),
    "cost-pools": isComplete(totals.grossCosts > 0),
    "allocation-methods": isComplete(totals.unbalancedRows === 0),
    "tariff-calculations": isComplete(totals.allocatedCost > 0),
    reports: isComplete(totals.allocatedCost > 0 && Math.abs(totals.variance) < 0.01)
  };

  const inputFoundationSummary = dashboardState.project
    ? summariseInputFoundationReadiness(dashboardState.project)
    : null;
  const inputSelectionSummary = dashboardState.project
    ? summariseInputSelectionReadiness(
        dashboardState.project.inputSelections?.length
          ? dashboardState.project.inputSelections
          : createDefaultInputSelectionScaffold(dashboardState.project)
      )
    : null;

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Progress</p>
          <p className="mt-2 text-2xl font-semibold">{totals.completedSteps}/4</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Revenue requirement</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(totals.revenueRequirement)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Customers</p>
          <p className="mt-2 text-2xl font-semibold">{formatNumber(totals.customers)}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Annual kWh</p>
          <p className="mt-2 text-2xl font-semibold">{formatNumber(totals.annualKwh)}</p>
        </div>
      </div>

      <div className="rounded-md border border-line bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-semibold">Readiness checks</h2>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-md border border-line bg-field p-3">
            <p className="font-medium text-ink/60">Allocated cost</p>
            <p className="mt-1">{formatCurrency(totals.allocatedCost)}</p>
          </div>
          <div className="rounded-md border border-line bg-field p-3">
            <p className="font-medium text-ink/60">Revenue variance</p>
            <p className="mt-1">{formatCurrency(totals.variance)}</p>
          </div>
          <div className="rounded-md border border-line bg-field p-3">
            <p className="font-medium text-ink/60">Allocation rows needing review</p>
            <p className="mt-1">{totals.unbalancedRows}</p>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-line bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Input foundation</h2>
            <p className="mt-1 text-sm text-ink/70">
              Tariff model, tariff year and UtilityHub reference readiness before input selection.
            </p>
          </div>
          <span className="w-fit rounded-full bg-field px-3 py-1 text-xs font-semibold text-semarts-dark">
            {inputFoundationSummary?.status ?? "Needs setup"}
          </span>
        </div>

        {inputFoundationSummary && inputFoundationSummary.checks.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm">
            {inputFoundationSummary.checks.map((check) => (
              <li key={check.code} className="rounded-md border border-line bg-field p-3">
                <span className="font-medium">{check.label}: </span>
                <span>{check.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-ink/70">
            Model/year setup is ready for input selection. UtilityHub-sourced data still needs
            reviewed selection before it can affect tariffs.
          </p>
        )}
      </div>

      <div className="rounded-md border border-line bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Input selection readiness</h2>
            <p className="mt-1 text-sm text-ink/70">
              UtilityHub and reference data selection groups for this tariff year. These are
              evidence-only until reviewed and explicitly approved as tariff-driving.
            </p>
          </div>
          <span className="w-fit rounded-full bg-field px-3 py-1 text-xs font-semibold text-semarts-dark">
            {inputSelectionSummary?.status ?? "Not started"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {inputSelectionSummary?.groupSummaries.map((summary) => (
            <div key={summary.group} className="rounded-md border border-line bg-field p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{summary.label}</p>
                  <p className="mt-1 text-xs text-ink/60">
                    {summary.selectedCount} selected, {summary.evidenceOnlyCount} evidence-only,{" "}
                    {summary.tariffDrivingCount} tariff-driving
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-semarts-dark">
                  {summary.status}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-ink/70">
                {summary.messages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projectSections.map((section) => (
          <Link
            key={section.href}
            href={`/projects/${projectId}/${section.href}`}
            className="rounded-md border border-line bg-white p-4 shadow-sm outline-none hover:border-semarts focus:border-semarts sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="font-semibold">{section.title}</h3>
              <span className="w-fit shrink-0 rounded-full bg-field px-3 py-1 text-xs font-semibold text-semarts-dark">
                {sectionStatusByHref[section.href as keyof typeof sectionStatusByHref]}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-ink/70">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
