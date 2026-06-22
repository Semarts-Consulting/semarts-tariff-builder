import type {
  AllocationMethodRow,
  CostPoolRow,
  DataInputRow,
  Project,
  ProjectAllocationMethods,
  ProjectCostPools,
  ProjectDataInputs,
  ProjectSection
} from "@/types/project";

export const demoProjectId = "demo-private-network";

export const sampleProjects: Project[] = [
  {
    id: demoProjectId,
    name: "Demo Private Network Tariff Review",
    networkName: "Semarts Embedded Electricity Network",
    tariffYear: 2026,
    effectiveDate: "2026-07-01",
    billingPeriod: "Monthly",
    customerClasses: ["Residential", "Small business", "Common area"],
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
