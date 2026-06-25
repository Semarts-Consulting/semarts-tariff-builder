import { describe, expect, it } from "vitest";
import { getBoundaryMeterSelectorResult } from "@/lib/boundary-meter-selector-service";
import { getMeterSelectorResult } from "@/lib/meter-selector-service";
import { getMonthlyConsumptionSelectorResult } from "@/lib/monthly-consumption-selector-service";
import { getReferenceDataSelectorResult } from "@/lib/reference-data-selector-service";
import type { UtilityHubSelectorClientConfig } from "@/lib/utilityhub-selector-client-config";

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

  it("returns safe unavailable states when live mode lacks an endpoint", () => {
    const config: UtilityHubSelectorClientConfig = {
      mode: "live-missing-endpoint",
      message:
        "UtilityHub selector live mode is requested, but no selector base URL is configured."
    };

    expect(getMeterSelectorResult(config)).toMatchObject({
      mode: "live-missing-endpoint",
      status: "unavailable",
      options: []
    });
    expect(getMonthlyConsumptionSelectorResult(config)).toMatchObject({
      mode: "live-missing-endpoint",
      status: "unavailable",
      options: []
    });
    expect(getBoundaryMeterSelectorResult(config)).toMatchObject({
      mode: "live-missing-endpoint",
      status: "unavailable",
      options: []
    });
    expect(getReferenceDataSelectorResult(config)).toMatchObject({
      mode: "live-missing-endpoint",
      status: "unavailable",
      options: []
    });
  });

  it("does not call configured live endpoints before the live adapter package", () => {
    const config: UtilityHubSelectorClientConfig = {
      mode: "live-configured-not-implemented",
      baseUrl: "https://utilityhub.example.test",
      message:
        "UtilityHub selector live endpoint is configured, but network retrieval is not implemented in this package."
    };

    expect(getMeterSelectorResult(config)).toMatchObject({
      mode: "live-configured-not-implemented",
      status: "unavailable",
      message: config.message,
      options: []
    });
  });
});
