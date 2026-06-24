import type { NormalisedSupplyChargeLine } from "@/lib/supply-calculation-engine";
import type { SupplyContractLosses } from "@/types/project";

export type SupplyEnergyRateEvidenceRow = {
  lossPosition: SupplyContractLosses;
  pencePerKwh: number;
  chargeNames: string[];
  sourceRowIds: string[];
};

export type SupplyEnergyRateReviewRow = {
  id: string;
  chargeName: string;
  reason: string;
};

export type SupplyEnergyRateEvidence = {
  rows: SupplyEnergyRateEvidenceRow[];
  reviewRows: SupplyEnergyRateReviewRow[];
  totalPencePerKwh: number;
};

const lossPositionOrder: SupplyContractLosses[] = ["NBP", "GSP", "CM"];

export function buildSupplyEnergyRateEvidence(
  chargeLines: NormalisedSupplyChargeLine[]
): SupplyEnergyRateEvidence {
  const groupedRows = new Map<SupplyContractLosses, SupplyEnergyRateEvidenceRow>();
  const reviewRows: SupplyEnergyRateReviewRow[] = [];

  chargeLines
    .filter((line) => line.source === "Supply Contract" && line.chargeType === "Consumption")
    .forEach((line) => {
      const pencePerKwh = convertRateToPencePerKwh(line);

      if (line.losses === null) {
        reviewRows.push({
          id: line.id,
          chargeName: line.chargeName,
          reason: "Missing NBP, GSP or CM loss position."
        });
        return;
      }

      if (pencePerKwh === null) {
        reviewRows.push({
          id: line.id,
          chargeName: line.chargeName,
          reason: `Unsupported energy rate unit ${line.unitOfMeasurement}.`
        });
        return;
      }

      const existing = groupedRows.get(line.losses) ?? {
        lossPosition: line.losses,
        pencePerKwh: 0,
        chargeNames: [],
        sourceRowIds: []
      };

      groupedRows.set(line.losses, {
        ...existing,
        pencePerKwh: existing.pencePerKwh + pencePerKwh,
        chargeNames: [...existing.chargeNames, line.chargeName],
        sourceRowIds: [...existing.sourceRowIds, line.id]
      });
    });

  const rows = lossPositionOrder
    .map((lossPosition) => groupedRows.get(lossPosition))
    .filter((row): row is SupplyEnergyRateEvidenceRow => row !== undefined);

  return {
    rows,
    reviewRows,
    totalPencePerKwh: rows.reduce((total, row) => total + row.pencePerKwh, 0)
  };
}

function convertRateToPencePerKwh(line: NormalisedSupplyChargeLine) {
  if (line.unitOfMeasurement === "per kWh") {
    return line.ratePounds * 100;
  }

  if (line.unitOfMeasurement === "per MWh") {
    return (line.ratePounds * 100) / 1000;
  }

  return null;
}
