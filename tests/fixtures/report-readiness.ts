import type {
  AllocationMethodRow,
  CostPoolRow,
  DataInputRow,
  Project,
  ProjectAllocationMethods,
  ProjectCostPools,
  ProjectDataInputs,
  ProjectMethodologyInputs,
  SupplyReferenceData
} from "@/types/project";

export type ReportReadinessScenario = {
  project: Project;
  dataInputs: ProjectDataInputs;
  costPools: ProjectCostPools;
  allocationMethods: ProjectAllocationMethods;
  methodologyInputs: Pick<ProjectMethodologyInputs, "projectId" | "supplyDetails">;
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
      supplyDetails: []
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
