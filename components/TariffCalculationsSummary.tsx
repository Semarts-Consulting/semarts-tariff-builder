"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateTariffs } from "@/lib/calculation-engine";
import { TariffAuditTracePanel } from "@/components/TariffAuditTracePanel";
import {
  calculateSupplyEnergyApplication,
  type SupplyEnergyApplicationInput,
  type SupplyEnergyNetworkLevel
} from "@/lib/supply-energy-application";
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

const defaultSupplyEnergyApplication: SupplyEnergyApplicationInput = {
  id: "current-supply-energy-application",
  customerClass: "",
  nbpPencePerKwh: 0,
  gspPencePerKwh: 0,
  siteMeterPencePerKwh: 0,
  cmPencePerKwh: 0,
  transmissionLossMultiplier: 1,
  dnoDistributionLossFactor: 1,
  ehvLossMultiplier: 1,
  hvLossMultiplier: 1,
  lvLossMultiplier: 1,
  networkLevel: "Site Meter",
  profitMultiplier: 1,
  sourceLabel: "Manual supply energy review"
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

function parseNumber(value: string) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
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
  const [supplyEnergyApplication, setSupplyEnergyApplication] =
    useState<SupplyEnergyApplicationInput>(defaultSupplyEnergyApplication);
  const [applySupplyEnergy, setApplySupplyEnergy] = useState(false);
  const [supplyReferenceData, setSupplyReferenceData] = useState<SupplyReferenceData>(() =>
    getSupplyReferenceData()
  );

  useEffect(() => {
    const dataInputs = getProjectDataInputs(projectId);
    const costPools = getProjectCostPools(projectId);
    const allocationMethods = getProjectAllocationMethods(projectId);
    const selectedCustomerClass =
      dataInputs.rows[0]?.customerClass ?? defaultSupplyEnergyApplication.customerClass;

    setSupplyEnergyApplication((current) => ({
      ...current,
      customerClass: current.customerClass || selectedCustomerClass
    }));
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
  const projectCalculationInputs = useMemo(
    () => ({
      dataInputs: getProjectDataInputs(projectId),
      costPools: getProjectCostPools(projectId),
      allocationMethods: getProjectAllocationMethods(projectId)
    }),
    [projectId]
  );
  const supplyEnergyResult = useMemo(
    () => calculateSupplyEnergyApplication(supplyEnergyApplication),
    [supplyEnergyApplication]
  );
  const recalculatedResult = useMemo(
    () =>
      calculateTariffs({
        projectId,
        dataInputRows: projectCalculationInputs.dataInputs.rows,
        costPoolRows: projectCalculationInputs.costPools.rows,
        allocationRows: projectCalculationInputs.allocationMethods.rows,
        supplyEnergyRows: applySupplyEnergy ? [supplyEnergyResult.tariffRow] : []
      }),
    [applySupplyEnergy, projectCalculationInputs, projectId, supplyEnergyResult.tariffRow]
  );

  useEffect(() => {
    setCalculationResult(recalculatedResult);
  }, [recalculatedResult]);
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

      <div className="rounded-md border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-semibold">Supply energy / kWh application</h2>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Build a supply p/kWh rate from component loss positions, review the calculated customer
              rate, then explicitly include it in the Energy / kWh tariff calculation for this view.
            </p>
          </div>
          <label className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={applySupplyEnergy}
              onChange={(event) => setApplySupplyEnergy(event.target.checked)}
            />
            Apply to tariff
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-medium">
            Customer class
            <select
              value={supplyEnergyApplication.customerClass}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
              onChange={(event) =>
                setSupplyEnergyApplication((current) => ({
                  ...current,
                  customerClass: event.target.value
                }))
              }
            >
              {projectCalculationInputs.dataInputs.rows.map((row) => (
                <option key={row.id}>{row.customerClass}</option>
              ))}
            </select>
          </label>
          <NumberInput
            label="NBP p/kWh"
            value={supplyEnergyApplication.nbpPencePerKwh}
            onChange={(value) =>
              setSupplyEnergyApplication((current) => ({
                ...current,
                nbpPencePerKwh: value
              }))
            }
          />
          <NumberInput
            label="GSP p/kWh"
            value={supplyEnergyApplication.gspPencePerKwh}
            onChange={(value) =>
              setSupplyEnergyApplication((current) => ({
                ...current,
                gspPencePerKwh: value
              }))
            }
          />
          <NumberInput
            label="CM / site p/kWh"
            value={
              supplyEnergyApplication.cmPencePerKwh +
              supplyEnergyApplication.siteMeterPencePerKwh
            }
            onChange={(value) =>
              setSupplyEnergyApplication((current) => ({
                ...current,
                cmPencePerKwh: value,
                siteMeterPencePerKwh: 0
              }))
            }
          />
          <NumberInput
            label="TLM"
            value={supplyEnergyApplication.transmissionLossMultiplier}
            step="0.000001"
            onChange={(value) =>
              setSupplyEnergyApplication((current) => ({
                ...current,
                transmissionLossMultiplier: value || 1
              }))
            }
          />
          <NumberInput
            label="DNO loss factor"
            value={supplyEnergyApplication.dnoDistributionLossFactor}
            step="0.000001"
            onChange={(value) =>
              setSupplyEnergyApplication((current) => ({
                ...current,
                dnoDistributionLossFactor: value || 1
              }))
            }
          />
          <label className="text-sm font-medium">
            Network level
            <select
              value={supplyEnergyApplication.networkLevel}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
              onChange={(event) =>
                setSupplyEnergyApplication((current) => ({
                  ...current,
                  networkLevel: event.target.value as SupplyEnergyNetworkLevel
                }))
              }
            >
              <option>Site Meter</option>
              <option>EHV</option>
              <option>HV</option>
              <option>LV</option>
            </select>
          </label>
          <NumberInput
            label="EHV loss"
            value={supplyEnergyApplication.ehvLossMultiplier}
            step="0.000001"
            onChange={(value) =>
              setSupplyEnergyApplication((current) => ({
                ...current,
                ehvLossMultiplier: value || 1
              }))
            }
          />
          <NumberInput
            label="HV loss"
            value={supplyEnergyApplication.hvLossMultiplier}
            step="0.000001"
            onChange={(value) =>
              setSupplyEnergyApplication((current) => ({
                ...current,
                hvLossMultiplier: value || 1
              }))
            }
          />
          <NumberInput
            label="LV loss"
            value={supplyEnergyApplication.lvLossMultiplier}
            step="0.000001"
            onChange={(value) =>
              setSupplyEnergyApplication((current) => ({
                ...current,
                lvLossMultiplier: value || 1
              }))
            }
          />
          <NumberInput
            label="Profit multiplier"
            value={supplyEnergyApplication.profitMultiplier}
            step="0.000001"
            onChange={(value) =>
              setSupplyEnergyApplication((current) => ({
                ...current,
                profitMultiplier: value || 1
              }))
            }
          />
          <label className="text-sm font-medium md:col-span-2">
            Source label
            <input
              value={supplyEnergyApplication.sourceLabel}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
              onChange={(event) =>
                setSupplyEnergyApplication((current) => ({
                  ...current,
                  sourceLabel: event.target.value
                }))
              }
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SummaryMetric
            label="Site meter p/kWh"
            value={`${formatNumber(supplyEnergyResult.supplyCost.siteMeterPencePerKwh)} p/kWh`}
          />
          <SummaryMetric
            label="Private loss multiplier"
            value={formatNumber(supplyEnergyResult.supplyCost.privateNetworkLossMultiplier)}
          />
          <SummaryMetric
            label="Customer p/kWh"
            value={`${formatNumber(supplyEnergyResult.supplyCost.finalPencePerKwh)} p/kWh`}
          />
          <SummaryMetric
            label="Tariff impact"
            value={applySupplyEnergy ? "Included" : "Preview only"}
          />
        </div>
      </div>

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
          <li>Supply energy p/kWh is included only when explicitly applied in this calculation view.</li>
          <li>Rows needing review indicate allocation rules that do not total 100%.</li>
        </ul>
      </div>

      <TariffAuditTracePanel entries={calculationResult.auditTrace} />
    </div>
  );
}

function NumberInput({
  label,
  value,
  step = "0.0001",
  onChange
}: {
  label: string;
  value: number;
  step?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        type="number"
        value={value}
        step={step}
        className="mt-1 w-full rounded-md border border-line px-3 py-2 text-sm"
        onChange={(event) => onChange(parseNumber(event.target.value))}
      />
    </label>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-field p-3">
      <p className="text-xs font-semibold uppercase text-ink/50">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
