import {
  calculateSupplyEnergyCost,
  type SupplyEnergyCostComponent,
  type SupplyEnergyCostResult
} from "@/lib/supply-energy-cost";
import type { SupplyEnergyTariffRow } from "@/lib/calculation-engine";

export type SupplyEnergyNetworkLevel = "Site Meter" | "EHV" | "HV" | "LV";

export type SupplyEnergyApplicationInput = {
  id: string;
  customerClass: string;
  nbpPencePerKwh: number;
  gspPencePerKwh: number;
  siteMeterPencePerKwh: number;
  cmPencePerKwh: number;
  transmissionLossMultiplier: number;
  dnoDistributionLossFactor: number;
  ehvLossMultiplier: number;
  hvLossMultiplier: number;
  lvLossMultiplier: number;
  networkLevel: SupplyEnergyNetworkLevel;
  profitMultiplier: number;
  sourceLabel: string;
};

export type SupplyEnergyApplicationResult = {
  supplyCost: SupplyEnergyCostResult;
  tariffRow: SupplyEnergyTariffRow;
};

export function calculateSupplyEnergyApplication(
  input: SupplyEnergyApplicationInput
): SupplyEnergyApplicationResult {
  const components: SupplyEnergyCostComponent[] = [
    {
      name: "NBP components",
      pencePerKwh: input.nbpPencePerKwh,
      lossPosition: "NBP",
      source: input.sourceLabel
    },
    {
      name: "GSP components",
      pencePerKwh: input.gspPencePerKwh,
      lossPosition: "GSP",
      source: input.sourceLabel
    },
    {
      name: "Site meter components",
      pencePerKwh: input.siteMeterPencePerKwh,
      lossPosition: "Site Meter",
      source: input.sourceLabel
    },
    {
      name: "CM components",
      pencePerKwh: input.cmPencePerKwh,
      lossPosition: "CM",
      source: input.sourceLabel
    }
  ];
  const supplyCost = calculateSupplyEnergyCost({
    id: input.id,
    band: "Single",
    components,
    transmissionLossMultiplier: input.transmissionLossMultiplier,
    dnoDistributionLossFactor: input.dnoDistributionLossFactor,
    privateNetworkLossMultipliers: privateNetworkLossMultipliersForLevel(input),
    profitMultiplier: input.profitMultiplier
  });

  return {
    supplyCost,
    tariffRow: {
      id: input.id,
      customerClass: input.customerClass,
      pencePerKwh: supplyCost.finalPencePerKwh,
      sourceRowIds: [input.id],
      notes: `${input.sourceLabel} supply energy p/kWh applied to ${input.customerClass}.`
    }
  };
}

function privateNetworkLossMultipliersForLevel(input: SupplyEnergyApplicationInput) {
  if (input.networkLevel === "Site Meter") {
    return [1];
  }

  if (input.networkLevel === "EHV") {
    return [input.ehvLossMultiplier];
  }

  if (input.networkLevel === "HV") {
    return [input.ehvLossMultiplier, input.hvLossMultiplier];
  }

  return [input.ehvLossMultiplier, input.hvLossMultiplier, input.lvLossMultiplier];
}
