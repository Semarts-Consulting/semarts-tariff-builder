export type ProjectStatus = "Draft" | "Ready for review" | "Locked" | "Archived";
export type InputReadinessStatus =
  | "not-started"
  | "in-progress"
  | "needs-review"
  | "blocked"
  | "ready-for-calculation";

export type Project = {
  id: string;
  name: string;
  networkName: string;
  tariffModelName?: string;
  utilityHubCustomerId?: string;
  utilityHubSiteId?: string;
  tariffYear: number;
  referencePeriodStart?: string;
  referencePeriodEnd?: string;
  effectiveDate: string;
  billingPeriod: string;
  customerClasses: string[];
  inputReadinessStatus?: InputReadinessStatus;
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
  requiresReview?: boolean;
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
  costByType: string;
  annualValue: number;
  comment: string;
  sourceFileName: string;
  uploadedAt: string;
  importBatchId: string;
  rowFingerprint: string;
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
  comment: string;
  sourceFileName: string;
  uploadedAt: string;
  importBatchId: string;
  rowFingerprint: string;
};

export type IndirectOverheadInput = {
  id: string;
  description: string;
  annualCost: number;
  comment: string;
  sourceFileName: string;
  uploadedAt: string;
  importBatchId: string;
  rowFingerprint: string;
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

export type SupplyVoltage = "EHV" | "HV" | "LV";

export type SupplyChargeBasis = "Fixed" | "Pass Through";

export type SupplyContractLosses = "CM" | "GSP" | "NBP";

export type SupplyContractChargeType = "Consumption" | "Fixed" | "Capacity";

export type SupplyContractUnitOfMeasurement =
  | "per kWh"
  | "per MWh"
  | "per day"
  | "per Month"
  | "per year"
  | "per kVA per day"
  | "per kVA per Month";

export type SupplyContractRateUnit = "\u00a3" | "p";

export type SupplyContractTimeOfUse =
  | "All times"
  | "Red"
  | "Amber"
  | "Green"
  | "Super Red"
  | "Day"
  | "Night"
  | "Custom";

export type SupplyContractDayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type SupplyContractMonth =
  | "January"
  | "February"
  | "March"
  | "April"
  | "May"
  | "June"
  | "July"
  | "August"
  | "September"
  | "October"
  | "November"
  | "December";

export type SupplyContractCustomTimeOfUse = {
  daysOfWeek: SupplyContractDayOfWeek[];
  appliesOnBankHolidays: boolean;
  months: SupplyContractMonth[];
  startTime: string;
  endTime: string;
};

export type SupplyTimeOfUseReference =
  | "Red"
  | "Amber"
  | "Green"
  | "Super Red"
  | "Day"
  | "Night";

export type SupplyTimeOfUseDefinition = {
  id: SupplyTimeOfUseReference;
  label: SupplyTimeOfUseReference;
  daysOfWeek: SupplyContractDayOfWeek[];
  appliesOnBankHolidays: boolean;
  months: SupplyContractMonth[];
  startTime: string;
  endTime: string;
  sourceReference: string;
};

export type SupplyReferenceReviewStatus =
  | "Source required"
  | "Pending review"
  | "Extracted"
  | "Partially reviewed"
  | "Reviewed";

export type DistributionLossFactorReference = {
  id: string;
  voltage: SupplyVoltage | "Metering";
  lossFactorName: string;
  lossPercent: number;
  lossMultiplier: number;
  sourceReference: string;
  reviewStatus: SupplyReferenceReviewStatus;
};

export type SupplyReferenceExtractionStatus =
  | "Pending extraction"
  | "Source discovered"
  | "Extracted"
  | "Extraction failed"
  | "Reviewed"
  | "Rejected";

export type SupplyReferenceCandidateStatus =
  | "Extracted"
  | "Approved"
  | "Rejected"
  | "Needs review";

export type SupplyReferenceSourceDocument = {
  id: string;
  distributorId: string;
  chargingYear: string;
  title: string;
  sourceUrl: string;
  fileName: string;
  fileType: "PDF" | "Excel" | "CSV" | "Other";
  extractionStatus: SupplyReferenceExtractionStatus;
  extractionNotes: string;
  uploadedAt: string;
};

export type SupplyReferenceTouCandidate = {
  id: string;
  sourceDocumentId: string;
  distributorId: string;
  chargingYear: string;
  bandName: SupplyTimeOfUseReference;
  daysOfWeek: SupplyContractDayOfWeek[];
  appliesOnBankHolidays: boolean;
  months: SupplyContractMonth[];
  startTime: string;
  endTime: string;
  sourceReference: string;
  confidence: number;
  status: SupplyReferenceCandidateStatus;
};

export type SupplyReferenceLossCandidate = {
  id: string;
  sourceDocumentId: string;
  distributorId: string;
  chargingYear: string;
  voltage: SupplyVoltage | "Metering";
  lossFactorName: string;
  lossPercent: number;
  lossMultiplier: number;
  sourceReference: string;
  confidence: number;
  status: SupplyReferenceCandidateStatus;
};

export type DnoNetworkAreaReference = {
  distributorId: string;
  dnoName: string;
  networkArea: string;
  operatorCode: string;
  notes: string;
};

export type SupplyReferenceDataSet = {
  id: string;
  distributorId: string;
  chargingYear: string;
  reviewStatus: SupplyReferenceReviewStatus;
  extractionStatus: "Not extracted" | "Extracted" | "Extraction failed";
  timeOfUseReviewStatus: SupplyReferenceReviewStatus;
  lossesReviewStatus: SupplyReferenceReviewStatus;
  sourceDocumentTitle: string;
  sourceDocumentUrl: string;
  sourceReviewedAt: string;
  sourceNotes: string;
  timeOfUseDefinitions: SupplyTimeOfUseDefinition[];
  distributionLossFactors: DistributionLossFactorReference[];
};

export type SupplyReferenceData = {
  dnoNetworkAreas: DnoNetworkAreaReference[];
  dataSets: SupplyReferenceDataSet[];
  lastUpdated: string;
};

export type SupplyContractChargeInput = {
  id: string;
  chargeName: string;
  losses: SupplyContractLosses;
  chargeType: SupplyContractChargeType;
  unitOfMeasurement: SupplyContractUnitOfMeasurement;
  timeOfUse: SupplyContractTimeOfUse;
  customTimeOfUse: SupplyContractCustomTimeOfUse;
  rateUnit: SupplyContractRateUnit;
  rate: number;
};

export type SupplyDetailsInput = {
  id: string;
  mpan: string;
  supplyCapacityKva: number;
  voltage: SupplyVoltage;
  transmission: SupplyChargeBasis;
  distribution: SupplyChargeBasis;
  tnuosNonLocationalChargePerDay: number;
  tnuosTriadChargePerKw: number;
  duosFixedChargePerDay: number;
  duosImportCapacityPencePerKvaPerDay: number;
  duosRedUnitPencePerKwh: number;
  duosAmberUnitPencePerKwh: number;
  duosGreenUnitPencePerKwh: number;
  duosSuperRedUnitPencePerKwh: number;
  supplyContractCharges: SupplyContractChargeInput[];
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

export type SiteSubmeterResponsibility =
  | "Tenant"
  | "Network Operator"
  | "Landlord"
  | "Shared Asset"
  | "EV Asset"
  | "Plant Room"
  | "Infrastructure"
  | "Other Internal Use";

export type SiteSubmeterRecord = {
  id: string;
  meter: string;
  location: string;
  responsibility: SiteSubmeterResponsibility;
  tenantName: string;
  notes: string;
  sourceFileName: string;
  uploadedAt: string;
  importBatchId: string;
  rowFingerprint: string;
};

export type SubmeterConsumptionFormat =
  | "Half-hourly"
  | "Monthly"
  | "Quarterly"
  | "Annual";

export type SubmeterConsumptionUnit = "kWh";

export type SubmeterConsumptionValidationStatus =
  | "Pending review"
  | "Validated"
  | "Needs correction";

export type SubmeterConsumptionRecord = {
  id: string;
  meter: string;
  format: SubmeterConsumptionFormat;
  periodStart: string;
  periodEnd: string;
  consumptionValue: number;
  unit: SubmeterConsumptionUnit;
  sourceType: string;
  sourceFileName: string;
  uploadedAt: string;
  importBatchId: string;
  rowFingerprint: string;
  validationStatus: SubmeterConsumptionValidationStatus;
  settlementPeriodKwh?: number[];
};

export type TransmissionLossMultiplierInput = {
  id: string;
  settlementDate: string;
  settlementPeriod: number;
  transmissionLossMultiplier: number;
  gspGroup: string;
  effectiveFromDate: string;
  source: string;
  retrievedAt: string;
  version: string;
  importBatchId: string;
  rowFingerprint: string;
};

export type ProjectMethodologyInputs = {
  projectId: string;
  assumptions: TariffAssumptions;
  directCosts: DirectCostInput[];
  employeeCosts: EmployeeCostInput[];
  indirectOverheads: IndirectOverheadInput[];
  supplyDetails: SupplyDetailsInput[];
  supplyCharges: SupplyChargeInput;
  tenants: TenantInput[];
  assets: AssetInput[];
  potllSupplies: PotllSupplyInput[];
  halfHourlyImports: HalfHourlyImportRow[];
  siteSubmeters: SiteSubmeterRecord[];
  submeterConsumption: SubmeterConsumptionRecord[];
  transmissionLossMultipliers: TransmissionLossMultiplierInput[];
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

export type TariffCalculationValidationSeverity = "Error" | "Warning";

export type TariffCalculationValidationCode =
  | "Missing customer class"
  | "Missing allocation share customer class"
  | "Negative data input"
  | "Negative cost pool"
  | "Recoverable percentage outside range"
  | "Duplicate customer class"
  | "Negative allocation share"
  | "Unbalanced allocation"
  | "Allocation method requires review"
  | "Missing cost pool"
  | "Missing allocation method"
  | "Duplicate allocation method"
  | "Missing allocation shares"
  | "Duplicate allocation share"
  | "Unknown customer class"
  | "Missing fixed denominator"
  | "Missing consumption denominator"
  | "Missing capacity denominator";

export type TariffCalculationValidationIssue = {
  code: TariffCalculationValidationCode;
  severity: TariffCalculationValidationSeverity;
  message: string;
  rowId?: string;
  customerClass?: string;
  costPoolId?: string;
};

export type TariffCalculationTraceStage =
  | "Revenue requirement"
  | "Cost allocation"
  | "Class total"
  | "Rate derivation"
  | "Revenue recovery";

export type TariffCalculationTraceUnit =
  | "GBP"
  | "Percent"
  | "Customers"
  | "kWh"
  | "kW"
  | "GBP per customer"
  | "GBP per kWh"
  | "GBP per kW";

export type TariffCalculationTraceValue = {
  label: string;
  value: number;
  unit: TariffCalculationTraceUnit;
};

export type TariffCalculationTraceEntry = {
  id: string;
  stage: TariffCalculationTraceStage;
  label: string;
  formula: string;
  inputs: TariffCalculationTraceValue[];
  result: TariffCalculationTraceValue;
  sourceRowIds: string[];
  costPoolId?: string;
  allocationMethodId?: string;
  dataInputRowId?: string;
  customerClass?: string;
  tariffComponent?: TariffComponent;
};

export type TariffCalculationResult = {
  projectId: string;
  revenueRequirement: number;
  allocatedCost: number;
  unallocatedCost: number;
  unbalancedAllocationCount: number;
  isRevenueRecovered: boolean;
  validationIssues: TariffCalculationValidationIssue[];
  auditTrace?: TariffCalculationTraceEntry[];
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
