import type { DirectCostInput, EmployeeCostInput, IndirectOverheadInput } from "@/types/project";

export type MethodologyCostReadinessStatus = "Ready for review" | "Needs review" | "No evidence";

export type CostReadinessIssue = {
  rowId: string;
  source: "Direct cost" | "Employee cost" | "Indirect overhead";
  reference: string;
  messages: string[];
};

export type MethodologyCostReadinessSummary = {
  status: MethodologyCostReadinessStatus;
  directCostRows: number;
  directCostAnnualValue: number;
  directCostTypes: string[];
  employeeRows: number;
  employeeFte: number;
  employeeWeightedFte: number;
  employeeRoleTypes: string[];
  indirectOverheadRows: number;
  indirectOverheadAnnualCost: number;
  totalAnnualCostEvidence: number;
  uploadBatchCount: number;
  issues: CostReadinessIssue[];
  messages: string[];
};

function normaliseText(value: string) {
  return value.trim();
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map(normaliseText).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function collectUploadBatchIds(
  directCosts: DirectCostInput[],
  employeeCosts: EmployeeCostInput[],
  indirectOverheads: IndirectOverheadInput[]
) {
  return new Set(
    [
      ...directCosts.map((row) => row.importBatchId),
      ...employeeCosts.map((row) => row.importBatchId),
      ...indirectOverheads.map((row) => row.importBatchId)
    ].filter(Boolean)
  );
}

function reviewDirectCost(row: DirectCostInput): CostReadinessIssue | null {
  const messages: string[] = [];

  if (!normaliseText(row.description)) messages.push("Missing description");
  if (!normaliseText(row.costByType)) messages.push("Missing cost type");
  if (row.annualValue < 0) messages.push("Negative annual value");

  return messages.length > 0
    ? {
        rowId: row.id,
        source: "Direct cost",
        reference: row.description || row.id,
        messages
      }
    : null;
}

function reviewEmployeeCost(row: EmployeeCostInput): CostReadinessIssue | null {
  const messages: string[] = [];

  if (!normaliseText(row.role)) messages.push("Missing role");
  if (row.fte < 0) messages.push("Negative FTE");
  if (row.timePercent < 0 || row.timePercent > 100) messages.push("Time percentage outside 0-100");

  return messages.length > 0
    ? {
        rowId: row.id,
        source: "Employee cost",
        reference: row.role || row.id,
        messages
      }
    : null;
}

function reviewIndirectOverhead(row: IndirectOverheadInput): CostReadinessIssue | null {
  const messages: string[] = [];

  if (!normaliseText(row.description)) messages.push("Missing description");
  if (row.annualCost < 0) messages.push("Negative annual cost");

  return messages.length > 0
    ? {
        rowId: row.id,
        source: "Indirect overhead",
        reference: row.description || row.id,
        messages
      }
    : null;
}

export function summariseMethodologyCostReadiness(input: {
  directCosts: DirectCostInput[];
  employeeCosts: EmployeeCostInput[];
  indirectOverheads: IndirectOverheadInput[];
}): MethodologyCostReadinessSummary {
  const directCostAnnualValue = input.directCosts.reduce(
    (total, row) => total + row.annualValue,
    0
  );
  const employeeFte = input.employeeCosts.reduce((total, row) => total + row.fte, 0);
  const employeeWeightedFte = input.employeeCosts.reduce(
    (total, row) => total + row.fte * (row.timePercent / 100),
    0
  );
  const indirectOverheadAnnualCost = input.indirectOverheads.reduce(
    (total, row) => total + row.annualCost,
    0
  );
  const issues = [
    ...input.directCosts.map(reviewDirectCost),
    ...input.employeeCosts.map(reviewEmployeeCost),
    ...input.indirectOverheads.map(reviewIndirectOverhead)
  ].filter((issue): issue is CostReadinessIssue => issue !== null);
  const rowCount =
    input.directCosts.length + input.employeeCosts.length + input.indirectOverheads.length;
  const status: MethodologyCostReadinessStatus =
    rowCount === 0 ? "No evidence" : issues.length > 0 ? "Needs review" : "Ready for review";
  const uploadBatchCount = collectUploadBatchIds(
    input.directCosts,
    input.employeeCosts,
    input.indirectOverheads
  ).size;
  const messages =
    status === "No evidence"
      ? ["No direct cost, employee cost, or overhead evidence has been recorded yet."]
      : issues.length > 0
        ? [
            `${issues.length} methodology cost evidence row${
              issues.length === 1 ? "" : "s"
            } need review before the inputs are used for defensible tariff methodology support.`
          ]
        : ["Methodology cost evidence is ready for commercial review."];

  return {
    status,
    directCostRows: input.directCosts.length,
    directCostAnnualValue,
    directCostTypes: uniqueSorted(input.directCosts.map((row) => row.costByType)),
    employeeRows: input.employeeCosts.length,
    employeeFte,
    employeeWeightedFte,
    employeeRoleTypes: uniqueSorted(input.employeeCosts.map((row) => row.roleType)),
    indirectOverheadRows: input.indirectOverheads.length,
    indirectOverheadAnnualCost,
    totalAnnualCostEvidence: directCostAnnualValue + indirectOverheadAnnualCost,
    uploadBatchCount,
    issues,
    messages
  };
}
