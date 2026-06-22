import type { AllocationMethodRow, CostPoolRow, DataInputRow } from "@/types/project";

export const twoClassScenarioDataInputRows: DataInputRow[] = [
  {
    id: "input-residential",
    customerClass: "Residential",
    customerCount: 50,
    annualKwh: 100000,
    peakDemandKw: 200,
    notes: "Residential customers on a small private network."
  },
  {
    id: "input-commercial",
    customerClass: "Commercial",
    customerCount: 10,
    annualKwh: 50000,
    peakDemandKw: 100,
    notes: "Commercial customers on a small private network."
  }
];

export const twoClassScenarioCostPoolRows: CostPoolRow[] = [
  {
    id: "cost-fixed-network",
    name: "Fixed network operations",
    category: "Operations",
    annualAmount: 6000,
    recoverablePercent: 100,
    notes: "Fixed network cost recovered by customer count."
  },
  {
    id: "cost-energy-network",
    name: "Consumption network costs",
    category: "Network services",
    annualAmount: 9000,
    recoverablePercent: 100,
    notes: "Consumption cost recovered by annual kWh."
  },
  {
    id: "cost-demand-network",
    name: "Demand network costs",
    category: "Asset recovery",
    annualAmount: 3000,
    recoverablePercent: 100,
    notes: "Demand cost recovered by peak demand."
  }
];

export const twoClassScenarioAllocationRows: AllocationMethodRow[] = [
  {
    id: "allocation-fixed-network",
    costPoolId: "cost-fixed-network",
    costPoolName: "Fixed network operations",
    basis: "Customer count",
    tariffComponent: "Fixed",
    classShares: [
      { customerClass: "Residential", percent: 83.33333333333334 },
      { customerClass: "Commercial", percent: 16.666666666666664 }
    ],
    notes: "Fixed network cost allocated by customer count."
  },
  {
    id: "allocation-energy-network",
    costPoolId: "cost-energy-network",
    costPoolName: "Consumption network costs",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [
      { customerClass: "Residential", percent: 66.66666666666666 },
      { customerClass: "Commercial", percent: 33.33333333333333 }
    ],
    notes: "Consumption network cost allocated by annual kWh."
  },
  {
    id: "allocation-demand-network",
    costPoolId: "cost-demand-network",
    costPoolName: "Demand network costs",
    basis: "Peak demand",
    tariffComponent: "Demand",
    classShares: [
      { customerClass: "Residential", percent: 66.66666666666666 },
      { customerClass: "Commercial", percent: 33.33333333333333 }
    ],
    notes: "Demand network cost allocated by peak demand."
  }
];

export const twoClassScenarioExpected = {
  revenueRequirement: 18000,
  classResults: {
    Residential: {
      fixedCost: 5000,
      energyCost: 6000,
      demandCost: 2000,
      passThroughCost: 0,
      totalAllocatedCost: 13000,
      fixedChargePerCustomer: 100,
      energyChargePerKwh: 0.06,
      demandChargePerKw: 10
    },
    Commercial: {
      fixedCost: 1000,
      energyCost: 3000,
      demandCost: 1000,
      passThroughCost: 0,
      totalAllocatedCost: 5000,
      fixedChargePerCustomer: 100,
      energyChargePerKwh: 0.06,
      demandChargePerKw: 10
    }
  }
};
