import type {
  AllocationMethodRow,
  CostPoolRow,
  DataInputRow,
  Project,
  ProjectAllocationMethods,
  ProjectCostPools,
  ProjectDataInputs,
  ProjectMethodologyInputs,
  SiteSubmeterRecord,
  SupplyDetailsInput,
  SupplyReferenceData,
  SubmeterConsumptionRecord,
  TransmissionLossMultiplierInput,
  HalfHourlyImportRow
} from "@/types/project";

export type ReportReadinessScenario = {
  project: Project;
  dataInputs: ProjectDataInputs;
  costPools: ProjectCostPools;
  allocationMethods: ProjectAllocationMethods;
  methodologyInputs: Pick<
    ProjectMethodologyInputs,
    | "projectId"
    | "supplyDetails"
    | "siteSubmeters"
    | "submeterConsumption"
    | "transmissionLossMultipliers"
    | "halfHourlyImports"
  >;
  supplyReferenceData: SupplyReferenceData;
};

const lastUpdated = "2026-06-22T09:00:00.000Z";

function createProject(projectId: string, name: string): Project {
  return {
    id: projectId,
    name,
    networkName: "Semarts Test Network",
    tariffYear: 2026,
    effectiveDate: "2026-04-01",
    billingPeriod: "Annual",
    customerClasses: ["Residential", "Small business"],
    status: "Ready for review",
    lastUpdated
  };
}

const dataRows: DataInputRow[] = [
  {
    id: "input-residential",
    customerClass: "Residential",
    customerCount: 100,
    annualKwh: 200000,
    peakDemandKw: 500,
    notes: "Residential metered consumption"
  },
  {
    id: "input-small-business",
    customerClass: "Small business",
    customerCount: 20,
    annualKwh: 100000,
    peakDemandKw: 300,
    notes: "Small business metered consumption"
  }
];

const costRows: CostPoolRow[] = [
  {
    id: "cost-standing-network",
    name: "Network standing charge",
    category: "Network services",
    annualAmount: 10000,
    recoverablePercent: 100,
    notes: "Standing network cost"
  },
  {
    id: "cost-energy-network",
    name: "Energy balancing charge",
    category: "Operations",
    annualAmount: 5000,
    recoverablePercent: 50,
    notes: "Partially recoverable energy balancing cost"
  }
];

const readyAllocationRows: AllocationMethodRow[] = [
  {
    id: "allocation-standing-network",
    costPoolId: "cost-standing-network",
    costPoolName: "Network standing charge",
    basis: "Customer count",
    tariffComponent: "Fixed",
    classShares: [
      { customerClass: "Residential", percent: 70 },
      { customerClass: "Small business", percent: 30 }
    ],
    notes: "Allocated by customer count"
  },
  {
    id: "allocation-energy-network",
    costPoolId: "cost-energy-network",
    costPoolName: "Energy balancing charge",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [
      { customerClass: "Residential", percent: 60 },
      { customerClass: "Small business", percent: 40 }
    ],
    notes: "Allocated by annual consumption"
  }
];

const nonReadyAllocationRows: AllocationMethodRow[] = [
  {
    id: "allocation-standing-network-review",
    costPoolId: "cost-standing-network",
    costPoolName: "Network standing charge",
    basis: "Customer count",
    tariffComponent: "Fixed",
    classShares: [{ customerClass: "Residential", percent: 80 }],
    notes: "Default-created allocation still needs review",
    requiresReview: true
  },
  {
    id: "allocation-energy-network-missing-shares",
    costPoolId: "cost-energy-network",
    costPoolName: "Energy balancing charge",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [],
    notes: "Incomplete allocation for readiness testing"
  }
];

const emptySupplyReferenceData: SupplyReferenceData = {
  dnoNetworkAreas: [],
  dataSets: [],
  lastUpdated
};

const supplyEvidenceRows: SupplyDetailsInput[] = [
  {
    id: "supply-evidence-1",
    mpan: "1234567890123",
    supplyCapacityKva: 100,
    voltage: "LV",
    transmission: "Pass Through",
    distribution: "Fixed",
    tnuosNonLocationalChargePerDay: 0,
    tnuosTriadChargePerKw: 0,
    duosFixedChargePerDay: 40,
    duosImportCapacityPencePerKvaPerDay: 50,
    duosRedUnitPencePerKwh: 10,
    duosAmberUnitPencePerKwh: 5,
    duosGreenUnitPencePerKwh: 1,
    duosSuperRedUnitPencePerKwh: 25,
    supplyContractCharges: [
      {
        id: "supply-fixed-annual",
        chargeName: "Supplier standing charge",
        losses: "CM",
        chargeType: "Fixed",
        unitOfMeasurement: "per year",
        timeOfUse: "All times",
        customTimeOfUse: {
          daysOfWeek: [],
          appliesOnBankHolidays: false,
          months: [],
          startTime: "",
          endTime: ""
        },
        rateUnit: "\u00a3",
        rate: 1200
      },
      {
        id: "supply-consumption",
        chargeName: "Supplier unit charge",
        losses: "GSP",
        chargeType: "Consumption",
        unitOfMeasurement: "per kWh",
        timeOfUse: "All times",
        customTimeOfUse: {
          daysOfWeek: [],
          appliesOnBankHolidays: false,
          months: [],
          startTime: "",
          endTime: ""
        },
        rateUnit: "p",
        rate: 15
      }
    ]
  }
];

const submeterRows: SiteSubmeterRecord[] = [
  {
    id: "submeter-tenant",
    meter: "MTR-TENANT",
    location: "Terminal retail",
    responsibility: "Tenant",
    tenantName: "Retail tenant",
    notes: "",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: ""
  },
  {
    id: "submeter-plant-room",
    meter: "MTR-PLANT",
    location: "Plant room",
    responsibility: "Plant Room",
    tenantName: "",
    notes: "",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: ""
  }
];

const boundaryRows: HalfHourlyImportRow[] = [
  {
    id: "boundary-report",
    mpan: "1234567890123",
    date: "2026-04-01",
    totalKwh: 120,
    settlementPeriodKwh: Array.from({ length: 48 }, () => 2.5),
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: ""
  }
];

const submeterConsumptionRows: SubmeterConsumptionRecord[] = [
  {
    id: "submeter-hh-tenant",
    meter: "MTR-TENANT",
    format: "Half-hourly",
    periodStart: "2026-04-01",
    periodEnd: "2026-04-01",
    consumptionValue: 48,
    unit: "kWh",
    sourceType: "HH import",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: "",
    validationStatus: "Validated",
    settlementPeriodKwh: Array.from({ length: 48 }, () => 1)
  },
  {
    id: "submeter-monthly-plant",
    meter: "MTR-PLANT",
    format: "Monthly",
    periodStart: "2026-04-01",
    periodEnd: "2026-04-30",
    consumptionValue: 70,
    unit: "kWh",
    sourceType: "Manual",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: "",
    validationStatus: "Pending review"
  },
  {
    id: "submeter-unknown",
    meter: "UNKNOWN",
    format: "Monthly",
    periodStart: "2026-04-01",
    periodEnd: "2026-04-30",
    consumptionValue: 5,
    unit: "kWh",
    sourceType: "Manual",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: "",
    validationStatus: "Needs correction"
  }
];

const tlmRows: TransmissionLossMultiplierInput[] = Array.from({ length: 47 }, (_, index) => ({
  id: `tlm-report-${index + 1}`,
  settlementDate: "2026-04-01",
  settlementPeriod: index + 1,
  transmissionLossMultiplier: 1.02,
  gspGroup: "",
  effectiveFromDate: "2026-04-01",
  source: "Report fixture",
  retrievedAt: lastUpdated,
  version: "fixture",
  importBatchId: "",
  rowFingerprint: ""
}));

function createScenario(
  projectId: string,
  name: string,
  allocationRows: AllocationMethodRow[]
): ReportReadinessScenario {
  return {
    project: createProject(projectId, name),
    dataInputs: {
      projectId,
      rows: dataRows,
      assumptions: "Customer counts and consumption are imported from reviewed workbook inputs.",
      lastUpdated
    },
    costPools: {
      projectId,
      rows: costRows,
      assumptions: "Recoverable costs follow the approved tariff methodology.",
      lastUpdated
    },
    allocationMethods: {
      projectId,
      rows: allocationRows,
      assumptions: "Allocation bases follow the stakeholder-approved workbook model.",
      lastUpdated
    },
    methodologyInputs: {
      projectId,
      supplyDetails: projectId === "report-ready-project" ? supplyEvidenceRows : [],
      siteSubmeters: projectId === "report-ready-project" ? submeterRows : [],
      submeterConsumption:
        projectId === "report-ready-project" ? submeterConsumptionRows : [],
      transmissionLossMultipliers: projectId === "report-ready-project" ? tlmRows : [],
      halfHourlyImports: projectId === "report-ready-project" ? boundaryRows : []
    },
    supplyReferenceData: emptySupplyReferenceData
  };
}

export const readyReportScenario = createScenario(
  "report-ready-project",
  "Ready report project",
  readyAllocationRows
);

export const nonReadyReportScenario = createScenario(
  "report-non-ready-project",
  "Non-ready report project",
  nonReadyAllocationRows
);

export const reportReadinessScenarios = [readyReportScenario, nonReadyReportScenario];
