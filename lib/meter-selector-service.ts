import { createLocalMeterSelectorEnvelope } from "@/lib/meter-selector-local-envelope";
import {
  adaptUtilityHubMeterSelector,
  type MeterSelectorAdapterResult
} from "@/lib/utilityhub-meter-selector-adapter";

export type MeterSelectorServiceResult = MeterSelectorAdapterResult & {
  mode: "local-contract-envelope";
};

export function getMeterSelectorResult(): MeterSelectorServiceResult {
  return {
    ...adaptUtilityHubMeterSelector(createLocalMeterSelectorEnvelope()),
    mode: "local-contract-envelope"
  };
}
