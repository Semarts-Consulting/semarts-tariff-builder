import { createLocalMeterSelectorEnvelope } from "@/lib/meter-selector-local-envelope";
import {
  createUnavailableSelectorEnvelope,
  resolveUtilityHubSelectorClientConfig,
  type UtilityHubSelectorClientConfig,
  type UtilityHubSelectorClientMode
} from "@/lib/utilityhub-selector-client-config";
import {
  adaptUtilityHubMeterSelector,
  type MeterSelectorAdapterResult,
  type UtilityHubMeterSelectorItem
} from "@/lib/utilityhub-meter-selector-adapter";

export type MeterSelectorServiceResult = MeterSelectorAdapterResult & {
  mode: UtilityHubSelectorClientMode;
};

export function getMeterSelectorResult(
  config: UtilityHubSelectorClientConfig = resolveUtilityHubSelectorClientConfig()
): MeterSelectorServiceResult {
  const envelope =
    config.mode === "local-contract-envelope"
      ? createLocalMeterSelectorEnvelope()
      : createUnavailableSelectorEnvelope<UtilityHubMeterSelectorItem>({
          message: config.message
        });

  return {
    ...adaptUtilityHubMeterSelector(envelope),
    mode: config.mode
  };
}
