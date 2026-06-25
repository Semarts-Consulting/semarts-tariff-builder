import { createLocalReferenceDataSelectorEnvelope } from "@/lib/reference-data-selector-local-envelope";
import {
  createUnavailableSelectorEnvelope,
  resolveUtilityHubSelectorClientConfig,
  type UtilityHubSelectorClientConfig,
  type UtilityHubSelectorClientMode
} from "@/lib/utilityhub-selector-client-config";
import {
  adaptUtilityHubReferenceDataSelector,
  type ReferenceDataSelectorAdapterResult,
  type UtilityHubReferenceDataSelectorItem
} from "@/lib/utilityhub-reference-data-selector-adapter";

export type ReferenceDataSelectorServiceResult = ReferenceDataSelectorAdapterResult & {
  mode: UtilityHubSelectorClientMode;
};

export function getReferenceDataSelectorResult(
  config: UtilityHubSelectorClientConfig = resolveUtilityHubSelectorClientConfig()
): ReferenceDataSelectorServiceResult {
  const envelope =
    config.mode === "local-contract-envelope"
      ? createLocalReferenceDataSelectorEnvelope()
      : createUnavailableSelectorEnvelope<UtilityHubReferenceDataSelectorItem>({
          message: config.message
        });

  return {
    ...adaptUtilityHubReferenceDataSelector(envelope),
    mode: config.mode
  };
}
