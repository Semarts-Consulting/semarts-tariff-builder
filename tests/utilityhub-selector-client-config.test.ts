import { describe, expect, it } from "vitest";
import {
  createUnavailableSelectorEnvelope,
  resolveUtilityHubSelectorClientConfig
} from "@/lib/utilityhub-selector-client-config";

describe("UtilityHub selector client configuration", () => {
  it("defaults to local contract-envelope mode", () => {
    const config = resolveUtilityHubSelectorClientConfig({});

    expect(config).toMatchObject({
      mode: "local-contract-envelope"
    });
  });

  it("reports live mode as unavailable when no endpoint is configured", () => {
    const config = resolveUtilityHubSelectorClientConfig({
      NEXT_PUBLIC_UTILITYHUB_SELECTOR_MODE: "live"
    });

    expect(config.mode).toBe("live-missing-endpoint");
    expect(config.message).toContain("no selector base URL");
  });

  it("enables live mode when a selector endpoint is configured", () => {
    const config = resolveUtilityHubSelectorClientConfig({
      NEXT_PUBLIC_UTILITYHUB_SELECTOR_MODE: "live",
      NEXT_PUBLIC_UTILITYHUB_SELECTOR_BASE_URL: "https://utilityhub.example.test"
    });

    expect(config).toMatchObject({
      mode: "live",
      baseUrl: "https://utilityhub.example.test"
    });
  });

  it("creates explicit unavailable selector envelopes without items", () => {
    const envelope = createUnavailableSelectorEnvelope({
      message: "Selector unavailable.",
      retrievedAt: "2026-06-26T09:00:00.000Z"
    });

    expect(envelope).toMatchObject({
      contractVersion: "utilityhub-tariff-selectors.v1",
      state: "unavailable",
      permissionStatus: "read_only",
      retrievedAt: "2026-06-26T09:00:00.000Z",
      message: "Selector unavailable.",
      items: []
    });
  });
});
