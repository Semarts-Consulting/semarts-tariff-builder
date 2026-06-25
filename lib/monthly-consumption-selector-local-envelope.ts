import type { UtilityHubSelectorEnvelope } from "@/lib/utilityhub-customer-site-selector-adapter";
import type { UtilityHubMonthlyConsumptionSelectorItem } from "@/lib/utilityhub-monthly-consumption-selector-adapter";

export function createLocalMonthlyConsumptionSelectorEnvelope(
  retrievedAt = new Date().toISOString()
): UtilityHubSelectorEnvelope<UtilityHubMonthlyConsumptionSelectorItem> {
  return {
    contractVersion: "utilityhub-tariff-selectors.v1",
    state: "empty",
    permissionStatus: "read_only",
    retrievedAt,
    message:
      "Live UtilityHub monthly consumption selector service is not connected. Current aggregate rows remain tariff-driving.",
    items: []
  };
}
