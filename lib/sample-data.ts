import type {
  AllocationMethodRow,
  CostPoolRow,
  DataInputRow,
  Project,
  ProjectAllocationMethods,
  ProjectCostPools,
  ProjectDataInputs,
  ProjectMethodologyInputs,
  ProjectSection
} from "@/types/project";

export const demoProjectId = "demo-private-network";

export const sampleProjects: Project[] = [
  {
    id: demoProjectId,
    name: "Demo Private Network Tariff Review",
    tariffModelName: "Demo Private Network Tariffs",
    networkName: "Semarts Embedded Electricity Network",
    utilityHubCustomerId: "utilityhub-customer-demo",
    utilityHubSiteId: "utilityhub-site-demo-private-network",
    tariffYear: 2026,
    referencePeriodStart: "2025-01-01",
    referencePeriodEnd: "2025-12-31",
    effectiveDate: "2026-07-01",
    billingPeriod: "Monthly",
    customerClasses: ["Residential", "Small business", "Common area"],
    inputReadinessStatus: "in-progress",
    status: "Draft",
    lastUpdated: "20 June 2026"
  }
];

const demoDataInputRows: DataInputRow[] = [
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

const demoCostPoolRows: CostPoolRow[] = [
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

const demoAllocationMethodRows: AllocationMethodRow[] = [
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
    notes: "Fixed network costs allocated by customer count.",
    requiresReview: false
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
    notes: "Consumption-related costs allocated by forecast annual kWh.",
    requiresReview: false
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
    notes: "Capacity costs allocated by peak demand kW.",
    requiresReview: false
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
    notes: "Pass-through charge allocated by annual kWh.",
    requiresReview: false
  }
];

const demoSettlementDate = "2026-04-01";
const demoMethodologyUpdatedAt = "22 June 2026";

function createDemoSubmeterConsumption(
  id: string,
  meter: string,
  consumptionValue: number,
  periodValue: number
) {
  return {
    id,
    meter,
    format: "Half-hourly" as const,
    periodStart: demoSettlementDate,
    periodEnd: demoSettlementDate,
    consumptionValue,
    unit: "kWh" as const,
    sourceType: "Demo HH import",
    sourceFileName: "demo-submeter-consumption.xlsx",
    uploadedAt: "2026-06-22T09:00:00.000Z",
    importBatchId: "demo-submeter-evidence",
    rowFingerprint: `${meter}|${demoSettlementDate}|${consumptionValue}`,
    validationStatus: "Validated" as const,
    settlementPeriodKwh: Array.from({ length: 48 }, () => periodValue)
  };
}

function cloneDataInputRows(): DataInputRow[] {
  return demoDataInputRows.map((row) => ({ ...row }));
}

function cloneCostPoolRows(): CostPoolRow[] {
  return demoCostPoolRows.map((row) => ({ ...row }));
}

function cloneAllocationMethodRows(): AllocationMethodRow[] {
  return demoAllocationMethodRows.map((row) => ({
    ...row,
    classShares: row.classShares.map((share) => ({ ...share }))
  }));
}

export function createDemoProjectDataInputs(): ProjectDataInputs {
  return {
    projectId: demoProjectId,
    rows: cloneDataInputRows(),
    assumptions:
      "Representative internal MVP scenario for a private electricity network tariff review.",
    lastUpdated: "22 June 2026"
  };
}

export function createDemoProjectCostPools(): ProjectCostPools {
  return {
    projectId: demoProjectId,
    rows: cloneCostPoolRows(),
    assumptions:
      "Recoverable network cost base used to demonstrate tariff build-up and reconciliation.",
    lastUpdated: "22 June 2026"
  };
}

export function createDemoProjectAllocationMethods(): ProjectAllocationMethods {
  return {
    projectId: demoProjectId,
    rows: cloneAllocationMethodRows(),
    assumptions:
      "Allocation bases mirror the representative MVP scenario and are accepted for internal demo use.",
    lastUpdated: "22 June 2026"
  };
}

export function createDemoProjectMethodologyInputs(): ProjectMethodologyInputs {
  return {
    projectId: demoProjectId,
    assumptions: {
      weightedAverageCostOfCapitalPercent: 0,
      cpiPercent: 0,
      annualRevenue: 0,
      annualUtilityRecoveries: 0,
      averageAssetAgeYears: 0,
      averageMeteringAssetAgeYears: 0,
      potllEhvLossPercent: 0,
      potllHvLossPercent: 0,
      potllLvLossPercent: 0,
      referenceYearStart: "",
      referenceYearEnd: "",
      tariffYearStart: "",
      tariffYearEnd: ""
    },
    directCosts: [],
    employeeCosts: [],
    indirectOverheads: [],
    supplyDetails: [],
    supplyCharges: {
      dayUnitRatePencePerKwh: 0,
      nightUnitRatePencePerKwh: 0,
      climateChangeLevyPencePerKwh: 0,
      duosFixedChargePerDay: 0,
      duosImportCapacityPencePerKvaPerDay: 0,
      duosSuperRedUnitPencePerKwh: 0,
      tnuosNonLocationalChargePerDay: 0,
      tnuosTriadChargePerKw: 0,
      procurementCost: 0,
      consultancyCost: 0,
      validationCost: 0,
      profitPercent: 0
    },
    tenants: [],
    assets: [],
    potllSupplies: [],
    halfHourlyImports: [
      {
        id: "demo-boundary-import",
        mpan: "1590000000001",
        date: demoSettlementDate,
        totalKwh: 120,
        settlementPeriodKwh: Array.from({ length: 48 }, () => 2.5),
        sourceFileName: "demo-boundary-import.csv",
        uploadedAt: "2026-06-22T09:00:00.000Z",
        importBatchId: "demo-submeter-evidence",
        rowFingerprint: "demo-boundary-import|2026-04-01|120"
      }
    ],
    siteSubmeters: [
      {
        id: "demo-submeter-residential",
        meter: "DEMO-MTR-RES",
        location: "Residential block / utility riser",
        responsibility: "Tenant",
        tenantName: "Residential tenants",
        notes: "Representative tenant submeter evidence.",
        sourceFileName: "demo-submeter-register.xlsx",
        uploadedAt: "2026-06-22T09:00:00.000Z",
        importBatchId: "demo-submeter-evidence",
        rowFingerprint: "DEMO-MTR-RES|Residential block / utility riser|Tenant|Residential tenants"
      },
      {
        id: "demo-submeter-small-business",
        meter: "DEMO-MTR-SB",
        location: "Retail parade / meter cupboard",
        responsibility: "Tenant",
        tenantName: "Small business tenants",
        notes: "Representative commercial occupier submeter evidence.",
        sourceFileName: "demo-submeter-register.xlsx",
        uploadedAt: "2026-06-22T09:00:00.000Z",
        importBatchId: "demo-submeter-evidence",
        rowFingerprint: "DEMO-MTR-SB|Retail parade / meter cupboard|Tenant|Small business tenants"
      },
      {
        id: "demo-submeter-common-area",
        meter: "DEMO-MTR-COMMON",
        location: "Landlord common services",
        responsibility: "Landlord",
        tenantName: "",
        notes: "Common-area evidence retained outside tariff denominators.",
        sourceFileName: "demo-submeter-register.xlsx",
        uploadedAt: "2026-06-22T09:00:00.000Z",
        importBatchId: "demo-submeter-evidence",
        rowFingerprint: "DEMO-MTR-COMMON|Landlord common services|Landlord|"
      },
      {
        id: "demo-submeter-network-operator",
        meter: "DEMO-MTR-NETOPS",
        location: "Network operator panel room",
        responsibility: "Network Operator",
        tenantName: "",
        notes: "Internal network operator evidence only.",
        sourceFileName: "demo-submeter-register.xlsx",
        uploadedAt: "2026-06-22T09:00:00.000Z",
        importBatchId: "demo-submeter-evidence",
        rowFingerprint: "DEMO-MTR-NETOPS|Network operator panel room|Network Operator|"
      }
    ],
    submeterConsumption: [
      createDemoSubmeterConsumption("demo-consumption-residential", "DEMO-MTR-RES", 48, 1),
      createDemoSubmeterConsumption("demo-consumption-small-business", "DEMO-MTR-SB", 36, 0.75),
      createDemoSubmeterConsumption("demo-consumption-common", "DEMO-MTR-COMMON", 24, 0.5),
      createDemoSubmeterConsumption("demo-consumption-network-operator", "DEMO-MTR-NETOPS", 12, 0.25)
    ],
    transmissionLossMultipliers: Array.from({ length: 48 }, (_, index) => ({
      id: `demo-tlm-${index + 1}`,
      settlementDate: demoSettlementDate,
      settlementPeriod: index + 1,
      transmissionLossMultiplier: 1.02,
      gspGroup: "",
      effectiveFromDate: demoSettlementDate,
      source: "Demo structured TLM evidence",
      retrievedAt: "2026-06-22T09:00:00.000Z",
      version: "demo-v1",
      importBatchId: "demo-submeter-evidence",
      rowFingerprint: `demo-tlm|${demoSettlementDate}|${index + 1}|1.02`
    })),
    notes:
      "Demo submeter, boundary import and TLM records are evidence-only and do not change tariff outputs.",
    lastUpdated: demoMethodologyUpdatedAt
  };
}

export const projectSections: ProjectSection[] = [
  {
    title: "Settings",
    description: "Project details, status, and lifecycle controls.",
    href: "settings"
  },
  {
    title: "Data inputs",
    description: "Customer counts, forecast kWh, demand values, and billing periods.",
    href: "data-inputs"
  },
  {
    title: "Cost inputs",
    description: "Recoverable operating, maintenance, asset, pass-through, and admin costs.",
    href: "cost-pools"
  },
  {
    title: "Allocation methods",
    description: "Rules for assigning cost pools across tariff classes and charge types.",
    href: "allocation-methods"
  },
  {
    title: "Tariff calculations",
    description: "Formula execution, indicative rates, and revenue reconciliation.",
    href: "tariff-calculations"
  },
  {
    title: "Reports",
    description: "Tariff schedule and methodology summary outputs.",
    href: "reports"
  }
];

export function getProject(projectId: string): Project {
  return sampleProjects.find((project) => project.id === projectId) ?? sampleProjects[0];
}
