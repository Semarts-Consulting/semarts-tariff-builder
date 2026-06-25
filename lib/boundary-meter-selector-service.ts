import { createLocalBoundaryMeterSelectorEnvelope } from "@/lib/boundary-meter-selector-local-envelope";
import {
  createUnavailableSelectorEnvelope,
  resolveUtilityHubSelectorClientConfig,
  type UtilityHubSelectorClientConfig,
  type UtilityHubSelectorClientMode
} from "@/lib/utilityhub-selector-client-config";
import {
  adaptUtilityHubBoundaryMeterSelector,
  type BoundaryMeterSelectorAdapterResult
} from "@/lib/utilityhub-boundary-meter-selector-adapter";
import type { UtilityHubMeterSelectorItem } from "@/lib/utilityhub-meter-selector-adapter";

export type BoundaryMeterSelectorServiceResult = BoundaryMeterSelectorAdapterResult & {
  mode: UtilityHubSelectorClientMode;
};

export function getBoundaryMeterSelectorResult(
  config: UtilityHubSelectorClientConfig = resolveUtilityHubSelectorClientConfig()
): BoundaryMeterSelectorServiceResult {
  const envelope =
    config.mode === "local-contract-envelope"
      ? createLocalBoundaryMeterSelectorEnvelope()
      : createUnavailableSelectorEnvelope<UtilityHubMeterSelectorItem>({
          message: config.message
        });

  return {
    ...adaptUtilityHubBoundaryMeterSelector(envelope),
    mode: config.mode
  };
}
