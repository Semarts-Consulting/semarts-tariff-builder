import { describe, expect, it } from "vitest";
import {
  assetDataHeaders,
  createAssetFingerprint,
  isValidAssetVoltageNetworkLevel,
  mergeAssetRows,
  parseAssetRows,
  parseYesNo,
  validateAssetHeaders
} from "@/lib/asset-import";
import type { AssetInput } from "@/types/project";

function createWorkbookRow(overrides: Partial<{
  description: string;
  assetCategory: string;
  isElectricalDistributionAsset: string;
  isChargeableOnElectricityTariff: string;
  voltage: string;
  networkLevel: string;
  lifeYears: number;
  priorYearAssetValue: number;
}> = {}) {
  return [
    overrides.description ?? "Transformer A",
    overrides.assetCategory ?? "Transformer",
    overrides.isElectricalDistributionAsset ?? "Yes",
    overrides.isChargeableOnElectricityTariff ?? "Yes",
    overrides.voltage ?? "HV",
    overrides.networkLevel ?? "HV",
    overrides.lifeYears ?? 40,
    overrides.priorYearAssetValue ?? 125000
  ];
}

function createAssetRow(overrides: Partial<AssetInput> = {}): AssetInput {
  const baseRow = {
    description: overrides.description ?? "Transformer A",
    assetCategory: overrides.assetCategory ?? "Transformer",
    isElectricalDistributionAsset: overrides.isElectricalDistributionAsset ?? true,
    isChargeableOnElectricityTariff: overrides.isChargeableOnElectricityTariff ?? true,
    voltage: overrides.voltage ?? "HV",
    networkLevel: overrides.networkLevel ?? "HV",
    lifeYears: overrides.lifeYears ?? 40,
    priorYearAssetValue: overrides.priorYearAssetValue ?? 125000
  } satisfies Pick<
    AssetInput,
    | "description"
    | "assetCategory"
    | "isElectricalDistributionAsset"
    | "isChargeableOnElectricityTariff"
    | "voltage"
    | "networkLevel"
    | "lifeYears"
    | "priorYearAssetValue"
  >;

  return {
    id: overrides.id ?? "asset-1",
    ...baseRow,
    sourceFileName: overrides.sourceFileName ?? "assets.xlsx",
    uploadedAt: overrides.uploadedAt ?? "2026-06-21T10:00:00.000Z",
    importBatchId: overrides.importBatchId ?? "asset-batch-1",
    rowFingerprint: overrides.rowFingerprint ?? createAssetFingerprint(baseRow)
  };
}

describe("asset import", () => {
  it("validates the expected template headers", () => {
    expect(validateAssetHeaders(assetDataHeaders)).toBe(true);
    expect(validateAssetHeaders(["Description", "Asset Value"])).toBe(false);
  });

  it("parses accepted yes/no values", () => {
    expect(parseYesNo("Yes")).toBe(true);
    expect(parseYesNo("1")).toBe(true);
    expect(parseYesNo("No")).toBe(false);
    expect(parseYesNo("false")).toBe(false);
    expect(parseYesNo("maybe")).toBeNull();
  });

  it("validates voltage and network-level pairings", () => {
    expect(isValidAssetVoltageNetworkLevel("EHV", "EHV Local")).toBe(true);
    expect(isValidAssetVoltageNetworkLevel("HV", "HV Local")).toBe(true);
    expect(isValidAssetVoltageNetworkLevel("LV", "HV")).toBe(false);
    expect(isValidAssetVoltageNetworkLevel("Metering", "Metering")).toBe(true);
  });

  it("parses valid workbook rows", () => {
    const result = parseAssetRows(
      [assetDataHeaders, createWorkbookRow()],
      "assets.xlsx",
      "2026-06-21T10:00:00.000Z",
      "asset-batch-1"
    );

    expect(result.errors).toEqual([]);
    expect(result.parsedRows).toHaveLength(1);
    expect(result.parsedRows[0]).toMatchObject({
      description: "Transformer A",
      assetCategory: "Transformer",
      isElectricalDistributionAsset: true,
      isChargeableOnElectricityTariff: true,
      voltage: "HV",
      networkLevel: "HV",
      lifeYears: 40,
      priorYearAssetValue: 125000,
      sourceFileName: "assets.xlsx",
      importBatchId: "asset-batch-1"
    });
  });

  it("returns row-level errors without importing invalid rows", () => {
    const result = parseAssetRows(
      [
        assetDataHeaders,
        createWorkbookRow({
          description: "",
          isElectricalDistributionAsset: "Maybe",
          voltage: "LV",
          networkLevel: "HV",
          lifeYears: 0,
          priorYearAssetValue: -1
        })
      ],
      "assets.xlsx",
      "2026-06-21T10:00:00.000Z",
      "asset-batch-1"
    );

    expect(result.parsedRows).toHaveLength(0);
    expect(result.errors).toContain("Row 2: Description is required.");
    expect(result.errors).toContain("Row 2: Electrical Distribution Asset must be Yes or No.");
    expect(result.errors).toContain("Row 2: Network Level HV is not valid for Voltage LV.");
    expect(result.errors).toContain("Row 2: Life Years must be greater than zero.");
    expect(result.errors).toContain("Row 2: Asset Value must be zero or greater.");
  });

  it("replaces changed rows by asset key while skipping identical duplicates", () => {
    const existingRow = createAssetRow();
    const duplicateRow = createAssetRow({ id: "asset-2" });
    const replacementRow = createAssetRow({
      id: "asset-3",
      priorYearAssetValue: 150000
    });

    const result = mergeAssetRows([existingRow], [duplicateRow, replacementRow]);

    expect(result.added).toBe(0);
    expect(result.replaced).toBe(1);
    expect(result.skippedDuplicates).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.priorYearAssetValue).toBe(150000);
  });
});
