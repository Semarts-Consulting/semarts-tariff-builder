import type {
  AllocationMethodRow,
  CostPoolRow,
  DataInputRow
} from "@/types/project";

export type WorkbookDerivedEvidenceTreatment =
  | "Evidence-only"
  | "Evidence-only/pass-through"
  | "Excluded pending review";

export type WorkbookDerivedEvidenceItem = {
  id: string;
  label: string;
  amount: number;
  treatment: WorkbookDerivedEvidenceTreatment;
  expectedAssertion: string;
};

export type WorkbookMappingConfidence =
  | "High"
  | "Medium"
  | "Low"
  | "Unresolved";

export type WorkbookMappingTreatment =
  | "Calculation input"
  | "Evidence-only"
  | "Excluded pending review"
  | "Manual review required";

export type WorkbookDerivedMappingRow = {
  id: string;
  sourceWorkbook: string;
  worksheetName: string;
  sourceSection: string;
  sourceLabel: string;
  rawValue: string;
  normalisedValue: number | null;
  normalisedUnit: string | null;
  mappingConfidence: WorkbookMappingConfidence;
  treatment: WorkbookMappingTreatment;
  validationIssue: string | null;
};

export type WorkbookLossEvidenceType =
  | "TLM"
  | "Local losses"
  | "Distribution losses"
  | "Settlement evidence";

export type WorkbookDerivedLossEvidenceRow = {
  id: string;
  sourceWorkbook: string;
  worksheetName: string;
  customerClass: string;
  meterReference: string;
  baseKwh: number;
  lossAdjustedKwh: number | null;
  lossPercent: number | null;
  evidenceType: WorkbookLossEvidenceType;
  mappingConfidence: WorkbookMappingConfidence;
  treatment: Exclude<WorkbookMappingTreatment, "Calculation input">;
  validationIssue: string | null;
};

export type WorkbookDerivedGenerationEvidenceRow = {
  id: string;
  sourceWorkbook: string;
  worksheetName: string;
  siteArea: string;
  meterReference: string;
  generationKwh: number | null;
  exportKwh: number | null;
  creditAmount: number | null;
  mappingConfidence: WorkbookMappingConfidence;
  treatment: Exclude<WorkbookMappingTreatment, "Calculation input">;
  validationIssue: string | null;
};

export type WorkbookDerivedTenantRecoveryRow = {
  id: string;
  sourceWorkbook: string;
  tenantName: string;
  tariffModelRef: string;
  customerReference: string;
  saNumber: string;
  voltage: string;
  forecastKwh: number | null;
  forecastRecoveryAmount: number | null;
  mappingConfidence: WorkbookMappingConfidence;
  treatment: WorkbookMappingTreatment;
  validationIssue: string | null;
};

export type WorkbookDerivedAssetEvidenceRow = {
  id: string;
  sourceWorkbook: string;
  assetDescription: string;
  assetCategory: string;
  voltage: string;
  localClass: string;
  isElectricalDistributionAsset: boolean;
  isChargeableOnElectricityTariff: boolean;
  annualChargeAmount: number | null;
  mappingConfidence: WorkbookMappingConfidence;
  treatment: WorkbookMappingTreatment;
  validationIssue: string | null;
};

export const wb001AirportScenarioDataInputRows: DataInputRow[] = [
  {
    id: "wb001-input-terminal-retail",
    customerClass: "Terminal retail",
    customerCount: 12,
    annualKwh: 2400000,
    peakDemandKw: 1500,
    notes:
      "Airport terminal retail class. Capacity value is represented through peakDemandKw for test-only demand allocation coverage."
  },
  {
    id: "wb001-input-airside-operations",
    customerClass: "Airside operations",
    customerCount: 4,
    annualKwh: 8000000,
    peakDemandKw: 3000,
    notes:
      "Airport airside operations class. Capacity value is represented through peakDemandKw for test-only demand allocation coverage."
  },
  {
    id: "wb001-input-ev-charging",
    customerClass: "EV charging",
    customerCount: 2,
    annualKwh: 1200000,
    peakDemandKw: 1000,
    notes:
      "Airport EV charging class. Capacity value is represented through peakDemandKw for test-only demand allocation coverage."
  }
];

export const wb001AirportScenarioCostPoolRows: CostPoolRow[] = [
  {
    id: "wb001-cost-network-asset-annuity",
    name: "Network asset annuity",
    category: "Asset recovery",
    annualAmount: 180000,
    recoverablePercent: 100,
    notes: "Recoverable network asset annuity allocated by capacity / demand input."
  },
  {
    id: "wb001-cost-network-maintenance",
    name: "Network maintenance",
    category: "Maintenance",
    annualAmount: 90000,
    recoverablePercent: 100,
    notes: "Recoverable maintenance cost allocated by annual kWh."
  },
  {
    id: "wb001-cost-customer-administration",
    name: "Customer administration",
    category: "Administration",
    annualAmount: 36000,
    recoverablePercent: 100,
    notes: "Recoverable administration cost allocated by customer count."
  }
];

export const wb001AirportScenarioAllocationRows: AllocationMethodRow[] = [
  {
    id: "wb001-allocation-network-asset-annuity",
    costPoolId: "wb001-cost-network-asset-annuity",
    costPoolName: "Network asset annuity",
    basis: "Peak demand",
    tariffComponent: "Demand",
    classShares: [
      { customerClass: "Terminal retail", percent: 27.27272727272727 },
      { customerClass: "Airside operations", percent: 54.54545454545454 },
      { customerClass: "EV charging", percent: 18.181818181818183 }
    ],
    notes:
      "Capacity-led allocation represented through the existing peak demand calculation path for test-only coverage."
  },
  {
    id: "wb001-allocation-network-maintenance",
    costPoolId: "wb001-cost-network-maintenance",
    costPoolName: "Network maintenance",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [
      { customerClass: "Terminal retail", percent: 20.689655172413794 },
      { customerClass: "Airside operations", percent: 68.96551724137932 },
      { customerClass: "EV charging", percent: 10.344827586206897 }
    ],
    notes: "Consumption-led allocation by annual kWh."
  },
  {
    id: "wb001-allocation-customer-administration",
    costPoolId: "wb001-cost-customer-administration",
    costPoolName: "Customer administration",
    basis: "Customer count",
    tariffComponent: "Fixed",
    classShares: [
      { customerClass: "Terminal retail", percent: 66.66666666666666 },
      { customerClass: "Airside operations", percent: 22.22222222222222 },
      { customerClass: "EV charging", percent: 11.11111111111111 }
    ],
    notes: "Fixed administration cost allocated by customer count."
  }
];

export const wb001AirportScenarioEvidenceItems: WorkbookDerivedEvidenceItem[] = [
  {
    id: "wb001-evidence-auos-local-network",
    label: "AUoS/local network evidence",
    amount: 42000,
    treatment: "Evidence-only",
    expectedAssertion: "Not included in cost pools passed to calculateTariffs."
  },
  {
    id: "wb001-evidence-supplier-pass-through",
    label: "Supplier pass-through evidence",
    amount: 75000,
    treatment: "Evidence-only/pass-through",
    expectedAssertion: "Not included in network tariff recovery target."
  },
  {
    id: "wb001-evidence-unresolved-workbook-row",
    label: "Unresolved workbook row",
    amount: 8500,
    treatment: "Excluded pending review",
    expectedAssertion:
      "Not included in cost pools or allocation rows passed to calculateTariffs."
  }
];

export const wb001AirportScenarioExpected = {
  revenueRequirement: 306000,
  evidenceOnlyTotal: 42000,
  passThroughEvidenceTotal: 75000,
  excludedPendingReviewTotal: 8500,
  classResults: {
    "Terminal retail": {
      fixedCost: 24000,
      energyCost: 18620.689655172413,
      demandCost: 49090.90909090909,
      passThroughCost: 0,
      totalAllocatedCost: 91711.5987460815,
      fixedChargePerCustomer: 2000,
      energyChargePerKwh: 0.007758620689655172,
      demandChargePerKw: 32.72727272727273
    },
    "Airside operations": {
      fixedCost: 8000,
      energyCost: 62068.96551724139,
      demandCost: 98181.81818181818,
      passThroughCost: 0,
      totalAllocatedCost: 168250.78369905957,
      fixedChargePerCustomer: 2000,
      energyChargePerKwh: 0.007758620689655174,
      demandChargePerKw: 32.72727272727273
    },
    "EV charging": {
      fixedCost: 4000,
      energyCost: 9310.344827586206,
      demandCost: 32727.27272727273,
      passThroughCost: 0,
      totalAllocatedCost: 46037.61755485893,
      fixedChargePerCustomer: 2000,
      energyChargePerKwh: 0.007758620689655172,
      demandChargePerKw: 32.72727272727273
    }
  }
};

export const wb006WeakMappingScenarioMappingRows: WorkbookDerivedMappingRow[] = [
  {
    id: "wb006-map-confirmed-maintenance",
    sourceWorkbook: "Airport model pattern",
    worksheetName: "Tariff Sheet",
    sourceSection: "Network cost recovery",
    sourceLabel: "Confirmed recoverable maintenance cost",
    rawValue: "GBP 12,000",
    normalisedValue: 12000,
    normalisedUnit: "GBP per year",
    mappingConfidence: "High",
    treatment: "Calculation input",
    validationIssue: null
  },
  {
    id: "wb006-map-auos-evidence",
    sourceWorkbook: "Airport model pattern",
    worksheetName: "AUoS",
    sourceSection: "Evidence",
    sourceLabel: "Local network charge",
    rawValue: "GBP 4,200",
    normalisedValue: 4200,
    normalisedUnit: "GBP per year",
    mappingConfidence: "Low",
    treatment: "Evidence-only",
    validationIssue: "Low-confidence workbook mapping requires review."
  },
  {
    id: "wb006-map-supplier-pass-through",
    sourceWorkbook: "Airport model pattern",
    worksheetName: "Supply",
    sourceSection: "Supplier charges",
    sourceLabel: "Supplier pass-through",
    rawValue: "GBP 7,500",
    normalisedValue: 7500,
    normalisedUnit: "GBP per year",
    mappingConfidence: "Medium",
    treatment: "Evidence-only",
    validationIssue:
      "Supplier context is not approved for network tariff recovery."
  },
  {
    id: "wb006-map-unresolved-workbook-amount",
    sourceWorkbook: "Port model pattern",
    worksheetName: "Summary",
    sourceSection: "Unresolved",
    sourceLabel: "Other recharge",
    rawValue: "GBP 850",
    normalisedValue: 850,
    normalisedUnit: "GBP per year",
    mappingConfidence: "Unresolved",
    treatment: "Excluded pending review",
    validationIssue: "Workbook row could not be mapped with reliable context."
  },
  {
    id: "wb006-map-weak-unit",
    sourceWorkbook: "Airport model pattern",
    worksheetName: "Charges",
    sourceSection: "Rates",
    sourceLabel: "Network unit rate",
    rawValue: "0.18",
    normalisedValue: null,
    normalisedUnit: null,
    mappingConfidence: "Low",
    treatment: "Manual review required",
    validationIssue: "Unit cannot be confirmed from workbook context."
  }
];

export const wb006WeakMappingScenarioDataInputRows: DataInputRow[] = [
  {
    id: "wb006-input-reviewed-class",
    customerClass: "Reviewed class",
    customerCount: 6,
    annualKwh: 120000,
    peakDemandKw: 60,
    notes: "Single reviewed class used to prove only approved mapped values feed calculation."
  }
];

export const wb006WeakMappingScenarioCostPoolRows: CostPoolRow[] = [
  {
    id: "wb006-cost-confirmed-maintenance",
    name: "Confirmed recoverable maintenance cost",
    category: "Maintenance",
    annualAmount: 12000,
    recoverablePercent: 100,
    notes:
      "Only high-confidence calculation-input mapping row is converted into a cost pool for this test."
  }
];

export const wb006WeakMappingScenarioAllocationRows: AllocationMethodRow[] = [
  {
    id: "wb006-allocation-confirmed-maintenance",
    costPoolId: "wb006-cost-confirmed-maintenance",
    costPoolName: "Confirmed recoverable maintenance cost",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [{ customerClass: "Reviewed class", percent: 100 }],
    notes:
      "Approved calculation-input row is allocated to the single reviewed class."
  }
];

export const wb006WeakMappingScenarioExpected = {
  revenueRequirement: 12000,
  excludedMappingAmount: 12550,
  validationIssueCount: 4,
  classResults: {
    "Reviewed class": {
      fixedCost: 0,
      energyCost: 12000,
      demandCost: 0,
      passThroughCost: 0,
      totalAllocatedCost: 12000,
      fixedChargePerCustomer: 0,
      energyChargePerKwh: 0.1,
      demandChargePerKw: 0
    }
  }
};

export const wb002TlmLocalLossScenarioDataInputRows: DataInputRow[] = [
  {
    id: "wb002-input-terminal-retail",
    customerClass: "Terminal retail",
    customerCount: 12,
    annualKwh: 2400000,
    peakDemandKw: 1500,
    notes:
      "Reviewed base consumption. TLM/local loss evidence is held separately and does not uplift this calculation input."
  },
  {
    id: "wb002-input-airside-operations",
    customerClass: "Airside operations",
    customerCount: 4,
    annualKwh: 8000000,
    peakDemandKw: 3000,
    notes:
      "Reviewed base consumption. TLM/local loss evidence is held separately and does not uplift this calculation input."
  }
];

export const wb002TlmLocalLossScenarioCostPoolRows: CostPoolRow[] = [
  {
    id: "wb002-cost-reviewed-network-maintenance",
    name: "Reviewed network maintenance",
    category: "Maintenance",
    annualAmount: 52000,
    recoverablePercent: 100,
    notes:
      "Approved recoverable network cost used to prove loss evidence remains separate from tariff inputs."
  }
];

export const wb002TlmLocalLossScenarioAllocationRows: AllocationMethodRow[] = [
  {
    id: "wb002-allocation-reviewed-network-maintenance",
    costPoolId: "wb002-cost-reviewed-network-maintenance",
    costPoolName: "Reviewed network maintenance",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [
      { customerClass: "Terminal retail", percent: 23.076923076923077 },
      { customerClass: "Airside operations", percent: 76.92307692307693 }
    ],
    notes:
      "Allocation uses reviewed base kWh only; evidence-only loss uplift is not applied."
  }
];

export const wb002TlmLocalLossEvidenceRows: WorkbookDerivedLossEvidenceRow[] = [
  {
    id: "wb002-loss-terminal-local",
    sourceWorkbook: "Airport losses model pattern",
    worksheetName: "Local Losses",
    customerClass: "Terminal retail",
    meterReference: "TR-001",
    baseKwh: 2400000,
    lossAdjustedKwh: 2520000,
    lossPercent: 5,
    evidenceType: "Local losses",
    mappingConfidence: "High",
    treatment: "Evidence-only",
    validationIssue: null
  },
  {
    id: "wb002-loss-airside-tlm",
    sourceWorkbook: "Airport losses model pattern",
    worksheetName: "TLM",
    customerClass: "Airside operations",
    meterReference: "AO-001",
    baseKwh: 8000000,
    lossAdjustedKwh: 8240000,
    lossPercent: 3,
    evidenceType: "TLM",
    mappingConfidence: "High",
    treatment: "Evidence-only",
    validationIssue: null
  },
  {
    id: "wb002-loss-distribution-weak",
    sourceWorkbook: "Airport losses model pattern",
    worksheetName: "Distribution",
    customerClass: "Terminal retail",
    meterReference: "TR-weak",
    baseKwh: 100000,
    lossAdjustedKwh: 106000,
    lossPercent: 6,
    evidenceType: "Distribution losses",
    mappingConfidence: "Low",
    treatment: "Manual review required",
    validationIssue: "Distribution loss evidence needs source review."
  },
  {
    id: "wb002-loss-settlement-unresolved",
    sourceWorkbook: "Airport losses model pattern",
    worksheetName: "Settlement",
    customerClass: "Unknown",
    meterReference: "Unresolved",
    baseKwh: 50000,
    lossAdjustedKwh: null,
    lossPercent: null,
    evidenceType: "Settlement evidence",
    mappingConfidence: "Unresolved",
    treatment: "Excluded pending review",
    validationIssue: "Settlement evidence cannot be mapped to a reviewed class."
  }
];

export const wb002TlmLocalLossScenarioExpected = {
  revenueRequirement: 52000,
  evidenceOnlyBaseKwh: 10400000,
  evidenceOnlyLossAdjustedKwh: 10760000,
  calculationAnnualKwh: 10400000,
  manualReviewIssueCount: 2,
  classResults: {
    "Terminal retail": {
      fixedCost: 0,
      energyCost: 12000,
      demandCost: 0,
      passThroughCost: 0,
      totalAllocatedCost: 12000,
      fixedChargePerCustomer: 0,
      energyChargePerKwh: 0.005,
      demandChargePerKw: 0
    },
    "Airside operations": {
      fixedCost: 0,
      energyCost: 40000,
      demandCost: 0,
      passThroughCost: 0,
      totalAllocatedCost: 40000,
      fixedChargePerCustomer: 0,
      energyChargePerKwh: 0.005,
      demandChargePerKw: 0
    }
  }
};

export const wb004GenerationExportScenarioDataInputRows: DataInputRow[] = [
  {
    id: "wb004-input-reviewed-import-class",
    customerClass: "Reviewed import class",
    customerCount: 8,
    annualKwh: 600000,
    peakDemandKw: 120,
    notes:
      "Reviewed import consumption. Generation and export evidence is held separately and does not net this calculation input."
  }
];

export const wb004GenerationExportScenarioCostPoolRows: CostPoolRow[] = [
  {
    id: "wb004-cost-reviewed-network-service",
    name: "Reviewed network service cost",
    category: "Network services",
    annualAmount: 30000,
    recoverablePercent: 100,
    notes:
      "Approved recoverable network cost used to prove generation/export evidence remains separate from tariff recovery."
  }
];

export const wb004GenerationExportScenarioAllocationRows: AllocationMethodRow[] = [
  {
    id: "wb004-allocation-reviewed-network-service",
    costPoolId: "wb004-cost-reviewed-network-service",
    costPoolName: "Reviewed network service cost",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [{ customerClass: "Reviewed import class", percent: 100 }],
    notes:
      "Allocation uses reviewed import consumption only; generation/export evidence is not netted."
  }
];

export const wb004GenerationExportEvidenceRows: WorkbookDerivedGenerationEvidenceRow[] = [
  {
    id: "wb004-generation-wind-reviewed",
    sourceWorkbook: "Port generation model pattern",
    worksheetName: "Wind Generation",
    siteArea: "Wind turbine",
    meterReference: "GEN-001",
    generationKwh: 120000,
    exportKwh: 80000,
    creditAmount: null,
    mappingConfidence: "High",
    treatment: "Evidence-only",
    validationIssue: null
  },
  {
    id: "wb004-export-meter-reviewed",
    sourceWorkbook: "Port generation model pattern",
    worksheetName: "Export Meter",
    siteArea: "Export meter",
    meterReference: "EXP-001",
    generationKwh: null,
    exportKwh: 45000,
    creditAmount: null,
    mappingConfidence: "High",
    treatment: "Evidence-only",
    validationIssue: null
  },
  {
    id: "wb004-export-credit-review",
    sourceWorkbook: "Port generation model pattern",
    worksheetName: "Credits",
    siteArea: "Export credit",
    meterReference: "CR-001",
    generationKwh: null,
    exportKwh: 45000,
    creditAmount: 2500,
    mappingConfidence: "Medium",
    treatment: "Manual review required",
    validationIssue: "Export credit treatment is not approved for tariff recovery."
  },
  {
    id: "wb004-generation-unresolved",
    sourceWorkbook: "Port generation model pattern",
    worksheetName: "Summary",
    siteArea: "Unresolved generation",
    meterReference: "Unresolved",
    generationKwh: 15000,
    exportKwh: null,
    creditAmount: null,
    mappingConfidence: "Unresolved",
    treatment: "Excluded pending review",
    validationIssue: "Generation evidence cannot be mapped to a reviewed source."
  }
];

export const wb004GenerationExportScenarioExpected = {
  revenueRequirement: 30000,
  calculationAnnualKwh: 600000,
  evidenceGenerationKwh: 135000,
  evidenceExportKwh: 170000,
  evidenceCreditAmount: 2500,
  reviewIssueCount: 2,
  classResults: {
    "Reviewed import class": {
      fixedCost: 0,
      energyCost: 30000,
      demandCost: 0,
      passThroughCost: 0,
      totalAllocatedCost: 30000,
      fixedChargePerCustomer: 0,
      energyChargePerKwh: 0.05,
      demandChargePerKw: 0
    }
  }
};

export const wb003PortTenantScenarioDataInputRows: DataInputRow[] = [
  {
    id: "wb003-input-reviewed-port-aggregate",
    customerClass: "Reviewed port aggregate",
    customerCount: 10,
    annualKwh: 750000,
    peakDemandKw: 250,
    notes:
      "Reviewed aggregate input. Tenant-level recovery forecast evidence is held separately and does not create tariff classes."
  }
];

export const wb003PortTenantScenarioCostPoolRows: CostPoolRow[] = [
  {
    id: "wb003-cost-reviewed-port-network",
    name: "Reviewed port network cost",
    category: "Network services",
    annualAmount: 45000,
    recoverablePercent: 100,
    notes:
      "Approved recoverable network cost used to prove tenant recovery evidence remains separate from tariff inputs."
  }
];

export const wb003PortTenantScenarioAllocationRows: AllocationMethodRow[] = [
  {
    id: "wb003-allocation-reviewed-port-network",
    costPoolId: "wb003-cost-reviewed-port-network",
    costPoolName: "Reviewed port network cost",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [{ customerClass: "Reviewed port aggregate", percent: 100 }],
    notes:
      "Allocation uses reviewed aggregate consumption only; tenant forecasts are not converted into customer classes."
  }
];

export const wb003PortTenantRecoveryRows: WorkbookDerivedTenantRecoveryRow[] = [
  {
    id: "wb003-tenant-reviewed-forecast",
    sourceWorkbook: "Port tenant recovery model pattern",
    tenantName: "Reviewed tenant A",
    tariffModelRef: "POTL-HV-01",
    customerReference: "CUST-001",
    saNumber: "SA-001",
    voltage: "HV",
    forecastKwh: 300000,
    forecastRecoveryAmount: 18000,
    mappingConfidence: "High",
    treatment: "Evidence-only",
    validationIssue: null
  },
  {
    id: "wb003-tenant-reviewed-local-charge",
    sourceWorkbook: "Port tenant recovery model pattern",
    tenantName: "Reviewed tenant B",
    tariffModelRef: "POTL-LV-02",
    customerReference: "CUST-002",
    saNumber: "SA-002",
    voltage: "LV",
    forecastKwh: 220000,
    forecastRecoveryAmount: 13200,
    mappingConfidence: "High",
    treatment: "Evidence-only",
    validationIssue: null
  },
  {
    id: "wb003-tenant-missing-tariff-ref",
    sourceWorkbook: "Port tenant recovery model pattern",
    tenantName: "Tenant missing tariff model",
    tariffModelRef: "",
    customerReference: "CUST-003",
    saNumber: "SA-003",
    voltage: "LV",
    forecastKwh: 150000,
    forecastRecoveryAmount: 9000,
    mappingConfidence: "Medium",
    treatment: "Manual review required",
    validationIssue: "Tenant row is missing tariff model reference."
  },
  {
    id: "wb003-tenant-unresolved",
    sourceWorkbook: "Port tenant recovery model pattern",
    tenantName: "Unresolved tenant row",
    tariffModelRef: "",
    customerReference: "",
    saNumber: "",
    voltage: "Unknown",
    forecastKwh: 80000,
    forecastRecoveryAmount: 4800,
    mappingConfidence: "Unresolved",
    treatment: "Excluded pending review",
    validationIssue: "Tenant row cannot be mapped to a reviewed customer reference."
  }
];

export const wb003PortTenantScenarioExpected = {
  revenueRequirement: 45000,
  calculationAnnualKwh: 750000,
  evidenceForecastKwh: 750000,
  evidenceForecastRecoveryAmount: 45000,
  reviewIssueCount: 2,
  classResults: {
    "Reviewed port aggregate": {
      fixedCost: 0,
      energyCost: 45000,
      demandCost: 0,
      passThroughCost: 0,
      totalAllocatedCost: 45000,
      fixedChargePerCustomer: 0,
      energyChargePerKwh: 0.06,
      demandChargePerKw: 0
    }
  }
};

export const wb005AssetAllocationScenarioDataInputRows: DataInputRow[] = [
  {
    id: "wb005-input-hv-users",
    customerClass: "HV users",
    customerCount: 4,
    annualKwh: 500000,
    peakDemandKw: 600,
    notes:
      "Reviewed customer class used to allocate pre-set annual asset charge amounts."
  },
  {
    id: "wb005-input-lv-users",
    customerClass: "LV users",
    customerCount: 16,
    annualKwh: 300000,
    peakDemandKw: 200,
    notes:
      "Reviewed customer class used to allocate pre-set annual asset charge amounts."
  }
];

export const wb005AssetAllocationScenarioCostPoolRows: CostPoolRow[] = [
  {
    id: "wb005-cost-chargeable-hv-asset",
    name: "Chargeable HV distribution asset annual amount",
    category: "Asset recovery",
    annualAmount: 64000,
    recoverablePercent: 100,
    notes:
      "Pre-set annual amount for test-only coverage. Not calculated from asset value, life, WACC, CPI, age, depreciation, or annuity factors."
  }
];

export const wb005AssetAllocationScenarioAllocationRows: AllocationMethodRow[] = [
  {
    id: "wb005-allocation-chargeable-hv-asset",
    costPoolId: "wb005-cost-chargeable-hv-asset",
    costPoolName: "Chargeable HV distribution asset annual amount",
    basis: "Peak demand",
    tariffComponent: "Demand",
    classShares: [
      { customerClass: "HV users", percent: 75 },
      { customerClass: "LV users", percent: 25 }
    ],
    notes:
      "Asset annual amount is allocated by existing peak demand basis for test-only coverage."
  }
];

export const wb005AssetEvidenceRows: WorkbookDerivedAssetEvidenceRow[] = [
  {
    id: "wb005-asset-chargeable-hv-distribution",
    sourceWorkbook: "Airport and port asset model pattern",
    assetDescription: "HV distribution ring main",
    assetCategory: "Electrical distribution",
    voltage: "HV",
    localClass: "Network asset",
    isElectricalDistributionAsset: true,
    isChargeableOnElectricityTariff: true,
    annualChargeAmount: 64000,
    mappingConfidence: "High",
    treatment: "Calculation input",
    validationIssue: null
  },
  {
    id: "wb005-asset-lv-metering-review",
    sourceWorkbook: "Airport and port asset model pattern",
    assetDescription: "LV metering cabinet",
    assetCategory: "Metering",
    voltage: "LV",
    localClass: "Metering asset",
    isElectricalDistributionAsset: true,
    isChargeableOnElectricityTariff: true,
    annualChargeAmount: 8000,
    mappingConfidence: "Medium",
    treatment: "Manual review required",
    validationIssue:
      "Metering asset annual amount needs review before it can feed tariff recovery."
  },
  {
    id: "wb005-asset-non-electrical-building",
    sourceWorkbook: "Airport and port asset model pattern",
    assetDescription: "Substation building fabric",
    assetCategory: "Building",
    voltage: "N/A",
    localClass: "Civil asset",
    isElectricalDistributionAsset: false,
    isChargeableOnElectricityTariff: false,
    annualChargeAmount: 12000,
    mappingConfidence: "High",
    treatment: "Excluded pending review",
    validationIssue: "Non-electrical building asset is not approved for tariff recovery."
  },
  {
    id: "wb005-asset-shared-site-infrastructure",
    sourceWorkbook: "Airport and port asset model pattern",
    assetDescription: "Shared site infrastructure",
    assetCategory: "Shared infrastructure",
    voltage: "Mixed",
    localClass: "Shared use",
    isElectricalDistributionAsset: true,
    isChargeableOnElectricityTariff: false,
    annualChargeAmount: 15000,
    mappingConfidence: "Low",
    treatment: "Evidence-only",
    validationIssue: "Shared-use infrastructure treatment is not approved."
  },
  {
    id: "wb005-asset-unresolved-row",
    sourceWorkbook: "Airport and port asset model pattern",
    assetDescription: "Unresolved asset row",
    assetCategory: "Unknown",
    voltage: "Unknown",
    localClass: "Unknown",
    isElectricalDistributionAsset: false,
    isChargeableOnElectricityTariff: false,
    annualChargeAmount: null,
    mappingConfidence: "Unresolved",
    treatment: "Excluded pending review",
    validationIssue: "Asset row cannot be mapped to chargeability or voltage."
  }
];

export const wb005AssetAllocationScenarioExpected = {
  revenueRequirement: 64000,
  calculationAnnualAssetAmount: 64000,
  excludedOrReviewAnnualAssetAmount: 35000,
  reviewIssueCount: 4,
  classResults: {
    "HV users": {
      fixedCost: 0,
      energyCost: 0,
      demandCost: 48000,
      passThroughCost: 0,
      totalAllocatedCost: 48000,
      fixedChargePerCustomer: 0,
      energyChargePerKwh: 0,
      demandChargePerKw: 80
    },
    "LV users": {
      fixedCost: 0,
      energyCost: 0,
      demandCost: 16000,
      passThroughCost: 0,
      totalAllocatedCost: 16000,
      fixedChargePerCustomer: 0,
      energyChargePerKwh: 0,
      demandChargePerKw: 80
    }
  }
};
