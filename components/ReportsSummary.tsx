"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateTariffs } from "@/lib/calculation-engine";
import {
  getProjectAllocationMethods,
  getProjectById,
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

type ReportsSummaryProps = {
  projectId: string;
};

type ReportState = {
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
    maximumFractionDigits: 2
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 2
  }).format(value);
}

function emptyCalculation(projectId: string): TariffCalculationResult {
  return {
    projectId,
    revenueRequirement: 0,
    allocatedCost: 0,
    unallocatedCost: 0,
    unbalancedAllocationCount: 0,
    classResults: []
  };
}

export function ReportsSummary({ projectId }: ReportsSummaryProps) {
  const [reportState, setReportState] = useState<ReportState>({
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

    setReportState({
      project,
      dataInputs,
      costPools,
      allocationMethods,
      calculation
    });
  }, [projectId]);

  const project = reportState.project;
  const dataInputs = reportState.dataInputs;
  const costPools = reportState.costPools;
  const allocationMethods = reportState.allocationMethods;
  const calculation = reportState.calculation ?? emptyCalculation(projectId);

  const dataTotals = useMemo(
    () =>
      dataInputs?.rows.reduce(
        (totals, row) => ({
          customers: totals.customers + row.customerCount,
          annualKwh: totals.annualKwh + row.annualKwh,
          peakDemandKw: totals.peakDemandKw + row.peakDemandKw
        }),
        { customers: 0, annualKwh: 0, peakDemandKw: 0 }
      ) ?? { customers: 0, annualKwh: 0, peakDemandKw: 0 },
    [dataInputs]
  );

  const grossCost = useMemo(
    () => costPools?.rows.reduce((total, row) => total + row.annualAmount, 0) ?? 0,
    [costPools]
  );

  if (!project || !dataInputs || !costPools || !allocationMethods) {
    return null;
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-ink/50">Project</p>
            <h2 className="mt-2 text-xl font-semibold">{project.name}</h2>
            <p className="mt-1 text-sm text-ink/70">{project.networkName}</p>
          </div>
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium text-ink/60">Tariff year</dt>
              <dd className="mt-1">{project.tariffYear}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink/60">Effective date</dt>
              <dd className="mt-1">{project.effectiveDate}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink/60">Billing period</dt>
              <dd className="mt-1">{project.billingPeriod}</dd>
            </div>
            <div>
              <dt className="font-medium text-ink/60">Status</dt>
              <dd className="mt-1">{project.status}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Revenue requirement</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(calculation.revenueRequirement)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Gross costs</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(grossCost)}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Customers</p>
          <p className="mt-2 text-2xl font-semibold">{formatNumber(dataTotals.customers)}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Annual kWh</p>
          <p className="mt-2 text-2xl font-semibold">{formatNumber(dataTotals.annualKwh)}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-md border border-line bg-white shadow-sm">
        <div className="border-b border-line p-4">
          <h2 className="font-semibold">Tariff schedule</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer class</th>
                <th className="px-4 py-3 font-semibold">Customers</th>
                <th className="px-4 py-3 font-semibold">Annual kWh</th>
                <th className="px-4 py-3 font-semibold">Peak kW</th>
                <th className="px-4 py-3 font-semibold">Fixed / customer</th>
                <th className="px-4 py-3 font-semibold">Energy / kWh</th>
                <th className="px-4 py-3 font-semibold">Demand / kW</th>
                <th className="px-4 py-3 font-semibold">Allocated cost</th>
              </tr>
            </thead>
            <tbody>
              {calculation.classResults.map((row) => (
                <tr key={row.customerClass} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{row.customerClass}</td>
                  <td className="px-4 py-3">{formatNumber(row.customerCount)}</td>
                  <td className="px-4 py-3">{formatNumber(row.annualKwh)}</td>
                  <td className="px-4 py-3">{formatNumber(row.peakDemandKw)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.fixedChargePerCustomer)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.energyChargePerKwh)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.demandChargePerKw)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.totalAllocatedCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-line bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Data assumptions</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70">
            {dataInputs.assumptions || "No data assumptions recorded yet."}
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Cost recovery assumptions</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70">
            {costPools.assumptions || "No cost recovery assumptions recorded yet."}
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Allocation assumptions</h2>
          <p className="mt-3 text-sm leading-6 text-ink/70">
            {allocationMethods.assumptions || "No allocation assumptions recorded yet."}
          </p>
        </div>
      </section>

      <section className="rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Report checks</h2>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-ink/70 md:grid-cols-2">
          <li>Revenue variance: {formatCurrency(calculation.unallocatedCost)}</li>
          <li>Allocation rows needing review: {calculation.unbalancedAllocationCount}</li>
          <li>Cost pools included: {costPools.rows.length}</li>
          <li>Customer classes included: {calculation.classResults.length}</li>
        </ul>
      </section>
    </div>
  );
}
