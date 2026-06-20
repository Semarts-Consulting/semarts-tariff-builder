export type ProjectStatus = "Draft" | "Ready for review" | "Locked" | "Archived";

export type Project = {
  id: string;
  name: string;
  networkName: string;
  tariffYear: number;
  effectiveDate: string;
  billingPeriod: string;
  customerClasses: string[];
  status: ProjectStatus;
  lastUpdated: string;
};

export type DataInputRow = {
  id: string;
  customerClass: string;
  customerCount: number;
  annualKwh: number;
  peakDemandKw: number;
  notes: string;
};

export type ProjectDataInputs = {
  projectId: string;
  rows: DataInputRow[];
  assumptions: string;
  lastUpdated: string;
};

export type CostPoolCategory =
  | "Operations"
  | "Maintenance"
  | "Administration"
  | "Network services"
  | "Asset recovery"
  | "Taxes and levies"
  | "Other";

export type CostPoolRow = {
  id: string;
  name: string;
  category: CostPoolCategory;
  annualAmount: number;
  recoverablePercent: number;
  notes: string;
};

export type ProjectCostPools = {
  projectId: string;
  rows: CostPoolRow[];
  assumptions: string;
  lastUpdated: string;
};

export type AllocationBasis =
  | "Customer count"
  | "Annual kWh"
  | "Peak demand"
  | "Equal share"
  | "Manual";

export type TariffComponent = "Fixed" | "Energy" | "Demand" | "Pass-through";

export type AllocationClassShare = {
  customerClass: string;
  percent: number;
};

export type AllocationMethodRow = {
  id: string;
  costPoolId: string;
  costPoolName: string;
  basis: AllocationBasis;
  tariffComponent: TariffComponent;
  classShares: AllocationClassShare[];
  notes: string;
};

export type ProjectAllocationMethods = {
  projectId: string;
  rows: AllocationMethodRow[];
  assumptions: string;
  lastUpdated: string;
};

export type TariffCalculationClassResult = {
  customerClass: string;
  customerCount: number;
  annualKwh: number;
  peakDemandKw: number;
  fixedCost: number;
  energyCost: number;
  demandCost: number;
  passThroughCost: number;
  totalAllocatedCost: number;
  fixedChargePerCustomer: number;
  energyChargePerKwh: number;
  demandChargePerKw: number;
};

export type TariffCalculationResult = {
  projectId: string;
  revenueRequirement: number;
  allocatedCost: number;
  unallocatedCost: number;
  unbalancedAllocationCount: number;
  classResults: TariffCalculationClassResult[];
};

export type ProjectSection = {
  title: string;
  description: string;
  href: string;
};

export type LocalProjectBackup = {
  version: 1;
  exportedAt: string;
  projects: Project[];
  dataInputs: ProjectDataInputs[];
  costPools: ProjectCostPools[];
  allocationMethods: ProjectAllocationMethods[];
};
