import { assetNetworkLevels, isValidAssetVoltageNetworkLevel } from "@/lib/asset-import";
import type { AssetNetworkLevel } from "@/lib/asset-import";
import type { AssetInput } from "@/types/project";

export type AssetReadinessStatus = "No records" | "Needs correction" | "Needs review" | "Ready for review";

export type AssetValueGroup = {
  label: string;
  rowCount: number;
  totalValue: number;
  chargeableValue: number;
};

export type AssetReadinessSummary = {
  status: AssetReadinessStatus;
  rowCount: number;
  totalAssetValue: number;
  electricalDistributionAssetValue: number;
  chargeableAssetValue: number;
  nonChargeableAssetValue: number;
  invalidRows: number;
  reviewMessages: string[];
  byVoltage: AssetValueGroup[];
  byNetworkLevel: AssetValueGroup[];
};

export function getAssetRowReadiness(row: AssetInput) {
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
    status: issues.length > 0 ? "Needs correction" : "Ready for review"
  } as const;
}

export function summariseAssetReadiness(rows: AssetInput[]): AssetReadinessSummary {
  const totalAssetValue = rows.reduce((total, row) => total + row.priorYearAssetValue, 0);
  const electricalDistributionAssetValue = rows
    .filter((row) => row.isElectricalDistributionAsset)
    .reduce((total, row) => total + row.priorYearAssetValue, 0);
  const chargeableAssetValue = rows
    .filter((row) => row.isChargeableOnElectricityTariff)
    .reduce((total, row) => total + row.priorYearAssetValue, 0);
  const invalidRows = rows.filter((row) => getAssetRowReadiness(row).issues.length > 0).length;
  const nonChargeableAssetValue = totalAssetValue - chargeableAssetValue;
  const reviewMessages: string[] = [];

  if (rows.length === 0) {
    reviewMessages.push("No asset evidence has been recorded yet.");
  }

  if (invalidRows > 0) {
    reviewMessages.push(`${invalidRows} asset row${invalidRows === 1 ? "" : "s"} need correction.`);
  }

  if (nonChargeableAssetValue > 0) {
    reviewMessages.push(
      `${formatNumber(nonChargeableAssetValue)} asset value is non-chargeable or evidence-only.`
    );
  }

  if (reviewMessages.length === 0) {
    reviewMessages.push("Asset evidence is ready for review.");
  }

  return {
    status:
      rows.length === 0
        ? "No records"
        : invalidRows > 0
          ? "Needs correction"
          : nonChargeableAssetValue > 0
            ? "Needs review"
            : "Ready for review",
    rowCount: rows.length,
    totalAssetValue,
    electricalDistributionAssetValue,
    chargeableAssetValue,
    nonChargeableAssetValue,
    invalidRows,
    reviewMessages,
    byVoltage: getAssetValueGroups(rows, "voltage"),
    byNetworkLevel: getAssetValueGroups(rows, "networkLevel")
  };
}

function getAssetValueGroups(rows: AssetInput[], groupField: "voltage" | "networkLevel") {
  const groups = new Map<string, AssetValueGroup>();

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

  return Array.from(groups.values()).sort((left, right) => left.label.localeCompare(right.label));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 2
  }).format(value);
}
