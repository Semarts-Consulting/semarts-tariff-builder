import { createLocalMonthlyConsumptionSelectorEnvelope } from "@/lib/monthly-consumption-selector-local-envelope";
import {
  createUnavailableSelectorEnvelope,
  resolveUtilityHubSelectorClientConfig,
  type UtilityHubSelectorClientConfig,
  type UtilityHubSelectorClientMode
} from "@/lib/utilityhub-selector-client-config";
import {
  adaptUtilityHubMonthlyConsumptionSelector,
  type MonthlyConsumptionSelectorAdapterResult,
  type UtilityHubMonthlyConsumptionSelectorItem
} from "@/lib/utilityhub-monthly-consumption-selector-adapter";

export type MonthlyConsumptionSelectorServiceResult =
  MonthlyConsumptionSelectorAdapterResult & {
    mode: UtilityHubSelectorClientMode;
  };

export function getMonthlyConsumptionSelectorResult(
  config: UtilityHubSelectorClientConfig = resolveUtilityHubSelectorClientConfig()
): MonthlyConsumptionSelectorServiceResult {
  const envelope =
    config.mode === "local-contract-envelope"
      ? createLocalMonthlyConsumptionSelectorEnvelope()
      : createUnavailableSelectorEnvelope<UtilityHubMonthlyConsumptionSelectorItem>({
          message: config.message
        });

  return {
    ...adaptUtilityHubMonthlyConsumptionSelector(envelope),
    mode: config.mode
  };
}
