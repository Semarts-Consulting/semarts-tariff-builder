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

export const nonRecoverableScenarioDataInputRows: DataInputRow[] = [
  {
    id: "input-standard",
    customerClass: "Standard",
    customerCount: 40,
    annualKwh: 80000,
    peakDemandKw: 160,
    notes: "Standard occupiers on the private network."
  },
  {
    id: "input-large-user",
    customerClass: "Large user",
    customerCount: 5,
    annualKwh: 70000,
    peakDemandKw: 140,
    notes: "Larger commercial user group with higher usage."
  }
];

export const nonRecoverableScenarioCostPoolRows: CostPoolRow[] = [
  {
    id: "cost-recoverable-operations",
    name: "Recoverable network operations",
    category: "Operations",
    annualAmount: 9000,
    recoverablePercent: 100,
    notes: "Fully recoverable fixed network operating cost."
  },
  {
    id: "cost-partially-recoverable-maintenance",
    name: "Partially recoverable maintenance",
    category: "Maintenance",
    annualAmount: 10000,
    recoverablePercent: 60,
    notes: "Only GBP 6,000 is recoverable; GBP 4,000 is excluded from tariffs."
  },
  {
    id: "cost-non-recoverable-admin",
    name: "Non-recoverable administration",
    category: "Administration",
    annualAmount: 5000,
    recoverablePercent: 0,
    notes: "Excluded from tariff recovery."
  }
];

export const nonRecoverableScenarioAllocationRows: AllocationMethodRow[] = [
  {
    id: "allocation-recoverable-operations",
    costPoolId: "cost-recoverable-operations",
    costPoolName: "Recoverable network operations",
    basis: "Customer count",
    tariffComponent: "Fixed",
    classShares: [
      { customerClass: "Standard", percent: 88.88888888888889 },
      { customerClass: "Large user", percent: 11.11111111111111 }
    ],
    notes: "Fixed recoverable costs allocated by customer count."
  },
  {
    id: "allocation-partially-recoverable-maintenance",
    costPoolId: "cost-partially-recoverable-maintenance",
    costPoolName: "Partially recoverable maintenance",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [
      { customerClass: "Standard", percent: 53.333333333333336 },
      { customerClass: "Large user", percent: 46.666666666666664 }
    ],
    notes: "Recoverable maintenance cost allocated by annual kWh."
  },
  {
    id: "allocation-non-recoverable-admin",
    costPoolId: "cost-non-recoverable-admin",
    costPoolName: "Non-recoverable administration",
    basis: "Customer count",
    tariffComponent: "Fixed",
    classShares: [
      { customerClass: "Standard", percent: 88.88888888888889 },
      { customerClass: "Large user", percent: 11.11111111111111 }
    ],
    notes: "Allocation exists, but recoverable cost is zero."
  }
];

export const nonRecoverableScenarioExpected = {
  annualCostBase: 24000,
  excludedCost: 9000,
  revenueRequirement: 15000,
  classResults: {
    Standard: {
      fixedCost: 8000,
      energyCost: 3200,
      demandCost: 0,
      passThroughCost: 0,
      totalAllocatedCost: 11200,
      fixedChargePerCustomer: 200,
      energyChargePerKwh: 0.04,
      demandChargePerKw: 0
    },
    "Large user": {
      fixedCost: 1000,
      energyCost: 2800,
      demandCost: 0,
      passThroughCost: 0,
      totalAllocatedCost: 3800,
      fixedChargePerCustomer: 200,
      energyChargePerKwh: 0.04,
      demandChargePerKw: 0
    }
  }
};
