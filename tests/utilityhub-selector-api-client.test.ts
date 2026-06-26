import { describe, expect, it } from "vitest";
import {
  buildInternalUtilityHubSelectorApiPath,
  readInternalUtilityHubSelectorApiStub
} from "@/lib/utilityhub-selector-api-client";

describe("UtilityHub selector API client helper", () => {
  it("builds internal selector paths without scope", () => {
    expect(buildInternalUtilityHubSelectorApiPath({ resource: "meters" })).toBe(
      "/api/utilityhub/selectors/meters"
    );
  });

  it("builds internal selector paths with tariff-year scope", () => {
    expect(
      buildInternalUtilityHubSelectorApiPath({
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
      })
    ).toBe(
      "/api/utilityhub/selectors/monthly-consumption?customerId=customer-1&siteId=site-1&userId=user-admin&tariffYear=2026&periodStart=2025-01-01&periodEnd=2025-12-31&referenceTypes=tlm%2Ccpi"
    );
  });

  it("reads unavailable selector states from the internal API stub", async () => {
    const status = await readInternalUtilityHubSelectorApiStub(
      { resource: "meters" },
      async () =>
        new Response(
          JSON.stringify({
            envelope: {
              state: "unavailable",
              message: "Selector unavailable."
            }
          }),
          { status: 200 }
        )
    );

    expect(status).toEqual({
      path: "/api/utilityhub/selectors/meters",
      state: "unavailable",
      message: "Selector unavailable."
    });
  });

  it("reports internal API errors without throwing into the UI", async () => {
    const status = await readInternalUtilityHubSelectorApiStub(
      { resource: "reference-data" },
      async () => new Response("Not found", { status: 404 })
    );

    expect(status).toEqual({
      path: "/api/utilityhub/selectors/reference-data",
      state: "error",
      message: "Internal selector API returned 404."
    });
  });
});
