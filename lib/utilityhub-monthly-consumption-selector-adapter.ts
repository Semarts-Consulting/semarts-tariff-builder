import type {
  UtilityHubSelectorEnvelope,
  UtilityHubSelectorPermissionStatus,
  UtilityHubSelectorProvenance
} from "@/lib/utilityhub-customer-site-selector-adapter";

export type UtilityHubConsumptionCoverageStatus =
  | "complete"
  | "partial"
  | "missing"
  | "not_applicable";

export type UtilityHubConsumptionValidationStatus =
  | "valid"
  | "review_required"
  | "invalid"
  | "unknown";

export type UtilityHubConsumptionValidationIssue = {
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
};

export type UtilityHubMonthlyConsumptionSelectorItem = {
  meterId: string;
  periodStart: string;
  periodEnd: string;
  monthLabel: string;
  importKwh: number;
  exportKwh?: number;
  netKwh?: number;
  readingCoverageStatus: UtilityHubConsumptionCoverageStatus;
  readingSource:
    | "meter_reading"
    | "supplier_file"
    | "manual_entry"
    | "calculated_summary"
    | "unknown";
  sourceVersion: string;
  calculatedAt: string;
  validationStatus: UtilityHubConsumptionValidationStatus;
  validationIssues: UtilityHubConsumptionValidationIssue[];
  provenance: UtilityHubSelectorProvenance;
};

export type MonthlyConsumptionSelectorOption = {
  id: string;
  meterId: string;
  periodStart: string;
  periodEnd: string;
  monthLabel: string;
  importKwh: number;
  exportKwh: number;
  netKwh: number;
  readingCoverageStatus: UtilityHubConsumptionCoverageStatus;
  validationStatus: UtilityHubConsumptionValidationStatus;
  validationIssueCount: number;
  permissionStatus: UtilityHubSelectorPermissionStatus;
  sourceVersion: string;
  snapshotId?: string;
  calculatedAt: string;
};

export type MonthlyConsumptionSelectorAdapterResult = {
  status: "ready" | "empty" | "unavailable" | "access-denied";
  message: string;
  options: MonthlyConsumptionSelectorOption[];
  sourceVersion?: string;
  retrievedAt: string;
  totalImportKwh: number;
  totalExportKwh: number;
  totalNetKwh: number;
  validationIssueCount: number;
  incompleteCoverageCount: number;
};

function toOption(
  item: UtilityHubMonthlyConsumptionSelectorItem,
  permissionStatus: UtilityHubSelectorPermissionStatus
): MonthlyConsumptionSelectorOption {
  const exportKwh = item.exportKwh ?? 0;
  const netKwh = item.netKwh ?? item.importKwh - exportKwh;

  return {
    id: `${item.meterId}:${item.periodStart}:${item.periodEnd}`,
    meterId: item.meterId,
    periodStart: item.periodStart,
    periodEnd: item.periodEnd,
    monthLabel: item.monthLabel,
    importKwh: item.importKwh,
    exportKwh,
    netKwh,
    readingCoverageStatus: item.readingCoverageStatus,
    validationStatus: item.validationStatus,
    validationIssueCount: item.validationIssues.length,
    permissionStatus,
    sourceVersion: item.sourceVersion,
    snapshotId: item.provenance.snapshotId,
    calculatedAt: item.calculatedAt
  };
}

export function adaptUtilityHubMonthlyConsumptionSelector(
  envelope: UtilityHubSelectorEnvelope<UtilityHubMonthlyConsumptionSelectorItem>
): MonthlyConsumptionSelectorAdapterResult {
  const options = envelope.items.map((item) => toOption(item, envelope.permissionStatus));
  const sourceVersion = options[0]?.sourceVersion;
  const totalImportKwh = options.reduce((total, option) => total + option.importKwh, 0);
  const totalExportKwh = options.reduce((total, option) => total + option.exportKwh, 0);
  const totalNetKwh = options.reduce((total, option) => total + option.netKwh, 0);
  const validationIssueCount = options.reduce(
    (total, option) => total + option.validationIssueCount,
    0
  );
  const incompleteCoverageCount = options.filter(
    (option) =>
      option.readingCoverageStatus === "partial" || option.readingCoverageStatus === "missing"
  ).length;

  if (envelope.state === "access_denied") {
    return {
      status: "access-denied",
      message:
        envelope.message ?? "UtilityHub denied access to monthly consumption summaries.",
      options: [],
      retrievedAt: envelope.retrievedAt,
      totalImportKwh: 0,
      totalExportKwh: 0,
      totalNetKwh: 0,
      validationIssueCount: 0,
      incompleteCoverageCount: 0
    };
  }

  if (envelope.state === "unavailable") {
    return {
      status: "unavailable",
      message: envelope.message ?? "UtilityHub monthly consumption selector is unavailable.",
      options: [],
      retrievedAt: envelope.retrievedAt,
      totalImportKwh: 0,
      totalExportKwh: 0,
      totalNetKwh: 0,
      validationIssueCount: 0,
      incompleteCoverageCount: 0
    };
  }

  if (envelope.state === "empty" || options.length === 0) {
    return {
      status: "empty",
      message: envelope.message ?? "No UtilityHub monthly consumption summaries match this scope.",
      options,
      sourceVersion,
      retrievedAt: envelope.retrievedAt,
      totalImportKwh,
      totalExportKwh,
      totalNetKwh,
      validationIssueCount,
      incompleteCoverageCount
    };
  }

  return {
    status: "ready",
    message: "UtilityHub monthly consumption summaries are available as evidence.",
    options,
    sourceVersion,
    retrievedAt: envelope.retrievedAt,
    totalImportKwh,
    totalExportKwh,
    totalNetKwh,
    validationIssueCount,
    incompleteCoverageCount
  };
}
