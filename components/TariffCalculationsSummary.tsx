"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateTariffs } from "@/lib/calculation-engine";
import { TariffAuditTracePanel } from "@/components/TariffAuditTracePanel";
import {
  getProjectAllocationMethods,
  getProjectCostPools,
  getProjectDataInputs,
  getProjectMethodologyInputs,
  getSupplyReferenceData
} from "@/lib/project-storage";
import { loadSupplyReferenceDataFromSupabase } from "@/lib/supabase-sync";
import { getSupplyReferenceReviewIssues } from "@/lib/supply-reference-review";
import type {
  SupplyReferenceData,
  TariffCalculationResult,
  TariffCalculationValidationIssue
} from "@/types/project";

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
    isRevenueRecovered: true,
    validationIssues: [],
    classResults: []
  };
}

function getIssueLabel(issue: TariffCalculationValidationIssue) {
  const context = [
    issue.customerClass ? `Class: ${issue.customerClass}` : "",
    issue.costPoolId ? `Cost pool: ${issue.costPoolId}` : ""
  ].filter(Boolean);

  return context.length > 0 ? `${issue.message} ${context.join("; ")}.` : issue.message;
}

export function TariffCalculationsSummary({ projectId }: TariffCalculationsSummaryProps) {
  const [calculationResult, setCalculationResult] = useState<TariffCalculationResult>(() =>
    emptyResult(projectId)
  );
  const [supplyReferenceData, setSupplyReferenceData] = useState<SupplyReferenceData>(() =>
    getSupplyReferenceData()
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

  useEffect(() => {
    let isMounted = true;

    loadSupplyReferenceDataFromSupabase()
      .then((cloudReferenceData) => {
        if (isMounted && cloudReferenceData) {
          setSupplyReferenceData(cloudReferenceData);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSupplyReferenceData(getSupplyReferenceData());
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const hasInputs = useMemo(
    () => calculationResult.classResults.some((row) => row.totalAllocatedCost > 0),
    [calculationResult.classResults]
  );
  const supplyReferenceIssues = useMemo(
    () =>
      getSupplyReferenceReviewIssues(
        getProjectMethodologyInputs(projectId).supplyDetails,
        supplyReferenceData
      ),
    [projectId, supplyReferenceData]
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

      {calculationResult.validationIssues.length > 0 || !calculationResult.isRevenueRecovered ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-900 shadow-sm">
          <h2 className="font-semibold">Calculation inputs need review</h2>
          <p className="mt-2">
            Tariff outputs remain available, but these readiness issues should be reviewed before approval.
          </p>
          <ul className="mt-3 space-y-1">
            {!calculationResult.isRevenueRecovered ? (
              <li>
                Revenue is not fully allocated. Variance {formatCurrency(calculationResult.unallocatedCost)}.
              </li>
            ) : null}
            {calculationResult.validationIssues.map((issue, index) => (
              <li key={`${issue.code}-${issue.rowId ?? issue.customerClass ?? index}`}>
                {getIssueLabel(issue)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {supplyReferenceIssues.length > 0 ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
          <h2 className="font-semibold">Supply reference data requires Semarts review</h2>
          <p className="mt-2">
            Indicative tariffs are shown, but supply-reference driven calculations should not be
            treated as approved until the relevant DNO source data is marked Reviewed.
          </p>
          <ul className="mt-3 space-y-1">
            {supplyReferenceIssues.map((issue) => (
              <li key={`${issue.supplyId}-${issue.distributorId}`}>
                {issue.message} MPAN {issue.mpan}.
              </li>
            ))}
          </ul>
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
                <th className="sticky left-0 z-10 bg-field px-4 py-3 font-semibold shadow-[1px_0_0_#dce3d7]">
                  Customer class
                </th>
                <th className="bg-field px-4 py-3 font-semibold">Allocated cost</th>
                <th className="bg-field px-4 py-3 font-semibold">Fixed cost</th>
                <th className="bg-field px-4 py-3 font-semibold">Energy cost</th>
                <th className="bg-field px-4 py-3 font-semibold">Demand cost</th>
                <th className="bg-field px-4 py-3 font-semibold">Pass-through</th>
                <th className="bg-field px-4 py-3 font-semibold">Fixed / customer</th>
                <th className="bg-field px-4 py-3 font-semibold">Energy / kWh</th>
                <th className="bg-field px-4 py-3 font-semibold">Demand / kW</th>
              </tr>
            </thead>
            <tbody>
              {calculationResult.classResults.map((row) => (
                <tr key={row.customerClass} className="border-t border-line">
                  <td className="sticky left-0 bg-white px-4 py-3 font-medium shadow-[1px_0_0_#dce3d7]">
                    {row.customerClass}
                  </td>
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

      <TariffAuditTracePanel entries={calculationResult.auditTrace} />
    </div>
  );
}
