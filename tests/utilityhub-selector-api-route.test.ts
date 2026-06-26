import { describe, expect, it } from "vitest";
import {
  createUtilityHubSelectorApiRouteResult,
  createLiveUtilityHubSelectorApiRouteResult,
  getUtilityHubSelectorScopeFromUrl,
  isUtilityHubSelectorResource
} from "@/lib/utilityhub-selector-api-route";

describe("UtilityHub selector API route helper", () => {
  const resources = [
    "customer-site-context",
    "meters",
    "monthly-consumption",
    "boundary-meters",
    "reference-data"
  ] as const;

  it("accepts only known selector resources", () => {
    expect(isUtilityHubSelectorResource("meters")).toBe(true);
    expect(isUtilityHubSelectorResource("unknown")).toBe(false);
  });

  it("returns controlled unavailable envelopes for every supported selector resource", () => {
    for (const resource of resources) {
      const result = createUtilityHubSelectorApiRouteResult({
        resource,
        url: `https://tariff-builder.example.test/api/utilityhub/selectors/${resource}`,
        config: {
          mode: "local-contract-envelope",
          message: "Local mode."
        }
      });

      expect(result.status).toBe(200);
      expect(result.body).toMatchObject({
        resource,
        envelope: {
          state: "unavailable",
          items: []
        }
      });
    }
  });

  it("extracts tariff-year selector scope from request URLs", () => {
    const scope = getUtilityHubSelectorScopeFromUrl(
      "https://tariff-builder.example.test/api/utilityhub/selectors/meters?customerId=customer-1&siteId=site-1&userId=user-admin&tariffYear=2026&periodStart=2025-01-01&periodEnd=2025-12-31&referenceTypes=tlm,cpi"
    );

    expect(scope).toEqual({
      customerId: "customer-1",
      siteId: "site-1",
      userId: "user-admin",
      tariffYear: 2026,
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
      referencePeriodStart: undefined,
      referencePeriodEnd: undefined,
      referenceTypes: "tlm,cpi"
    });
  });

  it("returns 404 for unknown resources", () => {
    const result = createUtilityHubSelectorApiRouteResult({
      resource: "unknown",
      url: "https://tariff-builder.example.test/api/utilityhub/selectors/unknown"
    });

    expect(result.status).toBe(404);
    expect(result.body).toMatchObject({
      error: "Unknown UtilityHub selector resource: unknown."
    });
  });

  it("returns unavailable envelopes through the internal API boundary", () => {
    const result = createUtilityHubSelectorApiRouteResult({
      resource: "boundary-meters",
      url: "https://tariff-builder.example.test/api/utilityhub/selectors/boundary-meters?siteId=site-1",
      config: {
        mode: "live-configured-not-implemented",
        baseUrl: "https://utilityhub.example.test/api",
        message: "Configured."
      }
    });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      resource: "boundary-meters",
      endpoint: "https://utilityhub.example.test/api/boundary-meters?siteId=site-1",
      envelope: {
        state: "unavailable",
        items: []
      }
    });
  });

  it("returns live selector envelopes through the async API boundary", async () => {
    const result = await createLiveUtilityHubSelectorApiRouteResult({
      resource: "reference-data",
      url: "https://tariff-builder.example.test/api/utilityhub/selectors/reference-data?periodStart=2026-04-01&periodEnd=2027-03-31&referenceTypes=tlm,cpi&userId=user-admin",
      config: {
        mode: "live",
        baseUrl: "https://utilityhub.example.test/api/shared-selectors/tariff",
        message: "Live mode."
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
                referenceDataId: "tlm-demo",
                referenceDataType: "tlm",
                displayName: "TLM demo",
                coverageStatus: "complete",
                validationStatus: "valid",
                validationIssueCount: 0,
                source: "UtilityHub",
                sourceVersion: "demo",
                lastUpdatedAt: "2026-06-26T09:00:00.000Z",
                provenance: {
                  sourceSystem: "utilityhub",
                  sourceRecordId: "tlm-demo",
                  retrievedAt: "2026-06-26T09:00:00.000Z",
                  lastUpdatedAt: "2026-06-26T09:00:00.000Z"
                }
              }
            ]
          }),
          { status: 200 }
        )
    });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      resource: "reference-data",
      endpoint:
        "https://utilityhub.example.test/api/shared-selectors/tariff/reference-data?userId=user-admin&periodStart=2026-04-01&periodEnd=2027-03-31&referenceTypes=tlm%2Ccpi",
      envelope: {
        state: "available",
        items: [
          {
            referenceDataId: "tlm-demo"
          }
        ]
      }
    });
  });
});
