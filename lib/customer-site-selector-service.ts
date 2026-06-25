import type { Project } from "@/types/project";
import { createLocalCustomerSiteSelectorEnvelope } from "@/lib/customer-site-selector-local-envelope";
import {
  createUnavailableSelectorEnvelope,
  resolveUtilityHubSelectorClientConfig,
  type UtilityHubSelectorClientConfig,
  type UtilityHubSelectorClientMode
} from "@/lib/utilityhub-selector-client-config";
import {
  adaptUtilityHubCustomerSiteSelector,
  type CustomerSiteSelectorAdapterResult,
  type UtilityHubCustomerSiteContextItem
} from "@/lib/utilityhub-customer-site-selector-adapter";

export type CustomerSiteSelectorServiceMode = UtilityHubSelectorClientMode;

export type CustomerSiteSelectorServiceResult = CustomerSiteSelectorAdapterResult & {
  mode: CustomerSiteSelectorServiceMode;
};

export function getCustomerSiteSelectorResult(
  project: Project,
  config: UtilityHubSelectorClientConfig = resolveUtilityHubSelectorClientConfig()
): CustomerSiteSelectorServiceResult {
  const envelope =
    config.mode === "local-contract-envelope"
      ? createLocalCustomerSiteSelectorEnvelope(project)
      : createUnavailableSelectorEnvelope<UtilityHubCustomerSiteContextItem>({
          message: config.message
        });
  const result = adaptUtilityHubCustomerSiteSelector(envelope, project);

  return {
    ...result,
    mode: config.mode
  };
}
