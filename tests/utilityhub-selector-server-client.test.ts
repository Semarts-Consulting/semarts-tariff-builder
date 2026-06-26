import { describe, expect, it } from "vitest";
import {
  buildUtilityHubSelectorEndpoint,
  fetchUtilityHubSelectorServerClientEnvelope,
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
        userId: "user-admin",
        tariffYear: 2026,
        periodStart: "2025-01-01",
        periodEnd: "2025-12-31",
        referenceTypes: "tlm,cpi"
      }
    });

    expect(endpoint).toBe(
      "https://utilityhub.example.test/api/monthly-consumption?customerId=customer-1&siteId=site-1&userId=user-admin&tariffYear=2026&periodStart=2025-01-01&periodEnd=2025-12-31&referenceTypes=tlm%2Ccpi"
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
      "https://utilityhub.example.test/api/boundary-meters?siteId=site-1"
    );
    expect(result.envelope).toMatchObject({
      state: "unavailable",
      items: []
    });
    expect(result.envelope.message).toContain("not implemented yet");
  });

  it("fetches live UtilityHub selector envelopes when live mode is configured", async () => {
    const result = await fetchUtilityHubSelectorServerClientEnvelope({
      config: {
        mode: "live",
        baseUrl: "https://utilityhub.example.test/api/shared-selectors/tariff",
        message: "Live mode."
      },
      resource: "customer-site-context",
      scope: {
        customerId: "customer-manchester-airport",
        userId: "user-admin"
      },
      fetcher: async () =>
        new Response(
          JSON.stringify({
            contractVersion: "utilityhub-tariff-selectors.v1",
            state: "available",
            permissionStatus: "allowed",
            retrievedAt: "2026-06-26T09:00:00.000Z",
            items: [
              {
                customerId: "customer-manchester-airport",
                customerName: "Manchester Airport",
                siteId: "site-man",
                siteName: "Manchester Airport",
                status: "active",
                effectiveFrom: "2026-01-01",
                permissionStatus: "allowed",
                sourceVersion: "demo",
                lastUpdatedAt: "2026-06-26T09:00:00.000Z",
                provenance: {
                  sourceSystem: "utilityhub",
                  sourceRecordId: "site-man",
                  retrievedAt: "2026-06-26T09:00:00.000Z",
                  lastUpdatedAt: "2026-06-26T09:00:00.000Z"
                }
              }
            ]
          }),
          { status: 200 }
        )
    });

    expect(result.endpoint).toBe(
      "https://utilityhub.example.test/api/shared-selectors/tariff/customer-site-context?customerId=customer-manchester-airport&userId=user-admin"
    );
    expect(result.envelope).toMatchObject({
      state: "available",
      items: [
        {
          customerId: "customer-manchester-airport",
          siteId: "site-man"
        }
      ]
    });
  });

  it("returns unavailable envelopes for live access-denied transport failures", async () => {
    const result = await fetchUtilityHubSelectorServerClientEnvelope({
      config: {
        mode: "live",
        baseUrl: "https://utilityhub.example.test/api/shared-selectors/tariff",
        message: "Live mode."
      },
      resource: "meters",
      fetcher: async () => new Response("Forbidden", { status: 403 })
    });

    expect(result.envelope).toMatchObject({
      state: "unavailable",
      items: []
    });
    expect(result.envelope.message).toContain("403");
  });

  it("passes through empty selector envelopes from UtilityHub", async () => {
    const result = await fetchUtilityHubSelectorServerClientEnvelope({
      config: {
        mode: "live",
        baseUrl: "https://utilityhub.example.test/api/shared-selectors/tariff",
        message: "Live mode."
      },
      resource: "meters",
      scope: {
        siteId: "site-without-demo-meters",
        userId: "user-admin"
      },
      fetcher: async () =>
        new Response(
          JSON.stringify({
            contractVersion: "utilityhub-tariff-selectors.v1",
            state: "empty",
            permissionStatus: "allowed",
            message: "No meters found.",
            retrievedAt: "2026-06-26T09:00:00.000Z",
            items: []
          }),
          { status: 200 }
        )
    });

    expect(result.envelope).toMatchObject({
      state: "empty",
      message: "No meters found.",
      items: []
    });
  });

  it("passes through access denied selector envelopes from UtilityHub", async () => {
    const result = await fetchUtilityHubSelectorServerClientEnvelope({
      config: {
        mode: "live",
        baseUrl: "https://utilityhub.example.test/api/shared-selectors/tariff",
        message: "Live mode."
      },
      resource: "meters",
      scope: {
        customerId: "customer-manchester-airport",
        userId: "user-ops"
      },
      fetcher: async () =>
        new Response(
          JSON.stringify({
            contractVersion: "utilityhub-tariff-selectors.v1",
            state: "access_denied",
            permissionStatus: "denied",
            message: "Access denied.",
            retrievedAt: "2026-06-26T09:00:00.000Z",
            items: []
          }),
          { status: 200 }
        )
    });

    expect(result.envelope).toMatchObject({
      state: "access_denied",
      permissionStatus: "denied",
      message: "Access denied.",
      items: []
    });
  });

  it("passes through review-required validation issues from monthly consumption", async () => {
    const result = await fetchUtilityHubSelectorServerClientEnvelope({
      config: {
        mode: "live",
        baseUrl: "https://utilityhub.example.test/api/shared-selectors/tariff",
        message: "Live mode."
      },
      resource: "monthly-consumption",
      scope: {
        customerId: "customer-manchester-airport",
        periodStart: "2026-04-01",
        periodEnd: "2026-04-30",
        userId: "user-admin"
      },
      fetcher: async () =>
        new Response(
          JSON.stringify({
            contractVersion: "utilityhub-tariff-selectors.v1",
            state: "available",
            permissionStatus: "allowed",
            retrievedAt: "2026-06-26T09:00:00.000Z",
            items: [
              {
                meterId: "meter-man-t1-r1-elec",
                periodStart: "2026-04-01",
                periodEnd: "2026-04-30",
                monthLabel: "April 2026",
                importKwh: 0,
                readingCoverageStatus: "missing",
                readingSource: "unknown",
                sourceVersion: "demo",
                calculatedAt: "2026-06-26T09:00:00.000Z",
                validationStatus: "review_required",
                validationIssues: [
                  {
                    code: "missing_month_reading",
                    severity: "warning",
                    message: "Monthly reading is missing."
                  }
                ],
                provenance: {
                  sourceSystem: "utilityhub",
                  sourceRecordId: "monthly-demo",
                  retrievedAt: "2026-06-26T09:00:00.000Z",
                  lastUpdatedAt: "2026-06-26T09:00:00.000Z"
                }
              }
            ]
          }),
          { status: 200 }
        )
    });

    expect(result.envelope.items[0]).toMatchObject({
      validationStatus: "review_required",
      validationIssues: [
        {
          code: "missing_month_reading"
        }
      ]
    });
  });
});
