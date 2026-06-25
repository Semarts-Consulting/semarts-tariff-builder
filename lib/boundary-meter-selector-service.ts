import { createLocalBoundaryMeterSelectorEnvelope } from "@/lib/boundary-meter-selector-local-envelope";
import {
  adaptUtilityHubBoundaryMeterSelector,
  type BoundaryMeterSelectorAdapterResult
} from "@/lib/utilityhub-boundary-meter-selector-adapter";

export type BoundaryMeterSelectorServiceResult = BoundaryMeterSelectorAdapterResult & {
  mode: "local-contract-envelope";
};

export function getBoundaryMeterSelectorResult(): BoundaryMeterSelectorServiceResult {
  return {
    ...adaptUtilityHubBoundaryMeterSelector(createLocalBoundaryMeterSelectorEnvelope()),
    mode: "local-contract-envelope"
  };
}
