import type {
  AllocationMethodRow,
  CostPoolRow,
  DataInputRow,
  HalfHourlyImportRow,
  SiteSubmeterRecord,
  SubmeterConsumptionRecord,
  TransmissionLossMultiplierInput
} from "@/types/project";

const scenarioDate = "2026-04-01";
const uploadedAt = "2026-06-23T09:00:00.000Z";
const importBatchId = "private-network-e2e-fixture";

function createHalfHourlyConsumption(
  id: string,
  meter: string,
  consumptionValue: number,
  periodValue: number
): SubmeterConsumptionRecord {
  return {
    id,
    meter,
    format: "Half-hourly",
    periodStart: scenarioDate,
    periodEnd: scenarioDate,
    consumptionValue,
    unit: "kWh",
    sourceType: "Synthetic workbook-derived scenario",
    sourceFileName: "private-network-e2e-fixture.xlsx",
    uploadedAt,
    importBatchId,
    rowFingerprint: `${meter}|${scenarioDate}|${consumptionValue}`,
    validationStatus: "Validated",
    settlementPeriodKwh: Array.from({ length: 48 }, () => periodValue)
  };
}

export const privateNetworkProjectId = "private-network-e2e-scenario";

export const privateNetworkDataInputRows: DataInputRow[] = [
  {
    id: "input-retail-tenants",
    customerClass: "Retail Tenants",
    customerCount: 4,
    annualKwh: 200000,
    peakDemandKw: 80,
    notes: "Aggregate approved tariff input; not derived from submeter evidence in this scenario."
  },
  {
    id: "input-airport-operations",
    customerClass: "Airport Operations",
    customerCount: 1,
    annualKwh: 300000,
    peakDemandKw: 120,
    notes: "Aggregate approved tariff input for common and operational demand."
  },
  {
    id: "input-ev-charging",
    customerClass: "EV Charging",
    customerCount: 2,
    annualKwh: 100000,
    peakDemandKw: 70,
    notes: "Aggregate approved tariff input for EV assets."
  }
];

export const privateNetworkCostPoolRows: CostPoolRow[] = [
  {
    id: "cost-private-fixed",
    name: "Private network fixed operating cost",
    category: "Operations",
    annualAmount: 12000,
    recoverablePercent: 100,
    notes: "Recoverable fixed cost."
  },
  {
    id: "cost-private-energy",
    name: "Private network variable energy cost",
    category: "Network services",
    annualAmount: 24000,
    recoverablePercent: 100,
    notes: "Recoverable variable cost."
  },
  {
    id: "cost-private-capacity",
    name: "Private network capacity cost",
    category: "Asset recovery",
    annualAmount: 18000,
    recoverablePercent: 100,
    notes: "Recoverable capacity-led cost."
  },
  {
    id: "cost-private-pass-through",
    name: "Direct pass-through metering cost",
    category: "Other",
    annualAmount: 6000,
    recoverablePercent: 100,
    notes: "Recoverable pass-through charge."
  }
];

export const privateNetworkAllocationRows: AllocationMethodRow[] = [
  {
    id: "allocation-private-fixed",
    costPoolId: "cost-private-fixed",
    costPoolName: "Private network fixed operating cost",
    basis: "Manual",
    tariffComponent: "Fixed",
    classShares: [
      { customerClass: "Retail Tenants", percent: 50 },
      { customerClass: "Airport Operations", percent: 25 },
      { customerClass: "EV Charging", percent: 25 }
    ],
    notes: "Manual split for the representative scenario."
  },
  {
    id: "allocation-private-energy",
    costPoolId: "cost-private-energy",
    costPoolName: "Private network variable energy cost",
    basis: "Annual kWh",
    tariffComponent: "Energy",
    classShares: [
      { customerClass: "Retail Tenants", percent: 33.3333 },
      { customerClass: "Airport Operations", percent: 50 },
      { customerClass: "EV Charging", percent: 16.6667 }
    ],
    notes: "Energy-led split aligned to aggregate approved tariff inputs."
  },
  {
    id: "allocation-private-capacity",
    costPoolId: "cost-private-capacity",
    costPoolName: "Private network capacity cost",
    basis: "Peak demand",
    tariffComponent: "Demand",
    classShares: [
      { customerClass: "Retail Tenants", percent: 30 },
      { customerClass: "Airport Operations", percent: 45 },
      { customerClass: "EV Charging", percent: 25 }
    ],
    notes: "Capacity-led split aligned to aggregate approved tariff inputs."
  },
  {
    id: "allocation-private-pass-through",
    costPoolId: "cost-private-pass-through",
    costPoolName: "Direct pass-through metering cost",
    basis: "Manual",
    tariffComponent: "Pass-through",
    classShares: [
      { customerClass: "Retail Tenants", percent: 50 },
      { customerClass: "Airport Operations", percent: 30 },
      { customerClass: "EV Charging", percent: 20 }
    ],
    notes: "Representative direct pass-through split."
  }
];

export const privateNetworkBoundaryMeterRows: HalfHourlyImportRow[] = [
  {
    id: "boundary-private-network-main",
    mpan: "1590000000001",
    date: scenarioDate,
    totalKwh: 120,
    settlementPeriodKwh: Array.from({ length: 48 }, () => 2.5),
    sourceFileName: "boundary-private-network.csv",
    uploadedAt,
    importBatchId,
    rowFingerprint: "boundary-private-network-main|2026-04-01|120"
  }
];

export const privateNetworkSiteSubmeters: SiteSubmeterRecord[] = [
  {
    id: "submeter-retail-a",
    meter: "MTR-RETAIL-A",
    location: "Terminal / Retail unit A",
    responsibility: "Tenant",
    tenantName: "Retail Tenant A",
    notes: "Tenant trading unit.",
    sourceFileName: "submeter-register.xlsx",
    uploadedAt,
    importBatchId,
    rowFingerprint: "MTR-RETAIL-A|Terminal / Retail unit A|Tenant|Retail Tenant A"
  },
  {
    id: "submeter-plant-a",
    meter: "MTR-PLANT-A",
    location: "Energy centre / Plant room",
    responsibility: "Plant Room",
    tenantName: "",
    notes: "Plant room consumption retained as common-area evidence.",
    sourceFileName: "submeter-register.xlsx",
    uploadedAt,
    importBatchId,
    rowFingerprint: "MTR-PLANT-A|Energy centre / Plant room|Plant Room|"
  },
  {
    id: "submeter-landlord-a",
    meter: "MTR-LANDLORD-A",
    location: "Concourse / Landlord lighting",
    responsibility: "Landlord",
    tenantName: "",
    notes: "Landlord common-area meter.",
    sourceFileName: "submeter-register.xlsx",
    uploadedAt,
    importBatchId,
    rowFingerprint: "MTR-LANDLORD-A|Concourse / Landlord lighting|Landlord|"
  },
  {
    id: "submeter-network-ops-a",
    meter: "MTR-NETOPS-A",
    location: "Network operator room",
    responsibility: "Network Operator",
    tenantName: "",
    notes: "Network operator internal consumption.",
    sourceFileName: "submeter-register.xlsx",
    uploadedAt,
    importBatchId,
    rowFingerprint: "MTR-NETOPS-A|Network operator room|Network Operator|"
  }
];

export const privateNetworkValidConsumptionRows: SubmeterConsumptionRecord[] = [
  createHalfHourlyConsumption("consumption-retail-a", "MTR-RETAIL-A", 48, 1),
  createHalfHourlyConsumption("consumption-plant-a", "MTR-PLANT-A", 24, 0.5),
  createHalfHourlyConsumption("consumption-landlord-a", "MTR-LANDLORD-A", 36, 0.75),
  createHalfHourlyConsumption("consumption-network-ops-a", "MTR-NETOPS-A", 12, 0.25)
];

export const privateNetworkUnknownMeterConsumptionRow: SubmeterConsumptionRecord = {
  id: "consumption-unknown-meter",
  meter: "MTR-UNKNOWN-A",
  format: "Monthly",
  periodStart: "2026-04-01",
  periodEnd: "2026-04-30",
  consumptionValue: 5,
  unit: "kWh",
  sourceType: "Synthetic workbook-derived scenario",
  sourceFileName: "submeter-consumption.xlsx",
  uploadedAt,
  importBatchId,
  rowFingerprint: "MTR-UNKNOWN-A|2026-04|5",
  validationStatus: "Needs correction"
};

export const privateNetworkAllConsumptionRows: SubmeterConsumptionRecord[] = [
  ...privateNetworkValidConsumptionRows,
  privateNetworkUnknownMeterConsumptionRow
];

export const privateNetworkTransmissionLossMultipliers: TransmissionLossMultiplierInput[] =
  Array.from({ length: 48 }, (_, index) => ({
    id: `tlm-private-network-${index + 1}`,
    settlementDate: scenarioDate,
    settlementPeriod: index + 1,
    transmissionLossMultiplier: 1.02,
    gspGroup: "_A",
    effectiveFromDate: scenarioDate,
    source: "Synthetic Elexon TLM fixture",
    retrievedAt: uploadedAt,
    version: "fixture-v1",
    importBatchId,
    rowFingerprint: `2026-04-01|${index + 1}|_A|1.02`
  }));

export const privateNetworkExpected = {
  boundaryKwh: 120,
  validSubmeterKwh: 120,
  lossAdjustedKwh: 122.4,
  revenueRequirement: 60000,
  classTotals: {
    "Retail Tenants": 22399.992,
    "Airport Operations": 24900,
    "EV Charging": 12700.008
  }
};
