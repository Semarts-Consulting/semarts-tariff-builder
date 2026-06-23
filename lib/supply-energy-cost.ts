import type { SupplyContractLosses } from "@/types/project";

export type SupplyEnergyCostBand = "Single" | "Day" | "Night" | "Combined";

export type SupplyEnergyLossPosition = SupplyContractLosses | "Site Meter";

export type SupplyEnergyCostComponent = {
  name: string;
  pencePerKwh: number;
  source: string;
  lossPosition: SupplyEnergyLossPosition;
};

export type SupplyEnergyCostInput = {
  id: string;
  band: SupplyEnergyCostBand;
  transmissionLossMultiplier: number;
  dnoDistributionLossFactor: number;
  privateNetworkLossMultipliers: number[];
  profitMultiplier: number;
  components: SupplyEnergyCostComponent[];
};

export type SupplyEnergyCostTraceEntry = {
  stage:
    | "Base supply cost"
    | "Transmission losses"
    | "GSP cost"
    | "DNO losses"
    | "Site meter pass-through"
    | "Private network losses"
    | "Profit";
  label: string;
  formula: string;
  valuePencePerKwh: number;
  sourceIds: string[];
};

export type SupplyEnergyCostResult = {
  id: string;
  band: SupplyEnergyCostBand;
  baseSupplyCostPencePerKwh: number;
  gspInputPencePerKwh: number;
  siteMeterInputPencePerKwh: number;
  customerMeterInputPencePerKwh: number;
  aboveGspPencePerKwh: number;
  gspPencePerKwh: number;
  siteMeterBeforePassThroughPencePerKwh: number;
  siteMeterPencePerKwh: number;
  privateNetworkLossMultiplier: number;
  userMeterPencePerKwh: number;
  finalPencePerKwh: number;
  auditTrace: SupplyEnergyCostTraceEntry[];
};

export function calculateSupplyEnergyCost(
  input: SupplyEnergyCostInput
): SupplyEnergyCostResult {
  validateMultiplier(input.transmissionLossMultiplier, "Transmission Loss Multiplier");
  validateMultiplier(input.dnoDistributionLossFactor, "DNO distribution loss factor");
  validateMultiplier(input.profitMultiplier, "Profit multiplier");
  input.privateNetworkLossMultipliers.forEach((multiplier, index) => {
    validateMultiplier(multiplier, `Private network loss multiplier ${index + 1}`);
  });

  const baseSupplyCostPencePerKwh = sumComponentsByLossPosition(input.components, "NBP");
  const gspInputPencePerKwh = sumComponentsByLossPosition(input.components, "GSP");
  const siteMeterInputPencePerKwh = sumComponentsByLossPosition(
    input.components,
    "Site Meter"
  );
  const customerMeterInputPencePerKwh = sumComponentsByLossPosition(
    input.components,
    "CM"
  );
  const aboveGspPencePerKwh =
    baseSupplyCostPencePerKwh * input.transmissionLossMultiplier;
  const gspPencePerKwh = aboveGspPencePerKwh + gspInputPencePerKwh;
  const siteMeterBeforePassThroughPencePerKwh =
    gspPencePerKwh * input.dnoDistributionLossFactor;
  const siteMeterPencePerKwh =
    siteMeterBeforePassThroughPencePerKwh +
    siteMeterInputPencePerKwh +
    customerMeterInputPencePerKwh;
  const privateNetworkLossMultiplier = input.privateNetworkLossMultipliers.reduce(
    (total, multiplier) => total * multiplier,
    1
  );
  const userMeterPencePerKwh = siteMeterPencePerKwh * privateNetworkLossMultiplier;
  const finalPencePerKwh = userMeterPencePerKwh * input.profitMultiplier;

  return {
    id: input.id,
    band: input.band,
    baseSupplyCostPencePerKwh,
    gspInputPencePerKwh,
    siteMeterInputPencePerKwh,
    customerMeterInputPencePerKwh,
    aboveGspPencePerKwh,
    gspPencePerKwh,
    siteMeterBeforePassThroughPencePerKwh,
    siteMeterPencePerKwh,
    privateNetworkLossMultiplier,
    userMeterPencePerKwh,
    finalPencePerKwh,
    auditTrace: [
      {
        stage: "Base supply cost",
        label: "Base supply cost before losses",
        formula: "sum(components where lossPosition is NBP)",
        valuePencePerKwh: baseSupplyCostPencePerKwh,
        sourceIds: sourceIdsForLossPosition(input.components, "NBP")
      },
      {
        stage: "Transmission losses",
        label: "Supply cost above GSP",
        formula: "baseSupplyCostPencePerKwh * transmissionLossMultiplier",
        valuePencePerKwh: aboveGspPencePerKwh,
        sourceIds: [input.id]
      },
      {
        stage: "GSP cost",
        label: "Supply cost at GSP",
        formula: "aboveGspPencePerKwh + sum(components where lossPosition is GSP)",
        valuePencePerKwh: gspPencePerKwh,
        sourceIds: sourceIdsForLossPosition(input.components, "GSP")
      },
      {
        stage: "DNO losses",
        label: "Supply cost above site meter",
        formula: "gspPencePerKwh * dnoDistributionLossFactor",
        valuePencePerKwh: siteMeterBeforePassThroughPencePerKwh,
        sourceIds: [input.id]
      },
      {
        stage: "Site meter pass-through",
        label: "Supply cost at site meter",
        formula:
          "siteMeterBeforePassThroughPencePerKwh + sum(components where lossPosition is Site Meter or CM)",
        valuePencePerKwh: siteMeterPencePerKwh,
        sourceIds: [
          ...sourceIdsForLossPosition(input.components, "Site Meter"),
          ...sourceIdsForLossPosition(input.components, "CM")
        ]
      },
      {
        stage: "Private network losses",
        label: "Supply cost at user meter",
        formula: "siteMeterPencePerKwh * product(privateNetworkLossMultipliers)",
        valuePencePerKwh: userMeterPencePerKwh,
        sourceIds: [input.id]
      },
      {
        stage: "Profit",
        label: "Final supply energy cost",
        formula: "userMeterPencePerKwh * profitMultiplier",
        valuePencePerKwh: finalPencePerKwh,
        sourceIds: [input.id]
      }
    ]
  };
}

export function convertDemandChargeToPencePerKwh({
  chargeGbpPerKw,
  demandKw,
  consumptionKwh
}: {
  chargeGbpPerKw: number;
  demandKw: number;
  consumptionKwh: number;
}) {
  if (consumptionKwh <= 0) {
    return 0;
  }

  return (chargeGbpPerKw * demandKw * 100) / consumptionKwh;
}

export function weightedPencePerKwh({
  dayPencePerKwh,
  dayKwh,
  nightPencePerKwh,
  nightKwh
}: {
  dayPencePerKwh: number;
  dayKwh: number;
  nightPencePerKwh: number;
  nightKwh: number;
}) {
  const totalKwh = dayKwh + nightKwh;

  if (totalKwh <= 0) {
    return 0;
  }

  return (dayPencePerKwh * dayKwh + nightPencePerKwh * nightKwh) / totalKwh;
}

function sumComponentsByLossPosition(
  components: SupplyEnergyCostComponent[],
  lossPosition: SupplyEnergyLossPosition
) {
  return components
    .filter((component) => component.lossPosition === lossPosition)
    .reduce((total, component) => total + component.pencePerKwh, 0);
}

function sourceIdsForLossPosition(
  components: SupplyEnergyCostComponent[],
  lossPosition: SupplyEnergyLossPosition
) {
  return components
    .filter((component) => component.lossPosition === lossPosition)
    .map((component) => component.source);
}

function validateMultiplier(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }
}
