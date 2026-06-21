"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { calculateTariffs } from "@/lib/calculation-engine";
import {
  getProjectAllocationMethods,
  getProjectById,
  getProjectCostPools,
  getProjectDataInputs,
  getProjectMethodologyInputs,
  getSupplyReferenceData
} from "@/lib/project-storage";
import { loadSupplyReferenceDataFromSupabase } from "@/lib/supabase-sync";
import { getSupplyReferenceReviewIssues } from "@/lib/supply-reference-review";
import type {
  Project,
  ProjectAllocationMethods,
  ProjectCostPools,
  ProjectDataInputs,
  SupplyReferenceData,
  TariffCalculationResult,
  TariffCalculationValidationIssue
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

export function ReportsSummary({ projectId }: ReportsSummaryProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [printStatus, setPrintStatus] = useState("");
  const [reportState, setReportState] = useState<ReportState>({
    project: null,
    dataInputs: null,
    costPools: null,
    allocationMethods: null,
    calculation: null
  });
  const [supplyReferenceData, setSupplyReferenceData] = useState<SupplyReferenceData>(() =>
    getSupplyReferenceData()
  );

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
  const supplyReferenceIssues = useMemo(
    () =>
      getSupplyReferenceReviewIssues(
        getProjectMethodologyInputs(projectId).supplyDetails,
        supplyReferenceData
      ),
    [projectId, supplyReferenceData]
  );

  if (!project || !dataInputs || !costPools || !allocationMethods) {
    return null;
  }

  function handlePrint() {
    setPrintStatus("Opening print dialog. If it does not appear, press Ctrl+P.");
    window.focus();
    window.print();
  }

  function downloadHtmlReport() {
    if (!reportRef.current || !project) {
      return;
    }

    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((element) => element.outerHTML)
      .join("\n");
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${project.name} tariff report</title>
    ${styles}
  </head>
  <body>
    <main style="max-width: 1100px; margin: 32px auto; padding: 0 24px;">
      ${reportRef.current.innerHTML}
    </main>
  </body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${project.id}-tariff-report.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setPrintStatus("Downloaded HTML report. Open it in a browser to print or save as PDF.");
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-white p-4 shadow-sm">
        <div>
          <h2 className="font-semibold">Export report</h2>
          <p className="mt-1 text-sm text-ink/70">
            Print this report or save it as a PDF from the browser print dialog.
          </p>
          {printStatus ? (
            <p className="mt-2 text-sm font-medium text-semarts-dark">{printStatus}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark"
          >
            Print / save PDF
          </button>
          <button
            type="button"
            onClick={downloadHtmlReport}
            className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:border-semarts"
          >
            Download HTML
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        <section className="print-only">
          <p className="text-sm font-semibold uppercase text-ink/50">
            Semarts Tariff Methodology Builder
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Tariff methodology report
          </h1>
        </section>

        {supplyReferenceIssues.length > 0 ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
            <h2 className="font-semibold">Supply reference data requires Semarts review</h2>
            <p className="mt-2">
              This report includes indicative outputs only. Supply-reference driven methodology
              should not be treated as approved until the relevant DNO source data is marked
              Reviewed.
            </p>
            <ul className="mt-3 space-y-1">
              {supplyReferenceIssues.map((issue) => (
                <li key={`${issue.supplyId}-${issue.distributorId}`}>
                  {issue.message} MPAN {issue.mpan}.
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {calculation.validationIssues.length > 0 || !calculation.isRevenueRecovered ? (
          <section className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-900 shadow-sm">
            <h2 className="font-semibold">Calculation inputs need review</h2>
            <p className="mt-2">
              This report remains available, but these readiness issues should be reviewed before approval.
            </p>
            <ul className="mt-3 space-y-1">
              {!calculation.isRevenueRecovered ? (
                <li>
                  Revenue is not fully allocated. Variance {formatCurrency(calculation.unallocatedCost)}.
                </li>
              ) : null}
              {calculation.validationIssues.map((issue, index) => (
                <li key={`${issue.code}-${issue.rowId ?? issue.customerClass ?? index}`}>
                  {getIssueLabel(issue)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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
            <div>
              <dt className="font-medium text-ink/60">Report date</dt>
              <dd className="mt-1">{new Date().toLocaleDateString("en-GB")}</dd>
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
                <th className="sticky left-0 z-10 bg-field px-4 py-3 font-semibold shadow-[1px_0_0_#dce3d7]">
                  Customer class
                </th>
                <th className="bg-field px-4 py-3 font-semibold">Customers</th>
                <th className="bg-field px-4 py-3 font-semibold">Annual kWh</th>
                <th className="bg-field px-4 py-3 font-semibold">Peak kW</th>
                <th className="bg-field px-4 py-3 font-semibold">Fixed / customer</th>
                <th className="bg-field px-4 py-3 font-semibold">Energy / kWh</th>
                <th className="bg-field px-4 py-3 font-semibold">Demand / kW</th>
                <th className="bg-field px-4 py-3 font-semibold">Allocated cost</th>
              </tr>
            </thead>
            <tbody>
              {calculation.classResults.map((row) => (
                <tr key={row.customerClass} className="border-t border-line">
                  <td className="sticky left-0 bg-white px-4 py-3 font-medium shadow-[1px_0_0_#dce3d7]">
                    {row.customerClass}
                  </td>
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

        <section className="overflow-hidden rounded-md border border-line bg-white shadow-sm">
        <div className="border-b border-line p-4">
          <h2 className="font-semibold">Recoverable cost pools</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="sticky left-0 z-10 bg-field px-4 py-3 font-semibold shadow-[1px_0_0_#dce3d7]">
                  Cost pool
                </th>
                <th className="bg-field px-4 py-3 font-semibold">Category</th>
                <th className="bg-field px-4 py-3 font-semibold">Annual amount</th>
                <th className="bg-field px-4 py-3 font-semibold">Recoverable %</th>
              </tr>
            </thead>
            <tbody>
              {costPools.rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="sticky left-0 bg-white px-4 py-3 font-medium shadow-[1px_0_0_#dce3d7]">
                    {row.name}
                  </td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3">{formatCurrency(row.annualAmount)}</td>
                  <td className="px-4 py-3">{formatNumber(row.recoverablePercent)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </section>

        <section className="overflow-hidden rounded-md border border-line bg-white shadow-sm">
        <div className="border-b border-line p-4">
          <h2 className="font-semibold">Allocation methodology</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="sticky left-0 z-10 bg-field px-4 py-3 font-semibold shadow-[1px_0_0_#dce3d7]">
                  Cost pool
                </th>
                <th className="bg-field px-4 py-3 font-semibold">Basis</th>
                <th className="bg-field px-4 py-3 font-semibold">Tariff component</th>
                <th className="bg-field px-4 py-3 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {allocationMethods.rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="sticky left-0 bg-white px-4 py-3 font-medium shadow-[1px_0_0_#dce3d7]">
                    {row.costPoolName}
                  </td>
                  <td className="px-4 py-3">{row.basis}</td>
                  <td className="px-4 py-3">{row.tariffComponent}</td>
                  <td className="px-4 py-3">{row.notes || "-"}</td>
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
          <li>Revenue recovered: {calculation.isRevenueRecovered ? "Yes" : "No"}</li>
          <li>Allocation rows needing review: {calculation.unbalancedAllocationCount}</li>
          <li>Calculation validation issues: {calculation.validationIssues.length}</li>
          <li>Cost pools included: {costPools.rows.length}</li>
          <li>Customer classes included: {calculation.classResults.length}</li>
        </ul>
        </section>
      </div>
    </div>
  );
}
