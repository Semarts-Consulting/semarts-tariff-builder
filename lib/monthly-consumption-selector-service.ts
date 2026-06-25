import { createLocalMonthlyConsumptionSelectorEnvelope } from "@/lib/monthly-consumption-selector-local-envelope";
import {
  adaptUtilityHubMonthlyConsumptionSelector,
  type MonthlyConsumptionSelectorAdapterResult
} from "@/lib/utilityhub-monthly-consumption-selector-adapter";

export type MonthlyConsumptionSelectorServiceResult =
  MonthlyConsumptionSelectorAdapterResult & {
    mode: "local-contract-envelope";
  };

export function getMonthlyConsumptionSelectorResult(): MonthlyConsumptionSelectorServiceResult {
  return {
    ...adaptUtilityHubMonthlyConsumptionSelector(createLocalMonthlyConsumptionSelectorEnvelope()),
    mode: "local-contract-envelope"
  };
}
