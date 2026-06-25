import type { Project } from "@/types/project";
import type {
  UtilityHubCustomerSiteContextItem,
  UtilityHubSelectorEnvelope
} from "@/lib/utilityhub-customer-site-selector-adapter";

function buildSourceVersion(project: Project) {
  return `tariff-builder-local:${project.id}:${project.tariffYear}`;
}

export function createLocalCustomerSiteSelectorEnvelope(
  project: Project,
  retrievedAt = new Date().toISOString()
): UtilityHubSelectorEnvelope<UtilityHubCustomerSiteContextItem> {
  const customerId = project.utilityHubCustomerId?.trim();
  const siteId = project.utilityHubSiteId?.trim();

  if (!customerId || !siteId) {
    return {
      contractVersion: "utilityhub-tariff-selectors.v1",
      state: "empty",
      permissionStatus: "allowed",
      message:
        "No UtilityHub customer/site selector records are available until customer and site references are present.",
      retrievedAt,
      items: []
    };
  }

  const sourceVersion = buildSourceVersion(project);
  const item: UtilityHubCustomerSiteContextItem = {
    customerId,
    customerName: customerId,
    siteId,
    siteName: project.networkName || project.name,
    status: project.status,
    effectiveFrom: project.referencePeriodStart ?? project.effectiveDate,
    permissionStatus: "read_only",
    sourceVersion,
    lastUpdatedAt: project.lastUpdated,
    provenance: {
      sourceSystem: "utilityhub",
      sourceRecordId: `site:${siteId}`,
      sourceVersion,
      snapshotId: sourceVersion,
      retrievedAt,
      lastUpdatedAt: project.lastUpdated
    }
  };

  return {
    contractVersion: "utilityhub-tariff-selectors.v1",
    state: "available",
    permissionStatus: "read_only",
    message:
      "Local contract-shaped selector envelope created from reviewed manual UtilityHub references.",
    retrievedAt,
    items: [item]
  };
}
