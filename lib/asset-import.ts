import {
  createImportedRowId,
  parseRequiredImportNumber,
  validateImportHeaders
} from "@/lib/import-utils";
import type { AssetInput } from "@/types/project";

export const assetDataHeaders = [
  "Description",
  "Asset Category",
  "Electrical Distribution Asset?",
  "Chargeable on electricity tariff?",
  "HV / LV",
  "Network Level",
  "Life Years",
  "Asset Value"
];

export const assetNetworkLevels = ["EHV", "EHV Local", "HV", "HV Local", "LV", "Metering"] as const;

export type AssetNetworkLevel = (typeof assetNetworkLevels)[number];

export const assetNetworkLevelsByVoltage: Record<AssetInput["voltage"], AssetNetworkLevel[]> = {
  EHV: ["EHV", "EHV Local"],
  HV: ["HV", "HV Local"],
  LV: ["LV"],
  Metering: ["Metering"]
};

export type AssetParseResult = {
  parsedRows: AssetInput[];
  errors: string[];
};

export type AssetMergeResult = {
  rows: AssetInput[];
  added: number;
  replaced: number;
  skippedDuplicates: number;
};

export function createAssetImportBatchId() {
  return `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function validateAssetHeaders(headerRow: unknown[]) {
  return validateImportHeaders(assetDataHeaders, headerRow);
}

export function parseYesNo(value: unknown) {
  const text = String(value ?? "").trim().toLowerCase();

  if (["yes", "y", "true", "1"].includes(text)) {
    return true;
  }

  if (["no", "n", "false", "0"].includes(text)) {
    return false;
  }

  return null;
}

export function parseAssetVoltage(value: unknown): AssetInput["voltage"] | null {
  const text = String(value ?? "").trim();

  if (text === "EHV" || text === "HV" || text === "LV" || text === "Metering") {
    return text;
  }

  return null;
}

export function parseAssetNetworkLevel(value: unknown) {
  const text = String(value ?? "").trim();

  return assetNetworkLevels.includes(text as AssetNetworkLevel) ? text : null;
}

export function getAssetNetworkLevelsForVoltage(voltage: string) {
  return assetNetworkLevelsByVoltage[voltage as AssetInput["voltage"]] ?? [];
}

export function isValidAssetVoltageNetworkLevel(
  voltage: AssetInput["voltage"] | string,
  networkLevel: string
) {
  return getAssetNetworkLevelsForVoltage(voltage).includes(networkLevel as AssetNetworkLevel);
}

export function createAssetKey(
  row: Pick<AssetInput, "description" | "assetCategory" | "voltage" | "networkLevel">
) {
  return [row.description, row.assetCategory, row.voltage, row.networkLevel]
    .map((value) => String(value).trim().toLowerCase())
    .join("::");
}

export function createAssetFingerprint(
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

export function parseAssetRows(
  rows: unknown[][],
  sourceFileName: string,
  uploadedAt: string,
  importBatchId: string
): AssetParseResult {
  const parsedRows: AssetInput[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateAssetHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: ["The selected workbook does not match the asset template headers."]
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
    const lifeYears = parseRequiredImportNumber(row[6]);
    const priorYearAssetValue = parseRequiredImportNumber(row[7]);

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

export function mergeAssetRows(
  existingRows: AssetInput[],
  incomingRows: AssetInput[]
): AssetMergeResult {
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
    rows: Array.from(byKey.values()).sort((a, b) => a.description.localeCompare(b.description)),
    added,
    replaced,
    skippedDuplicates
  };
}
