import { createLocalReferenceDataSelectorEnvelope } from "@/lib/reference-data-selector-local-envelope";
import {
  adaptUtilityHubReferenceDataSelector,
  type ReferenceDataSelectorAdapterResult
} from "@/lib/utilityhub-reference-data-selector-adapter";

export type ReferenceDataSelectorServiceResult = ReferenceDataSelectorAdapterResult & {
  mode: "local-contract-envelope";
};

export function getReferenceDataSelectorResult(): ReferenceDataSelectorServiceResult {
  return {
    ...adaptUtilityHubReferenceDataSelector(createLocalReferenceDataSelectorEnvelope()),
    mode: "local-contract-envelope"
  };
}
