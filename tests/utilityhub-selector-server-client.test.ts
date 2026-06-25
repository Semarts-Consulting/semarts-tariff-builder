import { describe, expect, it } from "vitest";
import {
  buildUtilityHubSelectorEndpoint,
  getUtilityHubSelectorServerClientEnvelope
} from "@/lib/utilityhub-selector-server-client";

describe("UtilityHub selector server client", () => {
  it("builds stable selector endpoint URLs with tariff-year scope", () => {
    const endpoint = buildUtilityHubSelectorEndpoint({
      baseUrl: "https://utilityhub.example.test/api",
      resource: "monthly-consumption",
      scope: {
        customerId: "customer-1",
        siteId: "site-1",
        tariffYear: 2026,
        referencePeriodStart: "2025-01-01",
        referencePeriodEnd: "2025-12-31"
      }
    });

    expect(endpoint).toBe(
      "https://utilityhub.example.test/api/tariff-selectors/monthly-consumption?customerId=customer-1&siteId=site-1&tariffYear=2026&referencePeriodStart=2025-01-01&referencePeriodEnd=2025-12-31"
    );
  });

  it("returns unavailable state when the client is in local mode", () => {
    const result = getUtilityHubSelectorServerClientEnvelope({
      config: {
        mode: "local-contract-envelope",
        message: "Local mode."
      },
      resource: "meters",
      retrievedAt: "2026-06-26T09:00:00.000Z"
    });

    expect(result.endpoint).toBeUndefined();
    expect(result.envelope).toMatchObject({
      state: "unavailable",
      retrievedAt: "2026-06-26T09:00:00.000Z",
      items: []
    });
  });

  it("returns unavailable state when live mode lacks an endpoint", () => {
    const result = getUtilityHubSelectorServerClientEnvelope({
      config: {
        mode: "live-missing-endpoint",
        message: "Missing endpoint."
      },
      resource: "reference-data"
    });

    expect(result.endpoint).toBeUndefined();
    expect(result.envelope.message).toBe("Missing endpoint.");
  });

  it("resolves configured endpoints without making network calls", () => {
    const result = getUtilityHubSelectorServerClientEnvelope({
      config: {
        mode: "live-configured-not-implemented",
        baseUrl: "https://utilityhub.example.test/api",
        message: "Configured."
      },
      resource: "boundary-meters",
      scope: {
        siteId: "site-1"
      }
    });

    expect(result.endpoint).toBe(
      "https://utilityhub.example.test/api/tariff-selectors/boundary-meters?siteId=site-1"
    );
    expect(result.envelope).toMatchObject({
      state: "unavailable",
      items: []
    });
    expect(result.envelope.message).toContain("not implemented yet");
  });
});
