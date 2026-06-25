import type { Project } from "@/types/project";
import type { CustomerSiteSelectorAdapterResult } from "@/lib/utilityhub-customer-site-selector-adapter";

export type CustomerSiteSelectorState = {
  status: "Ready for manual references" | "Awaiting live selector" | "Ready for review";
  hasCustomerReference: boolean;
  hasSiteReference: boolean;
  optionCount: number;
  sourceVersion?: string;
  messages: string[];
};

export function summariseCustomerSiteSelectorState(
  project: Project,
  selectorResult?: CustomerSiteSelectorAdapterResult
): CustomerSiteSelectorState {
  const hasCustomerReference = Boolean(project.utilityHubCustomerId?.trim());
  const hasSiteReference = Boolean(project.utilityHubSiteId?.trim());
  const optionCount = selectorResult?.options.length ?? 0;
  const messages: string[] = [];

  if (selectorResult?.status === "access-denied") {
    messages.push(selectorResult.message);
  } else if (selectorResult?.status === "unavailable") {
    messages.push(selectorResult.message);
  } else if (selectorResult?.status === "ready") {
    messages.push(selectorResult.message);
  } else {
    messages.push(
      "UtilityHub selector contract is available, but live selection is not connected in Tariff Builder yet."
    );
  }

  if (!hasCustomerReference) {
    messages.push("Add or select a UtilityHub customer reference before tariff-year input review.");
  }

  if (!hasSiteReference) {
    messages.push("Add or select a UtilityHub site reference before meter and reference-data selection.");
  }

  if (hasCustomerReference && hasSiteReference) {
    messages.push("Manual UtilityHub references are present and should be reviewed against UtilityHub.");
  }

  return {
    status:
      hasCustomerReference && hasSiteReference && selectorResult?.status !== "access-denied"
        ? "Ready for review"
        : hasCustomerReference || hasSiteReference || optionCount > 0
          ? "Ready for manual references"
          : "Awaiting live selector",
    hasCustomerReference,
    hasSiteReference,
    optionCount,
    sourceVersion: selectorResult?.sourceVersion,
    messages
  };
}
