"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { calculateTariffs } from "@/lib/calculation-engine";
import {
  normaliseSupplyCharges,
  reconcileSupplyEvidence
} from "@/lib/supply-calculation-engine";
import { TariffAuditTracePanel } from "@/components/TariffAuditTracePanel";
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

type ReportReadinessStatus =
  | "Needs correction"
  | "Needs review"
  | "Revenue variance"
  | "Ready for review";

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

function getReportReadinessStatus(calculation: TariffCalculationResult): ReportReadinessStatus {
  if (calculation.validationIssues.some((issue) => issue.severity === "Error")) {
    return "Needs correction";
  }

  if (calculation.validationIssues.some((issue) => issue.severity === "Warning")) {
    return "Needs review";
  }

  return calculation.isRevenueRecovered ? "Ready for review" : "Revenue variance";
}

function getReadinessDescription(status: ReportReadinessStatus) {
  switch (status) {
    case "Needs correction":
      return "Calculation input problems need correction before stakeholder approval. Outputs remain available for review.";
    case "Needs review":
      return "Non-blocking readiness warnings should be reviewed before stakeholder approval. Outputs remain available.";
    case "Revenue variance":
      return "Revenue is not fully recovered. Review the variance before stakeholder approval.";
    case "Ready for review":
      return "No calculation readiness issues are currently reported.";
  }
}

function getReadinessStyle(status: ReportReadinessStatus) {
  return status === "Ready for review"
    ? "border-semarts/30 bg-field text-semarts-dark"
    : "border-amber-200 bg-amber-50 text-amber-900";
}

function formatOptionalCurrency(value: number | null) {
  return value === null ? "Not calculated" : formatCurrency(value);
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
  const methodologyInputs = useMemo(() => getProjectMethodologyInputs(projectId), [projectId]);

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
  const recoverableCost = useMemo(
    () =>
      costPools?.rows.reduce(
        (total, row) => total + row.annualAmount * (row.recoverablePercent / 100),
        0
      ) ?? 0,
    [costPools]
  );
  const supplyReferenceIssues = useMemo(
    () =>
      getSupplyReferenceReviewIssues(
        methodologyInputs.supplyDetails,
        supplyReferenceData
      ),
    [methodologyInputs.supplyDetails, supplyReferenceData]
  );
  const supplyCalculation = useMemo(
    () =>
      normaliseSupplyCharges({
        projectId,
        supplyDetails: methodologyInputs.supplyDetails
      }),
    [methodologyInputs.supplyDetails, projectId]
  );
  const supplyEvidence = useMemo(
    () => reconcileSupplyEvidence(supplyCalculation.chargeLines),
    [supplyCalculation.chargeLines]
  );
  const supplyContractEvidenceRows = useMemo(
    () => supplyCalculation.chargeLines.filter((line) => line.source === "Supply Contract"),
    [supplyCalculation.chargeLines]
  );

  if (!project || !dataInputs || !costPools || !allocationMethods) {
    return null;
  }

  const readinessStatus = getReportReadinessStatus(calculation);

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

        <section
          className={`rounded-md border p-5 text-sm shadow-sm ${getReadinessStyle(
            readinessStatus
          )}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Report readiness</h2>
              <p className="mt-2">{getReadinessDescription(readinessStatus)}</p>
            </div>
            <span className="rounded-md border border-current px-3 py-1 text-xs font-semibold">
              {readinessStatus}
            </span>
          </div>

          {calculation.validationIssues.length > 0 || !calculation.isRevenueRecovered ? (
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase">Readiness items</h3>
              <ul className="mt-3 space-y-2">
                {!calculation.isRevenueRecovered ? (
                  <li>
                    <span className="mr-2 rounded-md border border-current px-2 py-0.5 text-xs font-semibold">
                      Revenue variance
                    </span>
                    Revenue is not fully allocated. Variance{" "}
                    {formatCurrency(calculation.unallocatedCost)}.
                  </li>
                ) : null}
                {calculation.validationIssues.map((issue, index) => (
                  <li key={`${issue.code}-${issue.rowId ?? issue.customerClass ?? index}`}>
                    <span className="mr-2 rounded-md border border-current px-2 py-0.5 text-xs font-semibold">
                      {issue.severity}
                    </span>
                    {getIssueLabel(issue)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        {readinessStatus !== "Ready for review" ? (
          <section className="rounded-md border border-red-200 bg-red-50 p-5 text-sm text-red-900 shadow-sm">
            <h2 className="font-semibold">Calculation inputs require approval review</h2>
            <p className="mt-2">
              This report remains available, but these readiness issues should be reviewed before approval.
            </p>
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

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
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
          <p className="text-xs font-semibold uppercase text-ink/50">Recoverable cost</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(recoverableCost)}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Allocated cost</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(calculation.allocatedCost)}
          </p>
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
          <li>Readiness status: {readinessStatus}</li>
          <li>Allocated cost: {formatCurrency(calculation.allocatedCost)}</li>
          <li>Recoverable cost: {formatCurrency(recoverableCost)}</li>
          <li>Revenue variance: {formatCurrency(calculation.unallocatedCost)}</li>
          <li>Revenue recovered: {calculation.isRevenueRecovered ? "Yes" : "No"}</li>
          <li>Allocation rows needing review: {calculation.unbalancedAllocationCount}</li>
          <li>Calculation validation issues: {calculation.validationIssues.length}</li>
          <li>Cost pools included: {costPools.rows.length}</li>
          <li>Customer classes included: {calculation.classResults.length}</li>
        </ul>
        </section>

        <section className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">Supply evidence only</h2>
              <p className="mt-2 leading-6">
                These supply inputs are shown as evidence only. They do not change network revenue
                requirement, recoverable cost, revenue recovery, or tariff rates in this report.
              </p>
            </div>
            <span className="rounded-md border border-current px-3 py-1 text-xs font-semibold">
              Not tariff-impacting
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-amber-200 bg-white/60 p-3">
              <p className="text-xs font-semibold uppercase text-amber-900/70">Supply MPANs</p>
              <p className="mt-1 text-lg font-semibold">{methodologyInputs.supplyDetails.length}</p>
            </div>
            <div className="rounded-md border border-amber-200 bg-white/60 p-3">
              <p className="text-xs font-semibold uppercase text-amber-900/70">
                Fixed evidence annual amount
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(supplyEvidence.fixedRecoveryAnnualAmount)}
              </p>
            </div>
            <div className="rounded-md border border-amber-200 bg-white/60 p-3">
              <p className="text-xs font-semibold uppercase text-amber-900/70">
                Pass-through evidence amount
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatCurrency(supplyEvidence.passThroughAnnualAmount)}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-md border border-amber-200 bg-white/60 p-4">
            <h3 className="font-semibold">Current limitation</h3>
            <p className="mt-2 leading-6">
              Supported annual supply amounts are calculated as separate evidence only. Customer
              applicability and reporting category are not derived from the current report data, so
              this report does not infer them from charge names.
            </p>
          </div>

          <div className="mt-5">
            <h3 className="font-semibold">Pass-through supply evidence</h3>
            {supplyEvidence.passThroughLines.length > 0 ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead className="text-left text-xs uppercase text-amber-900/70">
                    <tr>
                      <th className="px-3 py-2 font-semibold">MPAN</th>
                      <th className="px-3 py-2 font-semibold">Charge</th>
                      <th className="px-3 py-2 font-semibold">Voltage</th>
                      <th className="px-3 py-2 font-semibold">Annual evidence</th>
                      <th className="px-3 py-2 font-semibold">Evidence status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplyEvidence.passThroughLines.map((row) => (
                      <tr key={row.id} className="border-t border-amber-200">
                        <td className="px-3 py-2">{row.mpan || "Not recorded"}</td>
                        <td className="px-3 py-2">{row.chargeName}</td>
                        <td className="px-3 py-2">{row.voltage}</td>
                        <td className="px-3 py-2">
                          {formatOptionalCurrency(row.annualAmount)}
                        </td>
                        <td className="px-3 py-2">
                          Evidence only; excluded from network tariff recovery totals.
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-2 text-amber-900/80">No pass-through supply rows recorded.</p>
            )}
          </div>

          <div className="mt-5">
            <h3 className="font-semibold">Recorded supply contract charge evidence</h3>
            {supplyContractEvidenceRows.length > 0 ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-sm">
                  <thead className="text-left text-xs uppercase text-amber-900/70">
                    <tr>
                      <th className="px-3 py-2 font-semibold">MPAN</th>
                      <th className="px-3 py-2 font-semibold">Charge</th>
                      <th className="px-3 py-2 font-semibold">Type</th>
                      <th className="px-3 py-2 font-semibold">Rate evidence</th>
                      <th className="px-3 py-2 font-semibold">Annual evidence</th>
                      <th className="px-3 py-2 font-semibold">Losses</th>
                      <th className="px-3 py-2 font-semibold">Time of use</th>
                      <th className="px-3 py-2 font-semibold">Annual amount status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplyContractEvidenceRows.map((line) => (
                      <tr key={line.id} className="border-t border-amber-200">
                        <td className="px-3 py-2">{line.mpan || "Not recorded"}</td>
                        <td className="px-3 py-2">{line.chargeName || "Unnamed supply charge"}</td>
                        <td className="px-3 py-2">{line.chargeType}</td>
                        <td className="px-3 py-2">
                          {formatCurrency(line.ratePounds)} {line.unitOfMeasurement}
                        </td>
                        <td className="px-3 py-2">
                          {formatOptionalCurrency(line.annualAmount)}
                        </td>
                        <td className="px-3 py-2">{line.losses ?? "Not recorded"}</td>
                        <td className="px-3 py-2">{line.timeOfUse ?? "Not recorded"}</td>
                        <td className="px-3 py-2">{line.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-2 text-amber-900/80">
                No supply contract charge evidence recorded.
              </p>
            )}
          </div>
        </section>

        <TariffAuditTracePanel entries={calculation.auditTrace} defaultOpenAll />
      </div>
    </div>
  );
}
