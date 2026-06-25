import type { Project } from "@/types/project";

export type CustomerSiteSelectorState = {
  status: "Ready for manual references" | "Awaiting live selector" | "Ready for review";
  hasCustomerReference: boolean;
  hasSiteReference: boolean;
  messages: string[];
};

export function summariseCustomerSiteSelectorState(project: Project): CustomerSiteSelectorState {
  const hasCustomerReference = Boolean(project.utilityHubCustomerId?.trim());
  const hasSiteReference = Boolean(project.utilityHubSiteId?.trim());
  const messages: string[] = [
    "UtilityHub selector contract is available, but live selection is not connected in Tariff Builder yet."
  ];

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
      hasCustomerReference && hasSiteReference
        ? "Ready for review"
        : hasCustomerReference || hasSiteReference
          ? "Ready for manual references"
          : "Awaiting live selector",
    hasCustomerReference,
    hasSiteReference,
    messages
  };
}
