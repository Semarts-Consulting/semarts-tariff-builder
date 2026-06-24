import { describe, expect, it } from "vitest";
import { getAssetRowReadiness, summariseAssetReadiness } from "@/lib/asset-readiness";
import type { AssetInput } from "@/types/project";

function asset(overrides: Partial<AssetInput> = {}): AssetInput {
  return {
    id: overrides.id ?? "asset-1",
    description: overrides.description ?? "Transformer A",
    assetCategory: overrides.assetCategory ?? "Transformer",
    isElectricalDistributionAsset: overrides.isElectricalDistributionAsset ?? true,
    isChargeableOnElectricityTariff: overrides.isChargeableOnElectricityTariff ?? true,
    voltage: overrides.voltage ?? "HV",
    networkLevel: overrides.networkLevel ?? "HV",
    lifeYears: overrides.lifeYears ?? 40,
    priorYearAssetValue: overrides.priorYearAssetValue ?? 100000,
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: ""
  };
}

describe("asset readiness", () => {
  it("summarises chargeable asset evidence by voltage and network level", () => {
    const summary = summariseAssetReadiness([
      asset(),
      asset({ id: "asset-2", voltage: "LV", networkLevel: "LV", priorYearAssetValue: 50000 })
    ]);

    expect(summary.status).toBe("Ready for review");
    expect(summary.totalAssetValue).toBe(150000);
    expect(summary.chargeableAssetValue).toBe(150000);
    expect(summary.byVoltage).toEqual([
      expect.objectContaining({ label: "HV", totalValue: 100000 }),
      expect.objectContaining({ label: "LV", totalValue: 50000 })
    ]);
  });

  it("flags invalid asset rows for correction", () => {
    const row = asset({ description: "", voltage: "LV", networkLevel: "HV", lifeYears: 0 });

    expect(getAssetRowReadiness(row).issues).toEqual([
      "Missing description",
      "Invalid life",
      "Network level does not match voltage"
    ]);
    expect(summariseAssetReadiness([row]).status).toBe("Needs correction");
  });

  it("flags non-chargeable asset value as review evidence", () => {
    const summary = summariseAssetReadiness([
      asset(),
      asset({
        id: "asset-2",
        isChargeableOnElectricityTariff: false,
        priorYearAssetValue: 25000
      })
    ]);

    expect(summary.status).toBe("Needs review");
    expect(summary.nonChargeableAssetValue).toBe(25000);
    expect(summary.reviewMessages).toContain(
      "25,000 asset value is non-chargeable or evidence-only."
    );
  });
});
