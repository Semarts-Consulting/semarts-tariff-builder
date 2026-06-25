import type { Project } from "@/types/project";
import { createLocalCustomerSiteSelectorEnvelope } from "@/lib/customer-site-selector-local-envelope";
import {
  adaptUtilityHubCustomerSiteSelector,
  type CustomerSiteSelectorAdapterResult
} from "@/lib/utilityhub-customer-site-selector-adapter";

export type CustomerSiteSelectorServiceMode = "local-contract-envelope";

export type CustomerSiteSelectorServiceResult = CustomerSiteSelectorAdapterResult & {
  mode: CustomerSiteSelectorServiceMode;
};

export function getCustomerSiteSelectorResult(project: Project): CustomerSiteSelectorServiceResult {
  const result = adaptUtilityHubCustomerSiteSelector(
    createLocalCustomerSiteSelectorEnvelope(project),
    project
  );

  return {
    ...result,
    mode: "local-contract-envelope"
  };
}
