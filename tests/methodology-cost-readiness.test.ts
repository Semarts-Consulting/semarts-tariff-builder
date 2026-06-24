import { describe, expect, it } from "vitest";
import { summariseMethodologyCostReadiness } from "@/lib/methodology-cost-readiness";
import type { DirectCostInput, EmployeeCostInput, IndirectOverheadInput } from "@/types/project";

const uploadedAt = "2026-06-24T09:00:00.000Z";

function directCost(overrides: Partial<DirectCostInput> = {}): DirectCostInput {
  return {
    id: "direct-1",
    description: "Security recharge",
    costByType: "Security",
    annualValue: 12000,
    comment: "",
    sourceFileName: "direct.xlsx",
    uploadedAt,
    importBatchId: "direct-batch",
    rowFingerprint: "direct-fingerprint",
    ...overrides
  };
}

function employeeCost(overrides: Partial<EmployeeCostInput> = {}): EmployeeCostInput {
  return {
    id: "employee-1",
    role: "Energy manager",
    roleType: "Manager",
    fte: 0.5,
    timePercent: 60,
    comment: "",
    sourceFileName: "employee.xlsx",
    uploadedAt,
    importBatchId: "employee-batch",
    rowFingerprint: "employee-fingerprint",
    ...overrides
  };
}

function indirectOverhead(overrides: Partial<IndirectOverheadInput> = {}): IndirectOverheadInput {
  return {
    id: "overhead-1",
    description: "Shared utilities team",
    annualCost: 8000,
    comment: "",
    sourceFileName: "overheads.xlsx",
    uploadedAt,
    importBatchId: "overhead-batch",
    rowFingerprint: "overhead-fingerprint",
    ...overrides
  };
}

describe("summariseMethodologyCostReadiness", () => {
  it("summarises direct cost, employee cost, and overhead evidence without implying tariff impact", () => {
    const summary = summariseMethodologyCostReadiness({
      directCosts: [directCost(), directCost({ id: "direct-2", costByType: "Operations" })],
      employeeCosts: [employeeCost()],
      indirectOverheads: [indirectOverhead()]
    });

    expect(summary.status).toBe("Ready for review");
    expect(summary.directCostRows).toBe(2);
    expect(summary.directCostAnnualValue).toBe(24000);
    expect(summary.directCostTypes).toEqual(["Operations", "Security"]);
    expect(summary.employeeRows).toBe(1);
    expect(summary.employeeFte).toBe(0.5);
    expect(summary.employeeWeightedFte).toBe(0.3);
    expect(summary.employeeRoleTypes).toEqual(["Manager"]);
    expect(summary.indirectOverheadRows).toBe(1);
    expect(summary.indirectOverheadAnnualCost).toBe(8000);
    expect(summary.totalAnnualCostEvidence).toBe(32000);
    expect(summary.uploadBatchCount).toBe(3);
    expect(summary.issues).toEqual([]);
    expect(summary.messages).toContain("Methodology cost evidence is ready for commercial review.");
  });

  it("reports row-level issues for missing references and invalid values", () => {
    const summary = summariseMethodologyCostReadiness({
      directCosts: [directCost({ description: "", costByType: "", annualValue: -1 })],
      employeeCosts: [employeeCost({ role: "", fte: -0.2, timePercent: 120 })],
      indirectOverheads: [indirectOverhead({ description: "", annualCost: -10 })]
    });

    expect(summary.status).toBe("Needs review");
    expect(summary.issues).toHaveLength(3);
    expect(summary.issues[0]).toMatchObject({
      source: "Direct cost",
      messages: ["Missing description", "Missing cost type", "Negative annual value"]
    });
    expect(summary.issues[1]).toMatchObject({
      source: "Employee cost",
      messages: ["Missing role", "Negative FTE", "Time percentage outside 0-100"]
    });
    expect(summary.issues[2]).toMatchObject({
      source: "Indirect overhead",
      messages: ["Missing description", "Negative annual cost"]
    });
  });

  it("returns no evidence status when no methodology cost rows exist", () => {
    const summary = summariseMethodologyCostReadiness({
      directCosts: [],
      employeeCosts: [],
      indirectOverheads: []
    });

    expect(summary.status).toBe("No evidence");
    expect(summary.totalAnnualCostEvidence).toBe(0);
    expect(summary.messages).toContain(
      "No direct cost, employee cost, or overhead evidence has been recorded yet."
    );
  });
});
