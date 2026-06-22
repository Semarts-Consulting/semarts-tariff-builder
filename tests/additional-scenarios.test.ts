import { describe, expect, it } from "vitest";
import { calculateTariffs } from "@/lib/calculation-engine";
import {
  highConsumptionCostScenarioAllocationRows,
  highConsumptionCostScenarioCostPoolRows,
  highConsumptionCostScenarioDataInputRows,
  highConsumptionCostScenarioExpected,
  highFixedCostScenarioAllocationRows,
  highFixedCostScenarioCostPoolRows,
  highFixedCostScenarioDataInputRows,
  highFixedCostScenarioExpected,
  nonRecoverableScenarioAllocationRows,
  nonRecoverableScenarioCostPoolRows,
  nonRecoverableScenarioDataInputRows,
  nonRecoverableScenarioExpected,
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

  it("SCN-005 excludes non-recoverable cost from tariff recovery", () => {
    const result = calculateTariffs({
      projectId: "scn-005-non-recoverable-cost",
      dataInputRows: nonRecoverableScenarioDataInputRows,
      costPoolRows: nonRecoverableScenarioCostPoolRows,
      allocationRows: nonRecoverableScenarioAllocationRows
    });

    expect(result.validationIssues).toEqual([]);
    expect(result.revenueRequirement).toBe(
      nonRecoverableScenarioExpected.revenueRequirement
    );
    expect(result.allocatedCost).toBeCloseTo(result.revenueRequirement, 2);
    expect(result.unallocatedCost).toBeCloseTo(0, 2);
    expect(result.isRevenueRecovered).toBe(true);
    expect(result.unbalancedAllocationCount).toBe(0);

    const annualCostBase = nonRecoverableScenarioCostPoolRows.reduce(
      (total, row) => total + row.annualAmount,
      0
    );
    expect(annualCostBase).toBe(nonRecoverableScenarioExpected.annualCostBase);
    expect(annualCostBase - result.revenueRequirement).toBe(
      nonRecoverableScenarioExpected.excludedCost
    );

    Object.entries(nonRecoverableScenarioExpected.classResults).forEach(
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

    const auditTrace = result.auditTrace ?? [];
    const nonRecoverableTrace = auditTrace.find(
      (entry) =>
        entry.stage === "Revenue requirement" &&
        entry.costPoolId === "cost-non-recoverable-admin"
    );
    expect(nonRecoverableTrace?.result.unit).toBe("GBP");
    expect(nonRecoverableTrace?.result.value).toBeCloseTo(0, 2);

    const partialRecoveryTrace = auditTrace.find(
      (entry) =>
        entry.stage === "Revenue requirement" &&
        entry.costPoolId === "cost-partially-recoverable-maintenance"
    );
    expect(partialRecoveryTrace?.result.unit).toBe("GBP");
    expect(partialRecoveryTrace?.result.value).toBeCloseTo(6000, 2);
  });

  it("SCN-002 validates fixed charge sensitivity on a high fixed-cost site", () => {
    const result = calculateTariffs({
      projectId: "scn-002-high-fixed-cost",
      dataInputRows: highFixedCostScenarioDataInputRows,
      costPoolRows: highFixedCostScenarioCostPoolRows,
      allocationRows: highFixedCostScenarioAllocationRows
    });

    expect(result.validationIssues).toEqual([]);
    expect(result.revenueRequirement).toBe(
      highFixedCostScenarioExpected.revenueRequirement
    );
    expect(result.allocatedCost).toBeCloseTo(result.revenueRequirement, 2);
    expect(result.unallocatedCost).toBeCloseTo(0, 2);
    expect(result.isRevenueRecovered).toBe(true);
    expect(result.unbalancedAllocationCount).toBe(0);

    Object.entries(highFixedCostScenarioExpected.classResults).forEach(
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

    const auditTrace = result.auditTrace ?? [];
    const residentialFixedAllocationTrace = auditTrace.find(
      (entry) =>
        entry.stage === "Cost allocation" &&
        entry.allocationMethodId === "allocation-high-fixed-operations" &&
        entry.customerClass === "Residential" &&
        entry.tariffComponent === "Fixed"
    );
    expect(residentialFixedAllocationTrace?.result.unit).toBe("GBP");
    expect(residentialFixedAllocationTrace?.result.value).toBeCloseTo(27000, 2);

    const commercialFixedRateTrace = auditTrace.find(
      (entry) =>
        entry.stage === "Rate derivation" &&
        entry.customerClass === "Commercial" &&
        entry.tariffComponent === "Fixed"
    );
    expect(commercialFixedRateTrace?.result.unit).toBe("GBP per customer");
    expect(commercialFixedRateTrace?.result.value).toBeCloseTo(300, 4);
  });

  it("SCN-003 validates energy charge sensitivity on a high consumption-cost site", () => {
    const result = calculateTariffs({
      projectId: "scn-003-high-consumption-cost",
      dataInputRows: highConsumptionCostScenarioDataInputRows,
      costPoolRows: highConsumptionCostScenarioCostPoolRows,
      allocationRows: highConsumptionCostScenarioAllocationRows
    });

    expect(result.validationIssues).toEqual([]);
    expect(result.revenueRequirement).toBe(
      highConsumptionCostScenarioExpected.revenueRequirement
    );
    expect(result.allocatedCost).toBeCloseTo(result.revenueRequirement, 2);
    expect(result.unallocatedCost).toBeCloseTo(0, 2);
    expect(result.isRevenueRecovered).toBe(true);
    expect(result.unbalancedAllocationCount).toBe(0);

    Object.entries(highConsumptionCostScenarioExpected.classResults).forEach(
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

    const auditTrace = result.auditTrace ?? [];
    const commercialEnergyAllocationTrace = auditTrace.find(
      (entry) =>
        entry.stage === "Cost allocation" &&
        entry.allocationMethodId === "allocation-high-consumption-energy" &&
        entry.customerClass === "Commercial" &&
        entry.tariffComponent === "Energy"
    );
    expect(commercialEnergyAllocationTrace?.result.unit).toBe("GBP");
    expect(commercialEnergyAllocationTrace?.result.value).toBeCloseTo(24000, 2);

    const residentialEnergyRateTrace = auditTrace.find(
      (entry) =>
        entry.stage === "Rate derivation" &&
        entry.customerClass === "Residential" &&
        entry.tariffComponent === "Energy"
    );
    expect(residentialEnergyRateTrace?.result.unit).toBe("GBP per kWh");
    expect(residentialEnergyRateTrace?.result.value).toBeCloseTo(0.2, 4);
  });
});
