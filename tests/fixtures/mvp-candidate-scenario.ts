import type { AllocationMethodRow, CostPoolRow, DataInputRow } from "@/types/project";

export const mvpCandidateDataInputRows: DataInputRow[] = [
  {
    id: "input-residential",
    customerClass: "Residential",
    customerCount: 80,
    annualKwh: 160000,
    peakDemandKw: 320,
    notes: "Representative domestic tenants on the private network."
  },
  {
    id: "input-small-business",
    customerClass: "Small business",
    customerCount: 15,
    annualKwh: 120000,
    peakDemandKw: 240,
    notes: "Representative commercial occupiers."
  },
  {
    id: "input-common-area",
    customerClass: "Common area",
    customerCount: 5,
    annualKwh: 20000,
    peakDemandKw: 40,
    notes: "Landlord/common services supplied from the network."
  }
];

export const mvpCandidateCostPoolRows: CostPoolRow[] = [
  {
    id: "cost-standing-network",
    name: "Standing network operations",
    category: "Operations",
    annualAmount: 12000,
    recoverablePercent: 100,
    notes: "Recovered through fixed standing charges using customer count."
  },
  {
    id: "cost-consumption-network",
    name: "Consumption-related network costs",
    category: "Network services",
    annualAmount: 18000,
    recoverablePercent: 100,
    notes: "Recovered through energy charges using annual kWh."
  },
  {
    id: "cost-capacity-network",
    name: "Capacity-related network costs",
    category: "Asset recovery",
    annualAmount: 9000,
    recoverablePercent: 100,
    notes: "Recovered through demand charges using peak kW."
  },
  {
    id: "cost-direct-pass-through",
    name: "Direct electricity pass-through",
    category: "Taxes and levies",
    annualAmount: 6000,
    recoverablePercent: 100,
    notes: "Direct pass-through cost allocated by annual kWh."
  }
];

export const mvpCandidateAllocationRows: AllocationMethodRow[] = [
  {
    id: "allocation-standing-network",
    costPoolId: "cost-standing-network",
    costPoolName: "Standing network operations",
    basis: "Customer count",
    tariffComponent: "Fixed",
    classShares: [
      { customerClass: "Residential", percent: 80 },
      { customerClass: "Small business", percent: 15 },
      { customerClass: "Common area", percent: 5 }
    ],
    notes: "Fixed network costs allocated by customer count."
  },
  {
    id: "allocation-consumption-network",
    costPoolId: "cost-consumption-network",
    costPoolName: "Consumption-related network costs",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [
      { customerClass: "Residential", percent: 53.333333333333336 },
      { customerClass: "Small business", percent: 40 },
      { customerClass: "Common area", percent: 6.666666666666667 }
    ],
    notes: "Consumption-related costs allocated by forecast annual kWh."
  },
  {
    id: "allocation-capacity-network",
    costPoolId: "cost-capacity-network",
    costPoolName: "Capacity-related network costs",
    basis: "Peak demand",
    tariffComponent: "Demand",
    classShares: [
      { customerClass: "Residential", percent: 53.333333333333336 },
      { customerClass: "Small business", percent: 40 },
      { customerClass: "Common area", percent: 6.666666666666667 }
    ],
    notes: "Capacity costs allocated by peak demand kW."
  },
  {
    id: "allocation-direct-pass-through",
    costPoolId: "cost-direct-pass-through",
    costPoolName: "Direct electricity pass-through",
    basis: "Annual kWh",
    tariffComponent: "Pass-through",
    classShares: [
      { customerClass: "Residential", percent: 53.333333333333336 },
      { customerClass: "Small business", percent: 40 },
      { customerClass: "Common area", percent: 6.666666666666667 }
    ],
    notes: "Pass-through charge allocated by annual kWh."
  }
];

export const mvpCandidateExpected = {
  revenueRequirement: 45000,
  classResults: {
    Residential: {
      fixedCost: 9600,
      energyCost: 9600,
      demandCost: 4800,
      passThroughCost: 3200,
      totalAllocatedCost: 27200,
      fixedChargePerCustomer: 120,
      energyChargePerKwh: 0.08,
      demandChargePerKw: 15
    },
    "Small business": {
      fixedCost: 1800,
      energyCost: 7200,
      demandCost: 3600,
      passThroughCost: 2400,
      totalAllocatedCost: 15000,
      fixedChargePerCustomer: 120,
      energyChargePerKwh: 0.08,
      demandChargePerKw: 15
    },
    "Common area": {
      fixedCost: 600,
      energyCost: 1200,
      demandCost: 600,
      passThroughCost: 400,
      totalAllocatedCost: 2800,
      fixedChargePerCustomer: 120,
      energyChargePerKwh: 0.08,
      demandChargePerKw: 15
    }
  }
};
