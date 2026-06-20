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

export type WorkbookVoltage = "EHV" | "HV" | "LV MD" | "LV";
export type AssetVoltage = "EHV" | "HV" | "LV" | "Metering";

export type TariffAssumptions = {
  weightedAverageCostOfCapitalPercent: number;
  cpiPercent: number;
  annualRevenue: number;
  annualUtilityRecoveries: number;
  averageAssetAgeYears: number;
  averageMeteringAssetAgeYears: number;
  potllEhvLossPercent: number;
  potllHvLossPercent: number;
  potllLvLossPercent: number;
  referenceYearStart: string;
  referenceYearEnd: string;
  tariffYearStart: string;
  tariffYearEnd: string;
};

export type DirectCostInput = {
  id: string;
  description: string;
  costCentre: string;
  expenseHead: string;
  costType: string;
  annualValue: number;
  comment: string;
};

export type EmployeeRoleType =
  | "Exco"
  | "Director"
  | "Head"
  | "Senior Manager"
  | "Manager"
  | "Colleague";

export type EmployeeCostInput = {
  id: string;
  role: string;
  roleType: EmployeeRoleType;
  fte: number;
  timePercent: number;
  hourlyRate: number;
  comment: string;
};

export type IndirectOverheadInput = {
  id: string;
  description: string;
  annualCost: number;
  comment: string;
};

export type SupplyChargeInput = {
  dayUnitRatePencePerKwh: number;
  nightUnitRatePencePerKwh: number;
  climateChangeLevyPencePerKwh: number;
  duosFixedChargePerDay: number;
  duosImportCapacityPencePerKvaPerDay: number;
  duosSuperRedUnitPencePerKwh: number;
  tnuosNonLocationalChargePerDay: number;
  tnuosTriadChargePerKw: number;
  procurementCost: number;
  consultancyCost: number;
  validationCost: number;
  profitPercent: number;
};

export type TenantInput = {
  id: string;
  customerName: string;
  tariffModelRef: string;
  saNumber: string;
  customerReference: string;
  voltage: WorkbookVoltage;
  capacityKva: number;
  tariffType: WorkbookVoltage;
  supplyIncluded: boolean;
  monthlyKwh: number[];
};

export type AssetInput = {
  id: string;
  description: string;
  assetCategory: string;
  isElectricalDistributionAsset: boolean;
  isChargeableOnElectricityTariff: boolean;
  voltage: AssetVoltage;
  networkLevel: string;
  lifeYears: number;
  priorYearAssetValue: number;
  sourceFileName: string;
  uploadedAt: string;
  importBatchId: string;
  rowFingerprint: string;
};

export type PotllSupplyInput = {
  id: string;
  location: string;
  voltage: WorkbookVoltage | "Losses";
  quarterKwh: number[];
};

export type HalfHourlyImportRow = {
  id: string;
  mpan: string;
  date: string;
  totalKwh: number;
  settlementPeriodKwh: number[];
  sourceFileName: string;
  uploadedAt: string;
  importBatchId: string;
  rowFingerprint: string;
};

export type ProjectMethodologyInputs = {
  projectId: string;
  assumptions: TariffAssumptions;
  directCosts: DirectCostInput[];
  employeeCosts: EmployeeCostInput[];
  indirectOverheads: IndirectOverheadInput[];
  supplyCharges: SupplyChargeInput;
  tenants: TenantInput[];
  assets: AssetInput[];
  potllSupplies: PotllSupplyInput[];
  halfHourlyImports: HalfHourlyImportRow[];
  notes: string;
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
  methodologyInputs: ProjectMethodologyInputs[];
};
