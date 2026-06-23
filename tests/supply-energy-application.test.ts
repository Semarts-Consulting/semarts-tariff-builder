import { describe, expect, it } from "vitest";
import { calculateSupplyEnergyApplication } from "@/lib/supply-energy-application";

describe("supply energy application", () => {
  it("creates a tariff row using cumulative customer-level losses", () => {
    const application = calculateSupplyEnergyApplication({
      id: "supply-lv",
      customerClass: "LV",
      nbpPencePerKwh: 10,
      gspPencePerKwh: 20,
      siteMeterPencePerKwh: 30,
      cmPencePerKwh: 40,
      transmissionLossMultiplier: 2,
      dnoDistributionLossFactor: 3,
      ehvLossMultiplier: 1.002,
      hvLossMultiplier: 1.039,
      lvLossMultiplier: 1.059,
      networkLevel: "LV",
      profitMultiplier: 1,
      sourceLabel: "Test supply"
    });

    expect(application.supplyCost.siteMeterPencePerKwh).toBe(190);
    expect(application.supplyCost.privateNetworkLossMultiplier).toBeCloseTo(
      1.102502,
      6
    );
    expect(application.tariffRow).toEqual(
      expect.objectContaining({
        id: "supply-lv",
        customerClass: "LV",
        pencePerKwh: application.supplyCost.finalPencePerKwh,
        sourceRowIds: ["supply-lv"]
      })
    );
  });

  it("leaves site-meter rates without private network uplift", () => {
    const application = calculateSupplyEnergyApplication({
      id: "site-meter-supply",
      customerClass: "Site Meter",
      nbpPencePerKwh: 0,
      gspPencePerKwh: 0,
      siteMeterPencePerKwh: 100,
      cmPencePerKwh: 0,
      transmissionLossMultiplier: 1,
      dnoDistributionLossFactor: 1,
      ehvLossMultiplier: 1.002,
      hvLossMultiplier: 1.039,
      lvLossMultiplier: 1.059,
      networkLevel: "Site Meter",
      profitMultiplier: 1,
      sourceLabel: "Site meter supply"
    });

    expect(application.supplyCost.finalPencePerKwh).toBe(100);
    expect(application.tariffRow.pencePerKwh).toBe(100);
  });
});
