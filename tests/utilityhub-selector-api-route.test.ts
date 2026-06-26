import { describe, expect, it } from "vitest";
import {
  createUtilityHubSelectorApiRouteResult,
  getUtilityHubSelectorScopeFromUrl,
  isUtilityHubSelectorResource
} from "@/lib/utilityhub-selector-api-route";

describe("UtilityHub selector API route helper", () => {
  it("accepts only known selector resources", () => {
    expect(isUtilityHubSelectorResource("meters")).toBe(true);
    expect(isUtilityHubSelectorResource("unknown")).toBe(false);
  });

  it("extracts tariff-year selector scope from request URLs", () => {
    const scope = getUtilityHubSelectorScopeFromUrl(
      "https://tariff-builder.example.test/api/utilityhub/selectors/meters?customerId=customer-1&siteId=site-1&tariffYear=2026&referencePeriodStart=2025-01-01&referencePeriodEnd=2025-12-31"
    );

    expect(scope).toEqual({
      customerId: "customer-1",
      siteId: "site-1",
      tariffYear: 2026,
      referencePeriodStart: "2025-01-01",
      referencePeriodEnd: "2025-12-31"
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
      endpoint: "https://utilityhub.example.test/api/tariff-selectors/boundary-meters?siteId=site-1",
      envelope: {
        state: "unavailable",
        items: []
      }
    });
  });
});
