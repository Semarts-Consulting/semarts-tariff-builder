import { describe, expect, it } from "vitest";
import { buildInternalUtilityHubSelectorApiPath } from "@/lib/utilityhub-selector-api-client";

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
          tariffYear: 2026,
          referencePeriodStart: "2025-01-01",
          referencePeriodEnd: "2025-12-31"
        }
      })
    ).toBe(
      "/api/utilityhub/selectors/monthly-consumption?customerId=customer-1&siteId=site-1&tariffYear=2026&referencePeriodStart=2025-01-01&referencePeriodEnd=2025-12-31"
    );
  });
});
