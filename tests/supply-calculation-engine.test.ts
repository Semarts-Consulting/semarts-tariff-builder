import { describe, expect, it } from "vitest";
import {
  normaliseSupplyCharges,
  normaliseSupplyRate
} from "@/lib/supply-calculation-engine";
import type {
  SupplyContractChargeInput,
  SupplyContractCustomTimeOfUse,
  SupplyDetailsInput
} from "@/types/project";

const customTimeOfUse: SupplyContractCustomTimeOfUse = {
  daysOfWeek: ["Monday", "Tuesday"],
  appliesOnBankHolidays: true,
  months: ["January", "February"],
  startTime: "08:00",
  endTime: "18:00"
};

const supplyContractCharge: SupplyContractChargeInput = {
  id: "charge-1",
  chargeName: "Supplier unit charge",
  losses: "GSP",
  chargeType: "Consumption",
  unitOfMeasurement: "per kWh",
  timeOfUse: "Custom",
  customTimeOfUse,
  rateUnit: "p",
  rate: 15
};

const supplyDetail: SupplyDetailsInput = {
  id: "supply-1",
  mpan: "1234567890123",
  supplyCapacityKva: 100,
  voltage: "LV",
  transmission: "Fixed",
  distribution: "Fixed",
  tnuosNonLocationalChargePerDay: 20,
  tnuosTriadChargePerKw: 30,
  duosFixedChargePerDay: 40,
  duosImportCapacityPencePerKvaPerDay: 50,
  duosRedUnitPencePerKwh: 10,
  duosAmberUnitPencePerKwh: 5,
  duosGreenUnitPencePerKwh: 1,
  duosSuperRedUnitPencePerKwh: 25,
  supplyContractCharges: [supplyContractCharge]
};

function calculateWith(overrides: Partial<SupplyDetailsInput> = {}) {
  return normaliseSupplyCharges({
    projectId: "project",
    supplyDetails: [
      {
        ...supplyDetail,
        ...overrides
      }
    ]
  });
}

describe("normaliseSupplyCharges", () => {
  it("flags an invalid 12-digit MPAN", () => {
    const result = calculateWith({ mpan: "123456789012" });

    expect(result.chargeLines).toContainEqual(
      expect.objectContaining({
        status: "Invalid",
        messages: expect.arrayContaining(["MPAN must be 13 digits."])
      })
    );
  });

  it("accepts a valid 13-digit MPAN", () => {
    const result = calculateWith();

    expect(result.chargeLines).not.toContainEqual(
      expect.objectContaining({
        messages: expect.arrayContaining(["MPAN must be 13 digits."])
      })
    );
  });

  it("flags negative supply capacity", () => {
    const result = calculateWith({ supplyCapacityKva: -1 });

    expect(result.chargeLines).toContainEqual(
      expect.objectContaining({
        status: "Invalid",
        messages: expect.arrayContaining(["Supply capacity must not be negative."])
      })
    );
  });

  it("flags negative TNUoS, DUoS, and supply contract rates", () => {
    const result = calculateWith({
      tnuosTriadChargePerKw: -1,
      duosRedUnitPencePerKwh: -2,
      supplyContractCharges: [
        {
          ...supplyContractCharge,
          rate: -3
        }
      ]
    });

    expect(result.chargeLines).toContainEqual(
      expect.objectContaining({
        chargeName: "TNUoS triad charge",
        status: "Invalid",
        messages: expect.arrayContaining(["TNUoS triad charge must not be negative."])
      })
    );
    expect(result.chargeLines).toContainEqual(
      expect.objectContaining({
        chargeName: "DUoS red unit charge",
        status: "Invalid",
        messages: expect.arrayContaining(["DUoS red unit charge must not be negative."])
      })
    );
    expect(result.chargeLines).toContainEqual(
      expect.objectContaining({
        sourceChargeId: "charge-1",
        status: "Invalid",
        messages: expect.arrayContaining([
          "Supply contract charge rate must not be negative."
        ])
      })
    );
  });

  it("flags incompatible charge type and unit combinations", () => {
    const result = calculateWith({
      supplyContractCharges: [
        {
          ...supplyContractCharge,
          chargeType: "Consumption",
          unitOfMeasurement: "per day"
        }
      ]
    });

    expect(result.chargeLines).toContainEqual(
      expect.objectContaining({
        sourceChargeId: "charge-1",
        status: "Invalid",
        messages: expect.arrayContaining([
          "Consumption charge cannot use per day unit."
        ])
      })
    );
  });

  it("converts pence to pounds and leaves GBP rates unchanged", () => {
    expect(normaliseSupplyRate(15, "p")).toBe(0.15);
    expect(normaliseSupplyRate(20, "\u00a3")).toBe(20);
  });

  it("creates an excluded evidence line for pass-through transmission", () => {
    const result = calculateWith({ transmission: "Pass Through" });

    expect(result.chargeLines).toContainEqual(
      expect.objectContaining({
        id: "supply-1:transmission-pass-through",
        source: "Transmission",
        recoveryTreatment: "Pass Through",
        status: "Excluded"
      })
    );
  });

  it("creates fixed transmission lines with triad needing a business rule", () => {
    const result = calculateWith();

    expect(result.chargeLines).toContainEqual(
      expect.objectContaining({
        id: "supply-1:tnuos-non-locational",
        source: "Transmission",
        chargeName: "TNUoS non-locational charge"
      })
    );
    expect(result.chargeLines).toContainEqual(
      expect.objectContaining({
        id: "supply-1:tnuos-triad",
        chargeName: "TNUoS triad charge",
        status: "Needs business rule",
        messages: expect.arrayContaining([
          "kVA to kW conversion for TNUoS triad charges needs a business rule."
        ])
      })
    );
  });

  it("creates an excluded evidence line for pass-through distribution", () => {
    const result = calculateWith({ distribution: "Pass Through" });

    expect(result.chargeLines).toContainEqual(
      expect.objectContaining({
        id: "supply-1:distribution-pass-through",
        source: "Distribution",
        recoveryTreatment: "Pass Through",
        status: "Excluded"
      })
    );
  });

  it("creates LV distribution red, amber, and green unit lines", () => {
    const result = calculateWith({ voltage: "LV" });

    expect(result.chargeLines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "supply-1:duos-red-unit" }),
        expect.objectContaining({ id: "supply-1:duos-amber-unit" }),
        expect.objectContaining({ id: "supply-1:duos-green-unit" })
      ])
    );
  });

  it("creates HV distribution red, amber, and green unit lines", () => {
    const result = calculateWith({ voltage: "HV" });

    expect(result.chargeLines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "supply-1:duos-red-unit" }),
        expect.objectContaining({ id: "supply-1:duos-amber-unit" }),
        expect.objectContaining({ id: "supply-1:duos-green-unit" })
      ])
    );
  });

  it("creates an EHV distribution super red unit line", () => {
    const result = calculateWith({ voltage: "EHV" });

    expect(result.chargeLines).toContainEqual(
      expect.objectContaining({
        id: "supply-1:duos-super-red-unit",
        timeOfUse: "Super Red"
      })
    );
    expect(result.chargeLines).not.toContainEqual(
      expect.objectContaining({ id: "supply-1:duos-red-unit" })
    );
  });

  it("marks DUoS unit lines as needing volume data and preserves source references", () => {
    const result = calculateWith();

    expect(result.chargeLines).toContainEqual(
      expect.objectContaining({
        id: "supply-1:duos-red-unit",
        projectId: "project",
        mpan: "1234567890123",
        supplyDetailId: "supply-1",
        source: "Distribution",
        sourceChargeId: null,
        status: "Needs volume data"
      })
    );
  });

  it("preserves supply contract source charge references and time-of-use data", () => {
    const result = calculateWith();

    expect(result.chargeLines).toContainEqual(
      expect.objectContaining({
        id: "supply-1:supply-contract-charge-1",
        source: "Supply Contract",
        sourceChargeId: "charge-1",
        losses: "GSP",
        chargeType: "Consumption",
        unitOfMeasurement: "per kWh",
        timeOfUse: "Custom",
        customTimeOfUse,
        ratePounds: 0.15
      })
    );
  });
});
