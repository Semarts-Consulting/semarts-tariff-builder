import type { UtilityHubSelectorEnvelope } from "@/lib/utilityhub-customer-site-selector-adapter";
import type { UtilityHubReferenceDataSelectorItem } from "@/lib/utilityhub-reference-data-selector-adapter";

export function createLocalReferenceDataSelectorEnvelope(
  retrievedAt = new Date().toISOString()
): UtilityHubSelectorEnvelope<UtilityHubReferenceDataSelectorItem> {
  return {
    contractVersion: "utilityhub-tariff-selectors.v1",
    state: "empty",
    permissionStatus: "read_only",
    retrievedAt,
    message:
      "Live UtilityHub reference data selector service is not connected. Local reference records remain interim review evidence.",
    items: []
  };
}
