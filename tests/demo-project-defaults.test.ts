import { describe, expect, it } from "vitest";
import { calculateTariffs } from "@/lib/calculation-engine";
import {
  getProjectAllocationMethods,
  getProjectCostPools,
  getProjectDataInputs,
  getProjectMethodologyInputs
} from "@/lib/project-storage";
import { calculateLossAdjustedHalfHourlyConsumption } from "@/lib/loss-adjusted-consumption";
import { reconcileSubmeterConsumptionToBoundary } from "@/lib/submeter-reconciliation";
import { demoProjectId } from "@/lib/sample-data";

describe("demo project defaults", () => {
  it("seed the representative MVP tariff scenario for live demo use", () => {
    const dataInputs = getProjectDataInputs(demoProjectId);
    const costPools = getProjectCostPools(demoProjectId);
    const allocationMethods = getProjectAllocationMethods(demoProjectId);

    expect(dataInputs.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customerClass: "Residential",
          customerCount: 80,
          annualKwh: 160000,
          peakDemandKw: 320
        }),
        expect.objectContaining({
          customerClass: "Small business",
          customerCount: 15,
          annualKwh: 120000,
          peakDemandKw: 240
        }),
        expect.objectContaining({
          customerClass: "Common area",
          customerCount: 5,
          annualKwh: 20000,
          peakDemandKw: 40
        })
      ])
    );

    expect(costPools.rows).toHaveLength(4);
    expect(allocationMethods.rows).toHaveLength(4);

    const result = calculateTariffs({
      projectId: demoProjectId,
      dataInputRows: dataInputs.rows,
      costPoolRows: costPools.rows,
      allocationRows: allocationMethods.rows
    });

    expect(result.validationIssues).toEqual([]);
    expect(result.revenueRequirement).toBe(45000);
    expect(result.allocatedCost).toBeCloseTo(45000, 2);
    expect(result.unallocatedCost).toBeCloseTo(0, 2);
    expect(result.isRevenueRecovered).toBe(true);

    expect(
      result.classResults.map((row) => ({
        customerClass: row.customerClass,
        totalAllocatedCost: row.totalAllocatedCost,
        fixedChargePerCustomer: row.fixedChargePerCustomer,
        energyChargePerKwh: row.energyChargePerKwh,
        demandChargePerKw: row.demandChargePerKw
      }))
    ).toEqual(
      expect.arrayContaining([
        {
          customerClass: "Residential",
          totalAllocatedCost: 27200,
          fixedChargePerCustomer: 120,
          energyChargePerKwh: 0.08,
          demandChargePerKw: 15
        },
        {
          customerClass: "Small business",
          totalAllocatedCost: 15000,
          fixedChargePerCustomer: 120,
          energyChargePerKwh: 0.08,
          demandChargePerKw: 15
        },
        {
          customerClass: "Common area",
          totalAllocatedCost: 2800,
          fixedChargePerCustomer: 120,
          energyChargePerKwh: 0.08,
          demandChargePerKw: 15
        }
      ])
    );
  });

  it("seeds evidence-only submeter and TLM data for walkthrough use", () => {
    const methodologyInputs = getProjectMethodologyInputs(demoProjectId);

    expect(methodologyInputs.siteSubmeters).toHaveLength(4);
    expect(methodologyInputs.submeterConsumption).toHaveLength(4);
    expect(methodologyInputs.halfHourlyImports).toHaveLength(1);
    expect(methodologyInputs.transmissionLossMultipliers).toHaveLength(48);

    const reconciliation = reconcileSubmeterConsumptionToBoundary({
      boundaryMeterRows: methodologyInputs.halfHourlyImports,
      submeterRows: methodologyInputs.siteSubmeters,
      consumptionRows: methodologyInputs.submeterConsumption
    });

    expect(reconciliation.boundaryMeterImportTotalKwh).toBe(120);
    expect(reconciliation.totalSubmeterConsumptionKwh).toBe(120);
    expect(reconciliation.status).toBe("Green");

    const lossAdjusted = calculateLossAdjustedHalfHourlyConsumption({
      consumptionRows: methodologyInputs.submeterConsumption,
      multipliers: methodologyInputs.transmissionLossMultipliers
    });

    expect(lossAdjusted.warnings).toEqual([]);
    expect(lossAdjusted.rawConsumptionKwh).toBe(120);
    expect(lossAdjusted.lossAdjustedConsumptionKwh).toBeCloseTo(122.4, 4);
    expect(methodologyInputs.notes).toContain("evidence-only");
  });
});
