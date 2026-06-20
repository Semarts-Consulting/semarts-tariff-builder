import { sampleProjects } from "@/lib/sample-data";
import type {
  AllocationBasis,
  AllocationClassShare,
  AllocationMethodRow,
  CostPoolRow,
  DataInputRow,
  DirectCostInput,
  EmployeeCostInput,
  HalfHourlyImportRow,
  IndirectOverheadInput,
  LocalProjectBackup,
  ProjectMethodologyInputs,
  PotllSupplyInput,
  Project,
  ProjectAllocationMethods,
  ProjectCostPools,
  ProjectDataInputs,
  TenantInput,
  AssetInput
} from "@/types/project";

const storageKey = "semarts.projects";
const dataInputsStorageKey = "semarts.project-data-inputs";
const costPoolsStorageKey = "semarts.project-cost-pools";
const allocationMethodsStorageKey = "semarts.project-allocation-methods";
const methodologyInputsStorageKey = "semarts.project-methodology-inputs";

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseProjects(value: string | null): Project[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseProjectDataInputs(value: string | null): ProjectDataInputs[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseProjectCostPools(value: string | null): ProjectCostPools[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseProjectAllocationMethods(value: string | null): ProjectAllocationMethods[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseProjectMethodologyInputs(value: string | null): ProjectMethodologyInputs[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function normalizeProjectMethodologyInputs(
  inputs: ProjectMethodologyInputs
): ProjectMethodologyInputs {
  const defaults = createDefaultMethodologyInputs(inputs.projectId);
  const legacySupplyDetails = inputs.supplyDetails as
    | ProjectMethodologyInputs["supplyDetails"]
    | Omit<ProjectMethodologyInputs["supplyDetails"][number], "id">
    | undefined;
  const supplyDetails = Array.isArray(legacySupplyDetails)
    ? legacySupplyDetails.map((row) => ({
        ...createSupplyDetailsInput(),
        ...row,
        supplyContractCharges: (row.supplyContractCharges ?? []).map((charge) => {
          const legacyCharge = charge as typeof charge & { lossesApplied?: boolean };

          return {
            ...createSupplyContractChargeInput(),
            ...charge,
            losses:
              legacyCharge.losses ??
              (legacyCharge.lossesApplied ? "GSP" : "NBP"),
            chargeType: legacyCharge.chargeType ?? "Consumption",
            unitOfMeasurement: legacyCharge.unitOfMeasurement || "per kWh",
            rateUnit: legacyCharge.rateUnit ?? "p"
          };
        })
      }))
    : legacySupplyDetails
      ? [
          {
            ...createSupplyDetailsInput(),
            ...legacySupplyDetails,
            supplyContractCharges: []
          }
        ]
      : defaults.supplyDetails;

  return {
    ...defaults,
    ...inputs,
    assumptions: {
      ...defaults.assumptions,
      ...inputs.assumptions
    },
    supplyDetails,
    supplyCharges: {
      ...defaults.supplyCharges,
      ...inputs.supplyCharges
    }
  };
}

export function createProjectId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "project"}-${Date.now().toString(36)}`;
}

export function getStoredProjects() {
  if (!hasBrowserStorage()) {
    return [];
  }

  return parseProjects(window.localStorage.getItem(storageKey));
}

export function getProjects() {
  const storedProjects = getStoredProjects();
  const storedIds = new Set(storedProjects.map((project) => project.id));

  return [
    ...storedProjects,
    ...sampleProjects.filter((project) => !storedIds.has(project.id))
  ];
}

export function getProjectById(projectId: string) {
  return getProjects().find((project) => project.id === projectId) ?? sampleProjects[0];
}

export function saveProject(project: Project) {
  if (!hasBrowserStorage()) {
    return;
  }

  const projects = getStoredProjects();
  const nextProjects = [
    project,
    ...projects.filter((storedProject) => storedProject.id !== project.id)
  ];

  window.localStorage.setItem(storageKey, JSON.stringify(nextProjects));
}

export function reconcileProjectCustomerClasses(
  projectId: string,
  nextCustomerClasses: string[]
) {
  const existingDataInputs = getProjectDataInputs(projectId);
  const existingAllocationMethods = getProjectAllocationMethods(projectId);
  const existingRowsByClass = new Map(
    existingDataInputs.rows.map((row) => [row.customerClass, row])
  );
  const nextClassSet = new Set(nextCustomerClasses);
  const nextDataInputs: ProjectDataInputs = {
    ...existingDataInputs,
    rows: nextCustomerClasses.map(
      (customerClass) => existingRowsByClass.get(customerClass) ?? createDataInputRow(customerClass)
    ),
    lastUpdated: todayLabel()
  };
  const nextAllocationMethods: ProjectAllocationMethods = {
    ...existingAllocationMethods,
    rows: existingAllocationMethods.rows.map((row) => {
      const existingSharesByClass = new Map(
        row.classShares.map((share) => [share.customerClass, share.percent])
      );
      const classShares = nextCustomerClasses.map((customerClass) => ({
        customerClass,
        percent: existingSharesByClass.get(customerClass) ?? 0
      }));
      const remainingShareTotal = classShares.reduce((total, share) => total + share.percent, 0);

      return {
        ...row,
        basis: row.basis === "Manual" ? row.basis : "Manual",
        classShares:
          remainingShareTotal > 0 || classShares.length === 0
            ? classShares
            : equalShares(nextCustomerClasses),
        notes: row.classShares.some((share) => !nextClassSet.has(share.customerClass))
          ? `${row.notes ? `${row.notes} ` : ""}Customer classes reconciled.`
          : row.notes
      };
    }),
    lastUpdated: todayLabel()
  };

  saveProjectDataInputs(nextDataInputs);
  saveProjectAllocationMethods(nextAllocationMethods);

  return {
    dataInputs: nextDataInputs,
    allocationMethods: nextAllocationMethods
  };
}

export function deleteProject(projectId: string) {
  if (!hasBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(
    storageKey,
    JSON.stringify(getStoredProjects().filter((project) => project.id !== projectId))
  );
  window.localStorage.setItem(
    dataInputsStorageKey,
    JSON.stringify(getStoredDataInputs().filter((dataInputs) => dataInputs.projectId !== projectId))
  );
  window.localStorage.setItem(
    costPoolsStorageKey,
    JSON.stringify(getStoredCostPools().filter((costPools) => costPools.projectId !== projectId))
  );
  window.localStorage.setItem(
    allocationMethodsStorageKey,
    JSON.stringify(
      getStoredAllocationMethods().filter(
        (allocationMethods) => allocationMethods.projectId !== projectId
      )
    )
  );
  window.localStorage.setItem(
    methodologyInputsStorageKey,
    JSON.stringify(
      getStoredMethodologyInputs().filter(
        (methodologyInputs) => methodologyInputs.projectId !== projectId
      )
    )
  );
}

function createWorkbookRowId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDirectCostInput(): DirectCostInput {
  return {
    id: createWorkbookRowId("direct-cost"),
    description: "",
    costByType: "",
    annualValue: 0,
    comment: "",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: ""
  };
}

export function createEmployeeCostInput(): EmployeeCostInput {
  return {
    id: createWorkbookRowId("employee-cost"),
    role: "",
    roleType: "Manager",
    fte: 0,
    timePercent: 0,
    comment: "",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: ""
  };
}

export function createIndirectOverheadInput(): IndirectOverheadInput {
  return {
    id: createWorkbookRowId("overhead"),
    description: "",
    annualCost: 0,
    comment: "",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: ""
  };
}

export function createTenantInput(): TenantInput {
  return {
    id: createWorkbookRowId("tenant"),
    customerName: "",
    tariffModelRef: "",
    saNumber: "",
    customerReference: "",
    voltage: "LV",
    capacityKva: 0,
    tariffType: "LV",
    supplyIncluded: true,
    monthlyKwh: Array.from({ length: 12 }, () => 0)
  };
}

export function createAssetInput(): AssetInput {
  return {
    id: createWorkbookRowId("asset"),
    description: "",
    assetCategory: "",
    isElectricalDistributionAsset: true,
    isChargeableOnElectricityTariff: true,
    voltage: "LV",
    networkLevel: "",
    lifeYears: 0,
    priorYearAssetValue: 0,
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: ""
  };
}

export function createPotllSupplyInput(): PotllSupplyInput {
  return {
    id: createWorkbookRowId("potll-supply"),
    location: "",
    voltage: "LV",
    quarterKwh: Array.from({ length: 4 }, () => 0)
  };
}

export function createSupplyContractChargeInput(): ProjectMethodologyInputs["supplyDetails"][number]["supplyContractCharges"][number] {
  return {
    id: createWorkbookRowId("supply-contract-charge"),
    chargeName: "",
    losses: "NBP",
    chargeType: "Consumption",
    unitOfMeasurement: "per kWh",
    rateUnit: "p",
    rate: 0
  };
}

export function createSupplyDetailsInput(): ProjectMethodologyInputs["supplyDetails"][number] {
  return {
    id: createWorkbookRowId("supply"),
    mpan: "",
    supplyCapacityKva: 0,
    voltage: "HV",
    transmission: "Fixed",
    distribution: "Fixed",
    tnuosNonLocationalChargePerDay: 0,
    tnuosTriadChargePerKw: 0,
    duosFixedChargePerDay: 0,
    duosImportCapacityPencePerKvaPerDay: 0,
    duosRedUnitPencePerKwh: 0,
    duosAmberUnitPencePerKwh: 0,
    duosGreenUnitPencePerKwh: 0,
    duosSuperRedUnitPencePerKwh: 0,
    supplyContractCharges: []
  };
}

export function createHalfHourlyImportRow(): HalfHourlyImportRow {
  return {
    id: createWorkbookRowId("hh-import"),
    mpan: "",
    date: "",
    totalKwh: 0,
    settlementPeriodKwh: Array.from({ length: 48 }, () => 0),
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: ""
  };
}

export function createDefaultMethodologyInputs(projectId: string): ProjectMethodologyInputs {
  return {
    projectId,
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
    halfHourlyImports: [],
    notes: "",
    lastUpdated: todayLabel()
  };
}

export function getStoredMethodologyInputs() {
  if (!hasBrowserStorage()) {
    return [];
  }

  return parseProjectMethodologyInputs(
    window.localStorage.getItem(methodologyInputsStorageKey)
  ).map(normalizeProjectMethodologyInputs);
}

export function getProjectMethodologyInputs(projectId: string) {
  return (
    getStoredMethodologyInputs().find((inputs) => inputs.projectId === projectId) ??
    createDefaultMethodologyInputs(projectId)
  );
}

export function saveProjectMethodologyInputs(methodologyInputs: ProjectMethodologyInputs) {
  if (!hasBrowserStorage()) {
    return;
  }

  const storedMethodologyInputs = getStoredMethodologyInputs();
  const nextMethodologyInputs = [
    {
      ...methodologyInputs,
      lastUpdated: todayLabel()
    },
    ...storedMethodologyInputs.filter(
      (storedInputs) => storedInputs.projectId !== methodologyInputs.projectId
    )
  ];

  window.localStorage.setItem(
    methodologyInputsStorageKey,
    JSON.stringify(nextMethodologyInputs)
  );
}

export function createDataInputRow(customerClass = ""): DataInputRow {
  return {
    id: `input-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    customerClass,
    customerCount: 0,
    annualKwh: 0,
    peakDemandKw: 0,
    notes: ""
  };
}

export function createDefaultDataInputs(project: Project): ProjectDataInputs {
  return {
    projectId: project.id,
    rows: project.customerClasses.map((customerClass) => createDataInputRow(customerClass)),
    assumptions: "",
    lastUpdated: todayLabel()
  };
}

export function getStoredDataInputs() {
  if (!hasBrowserStorage()) {
    return [];
  }

  return parseProjectDataInputs(window.localStorage.getItem(dataInputsStorageKey));
}

export function getProjectDataInputs(projectId: string) {
  const project = getProjectById(projectId);
  return (
    getStoredDataInputs().find((dataInputs) => dataInputs.projectId === projectId) ??
    createDefaultDataInputs(project)
  );
}

export function saveProjectDataInputs(dataInputs: ProjectDataInputs) {
  if (!hasBrowserStorage()) {
    return;
  }

  const storedDataInputs = getStoredDataInputs();
  const nextDataInputs = [
    {
      ...dataInputs,
      lastUpdated: todayLabel()
    },
    ...storedDataInputs.filter((storedInput) => storedInput.projectId !== dataInputs.projectId)
  ];

  window.localStorage.setItem(dataInputsStorageKey, JSON.stringify(nextDataInputs));
}

export function createCostPoolRow(
  name = "",
  category: CostPoolRow["category"] = "Operations"
): CostPoolRow {
  return {
    id: `cost-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    category,
    annualAmount: 0,
    recoverablePercent: 100,
    notes: ""
  };
}

export function createDefaultCostPools(projectId: string): ProjectCostPools {
  return {
    projectId,
    rows: [
      createCostPoolRow("Operations and maintenance", "Operations"),
      createCostPoolRow("Network service charges", "Network services"),
      createCostPoolRow("Administration costs", "Administration"),
      createCostPoolRow("Depreciation and asset allowance", "Asset recovery"),
      createCostPoolRow("Taxes and statutory levies", "Taxes and levies")
    ],
    assumptions: "",
    lastUpdated: todayLabel()
  };
}

export function getStoredCostPools() {
  if (!hasBrowserStorage()) {
    return [];
  }

  return parseProjectCostPools(window.localStorage.getItem(costPoolsStorageKey));
}

export function getProjectCostPools(projectId: string) {
  return (
    getStoredCostPools().find((costPools) => costPools.projectId === projectId) ??
    createDefaultCostPools(projectId)
  );
}

export function saveProjectCostPools(costPools: ProjectCostPools) {
  if (!hasBrowserStorage()) {
    return;
  }

  const storedCostPools = getStoredCostPools();
  const nextCostPools = [
    {
      ...costPools,
      lastUpdated: todayLabel()
    },
    ...storedCostPools.filter((storedCostPoolsItem) => storedCostPoolsItem.projectId !== costPools.projectId)
  ];

  window.localStorage.setItem(costPoolsStorageKey, JSON.stringify(nextCostPools));
}

function getCustomerClasses(projectId: string) {
  const project = getProjectById(projectId);
  const inputClasses = getProjectDataInputs(projectId).rows
    .map((row) => row.customerClass.trim())
    .filter(Boolean);

  return inputClasses.length > 0 ? inputClasses : project.customerClasses;
}

function equalShares(customerClasses: string[]): AllocationClassShare[] {
  if (customerClasses.length === 0) {
    return [];
  }

  const basePercent = Math.floor((100 / customerClasses.length) * 100) / 100;
  let assignedPercent = 0;

  return customerClasses.map((customerClass, index) => {
    const percent =
      index === customerClasses.length - 1 ? Number((100 - assignedPercent).toFixed(2)) : basePercent;
    assignedPercent += percent;
    return { customerClass, percent };
  });
}

export function calculateAllocationShares(
  projectId: string,
  basis: AllocationBasis
): AllocationClassShare[] {
  const dataInputRows = getProjectDataInputs(projectId).rows.filter((row) =>
    row.customerClass.trim()
  );
  const customerClasses = getCustomerClasses(projectId);

  if (basis === "Equal share" || basis === "Manual" || dataInputRows.length === 0) {
    return equalShares(customerClasses);
  }

  const fieldByBasis = {
    "Customer count": "customerCount",
    "Annual kWh": "annualKwh",
    "Peak demand": "peakDemandKw"
  } as const;
  const field = fieldByBasis[basis];
  const total = dataInputRows.reduce((sum, row) => sum + row[field], 0);

  if (total <= 0) {
    return equalShares(customerClasses);
  }

  let assignedPercent = 0;
  return dataInputRows.map((row, index) => {
    const percent =
      index === dataInputRows.length - 1
        ? Number((100 - assignedPercent).toFixed(2))
        : Number(((row[field] / total) * 100).toFixed(2));
    assignedPercent += percent;
    return { customerClass: row.customerClass, percent };
  });
}

export function createAllocationMethodRow(
  projectId: string,
  costPool: CostPoolRow
): AllocationMethodRow {
  return {
    id: `allocation-${costPool.id}`,
    costPoolId: costPool.id,
    costPoolName: costPool.name,
    basis: "Customer count",
    tariffComponent: "Fixed",
    classShares: calculateAllocationShares(projectId, "Customer count"),
    notes: ""
  };
}

export function createDefaultAllocationMethods(projectId: string): ProjectAllocationMethods {
  const costPools = getProjectCostPools(projectId);

  return {
    projectId,
    rows: costPools.rows.map((costPool) => createAllocationMethodRow(projectId, costPool)),
    assumptions: "",
    lastUpdated: todayLabel()
  };
}

export function getStoredAllocationMethods() {
  if (!hasBrowserStorage()) {
    return [];
  }

  return parseProjectAllocationMethods(
    window.localStorage.getItem(allocationMethodsStorageKey)
  );
}

export function getProjectAllocationMethods(projectId: string) {
  return (
    getStoredAllocationMethods().find(
      (allocationMethods) => allocationMethods.projectId === projectId
    ) ?? createDefaultAllocationMethods(projectId)
  );
}

export function saveProjectAllocationMethods(allocationMethods: ProjectAllocationMethods) {
  if (!hasBrowserStorage()) {
    return;
  }

  const storedAllocationMethods = getStoredAllocationMethods();
  const nextAllocationMethods = [
    {
      ...allocationMethods,
      lastUpdated: todayLabel()
    },
    ...storedAllocationMethods.filter(
      (storedAllocationMethod) => storedAllocationMethod.projectId !== allocationMethods.projectId
    )
  ];

  window.localStorage.setItem(
    allocationMethodsStorageKey,
    JSON.stringify(nextAllocationMethods)
  );
}

export function exportLocalProjectBackup(): LocalProjectBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: getStoredProjects(),
    dataInputs: getStoredDataInputs(),
    costPools: getStoredCostPools(),
    allocationMethods: getStoredAllocationMethods(),
    methodologyInputs: getStoredMethodologyInputs()
  };
}

export function importLocalProjectBackup(backup: LocalProjectBackup) {
  if (!hasBrowserStorage()) {
    return;
  }

  if (
    backup.version !== 1 ||
    !Array.isArray(backup.projects) ||
    !Array.isArray(backup.dataInputs) ||
    !Array.isArray(backup.costPools) ||
    !Array.isArray(backup.allocationMethods)
  ) {
    throw new Error("The selected file is not a valid Semarts project backup.");
  }

  window.localStorage.setItem(storageKey, JSON.stringify(backup.projects));
  window.localStorage.setItem(dataInputsStorageKey, JSON.stringify(backup.dataInputs));
  window.localStorage.setItem(costPoolsStorageKey, JSON.stringify(backup.costPools));
  window.localStorage.setItem(
    allocationMethodsStorageKey,
    JSON.stringify(backup.allocationMethods)
  );
  window.localStorage.setItem(
    methodologyInputsStorageKey,
    JSON.stringify(backup.methodologyInputs ?? [])
  );
}
