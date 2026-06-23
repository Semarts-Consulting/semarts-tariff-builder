import { describe, expect, it } from "vitest";
import {
  calculateSupplyEnergyCost,
  convertDemandChargeToPencePerKwh,
  weightedPencePerKwh
} from "@/lib/supply-energy-cost";

describe("supply energy cost", () => {
  it("recreates the BRS blended LV supply cost from the documented model steps", () => {
    const result = calculateSupplyEnergyCost({
      id: "brs-lv-supply",
      band: "Single",
      components: [
        component("Power Price", 9.92, "NBP", "BRS Forecasted Energy Costs"),
        component("Shape Fee", 0, "NBP", "BRS Forecasted Energy Costs"),
        component("Imbalance Charge", 0, "NBP", "BRS Forecasted Energy Costs"),
        component("Management Fee", 0.1148, "NBP", "BRS Forecasted Energy Costs"),
        component("CfD Cost", 1.09, "NBP", "BRS Forecasted Energy Costs"),
        component("BSUoS and RCRC", 1.345, "NBP", "BRS Forecasted Energy Costs"),
        {
          name: "Capacity Market Settlement Cost",
          pencePerKwh: 1.2616,
          source: "BRS Forecasted Energy Costs",
          lossPosition: "NBP"
        },
        component("Triad", 0.3657, "NBP", "BRS Forecasted Energy Costs"),
        {
          name: "Energy Intensive Industries",
          pencePerKwh: 0.1445,
          source: "BRS Forecasted Energy Costs",
          lossPosition: "NBP"
        },
        component("RAB", 0.345, "NBP", "BRS Forecasted Energy Costs"),
        component("DUoS Super Red", 0.014, "GSP", "BRS DNO - Losses and Super Red"),
        component("Settlement Admin Charge", 0.02, "Site Meter", "BRS Selections & Inputs"),
        component("CfD Admin Fee", 0, "Site Meter", "BRS Selections & Inputs"),
        component("Capacity Market Admin Fee", 0.003, "Site Meter", "BRS Selections & Inputs"),
        component("Hydro Levy", 0.045, "Site Meter", "BRS Selections & Inputs"),
        component("RO", 3.31, "Site Meter", "BRS Selections & Inputs"),
        component("FiT", 1.125, "Site Meter", "BRS Selections & Inputs"),
        component("REGOs", 0, "Site Meter", "BRS Selections & Inputs"),
        component("CCL", 0.79825, "Site Meter", "BRS Selections & Inputs"),
        component("Elexon", 0, "Site Meter", "BRS Selections & Inputs"),
        component("DC and DA", 0.0045, "Site Meter", "BRS Selections & Inputs"),
        component("MOP", 0.0017, "Site Meter", "BRS Selections & Inputs"),
        component("Admin", 0, "Site Meter", "BRS Selections & Inputs")
      ],
      transmissionLossMultiplier: 1.017,
      dnoDistributionLossFactor: 1.020088,
      privateNetworkLossMultipliers: [1.091267],
      profitMultiplier: 1
    });

    expect(result.baseSupplyCostPencePerKwh).toBeCloseTo(14.5866, 4);
    expect(result.aboveGspPencePerKwh).toBeCloseTo(14.8345, 3);
    expect(result.gspPencePerKwh).toBeCloseTo(14.8486, 3);
    expect(result.siteMeterPencePerKwh).toBeCloseTo(20.4543, 3);
    expect(result.finalPencePerKwh).toBeCloseTo(22.3211, 3);
    expect(result.auditTrace.map((entry) => entry.stage)).toEqual([
      "Base supply cost",
      "Transmission losses",
      "GSP cost",
      "DNO losses",
      "Site meter pass-through",
      "Private network losses",
      "Profit"
    ]);
  });

  it("recreates the POTLL combined supply cost progression through network levels", () => {
    const siteMeter = calculateSupplyEnergyCost({
      id: "potll-combined-site",
      band: "Combined",
      components: potllComponents(),
      transmissionLossMultiplier: 1.01686,
      dnoDistributionLossFactor: 1.008457,
      privateNetworkLossMultipliers: [1],
      profitMultiplier: 1
    });
    const ehv = calculateSupplyEnergyCost({
      ...potllBaseInput(),
      id: "potll-combined-ehv",
      privateNetworkLossMultipliers: [1.002]
    });
    const hv = calculateSupplyEnergyCost({
      ...potllBaseInput(),
      id: "potll-combined-hv",
      privateNetworkLossMultipliers: [1.002, 1.039]
    });
    const lv = calculateSupplyEnergyCost({
      ...potllBaseInput(),
      id: "potll-combined-lv",
      privateNetworkLossMultipliers: [1.002, 1.039, 1.059]
    });

    expect(siteMeter.finalPencePerKwh).toBeCloseTo(27.4008, 3);
    expect(ehv.finalPencePerKwh).toBeCloseTo(27.4556, 2);
    expect(hv.finalPencePerKwh).toBeCloseTo(28.5264, 2);
    expect(lv.finalPencePerKwh).toBeCloseTo(30.2095, 2);
  });

  it("converts demand and time-banded rates into p/kWh denominators", () => {
    expect(
      convertDemandChargeToPencePerKwh({
        chargeGbpPerKw: 30,
        demandKw: 100,
        consumptionKwh: 1_000_000
      })
    ).toBeCloseTo(0.3, 4);

    expect(
      weightedPencePerKwh({
        dayPencePerKwh: 27.7564,
        dayKwh: 712000,
        nightPencePerKwh: 22.8974,
        nightKwh: 288000
      })
    ).toBeCloseTo(26.357, 3);
  });

  it("builds the rate by loss position before applying cumulative site losses", () => {
    const result = calculateSupplyEnergyCost({
      id: "loss-position-check",
      band: "Single",
      components: [
        component("NBP component", 10, "NBP", "nbp-source"),
        component("GSP component", 20, "GSP", "gsp-source"),
        component("Site component", 30, "Site Meter", "site-source"),
        component("Customer meter component", 40, "CM", "cm-source")
      ],
      transmissionLossMultiplier: 2,
      dnoDistributionLossFactor: 3,
      privateNetworkLossMultipliers: [4],
      profitMultiplier: 1
    });

    expect(result.siteMeterPencePerKwh).toBe(190);
    expect(result.finalPencePerKwh).toBe(760);
    expect(result.customerMeterInputPencePerKwh).toBe(40);
  });

  it("applies customer-specific private network losses cumulatively by network level", () => {
    const baseInput = {
      id: "network-level-check",
      band: "Combined" as const,
      components: [component("Site meter supply cost", 100, "CM", "supply-source")],
      transmissionLossMultiplier: 1,
      dnoDistributionLossFactor: 1,
      profitMultiplier: 1
    };
    const ehv = calculateSupplyEnergyCost({
      ...baseInput,
      privateNetworkLossMultipliers: [1.002]
    });
    const hv = calculateSupplyEnergyCost({
      ...baseInput,
      privateNetworkLossMultipliers: [1.002, 1.039]
    });
    const lv = calculateSupplyEnergyCost({
      ...baseInput,
      privateNetworkLossMultipliers: [1.002, 1.039, 1.059]
    });

    expect(ehv.finalPencePerKwh).toBeCloseTo(100.2, 4);
    expect(hv.finalPencePerKwh).toBeCloseTo(104.1078, 4);
    expect(lv.finalPencePerKwh).toBeCloseTo(110.2502, 4);
  });
});

function potllBaseInput() {
  return {
    band: "Combined" as const,
    components: potllComponents(),
    transmissionLossMultiplier: 1.01686,
    dnoDistributionLossFactor: 1.008457,
    profitMultiplier: 1
  };
}

function potllComponents() {
  return [
    component("Triad", 0.0209, "NBP", "POTLL Supply Costs"),
    component("DUoS super red", 0.0186, "GSP", "POTLL Supply Costs"),
    component("Combined unit charge", 26.3626, "GSP", "POTLL Supply Costs"),
    component("CCL", 0.775, "Site Meter", "POTLL Supply Costs"),
    component("Elexon fixed", 0.0000006, "Site Meter", "POTLL Supply Costs"),
    component("Standing charge", 0.0001296, "Site Meter", "POTLL Supply Costs")
  ];
}

function component(
  name: string,
  pencePerKwh: number,
  lossPosition: "NBP" | "GSP" | "Site Meter" | "CM",
  source: string
) {
  return { name, pencePerKwh, lossPosition, source };
}
