import { describe, expect, it } from "vitest";
import { calculateTariffs } from "@/lib/calculation-engine";
import {
  mvpCandidateAllocationRows,
  mvpCandidateCostPoolRows,
  mvpCandidateDataInputRows,
  mvpCandidateExpected
} from "@/tests/fixtures/mvp-candidate-scenario";

describe("MVP candidate representative scenario", () => {
  it("reconciles tariff outputs to the recoverable cost base with audit evidence", () => {
    const result = calculateTariffs({
      projectId: "mvp-candidate-private-network",
      dataInputRows: mvpCandidateDataInputRows,
      costPoolRows: mvpCandidateCostPoolRows,
      allocationRows: mvpCandidateAllocationRows
    });

    expect(result.validationIssues).toEqual([]);
    expect(result.revenueRequirement).toBe(mvpCandidateExpected.revenueRequirement);
    expect(result.allocatedCost).toBeCloseTo(result.revenueRequirement, 2);
    expect(result.unallocatedCost).toBeCloseTo(0, 2);
    expect(result.isRevenueRecovered).toBe(true);
    expect(result.unbalancedAllocationCount).toBe(0);

    Object.entries(mvpCandidateExpected.classResults).forEach(
      ([customerClass, expected]) => {
        const classResult = result.classResults.find(
          (row) => row.customerClass === customerClass
        );

        expect(classResult).toBeDefined();
        expect(classResult?.fixedCost).toBeCloseTo(expected.fixedCost, 2);
        expect(classResult?.energyCost).toBeCloseTo(expected.energyCost, 2);
        expect(classResult?.demandCost).toBeCloseTo(expected.demandCost, 2);
        expect(classResult?.passThroughCost).toBeCloseTo(expected.passThroughCost, 2);
        expect(classResult?.totalAllocatedCost).toBeCloseTo(
          expected.totalAllocatedCost,
          2
        );
        expect(classResult?.fixedChargePerCustomer).toBeCloseTo(
          expected.fixedChargePerCustomer,
          4
        );
        expect(classResult?.energyChargePerKwh).toBeCloseTo(
          expected.energyChargePerKwh,
          4
        );
        expect(classResult?.demandChargePerKw).toBeCloseTo(
          expected.demandChargePerKw,
          4
        );
      }
    );

    expect(
      result.classResults.reduce((total, row) => total + row.totalAllocatedCost, 0)
    ).toBeCloseTo(result.revenueRequirement, 2);

    expect(result.auditTrace).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stage: "Revenue requirement",
          formula: "annualAmount * recoverablePercent / 100",
          costPoolId: "cost-standing-network",
          result: expect.objectContaining({ value: 12000, unit: "GBP" })
        }),
        expect.objectContaining({
          stage: "Cost allocation",
          formula: "recoverableCost * allocationPercent / 100",
          costPoolId: "cost-capacity-network",
          allocationMethodId: "allocation-capacity-network",
          customerClass: "Residential",
          tariffComponent: "Demand",
          result: expect.objectContaining({ value: 4800, unit: "GBP" })
        }),
        expect.objectContaining({
          stage: "Rate derivation",
          formula: "(energyCost + passThroughCost) / annualKwh",
          customerClass: "Small business",
          tariffComponent: "Energy",
          result: expect.objectContaining({ value: 0.08, unit: "GBP per kWh" })
        }),
        expect.objectContaining({
          stage: "Revenue recovery",
          formula: "revenueRequirement - allocatedCost",
          result: expect.objectContaining({ value: expect.closeTo(0, 2), unit: "GBP" })
        })
      ])
    );
  });
});
