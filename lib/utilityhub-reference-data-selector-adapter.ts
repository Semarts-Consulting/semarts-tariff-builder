import type {
  UtilityHubSelectorEnvelope,
  UtilityHubSelectorPermissionStatus,
  UtilityHubSelectorProvenance
} from "@/lib/utilityhub-customer-site-selector-adapter";

export type UtilityHubReferenceDataType =
  | "tlm"
  | "cpi"
  | "transmission_charge"
  | "distribution_charge"
  | "supply_contract"
  | "loss_factor"
  | "other";

export type UtilityHubReferenceDataSelectorItem = {
  referenceDataId: string;
  referenceDataType: UtilityHubReferenceDataType;
  displayName: string;
  periodStart?: string;
  periodEnd?: string;
  coverageStatus: "complete" | "partial" | "missing" | "not_applicable";
  validationStatus: "valid" | "review_required" | "invalid" | "unknown";
  validationIssueCount: number;
  source: string;
  sourceVersion: string;
  lastUpdatedAt: string;
  provenance: UtilityHubSelectorProvenance;
};

export type ReferenceDataSelectorOption = {
  id: string;
  label: string;
  referenceDataType: UtilityHubReferenceDataType;
  periodStart?: string;
  periodEnd?: string;
  coverageStatus: UtilityHubReferenceDataSelectorItem["coverageStatus"];
  validationStatus: UtilityHubReferenceDataSelectorItem["validationStatus"];
  validationIssueCount: number;
  permissionStatus: UtilityHubSelectorPermissionStatus;
  source: string;
  sourceVersion: string;
  snapshotId?: string;
  lastUpdatedAt: string;
};

export type ReferenceDataSelectorAdapterResult = {
  status: "ready" | "empty" | "unavailable" | "access-denied";
  message: string;
  options: ReferenceDataSelectorOption[];
  sourceVersion?: string;
  retrievedAt: string;
  validationIssueCount: number;
  incompleteCoverageCount: number;
};

function toOption(
  item: UtilityHubReferenceDataSelectorItem,
  permissionStatus: UtilityHubSelectorPermissionStatus
): ReferenceDataSelectorOption {
  return {
    id: item.referenceDataId,
    label: item.displayName,
    referenceDataType: item.referenceDataType,
    periodStart: item.periodStart,
    periodEnd: item.periodEnd,
    coverageStatus: item.coverageStatus,
    validationStatus: item.validationStatus,
    validationIssueCount: item.validationIssueCount,
    permissionStatus,
    source: item.source,
    sourceVersion: item.sourceVersion,
    snapshotId: item.provenance.snapshotId,
    lastUpdatedAt: item.lastUpdatedAt
  };
}

export function adaptUtilityHubReferenceDataSelector(
  envelope: UtilityHubSelectorEnvelope<UtilityHubReferenceDataSelectorItem>
): ReferenceDataSelectorAdapterResult {
  const options = envelope.items.map((item) => toOption(item, envelope.permissionStatus));
  const sourceVersion = options[0]?.sourceVersion;
  const validationIssueCount = options.reduce(
    (total, option) => total + option.validationIssueCount,
    0
  );
  const incompleteCoverageCount = options.filter(
    (option) => option.coverageStatus === "partial" || option.coverageStatus === "missing"
  ).length;

  if (envelope.state === "access_denied") {
    return {
      status: "access-denied",
      message: envelope.message ?? "UtilityHub denied access to reference data selector records.",
      options: [],
      retrievedAt: envelope.retrievedAt,
      validationIssueCount: 0,
      incompleteCoverageCount: 0
    };
  }

  if (envelope.state === "unavailable") {
    return {
      status: "unavailable",
      message: envelope.message ?? "UtilityHub reference data selector is unavailable.",
      options: [],
      retrievedAt: envelope.retrievedAt,
      validationIssueCount: 0,
      incompleteCoverageCount: 0
    };
  }

  if (envelope.state === "empty" || options.length === 0) {
    return {
      status: "empty",
      message: envelope.message ?? "No UtilityHub reference data records match this scope.",
      options,
      sourceVersion,
      retrievedAt: envelope.retrievedAt,
      validationIssueCount,
      incompleteCoverageCount
    };
  }

  return {
    status: "ready",
    message: "UtilityHub reference data selector records are available as evidence.",
    options,
    sourceVersion,
    retrievedAt: envelope.retrievedAt,
    validationIssueCount,
    incompleteCoverageCount
  };
}
