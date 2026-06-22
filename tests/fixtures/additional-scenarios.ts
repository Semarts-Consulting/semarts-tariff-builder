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

export const highFixedCostScenarioDataInputRows: DataInputRow[] = [
  {
    id: "input-residential-high-fixed",
    customerClass: "Residential",
    customerCount: 90,
    annualKwh: 90000,
    peakDemandKw: 180,
    notes: "Residential customers on a fixed-cost-heavy private network."
  },
  {
    id: "input-commercial-high-fixed",
    customerClass: "Commercial",
    customerCount: 10,
    annualKwh: 60000,
    peakDemandKw: 120,
    notes: "Commercial customers with higher per-customer consumption."
  }
];

export const highFixedCostScenarioCostPoolRows: CostPoolRow[] = [
  {
    id: "cost-high-fixed-operations",
    name: "High fixed network operations",
    category: "Operations",
    annualAmount: 30000,
    recoverablePercent: 100,
    notes: "Dominant fixed cost recovered by customer count."
  },
  {
    id: "cost-high-fixed-energy",
    name: "Lower consumption network costs",
    category: "Network services",
    annualAmount: 6000,
    recoverablePercent: 100,
    notes: "Lower consumption-related cost recovered by annual kWh."
  },
  {
    id: "cost-high-fixed-demand",
    name: "Lower demand network costs",
    category: "Asset recovery",
    annualAmount: 3000,
    recoverablePercent: 100,
    notes: "Lower demand-related cost recovered by peak demand."
  }
];

export const highFixedCostScenarioAllocationRows: AllocationMethodRow[] = [
  {
    id: "allocation-high-fixed-operations",
    costPoolId: "cost-high-fixed-operations",
    costPoolName: "High fixed network operations",
    basis: "Customer count",
    tariffComponent: "Fixed",
    classShares: [
      { customerClass: "Residential", percent: 90 },
      { customerClass: "Commercial", percent: 10 }
    ],
    notes: "Fixed cost allocated by customer count."
  },
  {
    id: "allocation-high-fixed-energy",
    costPoolId: "cost-high-fixed-energy",
    costPoolName: "Lower consumption network costs",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [
      { customerClass: "Residential", percent: 60 },
      { customerClass: "Commercial", percent: 40 }
    ],
    notes: "Consumption cost allocated by annual kWh."
  },
  {
    id: "allocation-high-fixed-demand",
    costPoolId: "cost-high-fixed-demand",
    costPoolName: "Lower demand network costs",
    basis: "Peak demand",
    tariffComponent: "Demand",
    classShares: [
      { customerClass: "Residential", percent: 60 },
      { customerClass: "Commercial", percent: 40 }
    ],
    notes: "Demand cost allocated by peak demand."
  }
];

export const highFixedCostScenarioExpected = {
  revenueRequirement: 39000,
  classResults: {
    Residential: {
      fixedCost: 27000,
      energyCost: 3600,
      demandCost: 1800,
      passThroughCost: 0,
      totalAllocatedCost: 32400,
      fixedChargePerCustomer: 300,
      energyChargePerKwh: 0.04,
      demandChargePerKw: 10
    },
    Commercial: {
      fixedCost: 3000,
      energyCost: 2400,
      demandCost: 1200,
      passThroughCost: 0,
      totalAllocatedCost: 6600,
      fixedChargePerCustomer: 300,
      energyChargePerKwh: 0.04,
      demandChargePerKw: 10
    }
  }
};

export const highConsumptionCostScenarioDataInputRows: DataInputRow[] = [
  {
    id: "input-residential-high-consumption",
    customerClass: "Residential",
    customerCount: 20,
    annualKwh: 30000,
    peakDemandKw: 60,
    notes: "Residential customers on a consumption-cost-heavy network."
  },
  {
    id: "input-commercial-high-consumption",
    customerClass: "Commercial",
    customerCount: 10,
    annualKwh: 120000,
    peakDemandKw: 240,
    notes: "Commercial users with high annual consumption."
  }
];

export const highConsumptionCostScenarioCostPoolRows: CostPoolRow[] = [
  {
    id: "cost-high-consumption-fixed",
    name: "Lower fixed network operations",
    category: "Operations",
    annualAmount: 3000,
    recoverablePercent: 100,
    notes: "Lower fixed cost recovered by customer count."
  },
  {
    id: "cost-high-consumption-energy",
    name: "High consumption network costs",
    category: "Network services",
    annualAmount: 30000,
    recoverablePercent: 100,
    notes: "Dominant consumption-related cost recovered by annual kWh."
  },
  {
    id: "cost-high-consumption-demand",
    name: "Lower demand network costs",
    category: "Asset recovery",
    annualAmount: 3000,
    recoverablePercent: 100,
    notes: "Lower demand-related cost recovered by peak demand."
  }
];

export const highConsumptionCostScenarioAllocationRows: AllocationMethodRow[] = [
  {
    id: "allocation-high-consumption-fixed",
    costPoolId: "cost-high-consumption-fixed",
    costPoolName: "Lower fixed network operations",
    basis: "Customer count",
    tariffComponent: "Fixed",
    classShares: [
      { customerClass: "Residential", percent: 66.66666666666666 },
      { customerClass: "Commercial", percent: 33.33333333333333 }
    ],
    notes: "Fixed cost allocated by customer count."
  },
  {
    id: "allocation-high-consumption-energy",
    costPoolId: "cost-high-consumption-energy",
    costPoolName: "High consumption network costs",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [
      { customerClass: "Residential", percent: 20 },
      { customerClass: "Commercial", percent: 80 }
    ],
    notes: "Consumption cost allocated by annual kWh."
  },
  {
    id: "allocation-high-consumption-demand",
    costPoolId: "cost-high-consumption-demand",
    costPoolName: "Lower demand network costs",
    basis: "Peak demand",
    tariffComponent: "Demand",
    classShares: [
      { customerClass: "Residential", percent: 20 },
      { customerClass: "Commercial", percent: 80 }
    ],
    notes: "Demand cost allocated by peak demand."
  }
];

export const highConsumptionCostScenarioExpected = {
  revenueRequirement: 36000,
  classResults: {
    Residential: {
      fixedCost: 2000,
      energyCost: 6000,
      demandCost: 600,
      passThroughCost: 0,
      totalAllocatedCost: 8600,
      fixedChargePerCustomer: 100,
      energyChargePerKwh: 0.2,
      demandChargePerKw: 10
    },
    Commercial: {
      fixedCost: 1000,
      energyCost: 24000,
      demandCost: 2400,
      passThroughCost: 0,
      totalAllocatedCost: 27400,
      fixedChargePerCustomer: 100,
      energyChargePerKwh: 0.2,
      demandChargePerKw: 10
    }
  }
};

export const capacityHeavyScenarioDataInputRows: DataInputRow[] = [
  {
    id: "input-residential-capacity-heavy",
    customerClass: "Residential",
    customerCount: 40,
    annualKwh: 80000,
    peakDemandKw: 100,
    notes: "Residential customers with lower peak demand on a capacity-heavy network."
  },
  {
    id: "input-commercial-capacity-heavy",
    customerClass: "Commercial",
    customerCount: 10,
    annualKwh: 70000,
    peakDemandKw: 500,
    notes: "Commercial users with materially higher peak demand."
  }
];

export const capacityHeavyScenarioCostPoolRows: CostPoolRow[] = [
  {
    id: "cost-capacity-heavy-fixed",
    name: "Lower fixed network operations",
    category: "Operations",
    annualAmount: 3000,
    recoverablePercent: 100,
    notes: "Lower fixed cost recovered by customer count."
  },
  {
    id: "cost-capacity-heavy-energy",
    name: "Lower consumption network costs",
    category: "Network services",
    annualAmount: 3000,
    recoverablePercent: 100,
    notes: "Lower consumption-related cost recovered by annual kWh."
  },
  {
    id: "cost-capacity-heavy-demand",
    name: "High capacity network costs",
    category: "Asset recovery",
    annualAmount: 30000,
    recoverablePercent: 100,
    notes: "Dominant capacity-related cost recovered by peak demand."
  }
];

export const capacityHeavyScenarioAllocationRows: AllocationMethodRow[] = [
  {
    id: "allocation-capacity-heavy-fixed",
    costPoolId: "cost-capacity-heavy-fixed",
    costPoolName: "Lower fixed network operations",
    basis: "Customer count",
    tariffComponent: "Fixed",
    classShares: [
      { customerClass: "Residential", percent: 80 },
      { customerClass: "Commercial", percent: 20 }
    ],
    notes: "Fixed cost allocated by customer count."
  },
  {
    id: "allocation-capacity-heavy-energy",
    costPoolId: "cost-capacity-heavy-energy",
    costPoolName: "Lower consumption network costs",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [
      { customerClass: "Residential", percent: 53.333333333333336 },
      { customerClass: "Commercial", percent: 46.666666666666664 }
    ],
    notes: "Consumption cost allocated by annual kWh."
  },
  {
    id: "allocation-capacity-heavy-demand",
    costPoolId: "cost-capacity-heavy-demand",
    costPoolName: "High capacity network costs",
    basis: "Peak demand",
    tariffComponent: "Demand",
    classShares: [
      { customerClass: "Residential", percent: 16.666666666666664 },
      { customerClass: "Commercial", percent: 83.33333333333334 }
    ],
    notes: "Demand cost allocated by peak demand."
  }
];

export const capacityHeavyScenarioExpected = {
  revenueRequirement: 36000,
  classResults: {
    Residential: {
      fixedCost: 2400,
      energyCost: 1600,
      demandCost: 5000,
      passThroughCost: 0,
      totalAllocatedCost: 9000,
      fixedChargePerCustomer: 60,
      energyChargePerKwh: 0.02,
      demandChargePerKw: 50
    },
    Commercial: {
      fixedCost: 600,
      energyCost: 1400,
      demandCost: 25000,
      passThroughCost: 0,
      totalAllocatedCost: 27000,
      fixedChargePerCustomer: 60,
      energyChargePerKwh: 0.02,
      demandChargePerKw: 50
    }
  }
};

export const validationIssueScenarioDataInputRows: DataInputRow[] = [
  {
    id: "input-residential-validation-issue",
    customerClass: "Residential",
    customerCount: 0,
    annualKwh: 10000,
    peakDemandKw: 50,
    notes: "Residential class deliberately has no customer count to validate denominator handling."
  },
  {
    id: "input-commercial-validation-issue",
    customerClass: "Commercial",
    customerCount: 5,
    annualKwh: 20000,
    peakDemandKw: 100,
    notes: "Commercial class remains valid so partial outputs can still be reviewed."
  }
];

export const validationIssueScenarioCostPoolRows: CostPoolRow[] = [
  {
    id: "cost-validation-fixed",
    name: "Fixed network operations",
    category: "Operations",
    annualAmount: 5000,
    recoverablePercent: 100,
    notes: "Recoverable fixed cost with a missing residential denominator."
  },
  {
    id: "cost-validation-energy",
    name: "Consumption network costs",
    category: "Network services",
    annualAmount: 10000,
    recoverablePercent: 100,
    notes: "Recoverable consumption cost with deliberately unbalanced allocation shares."
  },
  {
    id: "cost-validation-demand",
    name: "Demand network costs",
    category: "Asset recovery",
    annualAmount: 6000,
    recoverablePercent: 100,
    notes: "Recoverable demand cost deliberately missing an allocation method."
  }
];

export const validationIssueScenarioAllocationRows: AllocationMethodRow[] = [
  {
    id: "allocation-validation-fixed",
    costPoolId: "cost-validation-fixed",
    costPoolName: "Fixed network operations",
    basis: "Customer count",
    tariffComponent: "Fixed",
    requiresReview: true,
    classShares: [{ customerClass: "Residential", percent: 100 }],
    notes: "Review warning is deliberate; output should remain calculable."
  },
  {
    id: "allocation-validation-energy",
    costPoolId: "cost-validation-energy",
    costPoolName: "Consumption network costs",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [
      { customerClass: "Residential", percent: 60 },
      { customerClass: "Commercial", percent: 30 }
    ],
    notes: "Shares deliberately total 90% to preserve and expose revenue variance."
  }
];

export const validationIssueScenarioExpected = {
  revenueRequirement: 21000,
  allocatedCost: 14000,
  unallocatedCost: 7000,
  unbalancedAllocationCount: 1,
  classResults: {
    Residential: {
      fixedCost: 5000,
      energyCost: 6000,
      demandCost: 0,
      passThroughCost: 0,
      totalAllocatedCost: 11000,
      fixedChargePerCustomer: 0,
      energyChargePerKwh: 0.6,
      demandChargePerKw: 0
    },
    Commercial: {
      fixedCost: 0,
      energyCost: 3000,
      demandCost: 0,
      passThroughCost: 0,
      totalAllocatedCost: 3000,
      fixedChargePerCustomer: 0,
      energyChargePerKwh: 0.15,
      demandChargePerKw: 0
    }
  }
};
