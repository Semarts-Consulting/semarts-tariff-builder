import { describe, expect, it } from "vitest";
import { calculateTariffs } from "@/lib/calculation-engine";
import {
  twoClassScenarioAllocationRows,
  twoClassScenarioCostPoolRows,
  twoClassScenarioDataInputRows,
  twoClassScenarioExpected
} from "@/tests/fixtures/additional-scenarios";

describe("additional tariff scenarios", () => {
  it("SCN-001 reconciles a small two-class site to expected tariff outputs", () => {
    const result = calculateTariffs({
      projectId: "scn-001-two-class-site",
      dataInputRows: twoClassScenarioDataInputRows,
      costPoolRows: twoClassScenarioCostPoolRows,
      allocationRows: twoClassScenarioAllocationRows
    });

    expect(result.validationIssues).toEqual([]);
    expect(result.revenueRequirement).toBe(twoClassScenarioExpected.revenueRequirement);
    expect(result.allocatedCost).toBeCloseTo(result.revenueRequirement, 2);
    expect(result.unallocatedCost).toBeCloseTo(0, 2);
    expect(result.isRevenueRecovered).toBe(true);
    expect(result.unbalancedAllocationCount).toBe(0);

    Object.entries(twoClassScenarioExpected.classResults).forEach(
      ([customerClass, expected]) => {
        const classResult = result.classResults.find(
          (row) => row.customerClass === customerClass
        );

        expect(classResult).toBeDefined();
        expect(classResult?.fixedCost).toBeCloseTo(expected.fixedCost, 2);
        expect(classResult?.energyCost).toBeCloseTo(expected.energyCost, 2);
        expect(classResult?.demandCost).toBeCloseTo(expected.demandCost, 2);
        expect(classResult?.passThroughCost).toBeCloseTo(
          expected.passThroughCost,
          2
        );
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

    expect(result.auditTrace).toBeDefined();
    const auditTrace = result.auditTrace ?? [];

    const fixedRevenueTrace = auditTrace.find(
      (entry) =>
        entry.stage === "Revenue requirement" &&
        entry.costPoolId === "cost-fixed-network"
    );
    expect(fixedRevenueTrace?.result.unit).toBe("GBP");
    expect(fixedRevenueTrace?.result.value).toBeCloseTo(6000, 2);

    const residentialEnergyAllocationTrace = auditTrace.find(
      (entry) =>
        entry.stage === "Cost allocation" &&
        entry.allocationMethodId === "allocation-energy-network" &&
        entry.customerClass === "Residential" &&
        entry.tariffComponent === "Energy"
    );
    expect(residentialEnergyAllocationTrace?.result.unit).toBe("GBP");
    expect(residentialEnergyAllocationTrace?.result.value).toBeCloseTo(6000, 2);

    const commercialDemandRateTrace = auditTrace.find(
      (entry) =>
        entry.stage === "Rate derivation" &&
        entry.customerClass === "Commercial" &&
        entry.tariffComponent === "Demand"
    );
    expect(commercialDemandRateTrace?.result.unit).toBe("GBP per kW");
    expect(commercialDemandRateTrace?.result.value).toBeCloseTo(10, 4);
  });
});
