import type { UtilityHubSelectorEnvelope } from "@/lib/utilityhub-customer-site-selector-adapter";
import type { UtilityHubMeterSelectorItem } from "@/lib/utilityhub-meter-selector-adapter";

export function createLocalMeterSelectorEnvelope(
  retrievedAt = new Date().toISOString()
): UtilityHubSelectorEnvelope<UtilityHubMeterSelectorItem> {
  return {
    contractVersion: "utilityhub-tariff-selectors.v1",
    state: "empty",
    permissionStatus: "read_only",
    retrievedAt,
    message:
      "Live UtilityHub meter selector service is not connected. Tariff Builder is not creating local meter masters.",
    items: []
  };
}
