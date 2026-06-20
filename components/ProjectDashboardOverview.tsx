"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calculateTariffs } from "@/lib/calculation-engine";
import { projectSections } from "@/lib/sample-data";
import {
  getProjectAllocationMethods,
  getProjectCostPools,
  getProjectDataInputs
} from "@/lib/project-storage";
import type {
  ProjectAllocationMethods,
  ProjectCostPools,
  ProjectDataInputs,
  TariffCalculationResult
} from "@/types/project";

type ProjectDashboardOverviewProps = {
  projectId: string;
};

type DashboardState = {
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
    dataInputs: null,
    costPools: null,
    allocationMethods: null,
    calculation: null
  });

  useEffect(() => {
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

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
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

      <div className="rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Readiness checks</h2>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div>
            <p className="font-medium text-ink/60">Allocated cost</p>
            <p className="mt-1">{formatCurrency(totals.allocatedCost)}</p>
          </div>
          <div>
            <p className="font-medium text-ink/60">Revenue variance</p>
            <p className="mt-1">{formatCurrency(totals.variance)}</p>
          </div>
          <div>
            <p className="font-medium text-ink/60">Allocation rows needing review</p>
            <p className="mt-1">{totals.unbalancedRows}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {projectSections.map((section) => (
          <Link
            key={section.href}
            href={`/projects/${projectId}/${section.href}`}
            className="rounded-md border border-line bg-white p-5 shadow-sm hover:border-semarts"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="font-semibold">{section.title}</h3>
              <span className="rounded-full bg-field px-3 py-1 text-xs font-semibold text-semarts-dark">
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
