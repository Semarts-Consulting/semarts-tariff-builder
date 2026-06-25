import type { Project } from "@/types/project";

export type UtilityHubSelectorResponseState = "available" | "empty" | "unavailable" | "access_denied";
export type UtilityHubSelectorPermissionStatus = "allowed" | "read_only" | "blocked" | "denied";

export type UtilityHubSelectorProvenance = {
  sourceSystem: "utilityhub" | "approved_reference_service";
  sourceRecordId: string;
  sourceDocumentId?: string;
  sourceVersion?: string;
  snapshotId?: string;
  retrievedAt: string;
  lastUpdatedAt: string;
  auditEventId?: string;
};

export type UtilityHubSelectorEnvelope<TItem> = {
  contractVersion: "utilityhub-tariff-selectors.v1";
  state: UtilityHubSelectorResponseState;
  permissionStatus: UtilityHubSelectorPermissionStatus;
  message?: string;
  retrievedAt: string;
  items: TItem[];
};

export type UtilityHubCustomerSiteContextItem = {
  customerId: string;
  customerName: string;
  siteId: string;
  siteName: string;
  areaId?: string;
  areaName?: string;
  buildingId?: string;
  buildingName?: string;
  floorId?: string;
  floorName?: string;
  status: string;
  effectiveFrom: string;
  effectiveTo?: string;
  permissionStatus: UtilityHubSelectorPermissionStatus;
  sourceVersion: string;
  lastUpdatedAt: string;
  provenance: UtilityHubSelectorProvenance;
};

export type CustomerSiteSelectorOption = {
  id: string;
  label: string;
  customerId: string;
  customerName: string;
  siteId: string;
  siteName: string;
  hierarchyLabel: string;
  permissionStatus: UtilityHubSelectorPermissionStatus;
  sourceVersion: string;
  snapshotId?: string;
  lastUpdatedAt: string;
};

export type CustomerSiteSelectorAdapterResult = {
  status: "ready" | "empty" | "unavailable" | "access-denied";
  message: string;
  options: CustomerSiteSelectorOption[];
  selectedOption?: CustomerSiteSelectorOption;
  sourceVersion?: string;
  retrievedAt: string;
};

function formatHierarchyLabel(item: UtilityHubCustomerSiteContextItem) {
  return [item.customerName, item.areaName, item.siteName, item.buildingName, item.floorName]
    .filter(Boolean)
    .join(" / ");
}

function toOption(item: UtilityHubCustomerSiteContextItem): CustomerSiteSelectorOption {
  return {
    id: `${item.customerId}:${item.siteId}`,
    label: `${item.customerName} - ${item.siteName}`,
    customerId: item.customerId,
    customerName: item.customerName,
    siteId: item.siteId,
    siteName: item.siteName,
    hierarchyLabel: formatHierarchyLabel(item),
    permissionStatus: item.permissionStatus,
    sourceVersion: item.sourceVersion,
    snapshotId: item.provenance.snapshotId,
    lastUpdatedAt: item.lastUpdatedAt
  };
}

export function adaptUtilityHubCustomerSiteSelector(
  envelope: UtilityHubSelectorEnvelope<UtilityHubCustomerSiteContextItem>,
  project: Pick<Project, "utilityHubCustomerId" | "utilityHubSiteId">
): CustomerSiteSelectorAdapterResult {
  const options = envelope.items.map(toOption);
  const selectedOption = options.find(
    (option) =>
      option.customerId === project.utilityHubCustomerId &&
      option.siteId === project.utilityHubSiteId
  );
  const sourceVersion = selectedOption?.sourceVersion ?? options[0]?.sourceVersion;

  if (envelope.state === "access_denied") {
    return {
      status: "access-denied",
      message: envelope.message ?? "UtilityHub denied access to this selector scope.",
      options: [],
      retrievedAt: envelope.retrievedAt
    };
  }

  if (envelope.state === "unavailable") {
    return {
      status: "unavailable",
      message: envelope.message ?? "UtilityHub customer/site selector is unavailable.",
      options: [],
      retrievedAt: envelope.retrievedAt
    };
  }

  if (envelope.state === "empty" || options.length === 0) {
    return {
      status: "empty",
      message: envelope.message ?? "No UtilityHub customer/site records match this scope.",
      options,
      sourceVersion,
      retrievedAt: envelope.retrievedAt
    };
  }

  return {
    status: "ready",
    message: selectedOption
      ? "Selected UtilityHub customer/site context is available as evidence."
      : "UtilityHub customer/site options are available for review.",
    options,
    selectedOption,
    sourceVersion,
    retrievedAt: envelope.retrievedAt
  };
}
