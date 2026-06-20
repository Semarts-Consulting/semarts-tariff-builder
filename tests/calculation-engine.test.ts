import { describe, expect, it } from "vitest";
import { calculateTariffs } from "@/lib/calculation-engine";
import type { AllocationMethodRow, CostPoolRow, DataInputRow } from "@/types/project";

const dataInputRows: DataInputRow[] = [
  {
    id: "input-residential",
    customerClass: "Residential",
    customerCount: 80,
    annualKwh: 120000,
    peakDemandKw: 300,
    notes: ""
  },
  {
    id: "input-business",
    customerClass: "Business",
    customerCount: 20,
    annualKwh: 80000,
    peakDemandKw: 200,
    notes: ""
  }
];

const costPoolRows: CostPoolRow[] = [
  {
    id: "fixed-cost",
    name: "Fixed costs",
    category: "Administration",
    annualAmount: 10000,
    recoverablePercent: 100,
    notes: ""
  },
  {
    id: "energy-cost",
    name: "Energy costs",
    category: "Network services",
    annualAmount: 20000,
    recoverablePercent: 50,
    notes: ""
  },
  {
    id: "demand-cost",
    name: "Demand costs",
    category: "Asset recovery",
    annualAmount: 15000,
    recoverablePercent: 100,
    notes: ""
  },
  {
    id: "pass-through-cost",
    name: "Pass-through costs",
    category: "Taxes and levies",
    annualAmount: 5000,
    recoverablePercent: 100,
    notes: ""
  }
];

const balancedAllocationRows: AllocationMethodRow[] = [
  {
    id: "allocation-fixed",
    costPoolId: "fixed-cost",
    costPoolName: "Fixed costs",
    basis: "Customer count",
    tariffComponent: "Fixed",
    classShares: [
      { customerClass: "Residential", percent: 80 },
      { customerClass: "Business", percent: 20 }
    ],
    notes: ""
  },
  {
    id: "allocation-energy",
    costPoolId: "energy-cost",
    costPoolName: "Energy costs",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [
      { customerClass: "Residential", percent: 60 },
      { customerClass: "Business", percent: 40 }
    ],
    notes: ""
  },
  {
    id: "allocation-demand",
    costPoolId: "demand-cost",
    costPoolName: "Demand costs",
    basis: "Peak demand",
    tariffComponent: "Demand",
    classShares: [
      { customerClass: "Residential", percent: 60 },
      { customerClass: "Business", percent: 40 }
    ],
    notes: ""
  },
  {
    id: "allocation-pass-through",
    costPoolId: "pass-through-cost",
    costPoolName: "Pass-through costs",
    basis: "Manual",
    tariffComponent: "Pass-through",
    classShares: [
      { customerClass: "Residential", percent: 50 },
      { customerClass: "Business", percent: 50 }
    ],
    notes: ""
  }
];

describe("calculateTariffs", () => {
  it("calculates recoverable revenue requirement", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows,
      allocationRows: balancedAllocationRows
    });

    expect(result.revenueRequirement).toBe(40000);
  });

  it("allocates costs by tariff component and customer class", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows,
      allocationRows: balancedAllocationRows
    });
    const residential = result.classResults.find(
      (row) => row.customerClass === "Residential"
    );
    const business = result.classResults.find((row) => row.customerClass === "Business");

    expect(residential?.fixedCost).toBe(8000);
    expect(residential?.energyCost).toBe(6000);
    expect(residential?.demandCost).toBe(9000);
    expect(residential?.passThroughCost).toBe(2500);
    expect(residential?.totalAllocatedCost).toBe(25500);

    expect(business?.fixedCost).toBe(2000);
    expect(business?.energyCost).toBe(4000);
    expect(business?.demandCost).toBe(6000);
    expect(business?.passThroughCost).toBe(2500);
    expect(business?.totalAllocatedCost).toBe(14500);
  });

  it("calculates indicative fixed, energy, and demand rates", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows,
      allocationRows: balancedAllocationRows
    });
    const residential = result.classResults.find(
      (row) => row.customerClass === "Residential"
    );
    const business = result.classResults.find((row) => row.customerClass === "Business");

    expect(residential?.fixedChargePerCustomer).toBe(100);
    expect(residential?.energyChargePerKwh).toBeCloseTo(0.070833, 5);
    expect(residential?.demandChargePerKw).toBe(30);

    expect(business?.fixedChargePerCustomer).toBe(100);
    expect(business?.energyChargePerKwh).toBe(0.08125);
    expect(business?.demandChargePerKw).toBe(30);
  });

  it("flags unbalanced allocations and preserves the resulting variance", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows: [costPoolRows[0]],
      allocationRows: [
        {
          ...balancedAllocationRows[0],
          classShares: [
            { customerClass: "Residential", percent: 50 },
            { customerClass: "Business", percent: 25 }
          ]
        }
      ]
    });

    expect(result.unbalancedAllocationCount).toBe(1);
    expect(result.allocatedCost).toBe(7500);
    expect(result.unallocatedCost).toBe(2500);
  });

  it("ignores allocation rows without a matching cost pool", () => {
    const result = calculateTariffs({
      projectId: "project",
      dataInputRows,
      costPoolRows: [costPoolRows[0]],
      allocationRows: [
        balancedAllocationRows[0],
        {
          ...balancedAllocationRows[1],
          costPoolId: "missing"
        }
      ]
    });

    expect(result.revenueRequirement).toBe(10000);
    expect(result.allocatedCost).toBe(10000);
    expect(result.unallocatedCost).toBe(0);
  });
});
