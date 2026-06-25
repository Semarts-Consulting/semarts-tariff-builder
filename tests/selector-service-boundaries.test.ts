import { describe, expect, it } from "vitest";
import { getBoundaryMeterSelectorResult } from "@/lib/boundary-meter-selector-service";
import { getMeterSelectorResult } from "@/lib/meter-selector-service";
import { getMonthlyConsumptionSelectorResult } from "@/lib/monthly-consumption-selector-service";
import { getReferenceDataSelectorResult } from "@/lib/reference-data-selector-service";

describe("selector service boundaries", () => {
  it("uses local contract envelope mode until live UtilityHub services are wired", () => {
    expect(getMeterSelectorResult()).toMatchObject({
      mode: "local-contract-envelope",
      status: "empty",
      options: []
    });
    expect(getMonthlyConsumptionSelectorResult()).toMatchObject({
      mode: "local-contract-envelope",
      status: "empty",
      options: []
    });
    expect(getBoundaryMeterSelectorResult()).toMatchObject({
      mode: "local-contract-envelope",
      status: "empty",
      options: []
    });
    expect(getReferenceDataSelectorResult()).toMatchObject({
      mode: "local-contract-envelope",
      status: "empty",
      options: []
    });
  });
});
