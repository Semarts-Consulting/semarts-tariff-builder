"use client";

import { ChangeEvent, Fragment, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { readSheet } from "read-excel-file/browser";
import writeXlsxFile from "write-excel-file/browser";
import type { SheetData } from "write-excel-file/browser";
import { isProjectArchived } from "@/lib/project-state";
import {
  createAssetInput,
  createDefaultMethodologyInputs,
  createDirectCostInput,
  createEmployeeCostInput,
  createIndirectOverheadInput,
  createPotllSupplyInput,
  createSupplyContractChargeInput,
  createSupplyDetailsInput,
  createTenantInput,
  getDnoNetworkAreaForMpan,
  getProjectById,
  getProjectMethodologyInputs,
  getSupplyReferenceData,
  saveProjectMethodologyInputs
} from "@/lib/project-storage";
import {
  clearAssetDataFromSupabase,
  clearBoundaryMeterDataFromSupabase,
  clearDirectCostDataFromSupabase,
  clearEmployeeCostDataFromSupabase,
  clearIndirectOverheadDataFromSupabase,
  clearSupplyDetailsFromSupabase,
  deleteAssetBatchFromSupabase,
  deleteBoundaryMeterBatchFromSupabase,
  deleteDirectCostBatchFromSupabase,
  deleteEmployeeCostBatchFromSupabase,
  deleteIndirectOverheadBatchFromSupabase,
  loadAssetDataFromSupabase,
  loadBoundaryMeterDataFromSupabase,
  loadDirectCostDataFromSupabase,
  loadEmployeeCostDataFromSupabase,
  loadIndirectOverheadDataFromSupabase,
  loadSupplyReferenceDataFromSupabase,
  loadSupplyDetailsFromSupabase,
  saveAssetDataToSupabase,
  saveDirectCostDataToSupabase,
  saveEmployeeCostDataToSupabase,
  saveIndirectOverheadDataToSupabase,
  saveProjectToSupabase,
  saveSupplyDetailsToSupabase,
  saveBoundaryMeterDataToSupabase
} from "@/lib/supabase-sync";
import type {
  AssetInput,
  DirectCostInput,
  EmployeeCostInput,
  EmployeeRoleType,
  HalfHourlyImportRow,
  IndirectOverheadInput,
  PotllSupplyInput,
  ProjectMethodologyInputs,
  SupplyChargeBasis,
  SupplyContractChargeType,
  SupplyContractChargeInput,
  SupplyContractDayOfWeek,
  SupplyContractLosses,
  SupplyContractMonth,
  SupplyContractRateUnit,
  SupplyContractTimeOfUse,
  SupplyContractUnitOfMeasurement,
  SupplyDetailsInput,
  SupplyReferenceData,
  SupplyVoltage,
  TariffAssumptions,
  TenantInput,
  WorkbookVoltage
} from "@/types/project";

type WorkbookFormProps = {
  projectId: string;
};

export type CostInputSection =
  | "asset-data"
  | "direct-non-employee"
  | "direct-employee"
  | "indirect-overheads"
  | "transmission-distribution"
  | "supply-contract";

type AssumptionNumberField = keyof Pick<
  TariffAssumptions,
  | "weightedAverageCostOfCapitalPercent"
  | "cpiPercent"
  | "annualRevenue"
  | "annualUtilityRecoveries"
  | "averageAssetAgeYears"
  | "averageMeteringAssetAgeYears"
  | "potllEhvLossPercent"
  | "potllHvLossPercent"
  | "potllLvLossPercent"
>;

type AssumptionDateField = keyof Pick<
  TariffAssumptions,
  "referenceYearStart" | "referenceYearEnd" | "tariffYearStart" | "tariffYearEnd"
>;

type SupplyDetailsChargeField = keyof Pick<
  SupplyDetailsInput,
  | "tnuosNonLocationalChargePerDay"
  | "tnuosTriadChargePerKw"
  | "duosFixedChargePerDay"
  | "duosImportCapacityPencePerKvaPerDay"
  | "duosRedUnitPencePerKwh"
  | "duosAmberUnitPencePerKwh"
  | "duosGreenUnitPencePerKwh"
  | "duosSuperRedUnitPencePerKwh"
>;

const voltages: WorkbookVoltage[] = ["EHV", "HV", "LV MD", "LV"];
const supplyVoltages: SupplyVoltage[] = ["EHV", "HV", "LV"];
const supplyChargeBases: SupplyChargeBasis[] = ["Fixed", "Pass Through"];
const supplyContractLosses: SupplyContractLosses[] = ["CM", "GSP", "NBP"];
const supplyContractChargeTypes: SupplyContractChargeType[] = [
  "Consumption",
  "Fixed",
  "Capacity"
];
const supplyContractRateUnits: SupplyContractRateUnit[] = ["\u00a3", "p"];
const supplyContractTimeOfUseOptions: SupplyContractTimeOfUse[] = [
  "All times",
  "Red",
  "Amber",
  "Green",
  "Super Red",
  "Day",
  "Night",
  "Custom"
];
const supplyContractDaysOfWeek: SupplyContractDayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];
const supplyContractMonths: SupplyContractMonth[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
const defaultCustomTimeOfUse: SupplyContractChargeInput["customTimeOfUse"] = {
  daysOfWeek: [],
  appliesOnBankHolidays: false,
  months: [],
  startTime: "00:00",
  endTime: "23:30"
};
const supplyContractUnitsByChargeType: Record<
  SupplyContractChargeType,
  SupplyContractUnitOfMeasurement[]
> = {
  Consumption: ["per kWh", "per MWh"],
  Fixed: ["per day", "per Month", "per year"],
  Capacity: ["per kVA per day", "per kVA per Month"]
};
const assetVoltages: AssetInput["voltage"][] = ["EHV", "HV", "LV", "Metering"];
const assetNetworkLevels = ["EHV", "EHV Local", "HV", "HV Local", "LV", "Metering"] as const;
type AssetNetworkLevel = (typeof assetNetworkLevels)[number];
const assetNetworkLevelsByVoltage: Record<AssetInput["voltage"], AssetNetworkLevel[]> = {
  EHV: ["EHV", "EHV Local"],
  HV: ["HV", "HV Local"],
  LV: ["LV"],
  Metering: ["Metering"]
};
const potllSupplyVoltages: PotllSupplyInput["voltage"][] = ["EHV", "HV", "LV MD", "LV", "Losses"];
const roleTypes: EmployeeRoleType[] = [
  "Exco",
  "Director",
  "Head",
  "Senior Manager",
  "Manager",
  "Colleague"
];
const boundaryMeterHeaders = [
  "MPAN",
  "Date",
  "Total kWh",
  ...Array.from({ length: 48 }, (_, index) => String(index + 1))
];
const assetDataHeaders = [
  "Description",
  "Asset Category",
  "Electrical Distribution Asset?",
  "Chargeable on electricity tariff?",
  "HV / LV",
  "Network Level",
  "Life Years",
  "Asset Value"
];
const directCostHeaders = [
  "Description",
  "Cost by Type",
  "Annual Value"
];
const employeeCostHeaders = ["Role", "Role Type", "FTE", "% Time"];
const indirectOverheadHeaders = ["Description", "Annual Cost"];
const transmissionChargeFields: { field: SupplyDetailsChargeField; label: string }[] = [
  {
    field: "tnuosNonLocationalChargePerDay",
    label: "TNUoS non-locational charge per day"
  },
  {
    field: "tnuosTriadChargePerKw",
    label: "TNUoS triad charge per kW"
  }
];
const commonDistributionChargeFields: { field: SupplyDetailsChargeField; label: string }[] = [
  {
    field: "duosFixedChargePerDay",
    label: "DUoS fixed charge per day"
  },
  {
    field: "duosImportCapacityPencePerKvaPerDay",
    label: "DUoS import capacity pence per kVA per day"
  }
];
const lvHvDistributionChargeFields: { field: SupplyDetailsChargeField; label: string }[] = [
  {
    field: "duosRedUnitPencePerKwh",
    label: "DUoS red unit pence per kWh"
  },
  {
    field: "duosAmberUnitPencePerKwh",
    label: "DUoS amber unit pence per kWh"
  },
  {
    field: "duosGreenUnitPencePerKwh",
    label: "DUoS green unit pence per kWh"
  }
];
const ehvDistributionChargeFields: { field: SupplyDetailsChargeField; label: string }[] = [
  {
    field: "duosSuperRedUnitPencePerKwh",
    label: "DUoS super red unit pence per kWh"
  }
];

function toNumber(value: string) {
  return Number(value) || 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Unknown error";
}

function getAnnualTenantKwh(row: TenantInput) {
  return row.monthlyKwh.reduce((total, monthValue) => total + monthValue, 0);
}

function getQuarterTotal(row: PotllSupplyInput) {
  return row.quarterKwh.reduce((total, quarterValue) => total + quarterValue, 0);
}

function getDefaultSupplyContractUnit(chargeType: SupplyContractChargeType) {
  return supplyContractUnitsByChargeType[chargeType][0];
}

function normaliseHeader(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normaliseMpan(value: unknown) {
  return String(value ?? "").trim();
}

function excelSerialDateToIso(value: number) {
  const excelEpoch = Date.UTC(1899, 11, 30);
  const parsed = new Date(excelEpoch + value * 24 * 60 * 60 * 1000);

  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function normaliseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    return excelSerialDateToIso(value);
  }

  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return text;
}

function parseRequiredNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : null;
}

function createBoundaryMeterFingerprint(row: Pick<
  HalfHourlyImportRow,
  "mpan" | "date" | "totalKwh" | "settlementPeriodKwh"
>) {
  return [
    row.mpan,
    row.date,
    row.totalKwh,
    ...row.settlementPeriodKwh
  ].join("|");
}

function createBoundaryMeterKey(row: Pick<HalfHourlyImportRow, "mpan" | "date">) {
  return `${row.mpan}::${row.date}`;
}

function createImportBatchId() {
  return `hh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAssetImportBatchId() {
  return `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createImportedRowId(prefix: string, index: number) {
  return `${prefix}-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function validateBoundaryHeaders(headerRow: unknown[]) {
  return boundaryMeterHeaders.every(
    (header, index) => normaliseHeader(headerRow[index]) === normaliseHeader(header)
  );
}

function parseBoundaryMeterRows(
  rows: unknown[][],
  sourceFileName: string,
  uploadedAt: string,
  importBatchId: string
) {
  const parsedRows: HalfHourlyImportRow[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateBoundaryHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: [
        "The selected workbook does not match the template headers: MPAN, Date, Total kWh, 1 to 48."
      ]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const excelRowNumber = index + 2;
    const hasValues = row.some((value) => String(value ?? "").trim() !== "");

    if (!hasValues) {
      return;
    }

    const mpan = normaliseMpan(row[0]);
    const date = normaliseDate(row[1]);
    const totalKwh = parseRequiredNumber(row[2]);
    const settlementPeriodKwh = row.slice(3, 51).map(parseRequiredNumber);

    if (!mpan) {
      errors.push(`Row ${excelRowNumber}: MPAN is required.`);
    }

    if (!date) {
      errors.push(`Row ${excelRowNumber}: Date is required.`);
    }

    if (totalKwh === null) {
      errors.push(`Row ${excelRowNumber}: Total kWh must be numeric.`);
    }

    if (settlementPeriodKwh.length !== 48 || settlementPeriodKwh.some((value) => value === null)) {
      errors.push(`Row ${excelRowNumber}: settlement periods 1 to 48 must all be numeric.`);
    }

    if (!mpan || !date || totalKwh === null || settlementPeriodKwh.some((value) => value === null)) {
      return;
    }

    const numericSettlementPeriods = settlementPeriodKwh.map((value) => value ?? 0);
    const baseRow = {
      mpan,
      date,
      totalKwh,
      settlementPeriodKwh: numericSettlementPeriods
    };

    parsedRows.push({
      id: `${importBatchId}-${parsedRows.length + 1}`,
      ...baseRow,
      sourceFileName,
      uploadedAt,
      importBatchId,
      rowFingerprint: createBoundaryMeterFingerprint(baseRow)
    });
  });

  return { parsedRows, errors };
}

function mergeBoundaryMeterRows(existingRows: HalfHourlyImportRow[], incomingRows: HalfHourlyImportRow[]) {
  const byKey = new Map(existingRows.map((row) => [createBoundaryMeterKey(row), row]));
  const seenIncomingFingerprints = new Set<string>();
  let added = 0;
  let replaced = 0;
  let skippedDuplicates = 0;

  incomingRows.forEach((row) => {
    const key = createBoundaryMeterKey(row);
    const existing = byKey.get(key);

    if (seenIncomingFingerprints.has(row.rowFingerprint)) {
      skippedDuplicates += 1;
      return;
    }

    seenIncomingFingerprints.add(row.rowFingerprint);

    if (existing?.rowFingerprint === row.rowFingerprint) {
      skippedDuplicates += 1;
      return;
    }

    if (existing) {
      replaced += 1;
    } else {
      added += 1;
    }

    byKey.set(key, row);
  });

  return {
    rows: Array.from(byKey.values()).sort((a, b) =>
      `${a.mpan}${a.date}`.localeCompare(`${b.mpan}${b.date}`)
    ),
    added,
    replaced,
    skippedDuplicates
  };
}

function getBoundaryMeterSummary(rows: HalfHourlyImportRow[]) {
  const dates = rows.map((row) => row.date).filter(Boolean).sort();
  const mpans = new Set(rows.map((row) => row.mpan).filter(Boolean));
  const rowKeys = new Set<string>();
  let duplicateKeys = 0;
  let actualPeriodCount = 0;
  let invalidPeriodValues = 0;
  let totalFromRows = 0;
  let totalFromHalfHours = 0;

  rows.forEach((row) => {
    const key = createBoundaryMeterKey(row);

    if (rowKeys.has(key)) {
      duplicateKeys += 1;
    }

    rowKeys.add(key);
    totalFromRows += row.totalKwh;

    row.settlementPeriodKwh.forEach((periodValue) => {
      if (Number.isFinite(periodValue)) {
        actualPeriodCount += 1;
        totalFromHalfHours += periodValue;
      } else {
        invalidPeriodValues += 1;
      }
    });

    if (row.settlementPeriodKwh.length < 48) {
      invalidPeriodValues += 48 - row.settlementPeriodKwh.length;
    }
  });

  const expectedPeriodCount = rows.length * 48;
  const variance = totalFromRows - totalFromHalfHours;

  return {
    rowCount: rows.length,
    mpanCount: mpans.size,
    firstDate: dates[0] ?? "",
    lastDate: dates[dates.length - 1] ?? "",
    expectedPeriodCount,
    actualPeriodCount,
    invalidPeriodValues,
    duplicateKeys,
    totalFromRows,
    totalFromHalfHours,
    variance,
    hasIssues:
      invalidPeriodValues > 0 ||
      duplicateKeys > 0 ||
      actualPeriodCount !== expectedPeriodCount ||
      Math.abs(variance) > 0.01
  };
}

function getBoundaryMeterRowReview(row: HalfHourlyImportRow) {
  const periodSum = row.settlementPeriodKwh.reduce(
    (total, periodValue) => total + (Number.isFinite(periodValue) ? periodValue : 0),
    0
  );
  const invalidPeriods =
    row.settlementPeriodKwh.filter((periodValue) => !Number.isFinite(periodValue)).length +
    Math.max(48 - row.settlementPeriodKwh.length, 0);
  const variance = row.totalKwh - periodSum;
  const status =
    invalidPeriods > 0
      ? "Invalid periods"
      : Math.abs(variance) > 0.01
        ? "Variance"
        : "Healthy";

  return {
    periodSum,
    invalidPeriods,
    variance,
    status
  };
}

function getBoundaryMeterUploadBatches(rows: HalfHourlyImportRow[]) {
  const batches = new Map<string, HalfHourlyImportRow[]>();

  rows.forEach((row) => {
    const key = row.importBatchId || "unknown";
    const currentRows = batches.get(key) ?? [];
    currentRows.push(row);
    batches.set(key, currentRows);
  });

  return Array.from(batches.entries())
    .map(([batchId, batchRows]) => {
      const summary = getBoundaryMeterSummary(batchRows);
      const latestRow = [...batchRows].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];

      return {
        batchId,
        rows: batchRows,
        fileName: latestRow?.sourceFileName || "Unknown file",
        uploadedAt: latestRow?.uploadedAt || "",
        ...summary
      };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

function validateAssetHeaders(headerRow: unknown[]) {
  return assetDataHeaders.every(
    (header, index) => normaliseHeader(headerRow[index]) === normaliseHeader(header)
  );
}

function parseYesNo(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase();

  if (["yes", "y", "true", "1"].includes(text)) {
    return true;
  }

  if (["no", "n", "false", "0"].includes(text)) {
    return false;
  }

  return null;
}

function parseAssetVoltage(value: unknown): AssetInput["voltage"] | null {
  const text = String(value ?? "").trim();

  if (text === "EHV" || text === "HV" || text === "LV" || text === "Metering") {
    return text;
  }

  return null;
}

function parseAssetNetworkLevel(value: unknown) {
  const text = String(value ?? "").trim();

  return assetNetworkLevels.includes(text as AssetNetworkLevel)
    ? text
    : null;
}

function getAssetNetworkLevelsForVoltage(voltage: string) {
  return assetNetworkLevelsByVoltage[voltage as AssetInput["voltage"]] ?? [];
}

function isValidAssetVoltageNetworkLevel(
  voltage: AssetInput["voltage"] | string,
  networkLevel: string
) {
  return getAssetNetworkLevelsForVoltage(voltage).includes(networkLevel as AssetNetworkLevel);
}

function createAssetKey(
  row: Pick<AssetInput, "description" | "assetCategory" | "voltage" | "networkLevel">
) {
  return [
    row.description,
    row.assetCategory,
    row.voltage,
    row.networkLevel
  ]
    .map((value) => String(value).trim().toLowerCase())
    .join("::");
}

function createAssetFingerprint(
  row: Pick<
    AssetInput,
    | "description"
    | "assetCategory"
    | "isElectricalDistributionAsset"
    | "isChargeableOnElectricityTariff"
    | "voltage"
    | "networkLevel"
    | "lifeYears"
    | "priorYearAssetValue"
  >
) {
  return [
    row.description,
    row.assetCategory,
    row.isElectricalDistributionAsset,
    row.isChargeableOnElectricityTariff,
    row.voltage,
    row.networkLevel,
    row.lifeYears,
    row.priorYearAssetValue
  ]
    .map((value) => String(value).trim().toLowerCase())
    .join("|");
}

function parseAssetRows(
  rows: unknown[][],
  sourceFileName: string,
  uploadedAt: string,
  importBatchId: string
) {
  const parsedRows: AssetInput[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateAssetHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: [
        "The selected workbook does not match the asset template headers."
      ]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const excelRowNumber = index + 2;
    const hasValues = row.some((value) => String(value ?? "").trim() !== "");

    if (!hasValues) {
      return;
    }

    const description = String(row[0] ?? "").trim();
    const assetCategory = String(row[1] ?? "").trim();
    const isElectricalDistributionAsset = parseYesNo(row[2]);
    const isChargeableOnElectricityTariff = parseYesNo(row[3]);
    const voltage = parseAssetVoltage(row[4]);
    const networkLevel = parseAssetNetworkLevel(row[5]);
    const lifeYears = parseRequiredNumber(row[6]);
    const priorYearAssetValue = parseRequiredNumber(row[7]);

    if (!description) {
      errors.push(`Row ${excelRowNumber}: Description is required.`);
    }

    if (!assetCategory) {
      errors.push(`Row ${excelRowNumber}: Asset Category is required.`);
    }

    if (isElectricalDistributionAsset === null) {
      errors.push(`Row ${excelRowNumber}: Electrical Distribution Asset must be Yes or No.`);
    }

    if (isChargeableOnElectricityTariff === null) {
      errors.push(`Row ${excelRowNumber}: Chargeable on electricity tariff must be Yes or No.`);
    }

    if (!voltage) {
      errors.push(`Row ${excelRowNumber}: HV / LV must be EHV, HV, LV, or Metering.`);
    }

    if (!networkLevel) {
      errors.push(
        `Row ${excelRowNumber}: Network Level must be EHV, EHV Local, HV, HV Local, LV, or Metering.`
      );
    }

    if (voltage && networkLevel && !isValidAssetVoltageNetworkLevel(voltage, networkLevel)) {
      errors.push(
        `Row ${excelRowNumber}: Network Level ${networkLevel} is not valid for Voltage ${voltage}.`
      );
    }

    if (lifeYears === null || lifeYears <= 0) {
      errors.push(`Row ${excelRowNumber}: Life Years must be greater than zero.`);
    }

    if (priorYearAssetValue === null || priorYearAssetValue < 0) {
      errors.push(`Row ${excelRowNumber}: Asset Value must be zero or greater.`);
    }

    if (
      !description ||
      !assetCategory ||
      isElectricalDistributionAsset === null ||
      isChargeableOnElectricityTariff === null ||
      !voltage ||
      !networkLevel ||
      !isValidAssetVoltageNetworkLevel(voltage, networkLevel) ||
      lifeYears === null ||
      lifeYears <= 0 ||
      priorYearAssetValue === null ||
      priorYearAssetValue < 0
    ) {
      return;
    }

    const baseRow = {
      description,
      assetCategory,
      isElectricalDistributionAsset,
      isChargeableOnElectricityTariff,
      voltage,
      networkLevel,
      lifeYears,
      priorYearAssetValue
    };

    parsedRows.push({
      id: createImportedRowId("asset-import", parsedRows.length + 1),
      ...baseRow,
      sourceFileName,
      uploadedAt,
      importBatchId,
      rowFingerprint: createAssetFingerprint(baseRow)
    });
  });

  return { parsedRows, errors };
}

function mergeAssetRows(existingRows: AssetInput[], incomingRows: AssetInput[]) {
  const byKey = new Map(existingRows.map((row) => [createAssetKey(row), row]));
  const seenIncomingFingerprints = new Set<string>();
  let added = 0;
  let replaced = 0;
  let skippedDuplicates = 0;

  incomingRows.forEach((row) => {
    const key = createAssetKey(row);
    const fingerprint = row.rowFingerprint || createAssetFingerprint(row);
    const existing = byKey.get(key);

    if (seenIncomingFingerprints.has(fingerprint)) {
      skippedDuplicates += 1;
      return;
    }

    seenIncomingFingerprints.add(fingerprint);

    if (existing && (existing.rowFingerprint || createAssetFingerprint(existing)) === fingerprint) {
      skippedDuplicates += 1;
      return;
    }

    if (existing) {
      replaced += 1;
    } else {
      added += 1;
    }

    byKey.set(key, row);
  });

  return {
    rows: Array.from(byKey.values()).sort((a, b) =>
      a.description.localeCompare(b.description)
    ),
    added,
    replaced,
    skippedDuplicates
  };
}

function getAssetRowReview(row: AssetInput) {
  const issues: string[] = [];

  if (!row.description.trim()) issues.push("Missing description");
  if (!row.assetCategory.trim()) issues.push("Missing category");
  if (row.lifeYears <= 0) issues.push("Invalid life");
  if (row.priorYearAssetValue < 0) issues.push("Invalid value");
  if (!assetNetworkLevels.includes(row.networkLevel as AssetNetworkLevel)) {
    issues.push("Invalid network level");
  } else if (!isValidAssetVoltageNetworkLevel(row.voltage, row.networkLevel)) {
    issues.push("Network level does not match voltage");
  }

  return {
    issues,
    status: issues.length > 0 ? "Needs review" : "Healthy"
  };
}

function getAssetSummary(rows: AssetInput[]) {
  const totalAssetValue = rows.reduce((total, row) => total + row.priorYearAssetValue, 0);
  const chargeableAssetValue = rows
    .filter((row) => row.isChargeableOnElectricityTariff)
    .reduce((total, row) => total + row.priorYearAssetValue, 0);
  const invalidRows = rows.filter((row) => getAssetRowReview(row).issues.length > 0).length;

  return {
    rowCount: rows.length,
    totalAssetValue,
    chargeableAssetValue,
    invalidRows,
    byVoltage: getAssetValueGroups(rows, "voltage"),
    byNetworkLevel: getAssetValueGroups(rows, "networkLevel"),
    uploadBatches: getAssetUploadBatches(rows)
  };
}

function getAssetValueGroups(rows: AssetInput[], groupField: "voltage" | "networkLevel") {
  const groups = new Map<
    string,
    { label: string; rowCount: number; totalValue: number; chargeableValue: number }
  >();

  rows.forEach((row) => {
    const label = String(row[groupField] || "Unassigned");
    const current = groups.get(label) ?? {
      label,
      rowCount: 0,
      totalValue: 0,
      chargeableValue: 0
    };

    groups.set(label, {
      ...current,
      rowCount: current.rowCount + 1,
      totalValue: current.totalValue + row.priorYearAssetValue,
      chargeableValue:
        current.chargeableValue +
        (row.isChargeableOnElectricityTariff ? row.priorYearAssetValue : 0)
    });
  });

  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function getAssetUploadBatches(rows: AssetInput[]) {
  const batches = new Map<string, AssetInput[]>();

  rows
    .filter((row) => row.importBatchId)
    .forEach((row) => {
      const currentRows = batches.get(row.importBatchId) ?? [];
      currentRows.push(row);
      batches.set(row.importBatchId, currentRows);
    });

  return Array.from(batches.entries())
    .map(([batchId, batchRows]) => {
      const latestRow = [...batchRows].sort((a, b) =>
        (b.uploadedAt || "").localeCompare(a.uploadedAt || "")
      )[0];

      return {
        batchId,
        rowCount: batchRows.length,
        fileName: latestRow?.sourceFileName || "Unknown file",
        uploadedAt: latestRow?.uploadedAt || "",
        totalAssetValue: batchRows.reduce((total, row) => total + row.priorYearAssetValue, 0)
      };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

function createDirectCostImportBatchId() {
  return `direct-cost-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function validateDirectCostHeaders(headerRow: unknown[]) {
  return directCostHeaders.every(
    (header, index) => normaliseHeader(headerRow[index]) === normaliseHeader(header)
  );
}

function createDirectCostKey(
  row: Pick<DirectCostInput, "description" | "costByType">
) {
  return [row.description, row.costByType]
    .map((value) => String(value).trim().toLowerCase())
    .join("::");
}

function createDirectCostFingerprint(
  row: Pick<
    DirectCostInput,
    "description" | "costByType" | "annualValue"
  >
) {
  return [row.description, row.costByType, row.annualValue]
    .map((value) => String(value).trim().toLowerCase())
    .join("|");
}

function parseDirectCostRows(
  rows: unknown[][],
  sourceFileName: string,
  uploadedAt: string,
  importBatchId: string
) {
  const parsedRows: DirectCostInput[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateDirectCostHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: ["The selected workbook does not match the direct cost template headers."]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const excelRowNumber = index + 2;
    const hasValues = row.some((value) => String(value ?? "").trim() !== "");

    if (!hasValues) {
      return;
    }

    const description = String(row[0] ?? "").trim();
    const costByType = String(row[1] ?? "").trim();
    const annualValue = parseRequiredNumber(row[2]);

    if (!description) errors.push(`Row ${excelRowNumber}: Description is required.`);
    if (!costByType) errors.push(`Row ${excelRowNumber}: Cost by Type is required.`);
    if (annualValue === null || annualValue < 0) {
      errors.push(`Row ${excelRowNumber}: Annual Value must be zero or greater.`);
    }

    if (!description || !costByType || annualValue === null || annualValue < 0) {
      return;
    }

    const baseRow = {
      description,
      costByType,
      annualValue
    };

    parsedRows.push({
      id: createImportedRowId("direct-cost-import", parsedRows.length + 1),
      ...baseRow,
      comment: "",
      sourceFileName,
      uploadedAt,
      importBatchId,
      rowFingerprint: createDirectCostFingerprint(baseRow)
    });
  });

  return { parsedRows, errors };
}

function mergeDirectCostRows(existingRows: DirectCostInput[], incomingRows: DirectCostInput[]) {
  const byKey = new Map(existingRows.map((row) => [createDirectCostKey(row), row]));
  const seenIncomingFingerprints = new Set<string>();
  let added = 0;
  let replaced = 0;
  let skippedDuplicates = 0;

  incomingRows.forEach((row) => {
    const key = createDirectCostKey(row);
    const fingerprint = row.rowFingerprint || createDirectCostFingerprint(row);
    const existing = byKey.get(key);

    if (seenIncomingFingerprints.has(fingerprint)) {
      skippedDuplicates += 1;
      return;
    }

    seenIncomingFingerprints.add(fingerprint);

    if (existing && (existing.rowFingerprint || createDirectCostFingerprint(existing)) === fingerprint) {
      skippedDuplicates += 1;
      return;
    }

    if (existing) {
      replaced += 1;
    } else {
      added += 1;
    }

    byKey.set(key, row);
  });

  return {
    rows: Array.from(byKey.values()).sort((a, b) => a.description.localeCompare(b.description)),
    added,
    replaced,
    skippedDuplicates
  };
}

function getDirectCostRowReview(row: DirectCostInput) {
  const issues: string[] = [];

  if (!row.description.trim()) issues.push("Missing description");
  if (!row.costByType.trim()) issues.push("Missing cost by type");
  if (row.annualValue < 0) issues.push("Invalid annual value");

  return {
    issues,
    status: issues.length > 0 ? "Needs review" : "Healthy"
  };
}

function getDirectCostSummary(rows: DirectCostInput[]) {
  const totalAnnualValue = rows.reduce((total, row) => total + row.annualValue, 0);
  const invalidRows = rows.filter((row) => getDirectCostRowReview(row).issues.length > 0).length;
  const costTypes = new Set(rows.map((row) => row.costByType).filter(Boolean));

  return {
    rowCount: rows.length,
    totalAnnualValue,
    invalidRows,
    costTypeCount: costTypes.size,
    uploadBatches: getDirectCostUploadBatches(rows)
  };
}

function getDirectCostUploadBatches(rows: DirectCostInput[]) {
  const batches = new Map<string, DirectCostInput[]>();

  rows
    .filter((row) => row.importBatchId)
    .forEach((row) => {
      const currentRows = batches.get(row.importBatchId) ?? [];
      currentRows.push(row);
      batches.set(row.importBatchId, currentRows);
    });

  return Array.from(batches.entries())
    .map(([batchId, batchRows]) => {
      const latestRow = [...batchRows].sort((a, b) =>
        (b.uploadedAt || "").localeCompare(a.uploadedAt || "")
      )[0];

      return {
        batchId,
        rowCount: batchRows.length,
        fileName: latestRow?.sourceFileName || "Unknown file",
        uploadedAt: latestRow?.uploadedAt || "",
        totalAnnualValue: batchRows.reduce((total, row) => total + row.annualValue, 0)
      };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

function createEmployeeCostImportBatchId() {
  return `employee-cost-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function validateEmployeeCostHeaders(headerRow: unknown[]) {
  return employeeCostHeaders.every(
    (header, index) => normaliseHeader(headerRow[index]) === normaliseHeader(header)
  );
}

function parseEmployeeRoleType(value: unknown): EmployeeRoleType | null {
  const text = String(value ?? "").trim();

  return roleTypes.includes(text as EmployeeRoleType) ? (text as EmployeeRoleType) : null;
}

function createEmployeeCostKey(row: Pick<EmployeeCostInput, "role" | "roleType">) {
  return [row.role, row.roleType]
    .map((value) => String(value).trim().toLowerCase())
    .join("::");
}

function createEmployeeCostFingerprint(
  row: Pick<EmployeeCostInput, "role" | "roleType" | "fte" | "timePercent">
) {
  return [row.role, row.roleType, row.fte, row.timePercent]
    .map((value) => String(value).trim().toLowerCase())
    .join("|");
}

function parseEmployeeCostRows(
  rows: unknown[][],
  sourceFileName: string,
  uploadedAt: string,
  importBatchId: string
) {
  const parsedRows: EmployeeCostInput[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateEmployeeCostHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: ["The selected workbook does not match the employee cost template headers."]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const excelRowNumber = index + 2;
    const hasValues = row.some((value) => String(value ?? "").trim() !== "");

    if (!hasValues) {
      return;
    }

    const role = String(row[0] ?? "").trim();
    const roleType = parseEmployeeRoleType(row[1]);
    const fte = parseRequiredNumber(row[2]);
    const timePercent = parseRequiredNumber(row[3]);

    if (!role) errors.push(`Row ${excelRowNumber}: Role is required.`);
    if (!roleType) {
      errors.push(`Row ${excelRowNumber}: Role Type must be ${roleTypes.join(", ")}.`);
    }
    if (fte === null || fte < 0) {
      errors.push(`Row ${excelRowNumber}: FTE must be zero or greater.`);
    }
    if (timePercent === null || timePercent < 0 || timePercent > 100) {
      errors.push(`Row ${excelRowNumber}: % Time must be between 0 and 100.`);
    }

    if (!role || !roleType || fte === null || fte < 0 || timePercent === null || timePercent < 0 || timePercent > 100) {
      return;
    }

    const baseRow = {
      role,
      roleType,
      fte,
      timePercent
    };

    parsedRows.push({
      id: createImportedRowId("employee-cost-import", parsedRows.length + 1),
      ...baseRow,
      comment: "",
      sourceFileName,
      uploadedAt,
      importBatchId,
      rowFingerprint: createEmployeeCostFingerprint(baseRow)
    });
  });

  return { parsedRows, errors };
}

function mergeEmployeeCostRows(existingRows: EmployeeCostInput[], incomingRows: EmployeeCostInput[]) {
  const byKey = new Map(existingRows.map((row) => [createEmployeeCostKey(row), row]));
  const seenIncomingFingerprints = new Set<string>();
  let added = 0;
  let replaced = 0;
  let skippedDuplicates = 0;

  incomingRows.forEach((row) => {
    const key = createEmployeeCostKey(row);
    const fingerprint = row.rowFingerprint || createEmployeeCostFingerprint(row);
    const existing = byKey.get(key);

    if (seenIncomingFingerprints.has(fingerprint)) {
      skippedDuplicates += 1;
      return;
    }

    seenIncomingFingerprints.add(fingerprint);

    if (existing && (existing.rowFingerprint || createEmployeeCostFingerprint(existing)) === fingerprint) {
      skippedDuplicates += 1;
      return;
    }

    if (existing) {
      replaced += 1;
    } else {
      added += 1;
    }

    byKey.set(key, row);
  });

  return {
    rows: Array.from(byKey.values()).sort((a, b) => a.role.localeCompare(b.role)),
    added,
    replaced,
    skippedDuplicates
  };
}

function getEmployeeCostRowReview(row: EmployeeCostInput) {
  const issues: string[] = [];

  if (!row.role.trim()) issues.push("Missing role");
  if (row.fte < 0) issues.push("Invalid FTE");
  if (row.timePercent < 0 || row.timePercent > 100) issues.push("Invalid % time");

  return {
    issues,
    status: issues.length > 0 ? "Needs review" : "Healthy"
  };
}

function getEmployeeCostSummary(rows: EmployeeCostInput[]) {
  const totalFte = rows.reduce((total, row) => total + row.fte, 0);
  const weightedFte = rows.reduce((total, row) => total + row.fte * (row.timePercent / 100), 0);
  const invalidRows = rows.filter((row) => getEmployeeCostRowReview(row).issues.length > 0).length;
  const roleTypeCount = new Set(rows.map((row) => row.roleType).filter(Boolean)).size;

  return {
    rowCount: rows.length,
    totalFte,
    weightedFte,
    roleTypeCount,
    invalidRows,
    uploadBatches: getEmployeeCostUploadBatches(rows)
  };
}

function getEmployeeCostUploadBatches(rows: EmployeeCostInput[]) {
  const batches = new Map<string, EmployeeCostInput[]>();

  rows
    .filter((row) => row.importBatchId)
    .forEach((row) => {
      const currentRows = batches.get(row.importBatchId) ?? [];
      currentRows.push(row);
      batches.set(row.importBatchId, currentRows);
    });

  return Array.from(batches.entries())
    .map(([batchId, batchRows]) => {
      const latestRow = [...batchRows].sort((a, b) =>
        (b.uploadedAt || "").localeCompare(a.uploadedAt || "")
      )[0];

      return {
        batchId,
        rowCount: batchRows.length,
        fileName: latestRow?.sourceFileName || "Unknown file",
        uploadedAt: latestRow?.uploadedAt || "",
        totalFte: batchRows.reduce((total, row) => total + row.fte, 0),
        weightedFte: batchRows.reduce(
          (total, row) => total + row.fte * (row.timePercent / 100),
          0
        )
      };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

function createIndirectOverheadImportBatchId() {
  return `indirect-overhead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function validateIndirectOverheadHeaders(headerRow: unknown[]) {
  return indirectOverheadHeaders.every(
    (header, index) => normaliseHeader(headerRow[index]) === normaliseHeader(header)
  );
}

function createIndirectOverheadKey(row: Pick<IndirectOverheadInput, "description">) {
  return row.description.trim().toLowerCase();
}

function createIndirectOverheadFingerprint(
  row: Pick<IndirectOverheadInput, "description" | "annualCost">
) {
  return [row.description, row.annualCost]
    .map((value) => String(value).trim().toLowerCase())
    .join("|");
}

function parseIndirectOverheadRows(
  rows: unknown[][],
  sourceFileName: string,
  uploadedAt: string,
  importBatchId: string
) {
  const parsedRows: IndirectOverheadInput[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateIndirectOverheadHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: ["The selected workbook does not match the indirect overhead template headers."]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const excelRowNumber = index + 2;
    const hasValues = row.some((value) => String(value ?? "").trim() !== "");

    if (!hasValues) {
      return;
    }

    const description = String(row[0] ?? "").trim();
    const annualCost = parseRequiredNumber(row[1]);

    if (!description) errors.push(`Row ${excelRowNumber}: Description is required.`);
    if (annualCost === null || annualCost < 0) {
      errors.push(`Row ${excelRowNumber}: Annual Cost must be zero or greater.`);
    }

    if (!description || annualCost === null || annualCost < 0) {
      return;
    }

    const baseRow = {
      description,
      annualCost
    };

    parsedRows.push({
      id: createImportedRowId("indirect-overhead-import", parsedRows.length + 1),
      ...baseRow,
      comment: "",
      sourceFileName,
      uploadedAt,
      importBatchId,
      rowFingerprint: createIndirectOverheadFingerprint(baseRow)
    });
  });

  return { parsedRows, errors };
}

function mergeIndirectOverheadRows(
  existingRows: IndirectOverheadInput[],
  incomingRows: IndirectOverheadInput[]
) {
  const byKey = new Map(existingRows.map((row) => [createIndirectOverheadKey(row), row]));
  const seenIncomingFingerprints = new Set<string>();
  let added = 0;
  let replaced = 0;
  let skippedDuplicates = 0;

  incomingRows.forEach((row) => {
    const key = createIndirectOverheadKey(row);
    const fingerprint = row.rowFingerprint || createIndirectOverheadFingerprint(row);
    const existing = byKey.get(key);

    if (seenIncomingFingerprints.has(fingerprint)) {
      skippedDuplicates += 1;
      return;
    }

    seenIncomingFingerprints.add(fingerprint);

    if (existing && (existing.rowFingerprint || createIndirectOverheadFingerprint(existing)) === fingerprint) {
      skippedDuplicates += 1;
      return;
    }

    if (existing) {
      replaced += 1;
    } else {
      added += 1;
    }

    byKey.set(key, row);
  });

  return {
    rows: Array.from(byKey.values()).sort((a, b) => a.description.localeCompare(b.description)),
    added,
    replaced,
    skippedDuplicates
  };
}

function getIndirectOverheadRowReview(row: IndirectOverheadInput) {
  const issues: string[] = [];

  if (!row.description.trim()) issues.push("Missing description");
  if (row.annualCost < 0) issues.push("Invalid annual cost");

  return {
    issues,
    status: issues.length > 0 ? "Needs review" : "Healthy"
  };
}

function getIndirectOverheadSummary(rows: IndirectOverheadInput[]) {
  const totalAnnualCost = rows.reduce((total, row) => total + row.annualCost, 0);
  const invalidRows = rows.filter((row) => getIndirectOverheadRowReview(row).issues.length > 0).length;

  return {
    rowCount: rows.length,
    totalAnnualCost,
    invalidRows,
    uploadBatches: getIndirectOverheadUploadBatches(rows)
  };
}

function getIndirectOverheadUploadBatches(rows: IndirectOverheadInput[]) {
  const batches = new Map<string, IndirectOverheadInput[]>();

  rows
    .filter((row) => row.importBatchId)
    .forEach((row) => {
      const currentRows = batches.get(row.importBatchId) ?? [];
      currentRows.push(row);
      batches.set(row.importBatchId, currentRows);
    });

  return Array.from(batches.entries())
    .map(([batchId, batchRows]) => {
      const latestRow = [...batchRows].sort((a, b) =>
        (b.uploadedAt || "").localeCompare(a.uploadedAt || "")
      )[0];

      return {
        batchId,
        rowCount: batchRows.length,
        fileName: latestRow?.sourceFileName || "Unknown file",
        uploadedAt: latestRow?.uploadedAt || "",
        totalAnnualCost: batchRows.reduce((total, row) => total + row.annualCost, 0)
      };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

function validateAssumptions(assumptions: TariffAssumptions) {
  const errors: string[] = [];

  if (
    assumptions.referenceYearStart &&
    assumptions.referenceYearEnd &&
    assumptions.referenceYearEnd < assumptions.referenceYearStart
  ) {
    errors.push("Reference year end must be after the start date.");
  }

  if (
    assumptions.tariffYearStart &&
    assumptions.tariffYearEnd &&
    assumptions.tariffYearEnd < assumptions.tariffYearStart
  ) {
    errors.push("Tariff year end must be after the start date.");
  }

  if (assumptions.weightedAverageCostOfCapitalPercent < 0) {
    errors.push("WACC cannot be negative.");
  }

  if (
    assumptions.potllEhvLossPercent < 0 ||
    assumptions.potllHvLossPercent < 0 ||
    assumptions.potllLvLossPercent < 0
  ) {
    errors.push("Network loss percentages cannot be negative.");
  }

  return errors;
}

function validateSupplyDetails(supplyDetails: SupplyDetailsInput[]) {
  const errors: string[] = [];

  supplyDetails.forEach((row, index) => {
    const mpan = row.mpan.trim();

    if (mpan && !/^\d{13}$/.test(mpan)) {
      errors.push(`Supply details row ${index + 1}: MPAN must be a 13 digit code.`);
    }

    if (row.supplyCapacityKva < 0) {
      errors.push(`Supply details row ${index + 1}: supply capacity cannot be negative.`);
    }

    const fieldsToValidate: { field: SupplyDetailsChargeField; label: string }[] = [];

    if (row.transmission === "Fixed") {
      fieldsToValidate.push(...transmissionChargeFields);
    }

    if (row.distribution === "Fixed") {
      fieldsToValidate.push(
        ...commonDistributionChargeFields,
        ...(row.voltage === "EHV"
          ? ehvDistributionChargeFields
          : lvHvDistributionChargeFields)
      );
    }

    fieldsToValidate.forEach(({ field, label }) => {
      if (row[field] < 0) {
        errors.push(`Supply details row ${index + 1}: ${label} cannot be negative.`);
      }
    });

    row.supplyContractCharges.forEach((charge, chargeIndex) => {
      if (charge.rate < 0) {
        errors.push(
          `Supply contract row ${index + 1}.${chargeIndex + 1}: rate cannot be negative.`
        );
      }

      if (
        !supplyContractUnitsByChargeType[charge.chargeType].includes(
          charge.unitOfMeasurement
        )
      ) {
        errors.push(
          `Supply contract row ${index + 1}.${chargeIndex + 1}: unit does not match charge type.`
        );
      }

      if (charge.timeOfUse === "Custom") {
        const customTimeOfUse = {
          ...defaultCustomTimeOfUse,
          ...charge.customTimeOfUse
        };

        if (customTimeOfUse.daysOfWeek.length === 0) {
          errors.push(
            `Supply contract row ${index + 1}.${chargeIndex + 1}: select at least one day of week.`
          );
        }

        if (customTimeOfUse.months.length === 0) {
          errors.push(
            `Supply contract row ${index + 1}.${chargeIndex + 1}: select at least one month.`
          );
        }

        if (!customTimeOfUse.startTime || !customTimeOfUse.endTime) {
          errors.push(
            `Supply contract row ${index + 1}.${chargeIndex + 1}: start and end time are required.`
          );
        }
      }
    });
  });

  return errors;
}

function useWorkbookMethodology(projectId: string) {
  const [methodologyInputs, setMethodologyInputs] = useState<ProjectMethodologyInputs>(
    () => createDefaultMethodologyInputs(projectId)
  );
  const [saveState, setSaveState] = useState("");
  const [isArchived, setIsArchived] = useState(false);

  useEffect(() => {
    setMethodologyInputs(getProjectMethodologyInputs(projectId));
    setIsArchived(isProjectArchived(projectId));
  }, [projectId]);

  function save(nextInputs: ProjectMethodologyInputs, message: string) {
    if (isArchived) {
      setSaveState("Archived projects are read-only. Restore the project in Settings to edit.");
      return;
    }

    saveProjectMethodologyInputs(nextInputs);
    setMethodologyInputs(getProjectMethodologyInputs(projectId));
    setSaveState(message);
  }

  return {
    methodologyInputs,
    setMethodologyInputs,
    saveState,
    isArchived,
    save
  };
}

export function WorkbookAssumptionsForm({ projectId }: WorkbookFormProps) {
  const { methodologyInputs, setMethodologyInputs, saveState, isArchived, save } =
    useWorkbookMethodology(projectId);
  const validationErrors = useMemo(
    () => (methodologyInputs ? validateAssumptions(methodologyInputs.assumptions) : []),
    [methodologyInputs]
  );

  function updateNumber(field: AssumptionNumberField, value: string) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      assumptions: {
        ...methodologyInputs.assumptions,
        [field]: toNumber(value)
      }
    });
  }

  function updateDate(field: AssumptionDateField, value: string) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      assumptions: {
        ...methodologyInputs.assumptions,
        [field]: value
      }
    });
  }

  function updateNotes(event: ChangeEvent<HTMLTextAreaElement>) {
    if (isArchived) return;
    setMethodologyInputs({ ...methodologyInputs, notes: event.target.value });
  }

  return (
    <section className="rounded-md border border-line bg-white p-6 shadow-sm">
      <div>
        <h2 className="font-semibold">Workbook methodology assumptions</h2>
        <p className="mt-1 text-sm text-ink/70">
          Source: Inputs and Selections A14:B29.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <NumberInput
          label="WACC %"
          value={methodologyInputs.assumptions.weightedAverageCostOfCapitalPercent}
          disabled={isArchived}
          onChange={(value) => updateNumber("weightedAverageCostOfCapitalPercent", value)}
        />
        <NumberInput
          label="CPI %"
          value={methodologyInputs.assumptions.cpiPercent}
          disabled={isArchived}
          onChange={(value) => updateNumber("cpiPercent", value)}
        />
        <NumberInput
          label="Annual revenue"
          value={methodologyInputs.assumptions.annualRevenue}
          disabled={isArchived}
          onChange={(value) => updateNumber("annualRevenue", value)}
        />
        <NumberInput
          label="Annual utility recoveries"
          value={methodologyInputs.assumptions.annualUtilityRecoveries}
          disabled={isArchived}
          onChange={(value) => updateNumber("annualUtilityRecoveries", value)}
        />
        <NumberInput
          label="Average asset age"
          value={methodologyInputs.assumptions.averageAssetAgeYears}
          disabled={isArchived}
          onChange={(value) => updateNumber("averageAssetAgeYears", value)}
        />
        <NumberInput
          label="Average metering asset age"
          value={methodologyInputs.assumptions.averageMeteringAssetAgeYears}
          disabled={isArchived}
          onChange={(value) => updateNumber("averageMeteringAssetAgeYears", value)}
        />
        <NumberInput
          label="POTLL EHV losses %"
          value={methodologyInputs.assumptions.potllEhvLossPercent}
          disabled={isArchived}
          onChange={(value) => updateNumber("potllEhvLossPercent", value)}
        />
        <NumberInput
          label="POTLL HV losses %"
          value={methodologyInputs.assumptions.potllHvLossPercent}
          disabled={isArchived}
          onChange={(value) => updateNumber("potllHvLossPercent", value)}
        />
        <NumberInput
          label="POTLL LV losses %"
          value={methodologyInputs.assumptions.potllLvLossPercent}
          disabled={isArchived}
          onChange={(value) => updateNumber("potllLvLossPercent", value)}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <DateInput
          label="Reference start"
          value={methodologyInputs.assumptions.referenceYearStart}
          disabled={isArchived}
          onChange={(value) => updateDate("referenceYearStart", value)}
        />
        <DateInput
          label="Reference end"
          value={methodologyInputs.assumptions.referenceYearEnd}
          disabled={isArchived}
          onChange={(value) => updateDate("referenceYearEnd", value)}
        />
        <DateInput
          label="Tariff start"
          value={methodologyInputs.assumptions.tariffYearStart}
          disabled={isArchived}
          onChange={(value) => updateDate("tariffYearStart", value)}
        />
        <DateInput
          label="Tariff end"
          value={methodologyInputs.assumptions.tariffYearEnd}
          disabled={isArchived}
          onChange={(value) => updateDate("tariffYearEnd", value)}
        />
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-medium">Methodology notes</span>
        <textarea
          value={methodologyInputs.notes}
          disabled={isArchived}
          rows={3}
          onChange={updateNotes}
          className="mt-2 w-full resize-y rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
        />
      </label>

      <SaveFooter
        disabled={isArchived || validationErrors.length > 0}
        saveState={saveState}
        validationErrors={validationErrors}
        onSave={() => save(methodologyInputs, "Workbook assumptions saved locally.")}
      />
    </section>
  );
}

export function WorkbookCustomerInputsForm({ projectId }: WorkbookFormProps) {
  const { methodologyInputs, setMethodologyInputs, saveState, isArchived, save } =
    useWorkbookMethodology(projectId);

  function updateTenant(rowId: string, updates: Partial<TenantInput>) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      tenants: methodologyInputs.tenants.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    });
  }

  function updateMonthlyKwh(row: TenantInput, index: number, value: string) {
    const monthlyKwh = row.monthlyKwh.map((monthValue, monthIndex) =>
      monthIndex === index ? toNumber(value) : monthValue
    );
    updateTenant(row.id, { monthlyKwh });
  }

  function updatePotllSupply(rowId: string, updates: Partial<PotllSupplyInput>) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      potllSupplies: methodologyInputs.potllSupplies.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    });
  }

  function updateQuarterKwh(row: PotllSupplyInput, index: number, value: string) {
    const quarterKwh = row.quarterKwh.map((quarterValue, quarterIndex) =>
      quarterIndex === index ? toNumber(value) : quarterValue
    );
    updatePotllSupply(row.id, { quarterKwh });
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Workbook tenant inputs</h2>
            <p className="mt-1 text-sm text-ink/70">Source: Tenant Data A12:Y199.</p>
          </div>
          <button
            type="button"
            disabled={isArchived}
            onClick={() =>
              setMethodologyInputs({
                ...methodologyInputs,
                tenants: [...methodologyInputs.tenants, createTenantInput()]
              })
            }
            className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
          >
            Add tenant
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Ref</th>
                <th className="px-4 py-3 font-semibold">Voltage</th>
                <th className="px-4 py-3 font-semibold">Capacity kVA</th>
                <th className="px-4 py-3 font-semibold">Tariff type</th>
                <th className="px-4 py-3 font-semibold">Supply</th>
                <th className="px-4 py-3 font-semibold">Monthly kWh</th>
                <th className="px-4 py-3 font-semibold">Annual kWh</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {methodologyInputs.tenants.map((row) => (
                <tr key={row.id} className="border-t border-line align-top">
                  <td className="px-4 py-3">
                    <input
                      value={row.customerName}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateTenant(row.id, { customerName: event.target.value })
                      }
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={row.tariffModelRef}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateTenant(row.id, { tariffModelRef: event.target.value })
                      }
                      className="w-24 rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <VoltageSelect
                      value={row.voltage}
                      disabled={isArchived}
                      onChange={(value) => updateTenant(row.id, { voltage: value })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={row.capacityKva}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateTenant(row.id, { capacityKva: toNumber(event.target.value) })
                      }
                      className="w-28 rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <VoltageSelect
                      value={row.tariffType}
                      disabled={isArchived}
                      onChange={(value) => updateTenant(row.id, { tariffType: value })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={row.supplyIncluded}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateTenant(row.id, { supplyIncluded: event.target.checked })
                      }
                      className="h-5 w-5"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="grid grid-cols-4 gap-2">
                      {row.monthlyKwh.map((monthValue, index) => (
                        <input
                          key={`${row.id}-month-${index}`}
                          type="number"
                          value={monthValue}
                          disabled={isArchived}
                          onChange={(event) => updateMonthlyKwh(row, index, event.target.value)}
                          className="w-20 rounded-md border border-line px-2 py-1 outline-none focus:border-semarts"
                          aria-label={`Month ${index + 1} kWh`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatNumber(getAnnualTenantKwh(row))}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isArchived}
                      onClick={() =>
                        setMethodologyInputs({
                          ...methodologyInputs,
                          tenants: methodologyInputs.tenants.filter(
                            (tenant) => tenant.id !== row.id
                          )
                        })
                      }
                      className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">POTLL own-use supplies</h2>
            <p className="mt-1 text-sm text-ink/70">Source: POTLL Supplies A12:G43.</p>
          </div>
          <button
            type="button"
            disabled={isArchived}
            onClick={() =>
              setMethodologyInputs({
                ...methodologyInputs,
                potllSupplies: [
                  ...methodologyInputs.potllSupplies,
                  createPotllSupplyInput()
                ]
              })
            }
            className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
          >
            Add supply
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Voltage</th>
                <th className="px-4 py-3 font-semibold">Quarterly kWh</th>
                <th className="px-4 py-3 font-semibold">Annual kWh</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {methodologyInputs.potllSupplies.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <input
                      value={row.location}
                      disabled={isArchived}
                      onChange={(event) =>
                        updatePotllSupply(row.id, { location: event.target.value })
                      }
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.voltage}
                      disabled={isArchived}
                      onChange={(event) =>
                        updatePotllSupply(row.id, {
                          voltage: event.target.value as PotllSupplyInput["voltage"]
                        })
                      }
                      className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                    >
                      {potllSupplyVoltages.map((voltage) => (
                        <option key={voltage}>{voltage}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {row.quarterKwh.map((quarterValue, index) => (
                        <input
                          key={`${row.id}-quarter-${index}`}
                          type="number"
                          value={quarterValue}
                          disabled={isArchived}
                          onChange={(event) => updateQuarterKwh(row, index, event.target.value)}
                          className="w-24 rounded-md border border-line px-2 py-1 outline-none focus:border-semarts"
                          aria-label={`Quarter ${index + 1} kWh`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatNumber(getQuarterTotal(row))}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isArchived}
                      onClick={() =>
                        setMethodologyInputs({
                          ...methodologyInputs,
                          potllSupplies: methodologyInputs.potllSupplies.filter(
                            (supply) => supply.id !== row.id
                          )
                        })
                      }
                      className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <SaveFooter
        disabled={isArchived}
        saveState={saveState}
        validationErrors={[]}
        onSave={() => save(methodologyInputs, "Workbook customer inputs saved locally.")}
      />
    </div>
  );
}

export function WorkbookBoundaryMeterDataForm({ projectId }: WorkbookFormProps) {
  const { methodologyInputs, setMethodologyInputs, saveState, isArchived, save } =
    useWorkbookMethodology(projectId);
  const [importStatus, setImportStatus] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [cloudStatus, setCloudStatus] = useState("");
  const [showProblemRowsOnly, setShowProblemRowsOnly] = useState(false);
  const [batchToRemove, setBatchToRemove] = useState("");
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const latestUpload = methodologyInputs.halfHourlyImports
    .filter((row) => row.uploadedAt)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
  const boundaryMeterSummary = useMemo(
    () => getBoundaryMeterSummary(methodologyInputs.halfHourlyImports),
    [methodologyInputs.halfHourlyImports]
  );
  const reviewRows = useMemo(
    () =>
      methodologyInputs.halfHourlyImports
        .map((row) => ({
          row,
          review: getBoundaryMeterRowReview(row)
        }))
        .filter((item) => !showProblemRowsOnly || item.review.status !== "Healthy")
        .slice(0, 250),
    [methodologyInputs.halfHourlyImports, showProblemRowsOnly]
  );
  const uploadBatches = useMemo(
    () => getBoundaryMeterUploadBatches(methodologyInputs.halfHourlyImports),
    [methodologyInputs.halfHourlyImports]
  );

  useEffect(() => {
    let isMounted = true;

    loadBoundaryMeterDataFromSupabase(projectId)
      .then((cloudRows) => {
        if (!isMounted || cloudRows.length === 0) {
          return;
        }

        const nextInputs = {
          ...getProjectMethodologyInputs(projectId),
          halfHourlyImports: cloudRows
        };

        saveProjectMethodologyInputs(nextInputs);
        setMethodologyInputs(nextInputs);
        setCloudStatus("Loaded boundary meter data from cloud.");
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setCloudStatus(
          error instanceof Error
            ? `Cloud load failed: ${error.message}`
            : "Cloud load failed."
        );
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, setMethodologyInputs]);

  async function downloadTemplate() {
    const sheetData: SheetData = [
      boundaryMeterHeaders.map((header) => ({
        value: header,
        type: String,
        fontWeight: "bold"
      }))
    ];

    const file = await writeXlsxFile(sheetData, { sheet: "HH Import Data" });
    await file.toFile("boundary-meter-data-template.xlsx");
  }

  async function importWorkbook(file: File) {
    const uploadedAt = new Date().toISOString();
    const importBatchId = createImportBatchId();
    const rows = await readSheet(file);
    const result = parseBoundaryMeterRows(rows, file.name, uploadedAt, importBatchId);

    if (result.errors.length > 0) {
      setImportErrors(result.errors.slice(0, 12));
      setImportStatus("");
      return;
    }

    const merged = mergeBoundaryMeterRows(
      methodologyInputs.halfHourlyImports,
      result.parsedRows
    );
    const nextInputs = {
      ...methodologyInputs,
      halfHourlyImports: merged.rows
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Boundary meter data saved locally.");
    setImportErrors([]);
    setImportStatus(
      `Imported ${result.parsedRows.length} rows. Added ${merged.added}, replaced ${merged.replaced}, skipped ${merged.skippedDuplicates} duplicate rows.`
    );

    try {
      const cloudSaved = await saveBoundaryMeterDataToSupabase(projectId, merged.rows);
      setCloudStatus(cloudSaved ? "Boundary meter data saved to cloud." : "Saved locally only.");
    } catch (error) {
      setCloudStatus(
        error instanceof Error
          ? `Saved locally. Cloud save failed: ${error.message}`
          : "Saved locally. Cloud save failed."
      );
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || isArchived) {
      return;
    }

    importWorkbook(file).catch((error: unknown) => {
      setImportErrors([
        error instanceof Error
          ? `Import failed: ${error.message}`
          : "Import failed. Check the file format and try again."
      ]);
      setImportStatus("");
    });
    event.target.value = "";
  }

  async function removeBatch(batchId: string) {
    if (isArchived) return;

    const nextInputs = {
      ...methodologyInputs,
      halfHourlyImports: methodologyInputs.halfHourlyImports.filter(
        (row) => row.importBatchId !== batchId
      )
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Boundary meter upload batch removed locally.");
    setBatchToRemove("");
    setImportStatus("");
    setImportErrors([]);

    try {
      const cloudDeleted = await deleteBoundaryMeterBatchFromSupabase(batchId);
      setCloudStatus(cloudDeleted ? "Upload batch removed from cloud." : "Batch removed locally only.");
    } catch (error) {
      setCloudStatus(
        error instanceof Error
          ? `Batch removed locally. Cloud delete failed: ${error.message}`
          : "Batch removed locally. Cloud delete failed."
      );
    }
  }

  async function clearBoundaryMeterData() {
    if (isArchived) return;

    const nextInputs = {
      ...methodologyInputs,
      halfHourlyImports: []
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Boundary meter data cleared locally.");
    setConfirmClearAll(false);
    setBatchToRemove("");
    setImportStatus("");
    setImportErrors([]);

    try {
      const cloudCleared = await clearBoundaryMeterDataFromSupabase(projectId);
      setCloudStatus(cloudCleared ? "Boundary meter data cleared from cloud." : "Data cleared locally only.");
    } catch (error) {
      setCloudStatus(
        error instanceof Error
          ? `Data cleared locally. Cloud clear failed: ${error.message}`
          : "Data cleared locally. Cloud clear failed."
      );
    }
  }

  return (
    <section className="mt-8 rounded-md border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Boundary meter data</h2>
          <p className="mt-1 text-sm text-ink/70">Source: HH Import Data A12:BA1107.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            downloadTemplate().catch((error: unknown) => {
              setImportErrors([
                error instanceof Error
                  ? `Template download failed: ${error.message}`
                  : "Template download failed."
              ]);
            });
          }}
          className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
        >
          Download template
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-line bg-field p-4">
          <p className="text-xs font-semibold uppercase text-ink/50">Stored rows</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatNumber(methodologyInputs.halfHourlyImports.length)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-field p-4">
          <p className="text-xs font-semibold uppercase text-ink/50">Latest upload</p>
          <p className="mt-2 text-sm font-medium">
            {latestUpload ? new Date(latestUpload.uploadedAt).toLocaleString("en-GB") : "No uploads"}
          </p>
        </div>
        <div className="rounded-md border border-line bg-field p-4">
          <p className="text-xs font-semibold uppercase text-ink/50">Latest file</p>
          <p className="mt-2 break-words text-sm font-medium">
            {latestUpload?.sourceFileName || "No file uploaded"}
          </p>
        </div>
      </div>

      <label className="mt-5 block rounded-md border border-dashed border-line bg-field p-5">
        <span className="text-sm font-semibold">Upload completed template</span>
        <input
          type="file"
          accept=".xlsx,.xls"
          disabled={isArchived}
          onChange={handleFileChange}
          className="mt-3 block w-full text-sm"
        />
      </label>

      <div className="mt-5 rounded-md border border-line bg-white p-4 text-sm text-ink/70">
        <p className="font-semibold text-ink">Required headers</p>
        <p className="mt-2 break-words">
          {boundaryMeterHeaders.join(", ")}
        </p>
      </div>

      <section className="mt-5 rounded-md border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Uploaded data summary</h3>
            <p className="mt-1 text-sm text-ink/70">
              Coverage, completeness and total half-hourly volume currently stored.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              boundaryMeterSummary.hasIssues
                ? "bg-red-50 text-red-700"
                : "bg-field text-semarts-dark"
            }`}
          >
            {boundaryMeterSummary.hasIssues ? "Needs review" : "Healthy"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <SummaryMetric
            label="Period covered"
            value={
              boundaryMeterSummary.firstDate
                ? `${boundaryMeterSummary.firstDate} to ${boundaryMeterSummary.lastDate}`
                : "No data"
            }
          />
          <SummaryMetric label="MPANs" value={formatNumber(boundaryMeterSummary.mpanCount)} />
          <SummaryMetric label="Rows" value={formatNumber(boundaryMeterSummary.rowCount)} />
          <SummaryMetric
            label="HH periods"
            value={`${formatNumber(boundaryMeterSummary.actualPeriodCount)} / ${formatNumber(
              boundaryMeterSummary.expectedPeriodCount
            )}`}
          />
          <SummaryMetric
            label="Total kWh from row totals"
            value={formatNumber(boundaryMeterSummary.totalFromRows)}
          />
          <SummaryMetric
            label="Total kWh from HH periods"
            value={formatNumber(boundaryMeterSummary.totalFromHalfHours)}
          />
          <SummaryMetric
            label="Total variance"
            value={formatNumber(boundaryMeterSummary.variance)}
          />
          <SummaryMetric
            label="Data issues"
            value={`${formatNumber(boundaryMeterSummary.invalidPeriodValues)} invalid periods, ${formatNumber(
              boundaryMeterSummary.duplicateKeys
            )} duplicate keys`}
          />
        </div>
      </section>

      {importStatus ? (
        <p className="mt-4 text-sm font-medium text-semarts-dark">{importStatus}</p>
      ) : null}
      {cloudStatus ? (
        <p className="mt-2 text-sm font-medium text-semarts-dark">{cloudStatus}</p>
      ) : null}
      {saveState ? <p className="mt-2 text-sm font-medium text-semarts-dark">{saveState}</p> : null}
      {importErrors.length > 0 ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Import needs review</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {importErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="mt-5 rounded-md border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Upload batches</h3>
            <p className="mt-1 text-sm text-ink/70">
              Remove a specific upload if a file was selected in error.
            </p>
          </div>
          {methodologyInputs.halfHourlyImports.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {confirmClearAll ? (
                <>
                  <button
                    type="button"
                    disabled={isArchived}
                    onClick={clearBoundaryMeterData}
                    className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
                  >
                    Confirm clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isArchived}
                  onClick={() => setConfirmClearAll(true)}
                  className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-700"
                >
                  Clear all boundary data
                </button>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">File</th>
                <th className="px-4 py-3 font-semibold">Uploaded</th>
                <th className="px-4 py-3 font-semibold">Rows</th>
                <th className="px-4 py-3 font-semibold">MPANs</th>
                <th className="px-4 py-3 font-semibold">Period</th>
                <th className="px-4 py-3 font-semibold">HH kWh</th>
                <th className="px-4 py-3 font-semibold">Health</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {uploadBatches.map((batch) => (
                <tr key={batch.batchId} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{batch.fileName}</td>
                  <td className="px-4 py-3">
                    {batch.uploadedAt ? new Date(batch.uploadedAt).toLocaleString("en-GB") : ""}
                  </td>
                  <td className="px-4 py-3">{formatNumber(batch.rowCount)}</td>
                  <td className="px-4 py-3">{formatNumber(batch.mpanCount)}</td>
                  <td className="px-4 py-3">
                    {batch.firstDate ? `${batch.firstDate} to ${batch.lastDate}` : "No dates"}
                  </td>
                  <td className="px-4 py-3">{formatNumber(batch.totalFromHalfHours)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        batch.hasIssues ? "bg-red-50 text-red-700" : "bg-field text-semarts-dark"
                      }`}
                    >
                      {batch.hasIssues ? "Needs review" : "Healthy"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {batchToRemove === batch.batchId ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isArchived}
                          onClick={() => removeBatch(batch.batchId)}
                          className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setBatchToRemove("")}
                          className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isArchived}
                        onClick={() => setBatchToRemove(batch.batchId)}
                        className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-700"
                      >
                        Remove batch
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {uploadBatches.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={8} className="px-4 py-6 text-center text-ink/60">
                    No upload batches found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 rounded-md border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Import review</h3>
            <p className="mt-1 text-sm text-ink/70">
              First 250 rows currently stored for this project.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={showProblemRowsOnly}
              onChange={(event) => setShowProblemRowsOnly(event.target.checked)}
              className="h-4 w-4"
            />
            Show problem rows only
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">MPAN</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Total kWh</th>
                <th className="px-4 py-3 font-semibold">HH sum</th>
                <th className="px-4 py-3 font-semibold">Variance</th>
                <th className="px-4 py-3 font-semibold">Invalid periods</th>
                <th className="px-4 py-3 font-semibold">Source file</th>
                <th className="px-4 py-3 font-semibold">Uploaded</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {reviewRows.map(({ row, review }) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{row.mpan}</td>
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">{formatNumber(row.totalKwh)}</td>
                  <td className="px-4 py-3">{formatNumber(review.periodSum)}</td>
                  <td className="px-4 py-3">{formatNumber(review.variance)}</td>
                  <td className="px-4 py-3">{formatNumber(review.invalidPeriods)}</td>
                  <td className="px-4 py-3">{row.sourceFileName}</td>
                  <td className="px-4 py-3">
                    {row.uploadedAt ? new Date(row.uploadedAt).toLocaleString("en-GB") : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        review.status === "Healthy"
                          ? "bg-field text-semarts-dark"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {review.status}
                    </span>
                  </td>
                </tr>
              ))}
              {reviewRows.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={9} className="px-4 py-6 text-center text-ink/60">
                    No boundary meter rows to review.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export function WorkbookCostInputsForm({
  projectId,
  section
}: WorkbookFormProps & { section?: CostInputSection }) {
  const { methodologyInputs, setMethodologyInputs, saveState, isArchived, save } =
    useWorkbookMethodology(projectId);
  const showAllSections = section === undefined;
  const [supplyReferenceData, setSupplyReferenceData] = useState<SupplyReferenceData>(() =>
    getSupplyReferenceData()
  );
  const [assetImportStatus, setAssetImportStatus] = useState("");
  const [assetImportErrors, setAssetImportErrors] = useState<string[]>([]);
  const [assetCloudStatus, setAssetCloudStatus] = useState("");
  const [assetBatchToRemove, setAssetBatchToRemove] = useState("");
  const [confirmClearAssets, setConfirmClearAssets] = useState(false);
  const [directCostImportStatus, setDirectCostImportStatus] = useState("");
  const [directCostImportErrors, setDirectCostImportErrors] = useState<string[]>([]);
  const [directCostCloudStatus, setDirectCostCloudStatus] = useState("");
  const [directCostBatchToRemove, setDirectCostBatchToRemove] = useState("");
  const [confirmClearDirectCosts, setConfirmClearDirectCosts] = useState(false);
  const [employeeCostImportStatus, setEmployeeCostImportStatus] = useState("");
  const [employeeCostImportErrors, setEmployeeCostImportErrors] = useState<string[]>([]);
  const [employeeCostCloudStatus, setEmployeeCostCloudStatus] = useState("");
  const [employeeCostBatchToRemove, setEmployeeCostBatchToRemove] = useState("");
  const [confirmClearEmployeeCosts, setConfirmClearEmployeeCosts] = useState(false);
  const [indirectOverheadImportStatus, setIndirectOverheadImportStatus] = useState("");
  const [indirectOverheadImportErrors, setIndirectOverheadImportErrors] = useState<string[]>([]);
  const [indirectOverheadCloudStatus, setIndirectOverheadCloudStatus] = useState("");
  const [indirectOverheadBatchToRemove, setIndirectOverheadBatchToRemove] = useState("");
  const [confirmClearIndirectOverheads, setConfirmClearIndirectOverheads] = useState(false);
  const [supplyCloudStatus, setSupplyCloudStatus] = useState("");
  const [confirmClearSupplyDetails, setConfirmClearSupplyDetails] = useState(false);
  const assetSummary = useMemo(
    () => getAssetSummary(methodologyInputs.assets),
    [methodologyInputs.assets]
  );
  const directCostSummary = useMemo(
    () => getDirectCostSummary(methodologyInputs.directCosts),
    [methodologyInputs.directCosts]
  );
  const employeeCostSummary = useMemo(
    () => getEmployeeCostSummary(methodologyInputs.employeeCosts),
    [methodologyInputs.employeeCosts]
  );
  const indirectOverheadSummary = useMemo(
    () => getIndirectOverheadSummary(methodologyInputs.indirectOverheads),
    [methodologyInputs.indirectOverheads]
  );
  const supplyDetailsValidationErrors = useMemo(
    () => validateSupplyDetails(methodologyInputs.supplyDetails),
    [methodologyInputs.supplyDetails]
  );
  const supplyRowsRequiringCharges = useMemo(
    () =>
      methodologyInputs.supplyDetails.filter(
        (row) => row.transmission === "Fixed" || row.distribution === "Fixed"
      ),
    [methodologyInputs.supplyDetails]
  );

  useEffect(() => {
    let isMounted = true;

    loadSupplyReferenceDataFromSupabase()
      .then((cloudReferenceData) => {
        if (!isMounted) {
          return;
        }

        setSupplyReferenceData(cloudReferenceData ?? getSupplyReferenceData());
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setSupplyReferenceData(getSupplyReferenceData());
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!showAllSections && section !== "direct-non-employee") {
      return;
    }

    let isMounted = true;

    loadDirectCostDataFromSupabase(projectId)
      .then((cloudRows) => {
        if (!isMounted || cloudRows.length === 0) {
          return;
        }

        const nextInputs = {
          ...getProjectMethodologyInputs(projectId),
          directCosts: cloudRows
        };

        saveProjectMethodologyInputs(nextInputs);
        setMethodologyInputs(nextInputs);
        setDirectCostCloudStatus("Loaded direct non-employee costs from cloud.");
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setDirectCostCloudStatus(`Cloud load failed: ${getErrorMessage(error)}`);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, section, showAllSections, setMethodologyInputs]);

  useEffect(() => {
    if (!showAllSections && section !== "direct-employee") {
      return;
    }

    let isMounted = true;

    loadEmployeeCostDataFromSupabase(projectId)
      .then((cloudRows) => {
        if (!isMounted || cloudRows.length === 0) {
          return;
        }

        const nextInputs = {
          ...getProjectMethodologyInputs(projectId),
          employeeCosts: cloudRows
        };

        saveProjectMethodologyInputs(nextInputs);
        setMethodologyInputs(nextInputs);
        setEmployeeCostCloudStatus("Loaded direct employee costs from cloud.");
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setEmployeeCostCloudStatus(`Cloud load failed: ${getErrorMessage(error)}`);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, section, showAllSections, setMethodologyInputs]);

  useEffect(() => {
    if (!showAllSections && section !== "indirect-overheads") {
      return;
    }

    let isMounted = true;

    loadIndirectOverheadDataFromSupabase(projectId)
      .then((cloudRows) => {
        if (!isMounted || cloudRows.length === 0) {
          return;
        }

        const nextInputs = {
          ...getProjectMethodologyInputs(projectId),
          indirectOverheads: cloudRows
        };

        saveProjectMethodologyInputs(nextInputs);
        setMethodologyInputs(nextInputs);
        setIndirectOverheadCloudStatus("Loaded indirect overheads from cloud.");
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setIndirectOverheadCloudStatus(`Cloud load failed: ${getErrorMessage(error)}`);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, section, showAllSections, setMethodologyInputs]);

  useEffect(() => {
    if (!showAllSections && section !== "asset-data") {
      return;
    }

    let isMounted = true;

    loadAssetDataFromSupabase(projectId)
      .then((cloudRows) => {
        if (!isMounted || cloudRows.length === 0) {
          return;
        }

        const nextInputs = {
          ...getProjectMethodologyInputs(projectId),
          assets: cloudRows
        };

        saveProjectMethodologyInputs(nextInputs);
        setMethodologyInputs(nextInputs);
        setAssetCloudStatus("Loaded asset data from cloud.");
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setAssetCloudStatus(
          `Cloud load failed: ${getErrorMessage(error)}`
        );
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, section, showAllSections, setMethodologyInputs]);

  useEffect(() => {
    if (
      !showAllSections &&
      section !== "transmission-distribution" &&
      section !== "supply-contract"
    ) {
      return;
    }

    let isMounted = true;

    loadSupplyDetailsFromSupabase(projectId)
      .then((cloudRows) => {
        if (!isMounted || cloudRows.length === 0) {
          return;
        }

        const nextInputs = {
          ...getProjectMethodologyInputs(projectId),
          supplyDetails: cloudRows
        };

        saveProjectMethodologyInputs(nextInputs);
        setMethodologyInputs(nextInputs);
        setSupplyCloudStatus("Loaded supply inputs from cloud.");
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setSupplyCloudStatus(`Cloud load failed: ${getErrorMessage(error)}`);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, section, showAllSections, setMethodologyInputs]);

  function updateSupplyDetails(rowId: string, updates: Partial<SupplyDetailsInput>) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      supplyDetails: methodologyInputs.supplyDetails.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    });
  }

  function addSupplyContractCharge(supplyId: string) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      supplyDetails: methodologyInputs.supplyDetails.map((row) =>
        row.id === supplyId
          ? {
              ...row,
              supplyContractCharges: [
                ...row.supplyContractCharges,
                createSupplyContractChargeInput()
              ]
            }
          : row
      )
    });
  }

  function updateSupplyContractCharge(
    supplyId: string,
    chargeId: string,
    updates: Partial<SupplyContractChargeInput>
  ) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      supplyDetails: methodologyInputs.supplyDetails.map((row) =>
        row.id === supplyId
          ? {
              ...row,
              supplyContractCharges: row.supplyContractCharges.map((charge) =>
                charge.id === chargeId ? { ...charge, ...updates } : charge
              )
            }
          : row
      )
    });
  }

  function updateSupplyContractCustomTimeOfUse(
    supplyId: string,
    charge: SupplyContractChargeInput,
    updates: Partial<SupplyContractChargeInput["customTimeOfUse"]>
  ) {
    updateSupplyContractCharge(supplyId, charge.id, {
      customTimeOfUse: {
        ...defaultCustomTimeOfUse,
        ...charge.customTimeOfUse,
        ...updates
      }
    });
  }

  function toggleSupplyContractCustomValue<T extends string>(
    currentValues: T[],
    value: T
  ) {
    return currentValues.includes(value)
      ? currentValues.filter((currentValue) => currentValue !== value)
      : [...currentValues, value];
  }

  function removeSupplyContractCharge(supplyId: string, chargeId: string) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      supplyDetails: methodologyInputs.supplyDetails.map((row) =>
        row.id === supplyId
          ? {
              ...row,
              supplyContractCharges: row.supplyContractCharges.filter(
                (charge) => charge.id !== chargeId
              )
            }
          : row
      )
    });
  }

  function updateDirectCost(rowId: string, updates: Partial<DirectCostInput>) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      directCosts: methodologyInputs.directCosts.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    });
  }

  function updateEmployeeCost(rowId: string, updates: Partial<EmployeeCostInput>) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      employeeCosts: methodologyInputs.employeeCosts.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    });
  }

  function updateOverhead(rowId: string, updates: Partial<IndirectOverheadInput>) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      indirectOverheads: methodologyInputs.indirectOverheads.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    });
  }

  function updateAsset(rowId: string, updates: Partial<AssetInput>) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      assets: methodologyInputs.assets.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    });
  }

  async function downloadDirectCostTemplate() {
    const sheetData: SheetData = [
      directCostHeaders.map((header) => ({
        value: header,
        type: String,
        fontWeight: "bold"
      }))
    ];
    const file = await writeXlsxFile(sheetData, { sheet: "Direct Non-Employee Costs" });
    await file.toFile("direct-non-employee-costs-template.xlsx");
  }

  async function importDirectCostWorkbook(file: File) {
    const rows = await readSheet(file);
    const uploadedAt = new Date().toISOString();
    const importBatchId = createDirectCostImportBatchId();
    const result = parseDirectCostRows(rows, file.name, uploadedAt, importBatchId);

    if (result.errors.length > 0) {
      setDirectCostImportErrors(result.errors.slice(0, 12));
      setDirectCostImportStatus("");
      return;
    }

    const merged = mergeDirectCostRows(methodologyInputs.directCosts, result.parsedRows);
    const nextInputs = {
      ...methodologyInputs,
      directCosts: merged.rows
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Direct non-employee costs saved locally.");
    setDirectCostImportErrors([]);
    setDirectCostImportStatus(
      `Imported ${result.parsedRows.length} rows. Added ${merged.added}, replaced ${merged.replaced}, skipped ${merged.skippedDuplicates} duplicate rows.`
    );

    try {
      await saveProjectToSupabase(getProjectById(projectId));
      const cloudSaved = await saveDirectCostDataToSupabase(projectId, merged.rows);
      setDirectCostCloudStatus(
        cloudSaved ? "Direct non-employee costs saved to cloud." : "Saved locally only."
      );
    } catch (error) {
      setDirectCostCloudStatus(
        `Saved locally. Cloud save failed: ${getErrorMessage(error)}`
      );
    }
  }

  function handleDirectCostFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || isArchived) {
      return;
    }

    importDirectCostWorkbook(file).catch((error: unknown) => {
      setDirectCostImportErrors([`Import failed: ${getErrorMessage(error)}`]);
      setDirectCostImportStatus("");
    });
    event.target.value = "";
  }

  async function downloadEmployeeCostTemplate() {
    const sheetData: SheetData = [
      employeeCostHeaders.map((header) => ({
        value: header,
        type: String,
        fontWeight: "bold"
      }))
    ];
    const file = await writeXlsxFile(sheetData, { sheet: "Direct Employee Costs" });
    await file.toFile("direct-employee-costs-template.xlsx");
  }

  async function importEmployeeCostWorkbook(file: File) {
    const rows = await readSheet(file);
    const uploadedAt = new Date().toISOString();
    const importBatchId = createEmployeeCostImportBatchId();
    const result = parseEmployeeCostRows(rows, file.name, uploadedAt, importBatchId);

    if (result.errors.length > 0) {
      setEmployeeCostImportErrors(result.errors.slice(0, 12));
      setEmployeeCostImportStatus("");
      return;
    }

    const merged = mergeEmployeeCostRows(methodologyInputs.employeeCosts, result.parsedRows);
    const nextInputs = {
      ...methodologyInputs,
      employeeCosts: merged.rows
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Direct employee costs saved locally.");
    setEmployeeCostImportErrors([]);
    setEmployeeCostImportStatus(
      `Imported ${result.parsedRows.length} rows. Added ${merged.added}, replaced ${merged.replaced}, skipped ${merged.skippedDuplicates} duplicate rows.`
    );

    try {
      await saveProjectToSupabase(getProjectById(projectId));
      const cloudSaved = await saveEmployeeCostDataToSupabase(projectId, merged.rows);
      setEmployeeCostCloudStatus(
        cloudSaved ? "Direct employee costs saved to cloud." : "Saved locally only."
      );
    } catch (error) {
      setEmployeeCostCloudStatus(
        `Saved locally. Cloud save failed: ${getErrorMessage(error)}`
      );
    }
  }

  function handleEmployeeCostFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || isArchived) {
      return;
    }

    importEmployeeCostWorkbook(file).catch((error: unknown) => {
      setEmployeeCostImportErrors([`Import failed: ${getErrorMessage(error)}`]);
      setEmployeeCostImportStatus("");
    });
    event.target.value = "";
  }

  async function downloadIndirectOverheadTemplate() {
    const sheetData: SheetData = [
      indirectOverheadHeaders.map((header) => ({
        value: header,
        type: String,
        fontWeight: "bold"
      }))
    ];
    const file = await writeXlsxFile(sheetData, { sheet: "Indirect Overheads" });
    await file.toFile("indirect-overheads-template.xlsx");
  }

  async function importIndirectOverheadWorkbook(file: File) {
    const rows = await readSheet(file);
    const uploadedAt = new Date().toISOString();
    const importBatchId = createIndirectOverheadImportBatchId();
    const result = parseIndirectOverheadRows(rows, file.name, uploadedAt, importBatchId);

    if (result.errors.length > 0) {
      setIndirectOverheadImportErrors(result.errors.slice(0, 12));
      setIndirectOverheadImportStatus("");
      return;
    }

    const merged = mergeIndirectOverheadRows(
      methodologyInputs.indirectOverheads,
      result.parsedRows
    );
    const nextInputs = {
      ...methodologyInputs,
      indirectOverheads: merged.rows
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Indirect overheads saved locally.");
    setIndirectOverheadImportErrors([]);
    setIndirectOverheadImportStatus(
      `Imported ${result.parsedRows.length} rows. Added ${merged.added}, replaced ${merged.replaced}, skipped ${merged.skippedDuplicates} duplicate rows.`
    );

    try {
      await saveProjectToSupabase(getProjectById(projectId));
      const cloudSaved = await saveIndirectOverheadDataToSupabase(projectId, merged.rows);
      setIndirectOverheadCloudStatus(
        cloudSaved ? "Indirect overheads saved to cloud." : "Saved locally only."
      );
    } catch (error) {
      setIndirectOverheadCloudStatus(
        `Saved locally. Cloud save failed: ${getErrorMessage(error)}`
      );
    }
  }

  function handleIndirectOverheadFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || isArchived) {
      return;
    }

    importIndirectOverheadWorkbook(file).catch((error: unknown) => {
      setIndirectOverheadImportErrors([`Import failed: ${getErrorMessage(error)}`]);
      setIndirectOverheadImportStatus("");
    });
    event.target.value = "";
  }

  async function saveIndirectOverheadsToCloud() {
    try {
      await saveProjectToSupabase(getProjectById(projectId));
      const cloudSaved = await saveIndirectOverheadDataToSupabase(
        projectId,
        methodologyInputs.indirectOverheads
      );
      setIndirectOverheadCloudStatus(
        cloudSaved ? "Indirect overheads saved to cloud." : "Saved locally only."
      );
    } catch (error) {
      setIndirectOverheadCloudStatus(`Cloud save failed: ${getErrorMessage(error)}`);
    }
  }

  async function restoreIndirectOverheadsFromCloud() {
    try {
      const cloudRows = await loadIndirectOverheadDataFromSupabase(projectId);
      const nextInputs = {
        ...methodologyInputs,
        indirectOverheads: cloudRows
      };

      setMethodologyInputs(nextInputs);
      save(nextInputs, "Indirect overheads restored from cloud.");
      setIndirectOverheadCloudStatus(
        cloudRows.length > 0
          ? "Indirect overheads restored from cloud."
          : "No cloud indirect overheads found."
      );
    } catch (error) {
      setIndirectOverheadCloudStatus(`Cloud restore failed: ${getErrorMessage(error)}`);
    }
  }

  async function removeIndirectOverheadUploadBatch(batchId: string) {
    if (isArchived) return;
    const nextInputs = {
      ...methodologyInputs,
      indirectOverheads: methodologyInputs.indirectOverheads.filter(
        (row) => row.importBatchId !== batchId
      )
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Indirect overhead import batch removed.");
    setIndirectOverheadBatchToRemove("");
    setIndirectOverheadImportStatus("");
    setIndirectOverheadImportErrors([]);

    try {
      const cloudDeleted = await deleteIndirectOverheadBatchFromSupabase(batchId);
      setIndirectOverheadCloudStatus(
        cloudDeleted ? "Indirect overhead batch removed from cloud." : "Batch removed locally only."
      );
    } catch (error) {
      setIndirectOverheadCloudStatus(
        `Batch removed locally. Cloud delete failed: ${getErrorMessage(error)}`
      );
    }
  }

  async function clearIndirectOverheadData() {
    if (isArchived) return;
    const nextInputs = {
      ...methodologyInputs,
      indirectOverheads: []
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Indirect overheads cleared locally.");
    setIndirectOverheadBatchToRemove("");
    setConfirmClearIndirectOverheads(false);
    setIndirectOverheadImportStatus("");
    setIndirectOverheadImportErrors([]);

    try {
      const cloudCleared = await clearIndirectOverheadDataFromSupabase(projectId);
      setIndirectOverheadCloudStatus(
        cloudCleared ? "Indirect overheads cleared from cloud." : "Indirect overheads cleared locally only."
      );
    } catch (error) {
      setIndirectOverheadCloudStatus(
        `Indirect overheads cleared locally. Cloud clear failed: ${getErrorMessage(error)}`
      );
    }
  }

  async function saveSupplyDetailsToCloud() {
    try {
      await saveProjectToSupabase(getProjectById(projectId));
      const cloudSaved = await saveSupplyDetailsToSupabase(
        projectId,
        methodologyInputs.supplyDetails
      );
      setSupplyCloudStatus(
        cloudSaved ? "Supply inputs saved to cloud." : "Saved locally only."
      );
    } catch (error) {
      setSupplyCloudStatus(`Cloud save failed: ${getErrorMessage(error)}`);
    }
  }

  async function restoreSupplyDetailsFromCloud() {
    try {
      const cloudRows = await loadSupplyDetailsFromSupabase(projectId);
      const nextInputs = {
        ...methodologyInputs,
        supplyDetails: cloudRows
      };

      setMethodologyInputs(nextInputs);
      save(nextInputs, "Supply inputs restored from cloud.");
      setSupplyCloudStatus(
        cloudRows.length > 0 ? "Supply inputs restored from cloud." : "No cloud supply inputs found."
      );
    } catch (error) {
      setSupplyCloudStatus(`Cloud restore failed: ${getErrorMessage(error)}`);
    }
  }

  async function clearSupplyDetails() {
    if (isArchived) return;
    const nextInputs = {
      ...methodologyInputs,
      supplyDetails: []
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Supply inputs cleared locally.");
    setConfirmClearSupplyDetails(false);

    try {
      const cloudCleared = await clearSupplyDetailsFromSupabase(projectId);
      setSupplyCloudStatus(
        cloudCleared ? "Supply inputs cleared from cloud." : "Supply inputs cleared locally only."
      );
    } catch (error) {
      setSupplyCloudStatus(
        `Supply inputs cleared locally. Cloud clear failed: ${getErrorMessage(error)}`
      );
    }
  }

  async function saveEmployeeCostsToCloud() {
    try {
      await saveProjectToSupabase(getProjectById(projectId));
      const cloudSaved = await saveEmployeeCostDataToSupabase(
        projectId,
        methodologyInputs.employeeCosts
      );
      setEmployeeCostCloudStatus(
        cloudSaved ? "Direct employee costs saved to cloud." : "Saved locally only."
      );
    } catch (error) {
      setEmployeeCostCloudStatus(`Cloud save failed: ${getErrorMessage(error)}`);
    }
  }

  async function restoreEmployeeCostsFromCloud() {
    try {
      const cloudRows = await loadEmployeeCostDataFromSupabase(projectId);
      const nextInputs = {
        ...methodologyInputs,
        employeeCosts: cloudRows
      };

      setMethodologyInputs(nextInputs);
      save(nextInputs, "Direct employee costs restored from cloud.");
      setEmployeeCostCloudStatus(
        cloudRows.length > 0
          ? "Direct employee costs restored from cloud."
          : "No cloud direct employee costs found."
      );
    } catch (error) {
      setEmployeeCostCloudStatus(`Cloud restore failed: ${getErrorMessage(error)}`);
    }
  }

  async function removeEmployeeCostUploadBatch(batchId: string) {
    if (isArchived) return;
    const nextInputs = {
      ...methodologyInputs,
      employeeCosts: methodologyInputs.employeeCosts.filter((row) => row.importBatchId !== batchId)
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Direct employee cost import batch removed.");
    setEmployeeCostBatchToRemove("");
    setEmployeeCostImportStatus("");
    setEmployeeCostImportErrors([]);

    try {
      const cloudDeleted = await deleteEmployeeCostBatchFromSupabase(batchId);
      setEmployeeCostCloudStatus(
        cloudDeleted
          ? "Direct employee cost batch removed from cloud."
          : "Batch removed locally only."
      );
    } catch (error) {
      setEmployeeCostCloudStatus(
        `Batch removed locally. Cloud delete failed: ${getErrorMessage(error)}`
      );
    }
  }

  async function clearEmployeeCostData() {
    if (isArchived) return;
    const nextInputs = {
      ...methodologyInputs,
      employeeCosts: []
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Direct employee costs cleared locally.");
    setEmployeeCostBatchToRemove("");
    setConfirmClearEmployeeCosts(false);
    setEmployeeCostImportStatus("");
    setEmployeeCostImportErrors([]);

    try {
      const cloudCleared = await clearEmployeeCostDataFromSupabase(projectId);
      setEmployeeCostCloudStatus(
        cloudCleared
          ? "Direct employee costs cleared from cloud."
          : "Direct employee costs cleared locally only."
      );
    } catch (error) {
      setEmployeeCostCloudStatus(
        `Direct employee costs cleared locally. Cloud clear failed: ${getErrorMessage(error)}`
      );
    }
  }

  async function saveDirectCostsToCloud() {
    try {
      await saveProjectToSupabase(getProjectById(projectId));
      const cloudSaved = await saveDirectCostDataToSupabase(
        projectId,
        methodologyInputs.directCosts
      );
      setDirectCostCloudStatus(
        cloudSaved ? "Direct non-employee costs saved to cloud." : "Saved locally only."
      );
    } catch (error) {
      setDirectCostCloudStatus(`Cloud save failed: ${getErrorMessage(error)}`);
    }
  }

  async function restoreDirectCostsFromCloud() {
    try {
      const cloudRows = await loadDirectCostDataFromSupabase(projectId);
      const nextInputs = {
        ...methodologyInputs,
        directCosts: cloudRows
      };

      setMethodologyInputs(nextInputs);
      save(nextInputs, "Direct non-employee costs restored from cloud.");
      setDirectCostCloudStatus(
        cloudRows.length > 0
          ? "Direct non-employee costs restored from cloud."
          : "No cloud direct non-employee costs found."
      );
    } catch (error) {
      setDirectCostCloudStatus(`Cloud restore failed: ${getErrorMessage(error)}`);
    }
  }

  async function removeDirectCostUploadBatch(batchId: string) {
    if (isArchived) return;
    const nextInputs = {
      ...methodologyInputs,
      directCosts: methodologyInputs.directCosts.filter((row) => row.importBatchId !== batchId)
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Direct non-employee cost import batch removed.");
    setDirectCostBatchToRemove("");
    setDirectCostImportStatus("");
    setDirectCostImportErrors([]);

    try {
      const cloudDeleted = await deleteDirectCostBatchFromSupabase(batchId);
      setDirectCostCloudStatus(
        cloudDeleted
          ? "Direct non-employee cost batch removed from cloud."
          : "Batch removed locally only."
      );
    } catch (error) {
      setDirectCostCloudStatus(
        `Batch removed locally. Cloud delete failed: ${getErrorMessage(error)}`
      );
    }
  }

  async function clearDirectCostData() {
    if (isArchived) return;
    const nextInputs = {
      ...methodologyInputs,
      directCosts: []
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Direct non-employee costs cleared locally.");
    setDirectCostBatchToRemove("");
    setConfirmClearDirectCosts(false);
    setDirectCostImportStatus("");
    setDirectCostImportErrors([]);

    try {
      const cloudCleared = await clearDirectCostDataFromSupabase(projectId);
      setDirectCostCloudStatus(
        cloudCleared
          ? "Direct non-employee costs cleared from cloud."
          : "Direct non-employee costs cleared locally only."
      );
    } catch (error) {
      setDirectCostCloudStatus(
        `Direct non-employee costs cleared locally. Cloud clear failed: ${getErrorMessage(error)}`
      );
    }
  }

  async function downloadAssetTemplate() {
    const sheetData: SheetData = [
      assetDataHeaders.map((header) => ({
        value: header,
        type: String,
        fontWeight: "bold"
      }))
    ];
    const file = await writeXlsxFile(sheetData, { sheet: "Asset Data" });
    await file.toFile("asset-data-template.xlsx");
  }

  async function importAssetWorkbook(file: File) {
    const rows = await readSheet(file);
    const uploadedAt = new Date().toISOString();
    const importBatchId = createAssetImportBatchId();
    const result = parseAssetRows(rows, file.name, uploadedAt, importBatchId);

    if (result.errors.length > 0) {
      setAssetImportErrors(result.errors.slice(0, 12));
      setAssetImportStatus("");
      return;
    }

    const merged = mergeAssetRows(methodologyInputs.assets, result.parsedRows);
    const nextInputs = {
      ...methodologyInputs,
      assets: merged.rows
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Asset data saved locally.");
    setAssetImportErrors([]);
    setAssetImportStatus(
      `Imported ${result.parsedRows.length} rows. Added ${merged.added}, replaced ${merged.replaced}, skipped ${merged.skippedDuplicates} duplicate rows.`
    );

    try {
      await saveProjectToSupabase(getProjectById(projectId));
      const cloudSaved = await saveAssetDataToSupabase(projectId, merged.rows);
      setAssetCloudStatus(cloudSaved ? "Asset data saved to cloud." : "Saved locally only.");
    } catch (error) {
      setAssetCloudStatus(
        `Saved locally. Cloud save failed: ${getErrorMessage(error)}`
      );
    }
  }

  async function removeAssetUploadBatch(batchId: string) {
    if (isArchived) return;
    const nextInputs = {
      ...methodologyInputs,
      assets: methodologyInputs.assets.filter((row) => row.importBatchId !== batchId)
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Asset import batch removed.");
    setAssetBatchToRemove("");
    setAssetImportStatus("");
    setAssetImportErrors([]);

    try {
      const cloudDeleted = await deleteAssetBatchFromSupabase(batchId);
      setAssetCloudStatus(cloudDeleted ? "Asset batch removed from cloud." : "Batch removed locally only.");
    } catch (error) {
      setAssetCloudStatus(
        `Batch removed locally. Cloud delete failed: ${getErrorMessage(error)}`
      );
    }
  }

  async function clearAssetData() {
    if (isArchived) return;
    const nextInputs = {
      ...methodologyInputs,
      assets: []
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Asset data cleared locally.");
    setAssetBatchToRemove("");
    setConfirmClearAssets(false);
    setAssetImportStatus("");
    setAssetImportErrors([]);

    try {
      const cloudCleared = await clearAssetDataFromSupabase(projectId);
      setAssetCloudStatus(cloudCleared ? "Asset data cleared from cloud." : "Asset data cleared locally only.");
    } catch (error) {
      setAssetCloudStatus(
        `Asset data cleared locally. Cloud clear failed: ${getErrorMessage(error)}`
      );
    }
  }

  async function saveAssetsToCloud() {
    try {
      await saveProjectToSupabase(getProjectById(projectId));
      const cloudSaved = await saveAssetDataToSupabase(projectId, methodologyInputs.assets);
      setAssetCloudStatus(cloudSaved ? "Asset data saved to cloud." : "Saved locally only.");
    } catch (error) {
      setAssetCloudStatus(
        `Cloud save failed: ${getErrorMessage(error)}`
      );
    }
  }

  async function restoreAssetsFromCloud() {
    try {
      const cloudRows = await loadAssetDataFromSupabase(projectId);
      const nextInputs = {
        ...methodologyInputs,
        assets: cloudRows
      };

      setMethodologyInputs(nextInputs);
      save(nextInputs, "Asset data restored from cloud.");
      setAssetCloudStatus(
        cloudRows.length > 0 ? "Asset data restored from cloud." : "No cloud asset data found."
      );
    } catch (error) {
      setAssetCloudStatus(
        `Cloud restore failed: ${getErrorMessage(error)}`
      );
    }
  }

  function handleAssetFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || isArchived) {
      return;
    }

    importAssetWorkbook(file).catch((error: unknown) => {
      setAssetImportErrors([
        error instanceof Error
          ? `Import failed: ${error.message}`
          : "Import failed. Check the file format and try again."
      ]);
      setAssetImportStatus("");
    });
    event.target.value = "";
  }

  return (
    <div className="mt-8 space-y-6">
      {showAllSections || section === "direct-non-employee" ? (
        <WorkbookTableSection
          title="Direct non-employee costs"
          source="Inputs and Selections A34:E72"
          addLabel="Add direct cost"
          onAdd={() =>
            setMethodologyInputs({
              ...methodologyInputs,
              directCosts: [...methodologyInputs.directCosts, createDirectCostInput()]
            })
          }
          disabled={isArchived}
        >
        <div className="mb-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                downloadDirectCostTemplate().catch((error: unknown) => {
                  setDirectCostImportErrors([
                    `Template download failed: ${getErrorMessage(error)}`
                  ]);
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
            >
              Download direct cost template
            </button>
            <button
              type="button"
              disabled={isArchived}
              onClick={() => {
                saveDirectCostsToCloud().catch((error: unknown) => {
                  setDirectCostCloudStatus(`Cloud save failed: ${getErrorMessage(error)}`);
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
            >
              Save to cloud
            </button>
            <button
              type="button"
              disabled={isArchived}
              onClick={() => {
                restoreDirectCostsFromCloud().catch((error: unknown) => {
                  setDirectCostCloudStatus(`Cloud restore failed: ${getErrorMessage(error)}`);
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
            >
              Restore from cloud
            </button>
            {confirmClearDirectCosts ? (
              <button
                type="button"
                disabled={isArchived}
                onClick={() => {
                  clearDirectCostData().catch((error: unknown) => {
                    setDirectCostCloudStatus(
                      `Direct non-employee cost clear failed: ${getErrorMessage(error)}`
                    );
                  });
                }}
                className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:text-ink/40"
              >
                Confirm clear all
              </button>
            ) : (
              <button
                type="button"
                disabled={isArchived || methodologyInputs.directCosts.length === 0}
                onClick={() => setConfirmClearDirectCosts(true)}
                className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
              >
                Clear all
              </button>
            )}
            <label className="block rounded-md border border-dashed border-line bg-field px-4 py-3">
              <span className="text-sm font-semibold">Upload direct cost template</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                disabled={isArchived}
                onChange={handleDirectCostFileChange}
                className="mt-2 block w-full text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <SummaryMetric label="Rows" value={formatNumber(directCostSummary.rowCount)} />
            <SummaryMetric
              label="Annual value"
              value={formatNumber(directCostSummary.totalAnnualValue)}
            />
            <SummaryMetric
              label="Cost types"
              value={formatNumber(directCostSummary.costTypeCount)}
            />
            <SummaryMetric
              label="Rows needing review"
              value={formatNumber(directCostSummary.invalidRows)}
            />
          </div>

          <div className="rounded-md border border-line bg-white p-4 text-sm text-ink/70">
            <p className="font-semibold text-ink">Required headers</p>
            <p className="mt-2 break-words">{directCostHeaders.join(", ")}</p>
          </div>

          <div className="rounded-md border border-line bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-ink">Recent direct cost uploads</p>
              <p className="text-xs font-medium uppercase text-ink/50">
                {formatNumber(directCostSummary.uploadBatches.length)} batches
              </p>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="bg-field text-left text-xs uppercase text-ink/60">
                  <tr>
                    <th className="px-3 py-2 font-semibold">File</th>
                    <th className="px-3 py-2 font-semibold">Uploaded</th>
                    <th className="px-3 py-2 font-semibold">Rows</th>
                    <th className="px-3 py-2 font-semibold">Annual value</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {directCostSummary.uploadBatches.map((batch) => (
                    <tr key={batch.batchId} className="border-t border-line">
                      <td className="px-3 py-2">{batch.fileName}</td>
                      <td className="px-3 py-2">
                        {batch.uploadedAt ? new Date(batch.uploadedAt).toLocaleString("en-GB") : ""}
                      </td>
                      <td className="px-3 py-2">{formatNumber(batch.rowCount)}</td>
                      <td className="px-3 py-2">{formatNumber(batch.totalAnnualValue)}</td>
                      <td className="px-3 py-2">
                        {directCostBatchToRemove === batch.batchId ? (
                          <button
                            type="button"
                            disabled={isArchived}
                            onClick={() => {
                              removeDirectCostUploadBatch(batch.batchId).catch(
                                (error: unknown) => {
                                  setDirectCostCloudStatus(
                                    `Batch removal failed: ${getErrorMessage(error)}`
                                  );
                                }
                              );
                            }}
                            className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:text-ink/40"
                          >
                            Confirm remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isArchived}
                            onClick={() => setDirectCostBatchToRemove(batch.batchId)}
                            className="rounded-md border border-line px-3 py-1 text-xs font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
                          >
                            Remove batch
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {directCostSummary.uploadBatches.length === 0 ? (
                    <tr className="border-t border-line">
                      <td colSpan={5} className="px-3 py-4 text-center text-ink/60">
                        No direct cost upload batches yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="mt-5 space-y-4">
              {methodologyInputs.supplyDetails
                .filter(
                  (row) => row.transmission === "Fixed" || row.distribution === "Fixed"
                )
                .map((row) => {
                  const distributionChargeFields =
                    row.voltage === "EHV"
                      ? ehvDistributionChargeFields
                      : lvHvDistributionChargeFields;
                  const showTransmissionCharges = row.transmission === "Fixed";
                  const showDistributionCharges = row.distribution === "Fixed";
                  const rowLabel = row.mpan ? `MPAN ${row.mpan}` : "New supply MPAN";

                  return (
                    <div key={row.id} className="rounded-md border border-line bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h4 className="font-semibold">{rowLabel}</h4>
                          <p className="mt-1 text-xs text-ink/60">
                            {row.voltage} supply, {formatNumber(row.supplyCapacityKva)} kVA
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-semibold">
                          <span className="rounded-md border border-line bg-field px-2 py-1">
                            Transmission: {row.transmission}
                          </span>
                          <span className="rounded-md border border-line bg-field px-2 py-1">
                            Distribution: {row.distribution}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        {showTransmissionCharges ? (
                          <div className="rounded-md border border-line bg-field p-4">
                            <h5 className="font-semibold">Transmission charges</h5>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              {transmissionChargeFields.map(({ field, label }) => (
                                <NumberInput
                                  key={field}
                                  label={label}
                                  value={row[field]}
                                  disabled={isArchived}
                                  onChange={(value) =>
                                    updateSupplyDetails(row.id, {
                                      [field]: toNumber(value)
                                    })
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {showDistributionCharges ? (
                          <div className="rounded-md border border-line bg-field p-4">
                            <h5 className="font-semibold">Distribution charges</h5>
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              {[
                                ...commonDistributionChargeFields,
                                ...distributionChargeFields
                              ].map(({ field, label }) => (
                                <NumberInput
                                  key={field}
                                  label={label}
                                  value={row[field]}
                                  disabled={isArchived}
                                  onChange={(value) =>
                                    updateSupplyDetails(row.id, {
                                      [field]: toNumber(value)
                                    })
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {directCostImportStatus ? (
            <p className="text-sm font-medium text-semarts-dark">{directCostImportStatus}</p>
          ) : null}
          {directCostCloudStatus ? (
            <p className="text-sm font-medium text-semarts-dark">{directCostCloudStatus}</p>
          ) : null}
          {directCostImportErrors.length > 0 ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Import needs review</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {directCostImportErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-field text-left text-xs uppercase text-ink/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Cost by type</th>
              <th className="px-4 py-3 font-semibold">Annual value</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {methodologyInputs.directCosts.map((row) => {
              const review = getDirectCostRowReview(row);

              return (
              <tr key={row.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <TextInput
                    value={row.description}
                    disabled={isArchived}
                    onChange={(value) => updateDirectCost(row.id, { description: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <TextInput
                    value={row.costByType}
                    disabled={isArchived}
                    onChange={(value) => updateDirectCost(row.id, { costByType: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <NumberCell
                    value={row.annualValue}
                    disabled={isArchived}
                    onChange={(value) => updateDirectCost(row.id, { annualValue: toNumber(value) })}
                  />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      review.status === "Healthy"
                        ? "bg-field text-semarts-dark"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {review.status}
                  </span>
                  {review.issues.length > 0 ? (
                    <p className="mt-2 text-xs text-red-700">{review.issues.join(", ")}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <RemoveButton
                    disabled={isArchived}
                    onClick={() =>
                      setMethodologyInputs({
                        ...methodologyInputs,
                        directCosts: methodologyInputs.directCosts.filter(
                          (cost) => cost.id !== row.id
                        )
                      })
                    }
                  />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        </WorkbookTableSection>
      ) : null}

      {showAllSections || section === "direct-employee" ? (
        <WorkbookTableSection
          title="Employee costs"
          source="Inputs and Selections A75:G85"
          addLabel="Add employee cost"
          onAdd={() =>
            setMethodologyInputs({
              ...methodologyInputs,
              employeeCosts: [...methodologyInputs.employeeCosts, createEmployeeCostInput()]
            })
          }
          disabled={isArchived}
        >
        <div className="mb-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                downloadEmployeeCostTemplate().catch((error: unknown) => {
                  setEmployeeCostImportErrors([
                    `Template download failed: ${getErrorMessage(error)}`
                  ]);
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
            >
              Download employee template
            </button>
            <button
              type="button"
              disabled={isArchived}
              onClick={() => {
                saveEmployeeCostsToCloud().catch((error: unknown) => {
                  setEmployeeCostCloudStatus(`Cloud save failed: ${getErrorMessage(error)}`);
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
            >
              Save to cloud
            </button>
            <button
              type="button"
              disabled={isArchived}
              onClick={() => {
                restoreEmployeeCostsFromCloud().catch((error: unknown) => {
                  setEmployeeCostCloudStatus(`Cloud restore failed: ${getErrorMessage(error)}`);
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
            >
              Restore from cloud
            </button>
            {confirmClearEmployeeCosts ? (
              <button
                type="button"
                disabled={isArchived}
                onClick={() => {
                  clearEmployeeCostData().catch((error: unknown) => {
                    setEmployeeCostCloudStatus(
                      `Direct employee cost clear failed: ${getErrorMessage(error)}`
                    );
                  });
                }}
                className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:text-ink/40"
              >
                Confirm clear all
              </button>
            ) : (
              <button
                type="button"
                disabled={isArchived || methodologyInputs.employeeCosts.length === 0}
                onClick={() => setConfirmClearEmployeeCosts(true)}
                className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
              >
                Clear all
              </button>
            )}
            <label className="block rounded-md border border-dashed border-line bg-field px-4 py-3">
              <span className="text-sm font-semibold">Upload employee template</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                disabled={isArchived}
                onChange={handleEmployeeCostFileChange}
                className="mt-2 block w-full text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <SummaryMetric label="Rows" value={formatNumber(employeeCostSummary.rowCount)} />
            <SummaryMetric label="Total FTE" value={formatNumber(employeeCostSummary.totalFte)} />
            <SummaryMetric
              label="Weighted FTE"
              value={formatNumber(employeeCostSummary.weightedFte)}
            />
            <SummaryMetric
              label="Role types"
              value={formatNumber(employeeCostSummary.roleTypeCount)}
            />
            <SummaryMetric
              label="Rows needing review"
              value={formatNumber(employeeCostSummary.invalidRows)}
            />
          </div>

          <div className="rounded-md border border-line bg-white p-4 text-sm text-ink/70">
            <p className="font-semibold text-ink">Required headers</p>
            <p className="mt-2 break-words">{employeeCostHeaders.join(", ")}</p>
          </div>

          <div className="rounded-md border border-line bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-ink">Recent employee cost uploads</p>
              <p className="text-xs font-medium uppercase text-ink/50">
                {formatNumber(employeeCostSummary.uploadBatches.length)} batches
              </p>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="bg-field text-left text-xs uppercase text-ink/60">
                  <tr>
                    <th className="px-3 py-2 font-semibold">File</th>
                    <th className="px-3 py-2 font-semibold">Uploaded</th>
                    <th className="px-3 py-2 font-semibold">Rows</th>
                    <th className="px-3 py-2 font-semibold">Total FTE</th>
                    <th className="px-3 py-2 font-semibold">Weighted FTE</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeCostSummary.uploadBatches.map((batch) => (
                    <tr key={batch.batchId} className="border-t border-line">
                      <td className="px-3 py-2">{batch.fileName}</td>
                      <td className="px-3 py-2">
                        {batch.uploadedAt ? new Date(batch.uploadedAt).toLocaleString("en-GB") : ""}
                      </td>
                      <td className="px-3 py-2">{formatNumber(batch.rowCount)}</td>
                      <td className="px-3 py-2">{formatNumber(batch.totalFte)}</td>
                      <td className="px-3 py-2">{formatNumber(batch.weightedFte)}</td>
                      <td className="px-3 py-2">
                        {employeeCostBatchToRemove === batch.batchId ? (
                          <button
                            type="button"
                            disabled={isArchived}
                            onClick={() => {
                              removeEmployeeCostUploadBatch(batch.batchId).catch(
                                (error: unknown) => {
                                  setEmployeeCostCloudStatus(
                                    `Batch removal failed: ${getErrorMessage(error)}`
                                  );
                                }
                              );
                            }}
                            className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:text-ink/40"
                          >
                            Confirm remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isArchived}
                            onClick={() => setEmployeeCostBatchToRemove(batch.batchId)}
                            className="rounded-md border border-line px-3 py-1 text-xs font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
                          >
                            Remove batch
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {employeeCostSummary.uploadBatches.length === 0 ? (
                    <tr className="border-t border-line">
                      <td colSpan={6} className="px-3 py-4 text-center text-ink/60">
                        No employee cost upload batches yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {employeeCostImportStatus ? (
            <p className="text-sm font-medium text-semarts-dark">{employeeCostImportStatus}</p>
          ) : null}
          {employeeCostCloudStatus ? (
            <p className="text-sm font-medium text-semarts-dark">{employeeCostCloudStatus}</p>
          ) : null}
          {employeeCostImportErrors.length > 0 ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Import needs review</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {employeeCostImportErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-field text-left text-xs uppercase text-ink/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Role type</th>
              <th className="px-4 py-3 font-semibold">FTE</th>
              <th className="px-4 py-3 font-semibold">% time</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {methodologyInputs.employeeCosts.map((row) => {
              const review = getEmployeeCostRowReview(row);

              return (
              <tr key={row.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <TextInput
                    value={row.role}
                    disabled={isArchived}
                    onChange={(value) => updateEmployeeCost(row.id, { role: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={row.roleType}
                    disabled={isArchived}
                    onChange={(event) =>
                      updateEmployeeCost(row.id, {
                        roleType: event.target.value as EmployeeRoleType
                      })
                    }
                    className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                  >
                    {roleTypes.map((roleType) => (
                      <option key={roleType}>{roleType}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <NumberCell
                    value={row.fte}
                    disabled={isArchived}
                    onChange={(value) => updateEmployeeCost(row.id, { fte: toNumber(value) })}
                  />
                </td>
                <td className="px-4 py-3">
                  <NumberCell
                    value={row.timePercent}
                    disabled={isArchived}
                    onChange={(value) =>
                      updateEmployeeCost(row.id, { timePercent: toNumber(value) })
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      review.status === "Healthy"
                        ? "bg-field text-semarts-dark"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {review.status}
                  </span>
                  {review.issues.length > 0 ? (
                    <p className="mt-2 text-xs text-red-700">{review.issues.join(", ")}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <RemoveButton
                    disabled={isArchived}
                    onClick={() =>
                      setMethodologyInputs({
                        ...methodologyInputs,
                        employeeCosts: methodologyInputs.employeeCosts.filter(
                          (cost) => cost.id !== row.id
                        )
                      })
                    }
                  />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        </WorkbookTableSection>
      ) : null}

      {showAllSections || section === "indirect-overheads" ? (
        <WorkbookTableSection
          title="Indirect overheads"
          source="Inputs and Selections A88:E97"
          addLabel="Add overhead"
          onAdd={() =>
            setMethodologyInputs({
              ...methodologyInputs,
              indirectOverheads: [
                ...methodologyInputs.indirectOverheads,
                createIndirectOverheadInput()
              ]
            })
          }
          disabled={isArchived}
        >
        <div className="mb-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                downloadIndirectOverheadTemplate().catch((error: unknown) => {
                  setIndirectOverheadImportErrors([
                    `Template download failed: ${getErrorMessage(error)}`
                  ]);
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
            >
              Download overhead template
            </button>
            <button
              type="button"
              disabled={isArchived}
              onClick={() => {
                saveIndirectOverheadsToCloud().catch((error: unknown) => {
                  setIndirectOverheadCloudStatus(`Cloud save failed: ${getErrorMessage(error)}`);
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
            >
              Save to cloud
            </button>
            <button
              type="button"
              disabled={isArchived}
              onClick={() => {
                restoreIndirectOverheadsFromCloud().catch((error: unknown) => {
                  setIndirectOverheadCloudStatus(`Cloud restore failed: ${getErrorMessage(error)}`);
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
            >
              Restore from cloud
            </button>
            {confirmClearIndirectOverheads ? (
              <button
                type="button"
                disabled={isArchived}
                onClick={() => {
                  clearIndirectOverheadData().catch((error: unknown) => {
                    setIndirectOverheadCloudStatus(
                      `Indirect overhead clear failed: ${getErrorMessage(error)}`
                    );
                  });
                }}
                className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:text-ink/40"
              >
                Confirm clear all
              </button>
            ) : (
              <button
                type="button"
                disabled={isArchived || methodologyInputs.indirectOverheads.length === 0}
                onClick={() => setConfirmClearIndirectOverheads(true)}
                className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
              >
                Clear all
              </button>
            )}
            <label className="block rounded-md border border-dashed border-line bg-field px-4 py-3">
              <span className="text-sm font-semibold">Upload overhead template</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                disabled={isArchived}
                onChange={handleIndirectOverheadFileChange}
                className="mt-2 block w-full text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SummaryMetric label="Rows" value={formatNumber(indirectOverheadSummary.rowCount)} />
            <SummaryMetric
              label="Annual cost"
              value={formatNumber(indirectOverheadSummary.totalAnnualCost)}
            />
            <SummaryMetric
              label="Rows needing review"
              value={formatNumber(indirectOverheadSummary.invalidRows)}
            />
          </div>

          <div className="rounded-md border border-line bg-white p-4 text-sm text-ink/70">
            <p className="font-semibold text-ink">Required headers</p>
            <p className="mt-2 break-words">{indirectOverheadHeaders.join(", ")}</p>
          </div>

          <div className="rounded-md border border-line bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-ink">Recent overhead uploads</p>
              <p className="text-xs font-medium uppercase text-ink/50">
                {formatNumber(indirectOverheadSummary.uploadBatches.length)} batches
              </p>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="bg-field text-left text-xs uppercase text-ink/60">
                  <tr>
                    <th className="px-3 py-2 font-semibold">File</th>
                    <th className="px-3 py-2 font-semibold">Uploaded</th>
                    <th className="px-3 py-2 font-semibold">Rows</th>
                    <th className="px-3 py-2 font-semibold">Annual cost</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {indirectOverheadSummary.uploadBatches.map((batch) => (
                    <tr key={batch.batchId} className="border-t border-line">
                      <td className="px-3 py-2">{batch.fileName}</td>
                      <td className="px-3 py-2">
                        {batch.uploadedAt ? new Date(batch.uploadedAt).toLocaleString("en-GB") : ""}
                      </td>
                      <td className="px-3 py-2">{formatNumber(batch.rowCount)}</td>
                      <td className="px-3 py-2">{formatNumber(batch.totalAnnualCost)}</td>
                      <td className="px-3 py-2">
                        {indirectOverheadBatchToRemove === batch.batchId ? (
                          <button
                            type="button"
                            disabled={isArchived}
                            onClick={() => {
                              removeIndirectOverheadUploadBatch(batch.batchId).catch(
                                (error: unknown) => {
                                  setIndirectOverheadCloudStatus(
                                    `Batch removal failed: ${getErrorMessage(error)}`
                                  );
                                }
                              );
                            }}
                            className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:text-ink/40"
                          >
                            Confirm remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isArchived}
                            onClick={() => setIndirectOverheadBatchToRemove(batch.batchId)}
                            className="rounded-md border border-line px-3 py-1 text-xs font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
                          >
                            Remove batch
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {indirectOverheadSummary.uploadBatches.length === 0 ? (
                    <tr className="border-t border-line">
                      <td colSpan={5} className="px-3 py-4 text-center text-ink/60">
                        No overhead upload batches yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {indirectOverheadImportStatus ? (
            <p className="text-sm font-medium text-semarts-dark">
              {indirectOverheadImportStatus}
            </p>
          ) : null}
          {indirectOverheadCloudStatus ? (
            <p className="text-sm font-medium text-semarts-dark">
              {indirectOverheadCloudStatus}
            </p>
          ) : null}
          {indirectOverheadImportErrors.length > 0 ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Import needs review</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {indirectOverheadImportErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-field text-left text-xs uppercase text-ink/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Annual cost</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {methodologyInputs.indirectOverheads.map((row) => {
              const review = getIndirectOverheadRowReview(row);

              return (
              <tr key={row.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <TextInput
                    value={row.description}
                    disabled={isArchived}
                    onChange={(value) => updateOverhead(row.id, { description: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <NumberCell
                    value={row.annualCost}
                    disabled={isArchived}
                    onChange={(value) => updateOverhead(row.id, { annualCost: toNumber(value) })}
                  />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      review.status === "Healthy"
                        ? "bg-field text-semarts-dark"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {review.status}
                  </span>
                  {review.issues.length > 0 ? (
                    <p className="mt-2 text-xs text-red-700">{review.issues.join(", ")}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <RemoveButton
                    disabled={isArchived}
                    onClick={() =>
                      setMethodologyInputs({
                        ...methodologyInputs,
                        indirectOverheads: methodologyInputs.indirectOverheads.filter(
                          (cost) => cost.id !== row.id
                        )
                      })
                    }
                  />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        </WorkbookTableSection>
      ) : null}

      {showAllSections || section === "asset-data" ? (
        <WorkbookTableSection
          title="Asset register"
          source="Asset Data A12:N60"
          addLabel="Add asset"
          onAdd={() =>
            setMethodologyInputs({
              ...methodologyInputs,
              assets: [...methodologyInputs.assets, createAssetInput()]
            })
          }
          disabled={isArchived}
        >
        <div className="mb-5 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                downloadAssetTemplate().catch((error: unknown) => {
                  setAssetImportErrors([
                    error instanceof Error
                      ? `Template download failed: ${error.message}`
                      : "Template download failed."
                  ]);
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
            >
              Download asset template
            </button>
            <button
              type="button"
              disabled={isArchived}
              onClick={() => {
                saveAssetsToCloud().catch((error: unknown) => {
                  setAssetCloudStatus(
                    `Cloud save failed: ${getErrorMessage(error)}`
                  );
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
            >
              Save to cloud
            </button>
            <button
              type="button"
              disabled={isArchived}
              onClick={() => {
                restoreAssetsFromCloud().catch((error: unknown) => {
                  setAssetCloudStatus(
                    `Cloud restore failed: ${getErrorMessage(error)}`
                  );
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
            >
              Restore from cloud
            </button>
            {confirmClearAssets ? (
              <button
                type="button"
                disabled={isArchived}
                onClick={() => {
                  clearAssetData().catch((error: unknown) => {
                    setAssetCloudStatus(
                      `Asset data clear failed: ${getErrorMessage(error)}`
                    );
                  });
                }}
                className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:text-ink/40"
              >
                Confirm clear all
              </button>
            ) : (
              <button
                type="button"
                disabled={isArchived || methodologyInputs.assets.length === 0}
                onClick={() => setConfirmClearAssets(true)}
                className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
              >
                Clear all
              </button>
            )}
            <label className="block rounded-md border border-dashed border-line bg-field px-4 py-3">
              <span className="text-sm font-semibold">Upload asset template</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                disabled={isArchived}
                onChange={handleAssetFileChange}
                className="mt-2 block w-full text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <SummaryMetric label="Assets" value={formatNumber(assetSummary.rowCount)} />
            <SummaryMetric
              label="Total asset value"
              value={formatNumber(assetSummary.totalAssetValue)}
            />
            <SummaryMetric
              label="Chargeable value"
              value={formatNumber(assetSummary.chargeableAssetValue)}
            />
            <SummaryMetric
              label="Rows needing review"
              value={formatNumber(assetSummary.invalidRows)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AssetSummaryTable title="Value by voltage" rows={assetSummary.byVoltage} />
            <AssetSummaryTable title="Value by network level" rows={assetSummary.byNetworkLevel} />
          </div>

          <div className="rounded-md border border-line bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-ink">Recent asset uploads</p>
              <p className="text-xs font-medium uppercase text-ink/50">
                {formatNumber(assetSummary.uploadBatches.length)} batches
              </p>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead className="bg-field text-left text-xs uppercase text-ink/60">
                  <tr>
                    <th className="px-3 py-2 font-semibold">File</th>
                    <th className="px-3 py-2 font-semibold">Uploaded</th>
                    <th className="px-3 py-2 font-semibold">Rows</th>
                    <th className="px-3 py-2 font-semibold">Asset value</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assetSummary.uploadBatches.map((batch) => (
                    <tr key={batch.batchId} className="border-t border-line">
                      <td className="px-3 py-2">{batch.fileName}</td>
                      <td className="px-3 py-2">
                        {batch.uploadedAt ? new Date(batch.uploadedAt).toLocaleString("en-GB") : ""}
                      </td>
                      <td className="px-3 py-2">{formatNumber(batch.rowCount)}</td>
                      <td className="px-3 py-2">{formatNumber(batch.totalAssetValue)}</td>
                      <td className="px-3 py-2">
                        {assetBatchToRemove === batch.batchId ? (
                          <button
                            type="button"
                            disabled={isArchived}
                            onClick={() => {
                              removeAssetUploadBatch(batch.batchId).catch((error: unknown) => {
                                setAssetCloudStatus(
                                  `Batch removal failed: ${getErrorMessage(error)}`
                                );
                              });
                            }}
                            className="rounded-md border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:text-ink/40"
                          >
                            Confirm remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isArchived}
                            onClick={() => setAssetBatchToRemove(batch.batchId)}
                            className="rounded-md border border-line px-3 py-1 text-xs font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
                          >
                            Remove batch
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {assetSummary.uploadBatches.length === 0 ? (
                    <tr className="border-t border-line">
                      <td colSpan={5} className="px-3 py-4 text-center text-ink/60">
                        No asset upload batches yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-md border border-line bg-white p-4 text-sm text-ink/70">
            <p className="font-semibold text-ink">Required headers</p>
            <p className="mt-2 break-words">{assetDataHeaders.join(", ")}</p>
          </div>

          {assetImportStatus ? (
            <p className="text-sm font-medium text-semarts-dark">{assetImportStatus}</p>
          ) : null}
          {assetCloudStatus ? (
            <p className="text-sm font-medium text-semarts-dark">{assetCloudStatus}</p>
          ) : null}
          {assetImportErrors.length > 0 ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Import needs review</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {assetImportErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead className="bg-field text-left text-xs uppercase text-ink/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Voltage</th>
              <th className="px-4 py-3 font-semibold">Network level</th>
              <th className="px-4 py-3 font-semibold">Life years</th>
              <th className="px-4 py-3 font-semibold">Asset value</th>
              <th className="px-4 py-3 font-semibold">Chargeable</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {methodologyInputs.assets.map((row) => {
              const review = getAssetRowReview(row);

              return (
              <tr key={row.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <TextInput
                    value={row.description}
                    disabled={isArchived}
                    onChange={(value) => updateAsset(row.id, { description: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <TextInput
                    value={row.assetCategory}
                    disabled={isArchived}
                    onChange={(value) => updateAsset(row.id, { assetCategory: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={row.voltage}
                    disabled={isArchived}
                    onChange={(event) =>
                      {
                        const voltage = event.target.value as AssetInput["voltage"];
                        const networkLevel = isValidAssetVoltageNetworkLevel(
                          voltage,
                          row.networkLevel
                        )
                          ? row.networkLevel
                          : "";
                        updateAsset(row.id, { voltage, networkLevel });
                      }
                    }
                    className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                  >
                    {assetVoltages.map((voltage) => (
                      <option key={voltage}>{voltage}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={row.networkLevel}
                    disabled={isArchived}
                    onChange={(event) => updateAsset(row.id, { networkLevel: event.target.value })}
                    className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                  >
                    <option value="">Select</option>
                    {getAssetNetworkLevelsForVoltage(row.voltage).map((networkLevel) => (
                      <option key={networkLevel}>{networkLevel}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <NumberCell
                    value={row.lifeYears}
                    disabled={isArchived}
                    onChange={(value) => updateAsset(row.id, { lifeYears: toNumber(value) })}
                  />
                </td>
                <td className="px-4 py-3">
                  <NumberCell
                    value={row.priorYearAssetValue}
                    disabled={isArchived}
                    onChange={(value) =>
                      updateAsset(row.id, { priorYearAssetValue: toNumber(value) })
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={row.isChargeableOnElectricityTariff}
                    disabled={isArchived}
                    onChange={(event) =>
                      updateAsset(row.id, {
                        isChargeableOnElectricityTariff: event.target.checked
                      })
                    }
                    className="h-5 w-5"
                  />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      review.status === "Healthy"
                        ? "bg-field text-semarts-dark"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {review.status}
                  </span>
                  {review.issues.length > 0 ? (
                    <p className="mt-2 text-xs text-red-700">{review.issues.join(", ")}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <RemoveButton
                    disabled={isArchived}
                    onClick={() =>
                      setMethodologyInputs({
                        ...methodologyInputs,
                        assets: methodologyInputs.assets.filter((asset) => asset.id !== row.id)
                      })
                    }
                  />
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        </WorkbookTableSection>
      ) : null}

      {showAllSections || section === "transmission-distribution" ? (
        <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Transmission and Distribution</h2>
        <p className="mt-1 text-sm text-ink/70">
          Source: Inputs and Selections A112:B146.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isArchived}
            onClick={() => {
              saveSupplyDetailsToCloud().catch((error: unknown) => {
                setSupplyCloudStatus(`Cloud save failed: ${getErrorMessage(error)}`);
              });
            }}
            className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
          >
            Save to cloud
          </button>
          <button
            type="button"
            onClick={() => {
              restoreSupplyDetailsFromCloud().catch((error: unknown) => {
                setSupplyCloudStatus(`Cloud restore failed: ${getErrorMessage(error)}`);
              });
            }}
            className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
          >
            Restore from cloud
          </button>
          {confirmClearSupplyDetails ? (
            <button
              type="button"
              disabled={isArchived}
              onClick={() => {
                clearSupplyDetails().catch((error: unknown) => {
                  setSupplyCloudStatus(`Cloud clear failed: ${getErrorMessage(error)}`);
                });
              }}
              className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:text-ink/40"
            >
              Confirm clear supply inputs
            </button>
          ) : (
            <button
              type="button"
              disabled={isArchived || methodologyInputs.supplyDetails.length === 0}
              onClick={() => setConfirmClearSupplyDetails(true)}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
            >
              Clear supply inputs
            </button>
          )}
        </div>
        {supplyCloudStatus ? (
          <p className="mt-2 text-sm font-medium text-semarts-dark">{supplyCloudStatus}</p>
        ) : null}
        <div className="mt-5 space-y-5">
          <div className="rounded-md border border-line bg-field p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold">Supply details</h3>
              <button
                type="button"
                disabled={isArchived}
                onClick={() =>
                  setMethodologyInputs({
                    ...methodologyInputs,
                    supplyDetails: [
                      ...methodologyInputs.supplyDetails,
                      createSupplyDetailsInput()
                    ]
                  })
                }
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold hover:border-semarts"
              >
                Add supply
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[880px] border-collapse text-sm">
                <thead className="bg-white text-left text-xs uppercase text-ink/60">
                  <tr>
                    <th className="px-3 py-2 font-semibold">MPAN</th>
                    <th className="px-3 py-2 font-semibold">DNO / Network Area</th>
                    <th className="px-3 py-2 font-semibold">Supply Capacity (kVA)</th>
                    <th className="px-3 py-2 font-semibold">Voltage</th>
                    <th className="px-3 py-2 font-semibold">Transmission</th>
                    <th className="px-3 py-2 font-semibold">Distribution</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {methodologyInputs.supplyDetails.map((row) => {
                    const dnoNetworkArea = getDnoNetworkAreaForMpan(row.mpan, supplyReferenceData);

                    return (
                    <tr key={row.id} className="border-t border-line">
                      <td className="px-3 py-2">
                        <input
                          value={row.mpan}
                          disabled={isArchived}
                          maxLength={13}
                          inputMode="numeric"
                          onChange={(event) =>
                            updateSupplyDetails(row.id, {
                              mpan: event.target.value.replace(/\D/g, "").slice(0, 13)
                            })
                          }
                          className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                        />
                      </td>
                      <td className="px-3 py-2">
                        {dnoNetworkArea ? (
                          <div>
                            <p className="font-medium">{dnoNetworkArea.dnoName}</p>
                            <p className="text-xs text-ink/60">{dnoNetworkArea.networkArea}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-ink/50">
                            {row.mpan.length >= 2 ? "No reference match" : "Enter MPAN"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <NumberCell
                          value={row.supplyCapacityKva}
                          disabled={isArchived}
                          onChange={(value) =>
                            updateSupplyDetails(row.id, {
                              supplyCapacityKva: toNumber(value)
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.voltage}
                          disabled={isArchived}
                          onChange={(event) =>
                            updateSupplyDetails(row.id, {
                              voltage: event.target.value as SupplyVoltage
                            })
                          }
                          className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                        >
                          {supplyVoltages.map((voltage) => (
                            <option key={voltage}>{voltage}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.transmission}
                          disabled={isArchived}
                          onChange={(event) =>
                            updateSupplyDetails(row.id, {
                              transmission: event.target.value as SupplyChargeBasis
                            })
                          }
                          className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                        >
                          {supplyChargeBases.map((basis) => (
                            <option key={basis}>{basis}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.distribution}
                          disabled={isArchived}
                          onChange={(event) =>
                            updateSupplyDetails(row.id, {
                              distribution: event.target.value as SupplyChargeBasis
                            })
                          }
                          className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                        >
                          {supplyChargeBases.map((basis) => (
                            <option key={basis}>{basis}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <RemoveButton
                          disabled={isArchived}
                          onClick={() =>
                            setMethodologyInputs({
                              ...methodologyInputs,
                              supplyDetails: methodologyInputs.supplyDetails.filter(
                                (supply) => supply.id !== row.id
                              )
                            })
                          }
                        />
                      </td>
                    </tr>
                    );
                  })}
                  {methodologyInputs.supplyDetails.length === 0 ? (
                    <tr className="border-t border-line">
                      <td colSpan={7} className="px-3 py-4 text-center text-ink/60">
                        No supply MPANs entered yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="mt-5 border-t border-line pt-5">
              <h4 className="font-semibold">MPAN-specific fixed charges</h4>
              {supplyRowsRequiringCharges.length === 0 ? (
                <p className="mt-3 rounded-md border border-line bg-white px-4 py-3 text-sm text-ink/60">
                  No fixed transmission or distribution charges required.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {supplyRowsRequiringCharges.map((row) => {
                    const distributionChargeFields =
                      row.voltage === "EHV"
                        ? ehvDistributionChargeFields
                        : lvHvDistributionChargeFields;
                    const showTransmissionCharges = row.transmission === "Fixed";
                    const showDistributionCharges = row.distribution === "Fixed";
                    const rowLabel = row.mpan ? `MPAN ${row.mpan}` : "New supply MPAN";

                    return (
                      <div key={row.id} className="rounded-md border border-line bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h5 className="font-semibold">{rowLabel}</h5>
                            <p className="mt-1 text-xs text-ink/60">
                              {row.voltage} supply, {formatNumber(row.supplyCapacityKva)} kVA
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs font-semibold">
                            <span className="rounded-md border border-line bg-field px-2 py-1">
                              Transmission: {row.transmission}
                            </span>
                            <span className="rounded-md border border-line bg-field px-2 py-1">
                              Distribution: {row.distribution}
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          {showTransmissionCharges ? (
                            <div className="rounded-md border border-line bg-field p-4">
                              <h6 className="font-semibold">Transmission charges</h6>
                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                {transmissionChargeFields.map(({ field, label }) => (
                                  <NumberInput
                                    key={field}
                                    label={label}
                                    value={row[field]}
                                    disabled={isArchived}
                                    onChange={(value) =>
                                      updateSupplyDetails(row.id, {
                                        [field]: toNumber(value)
                                      })
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {showDistributionCharges ? (
                            <div className="rounded-md border border-line bg-field p-4">
                              <h6 className="font-semibold">Distribution charges</h6>
                              <div className="mt-4 grid gap-4 md:grid-cols-2">
                                {[
                                  ...commonDistributionChargeFields,
                                  ...distributionChargeFields
                                ].map(({ field, label }) => (
                                  <NumberInput
                                    key={field}
                                    label={label}
                                    value={row[field]}
                                    disabled={isArchived}
                                    onChange={(value) =>
                                      updateSupplyDetails(row.id, {
                                        [field]: toNumber(value)
                                      })
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        </section>
      ) : null}

      {showAllSections || section === "supply-contract" ? (
        <section className="rounded-md border border-line bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Supply Contract</h2>
          <p className="mt-1 text-sm text-ink/70">
            Source: Inputs and Selections A112:B146.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={isArchived}
              onClick={() => {
                saveSupplyDetailsToCloud().catch((error: unknown) => {
                  setSupplyCloudStatus(`Cloud save failed: ${getErrorMessage(error)}`);
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
            >
              Save to cloud
            </button>
            <button
              type="button"
              onClick={() => {
                restoreSupplyDetailsFromCloud().catch((error: unknown) => {
                  setSupplyCloudStatus(`Cloud restore failed: ${getErrorMessage(error)}`);
                });
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
            >
              Restore from cloud
            </button>
            {confirmClearSupplyDetails ? (
              <button
                type="button"
                disabled={isArchived}
                onClick={() => {
                  clearSupplyDetails().catch((error: unknown) => {
                    setSupplyCloudStatus(`Cloud clear failed: ${getErrorMessage(error)}`);
                  });
                }}
                className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-400 disabled:cursor-not-allowed disabled:text-ink/40"
              >
                Confirm clear supply inputs
              </button>
            ) : (
              <button
                type="button"
                disabled={isArchived || methodologyInputs.supplyDetails.length === 0}
                onClick={() => setConfirmClearSupplyDetails(true)}
                className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:text-ink/40"
              >
                Clear supply inputs
              </button>
            )}
          </div>
          {supplyCloudStatus ? (
            <p className="mt-2 text-sm font-medium text-semarts-dark">{supplyCloudStatus}</p>
          ) : null}
          <div className="mt-5 space-y-5">
            {methodologyInputs.supplyDetails.map((supply) => {
              const supplyLabel = supply.mpan ? `MPAN ${supply.mpan}` : "New supply MPAN";

              return (
                <div key={supply.id} className="rounded-md border border-line bg-field p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{supplyLabel}</h3>
                      <p className="mt-1 text-xs text-ink/60">
                        {supply.voltage} supply, {formatNumber(supply.supplyCapacityKva)} kVA
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isArchived}
                      onClick={() => addSupplyContractCharge(supply.id)}
                      className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold hover:border-semarts"
                    >
                      Add charge
                    </button>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-sm">
                      <thead className="bg-white text-left text-xs uppercase text-ink/60">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Charge Name</th>
                          <th className="px-3 py-2 font-semibold">Losses</th>
                          <th className="px-3 py-2 font-semibold">Charge Type</th>
                          <th className="px-3 py-2 font-semibold">Unit of Measurement</th>
                          <th className="px-3 py-2 font-semibold">Time of Use</th>
                          <th className="px-3 py-2 font-semibold">Rate Unit</th>
                          <th className="px-3 py-2 font-semibold">Rate</th>
                          <th className="px-3 py-2 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supply.supplyContractCharges.map((charge) => {
                          const customTimeOfUse = {
                            ...defaultCustomTimeOfUse,
                            ...charge.customTimeOfUse
                          };

                          return (
                          <Fragment key={charge.id}>
                          <tr className="border-t border-line">
                            <td className="px-3 py-2">
                              <input
                                value={charge.chargeName}
                                disabled={isArchived}
                                onChange={(event) =>
                                  updateSupplyContractCharge(supply.id, charge.id, {
                                    chargeName: event.target.value
                                  })
                                }
                                className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={charge.losses}
                                disabled={isArchived}
                                onChange={(event) =>
                                  updateSupplyContractCharge(supply.id, charge.id, {
                                    losses: event.target.value as SupplyContractLosses
                                  })
                                }
                                className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                              >
                                {supplyContractLosses.map((losses) => (
                                  <option key={losses}>{losses}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={charge.chargeType}
                                disabled={isArchived}
                                onChange={(event) => {
                                  const chargeType = event.target.value as SupplyContractChargeType;

                                  updateSupplyContractCharge(supply.id, charge.id, {
                                    chargeType,
                                    unitOfMeasurement: getDefaultSupplyContractUnit(chargeType)
                                  });
                                }}
                                className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                              >
                                {supplyContractChargeTypes.map((chargeType) => (
                                  <option key={chargeType}>{chargeType}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={charge.unitOfMeasurement}
                                disabled={isArchived}
                                onChange={(event) =>
                                  updateSupplyContractCharge(supply.id, charge.id, {
                                    unitOfMeasurement: event.target.value as SupplyContractUnitOfMeasurement
                                  })
                                }
                                className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                              >
                                {supplyContractUnitsByChargeType[charge.chargeType].map((unit) => (
                                  <option key={unit}>{unit}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={charge.timeOfUse}
                                disabled={isArchived}
                                onChange={(event) =>
                                  updateSupplyContractCharge(supply.id, charge.id, {
                                    timeOfUse: event.target.value as SupplyContractTimeOfUse
                                  })
                                }
                                className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                              >
                                {supplyContractTimeOfUseOptions.map((timeOfUse) => (
                                  <option key={timeOfUse}>{timeOfUse}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={charge.rateUnit}
                                disabled={isArchived}
                                onChange={(event) =>
                                  updateSupplyContractCharge(supply.id, charge.id, {
                                    rateUnit: event.target.value as SupplyContractRateUnit
                                  })
                                }
                                className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                              >
                                {supplyContractRateUnits.map((rateUnit) => (
                                  <option key={rateUnit}>{rateUnit}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <NumberCell
                                value={charge.rate}
                                disabled={isArchived}
                                onChange={(value) =>
                                  updateSupplyContractCharge(supply.id, charge.id, {
                                    rate: toNumber(value)
                                  })
                                }
                              />
                            </td>
                            <td className="px-3 py-2">
                              <RemoveButton
                                disabled={isArchived}
                                onClick={() => removeSupplyContractCharge(supply.id, charge.id)}
                              />
                            </td>
                          </tr>
                          {charge.timeOfUse === "Custom" ? (
                            <tr className="border-t border-line">
                              <td colSpan={8} className="bg-white px-3 py-4">
                                <div className="rounded-md border border-line bg-field p-4">
                                  <h4 className="font-semibold">Custom time of use</h4>
                                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                    <div>
                                      <p className="text-sm font-medium">Days of week</p>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {supplyContractDaysOfWeek.map((day) => (
                                          <label
                                            key={day}
                                            className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={customTimeOfUse.daysOfWeek.includes(day)}
                                              disabled={isArchived}
                                              onChange={() =>
                                                updateSupplyContractCustomTimeOfUse(
                                                  supply.id,
                                                  charge,
                                                  {
                                                    daysOfWeek: toggleSupplyContractCustomValue(
                                                      customTimeOfUse.daysOfWeek,
                                                      day
                                                    )
                                                  }
                                                )
                                              }
                                            />
                                            {day}
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Months</p>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {supplyContractMonths.map((month) => (
                                          <label
                                            key={month}
                                            className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={customTimeOfUse.months.includes(month)}
                                              disabled={isArchived}
                                              onChange={() =>
                                                updateSupplyContractCustomTimeOfUse(
                                                  supply.id,
                                                  charge,
                                                  {
                                                    months: toggleSupplyContractCustomValue(
                                                      customTimeOfUse.months,
                                                      month
                                                    )
                                                  }
                                                )
                                              }
                                            />
                                            {month}
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Bank holidays</p>
                                      <label className="mt-2 flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm">
                                        <input
                                          type="checkbox"
                                          checked={customTimeOfUse.appliesOnBankHolidays}
                                          disabled={isArchived}
                                          onChange={(event) =>
                                            updateSupplyContractCustomTimeOfUse(
                                              supply.id,
                                              charge,
                                              {
                                                appliesOnBankHolidays: event.target.checked
                                              }
                                            )
                                          }
                                        />
                                        Included
                                      </label>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <label className="block">
                                        <span className="text-sm font-medium">Start time</span>
                                        <input
                                          type="time"
                                          value={customTimeOfUse.startTime}
                                          disabled={isArchived}
                                          onChange={(event) =>
                                            updateSupplyContractCustomTimeOfUse(
                                              supply.id,
                                              charge,
                                              { startTime: event.target.value }
                                            )
                                          }
                                          className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                                        />
                                      </label>
                                      <label className="block">
                                        <span className="text-sm font-medium">End time</span>
                                        <input
                                          type="time"
                                          value={customTimeOfUse.endTime}
                                          disabled={isArchived}
                                          onChange={(event) =>
                                            updateSupplyContractCustomTimeOfUse(
                                              supply.id,
                                              charge,
                                              { endTime: event.target.value }
                                            )
                                          }
                                          className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                                        />
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                          </Fragment>
                          );
                        })}
                        {supply.supplyContractCharges.length === 0 ? (
                          <tr className="border-t border-line">
                            <td colSpan={8} className="px-3 py-4 text-center text-ink/60">
                              No supply contract charges entered yet.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            {methodologyInputs.supplyDetails.length === 0 ? (
              <div className="rounded-md border border-line bg-field p-4 text-sm text-ink/60">
                Add MPANs in Transmission & Distribution before entering supply contract charges.
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <SaveFooter
        disabled={isArchived}
        saveState={saveState}
        validationErrors={supplyDetailsValidationErrors}
        onSave={() => save(methodologyInputs, "Workbook cost inputs saved locally.")}
      />
    </div>
  );
}

function WorkbookTableSection({
  title,
  source,
  addLabel,
  disabled,
  onAdd,
  children
}: {
  title: string;
  source: string;
  addLabel: string;
  disabled: boolean;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-ink/70">Source: {source}.</p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onAdd}
          className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
        >
          {addLabel}
        </button>
      </div>
      <div className="mt-5 overflow-x-auto">{children}</div>
    </section>
  );
}

function NumberInput({
  label,
  value,
  disabled,
  onChange
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="number"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
      />
    </label>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-field p-4">
      <p className="text-xs font-semibold uppercase text-ink/50">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold">{value}</p>
    </div>
  );
}

function AssetSummaryTable({
  title,
  rows
}: {
  title: string;
  rows: { label: string; rowCount: number; totalValue: number; chargeableValue: number }[];
}) {
  return (
    <div className="rounded-md border border-line bg-white p-4">
      <p className="font-semibold text-ink">{title}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-sm">
          <thead className="bg-field text-left text-xs uppercase text-ink/60">
            <tr>
              <th className="px-3 py-2 font-semibold">Group</th>
              <th className="px-3 py-2 font-semibold">Rows</th>
              <th className="px-3 py-2 font-semibold">Asset value</th>
              <th className="px-3 py-2 font-semibold">Chargeable value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-line">
                <td className="px-3 py-2">{row.label}</td>
                <td className="px-3 py-2">{formatNumber(row.rowCount)}</td>
                <td className="px-3 py-2">{formatNumber(row.totalValue)}</td>
                <td className="px-3 py-2">{formatNumber(row.chargeableValue)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr className="border-t border-line">
                <td colSpan={4} className="px-3 py-4 text-center text-ink/60">
                  No assets entered yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DateInput({
  label,
  value,
  disabled,
  onChange
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
      />
    </label>
  );
}

function TextInput({
  value,
  disabled,
  onChange
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
    />
  );
}

function NumberCell({
  value,
  disabled,
  onChange
}: {
  value: number;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="w-28 rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
    />
  );
}

function VoltageSelect({
  value,
  disabled,
  onChange
}: {
  value: WorkbookVoltage;
  disabled: boolean;
  onChange: (value: WorkbookVoltage) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as WorkbookVoltage)}
      className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
    >
      {voltages.map((voltage) => (
        <option key={voltage}>{voltage}</option>
      ))}
    </select>
  );
}

function RemoveButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
    >
      Remove
    </button>
  );
}

function SaveFooter({
  disabled,
  saveState,
  validationErrors,
  onSave
}: {
  disabled: boolean;
  saveState: string;
  validationErrors: string[];
  onSave: () => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={onSave}
        className="rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark disabled:cursor-not-allowed disabled:bg-ink/30"
      >
        Save workbook inputs
      </button>
      {saveState ? <span className="text-sm font-medium text-semarts-dark">{saveState}</span> : null}
      {validationErrors.length > 0 ? (
        <span className="text-sm font-medium text-red-700">{validationErrors.join(" ")}</span>
      ) : null}
    </div>
  );
}
