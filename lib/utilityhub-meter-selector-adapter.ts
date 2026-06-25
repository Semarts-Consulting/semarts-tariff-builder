import type {
  UtilityHubSelectorEnvelope,
  UtilityHubSelectorPermissionStatus,
  UtilityHubSelectorProvenance
} from "@/lib/utilityhub-customer-site-selector-adapter";

export type UtilityHubMeterSelectorItem = {
  meterId: string;
  meterReference: string;
  meterDisplayName: string;
  utilityType: string;
  supplyPointId: string;
  customerId: string;
  siteId: string;
  areaId?: string;
  buildingId?: string;
  floorId?: string;
  locationLabel: string;
  meterRole: string;
  responsibilityCategory?: string;
  meterStatus: string;
  effectiveFrom: string;
  effectiveTo?: string;
  parentMeterId?: string;
  boundaryMeterCandidate: boolean;
  sourceVersion: string;
  lastUpdatedAt: string;
  validationStatus: "valid" | "review_required" | "invalid" | "unknown";
  validationIssueCount: number;
  provenance: UtilityHubSelectorProvenance;
};

export type MeterSelectorOption = {
  id: string;
  label: string;
  meterId: string;
  meterReference: string;
  utilityType: string;
  supplyPointId: string;
  customerId: string;
  siteId: string;
  locationLabel: string;
  meterRole: string;
  responsibilityCategory?: string;
  meterStatus: string;
  boundaryMeterCandidate: boolean;
  permissionStatus: UtilityHubSelectorPermissionStatus;
  validationStatus: UtilityHubMeterSelectorItem["validationStatus"];
  validationIssueCount: number;
  sourceVersion: string;
  snapshotId?: string;
  lastUpdatedAt: string;
};

export type MeterSelectorAdapterResult = {
  status: "ready" | "empty" | "unavailable" | "access-denied";
  message: string;
  options: MeterSelectorOption[];
  sourceVersion?: string;
  retrievedAt: string;
  validationIssueCount: number;
  boundaryMeterCandidateCount: number;
};

function toOption(
  item: UtilityHubMeterSelectorItem,
  permissionStatus: UtilityHubSelectorPermissionStatus
): MeterSelectorOption {
  return {
    id: item.meterId,
    label: `${item.meterDisplayName} - ${item.locationLabel}`,
    meterId: item.meterId,
    meterReference: item.meterReference,
    utilityType: item.utilityType,
    supplyPointId: item.supplyPointId,
    customerId: item.customerId,
    siteId: item.siteId,
    locationLabel: item.locationLabel,
    meterRole: item.meterRole,
    responsibilityCategory: item.responsibilityCategory,
    meterStatus: item.meterStatus,
    boundaryMeterCandidate: item.boundaryMeterCandidate,
    permissionStatus,
    validationStatus: item.validationStatus,
    validationIssueCount: item.validationIssueCount,
    sourceVersion: item.sourceVersion,
    snapshotId: item.provenance.snapshotId,
    lastUpdatedAt: item.lastUpdatedAt
  };
}

export function adaptUtilityHubMeterSelector(
  envelope: UtilityHubSelectorEnvelope<UtilityHubMeterSelectorItem>
): MeterSelectorAdapterResult {
  const options = envelope.items.map((item) => toOption(item, envelope.permissionStatus));
  const sourceVersion = options[0]?.sourceVersion;
  const validationIssueCount = options.reduce(
    (total, option) => total + option.validationIssueCount,
    0
  );
  const boundaryMeterCandidateCount = options.filter(
    (option) => option.boundaryMeterCandidate
  ).length;

  if (envelope.state === "access_denied") {
    return {
      status: "access-denied",
      message: envelope.message ?? "UtilityHub denied access to meter selector records.",
      options: [],
      retrievedAt: envelope.retrievedAt,
      validationIssueCount: 0,
      boundaryMeterCandidateCount: 0
    };
  }

  if (envelope.state === "unavailable") {
    return {
      status: "unavailable",
      message: envelope.message ?? "UtilityHub meter selector is unavailable.",
      options: [],
      retrievedAt: envelope.retrievedAt,
      validationIssueCount: 0,
      boundaryMeterCandidateCount: 0
    };
  }

  if (envelope.state === "empty" || options.length === 0) {
    return {
      status: "empty",
      message: envelope.message ?? "No UtilityHub meter records match this scope.",
      options,
      sourceVersion,
      retrievedAt: envelope.retrievedAt,
      validationIssueCount,
      boundaryMeterCandidateCount
    };
  }

  return {
    status: "ready",
    message: "UtilityHub meter selector records are available as evidence.",
    options,
    sourceVersion,
    retrievedAt: envelope.retrievedAt,
    validationIssueCount,
    boundaryMeterCandidateCount
  };
}
