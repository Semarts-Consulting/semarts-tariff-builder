import { describe, expect, it } from "vitest";
import { buildSupplyEnergyRateEvidence } from "@/lib/supply-energy-report-evidence";
import type { NormalisedSupplyChargeLine } from "@/lib/supply-calculation-engine";

function supplyLine(
  overrides: Partial<NormalisedSupplyChargeLine> = {}
): NormalisedSupplyChargeLine {
  return {
    id: overrides.id ?? "line-1",
    projectId: "project-1",
    mpan: "1234567890123",
    supplyDetailId: "supply-1",
    source: overrides.source ?? "Supply Contract",
    sourceChargeId: "charge-1",
    chargeName: overrides.chargeName ?? "Supplier unit charge",
    recoveryTreatment: "Pass Through",
    chargeType: overrides.chargeType ?? "Consumption",
    voltage: "HV",
    losses: overrides.losses ?? "NBP",
    unitOfMeasurement: overrides.unitOfMeasurement ?? "per kWh",
    timeOfUse: "All times",
    customTimeOfUse: null,
    ratePounds: overrides.ratePounds ?? 0.12,
    quantity: null,
    annualAmount: null,
    status: "Needs volume data",
    messages: []
  };
}

describe("supply energy report evidence", () => {
  it("groups supply contract consumption rates by loss position in p/kWh", () => {
    const evidence = buildSupplyEnergyRateEvidence([
      supplyLine({ id: "nbp", losses: "NBP", ratePounds: 0.1 }),
      supplyLine({ id: "gsp", losses: "GSP", ratePounds: 0.2 }),
      supplyLine({ id: "cm", losses: "CM", ratePounds: 0.3 })
    ]);

    expect(evidence.rows).toEqual([
      expect.objectContaining({ lossPosition: "NBP", pencePerKwh: 10 }),
      expect.objectContaining({ lossPosition: "GSP", pencePerKwh: 20 }),
      expect.objectContaining({ lossPosition: "CM", pencePerKwh: 30 })
    ]);
    expect(evidence.totalPencePerKwh).toBe(60);
  });

  it("converts per MWh rates and flags unsupported rows for review", () => {
    const evidence = buildSupplyEnergyRateEvidence([
      supplyLine({
        id: "mwh",
        losses: "GSP",
        unitOfMeasurement: "per MWh",
        ratePounds: 120
      }),
      supplyLine({
        id: "fixed",
        chargeName: "Unsupported unit",
        unitOfMeasurement: "per day"
      })
    ]);

    expect(evidence.rows).toEqual([
      expect.objectContaining({ lossPosition: "GSP", pencePerKwh: 12 })
    ]);
    expect(evidence.reviewRows).toEqual([
      {
        id: "fixed",
        chargeName: "Unsupported unit",
        reason: "Unsupported energy rate unit per day."
      }
    ]);
  });
});
