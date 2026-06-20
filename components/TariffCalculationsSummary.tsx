"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateTariffs } from "@/lib/calculation-engine";
import {
  getProjectAllocationMethods,
  getProjectCostPools,
  getProjectDataInputs
} from "@/lib/project-storage";
import type { TariffCalculationResult } from "@/types/project";

type TariffCalculationsSummaryProps = {
  projectId: string;
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
    maximumFractionDigits: 4
  }).format(value);
}

function emptyResult(projectId: string): TariffCalculationResult {
  return {
    projectId,
    revenueRequirement: 0,
    allocatedCost: 0,
    unallocatedCost: 0,
    unbalancedAllocationCount: 0,
    classResults: []
  };
}

export function TariffCalculationsSummary({ projectId }: TariffCalculationsSummaryProps) {
  const [calculationResult, setCalculationResult] = useState<TariffCalculationResult>(() =>
    emptyResult(projectId)
  );

  useEffect(() => {
    const dataInputs = getProjectDataInputs(projectId);
    const costPools = getProjectCostPools(projectId);
    const allocationMethods = getProjectAllocationMethods(projectId);

    setCalculationResult(
      calculateTariffs({
        projectId,
        dataInputRows: dataInputs.rows,
        costPoolRows: costPools.rows,
        allocationRows: allocationMethods.rows
      })
    );
  }, [projectId]);

  const hasInputs = useMemo(
    () => calculationResult.classResults.some((row) => row.totalAllocatedCost > 0),
    [calculationResult.classResults]
  );

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Revenue requirement</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(calculationResult.revenueRequirement)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Allocated cost</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(calculationResult.allocatedCost)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Variance</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(calculationResult.unallocatedCost)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Rows needing review</p>
          <p className="mt-2 text-2xl font-semibold">
            {calculationResult.unbalancedAllocationCount}
          </p>
        </div>
      </div>

      {!hasInputs ? (
        <div className="rounded-md border border-line bg-white p-5 text-sm text-ink/70 shadow-sm">
          Enter data inputs, cost pools, and allocation methods to calculate indicative tariffs.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-md border border-line bg-white shadow-sm">
        <div className="border-b border-line p-4">
          <h2 className="font-semibold">Indicative tariff outputs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer class</th>
                <th className="px-4 py-3 font-semibold">Allocated cost</th>
                <th className="px-4 py-3 font-semibold">Fixed cost</th>
                <th className="px-4 py-3 font-semibold">Energy cost</th>
                <th className="px-4 py-3 font-semibold">Demand cost</th>
                <th className="px-4 py-3 font-semibold">Pass-through</th>
                <th className="px-4 py-3 font-semibold">Fixed / customer</th>
                <th className="px-4 py-3 font-semibold">Energy / kWh</th>
                <th className="px-4 py-3 font-semibold">Demand / kW</th>
              </tr>
            </thead>
            <tbody>
              {calculationResult.classResults.map((row) => (
                <tr key={row.customerClass} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{row.customerClass}</td>
                  <td className="px-4 py-3">{formatCurrency(row.totalAllocatedCost)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.fixedCost)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.energyCost)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.demandCost)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.passThroughCost)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.fixedChargePerCustomer)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.energyChargePerKwh)}</td>
                  <td className="px-4 py-3">{formatCurrency(row.demandChargePerKw)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-md border border-line bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Calculation notes</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
          <li>Recoverable cost equals annual cost multiplied by recoverable percentage.</li>
          <li>Allocated cost follows each cost pool allocation method and customer-class share.</li>
          <li>Energy rates include energy and pass-through components divided by annual kWh.</li>
          <li>Rows needing review indicate allocation rules that do not total 100%.</li>
        </ul>
      </div>
    </div>
  );
}
