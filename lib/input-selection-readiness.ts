import type {
  InputSelectionGroup,
  Project,
  TariffYearInputSelection
} from "@/types/project";

export type InputSelectionGroupSummary = {
  group: InputSelectionGroup;
  label: string;
  status: "Not started" | "Needs review" | "Blocked" | "Ready";
  totalCount: number;
  selectedCount: number;
  evidenceOnlyCount: number;
  tariffDrivingCount: number;
  warningCount: number;
  messages: string[];
};

export type InputSelectionReadinessSummary = {
  status: "Not started" | "Needs review" | "Blocked" | "Ready for input review";
  groupSummaries: InputSelectionGroupSummary[];
  blockedCount: number;
  warningCount: number;
};

const requiredGroups: Array<{ group: InputSelectionGroup; label: string }> = [
  { group: "customer-site-context", label: "Customer/site context" },
  { group: "meter-consumption", label: "Meter and consumption" },
  { group: "boundary-meter", label: "Boundary meters" },
  { group: "reference-data", label: "Reference data" }
];

function groupSelections(selections: TariffYearInputSelection[], group: InputSelectionGroup) {
  return selections.filter((selection) => selection.group === group);
}

function summariseGroup(
  selections: TariffYearInputSelection[],
  group: InputSelectionGroup,
  label: string
): InputSelectionGroupSummary {
  const groupRows = groupSelections(selections, group);
  const selectedRows = groupRows.filter((row) => row.selectionStatus === "selected");
  const blockedRows = groupRows.filter(
    (row) => row.selectionStatus === "blocked" || row.tariffUse === "blocked"
  );
  const reviewRows = groupRows.filter((row) =>
    ["not-reviewed", "needs-review", "accepted-with-limitation"].includes(row.reviewStatus)
  );
  const evidenceOnlyCount = selectedRows.filter((row) => row.tariffUse === "evidence-only").length;
  const tariffDrivingCount = selectedRows.filter((row) => row.tariffUse === "tariff-driving").length;
  const messages: string[] = [];

  if (groupRows.length === 0) {
    messages.push(`${label} has no selected evidence yet.`);
  }

  if (blockedRows.length > 0) {
    messages.push(`${blockedRows.length} ${label.toLowerCase()} item${blockedRows.length === 1 ? "" : "s"} blocked.`);
  }

  if (reviewRows.length > 0) {
    messages.push(`${reviewRows.length} ${label.toLowerCase()} item${reviewRows.length === 1 ? "" : "s"} need review.`);
  }

  if (tariffDrivingCount > 0) {
    messages.push("Tariff-driving input exists and must have owner sign-off.");
  }

  if (messages.length === 0) {
    messages.push(`${label} selections are ready for input review.`);
  }

  return {
    group,
    label,
    status:
      blockedRows.length > 0
        ? "Blocked"
        : groupRows.length === 0
          ? "Not started"
          : reviewRows.length > 0
            ? "Needs review"
            : "Ready",
    totalCount: groupRows.length,
    selectedCount: selectedRows.length,
    evidenceOnlyCount,
    tariffDrivingCount,
    warningCount: reviewRows.length,
    messages
  };
}

export function createDefaultInputSelectionScaffold(project: Project): TariffYearInputSelection[] {
  const referenceSuffix = `${project.id}-${project.tariffYear}`;

  return [
    {
      id: `${referenceSuffix}-customer-site`,
      group: "customer-site-context",
      sourceSystem: "utilityhub",
      sourceEntityType: "customer_site_context",
      sourceEntityId: project.utilityHubSiteId || project.utilityHubCustomerId || "",
      displayName: project.networkName || project.name,
      selectionStatus: project.utilityHubCustomerId && project.utilityHubSiteId ? "selected" : "provisional",
      reviewStatus: project.utilityHubCustomerId && project.utilityHubSiteId ? "needs-review" : "not-reviewed",
      tariffUse: "evidence-only",
      reviewNotes: "UtilityHub customer/site reference scaffold. Does not drive tariffs."
    },
    {
      id: `${referenceSuffix}-meter-consumption`,
      group: "meter-consumption",
      sourceSystem: "utilityhub",
      sourceEntityType: "meter_consumption_summary",
      sourceEntityId: "",
      displayName: "Reference-year meter consumption",
      selectionStatus: "available",
      reviewStatus: "not-reviewed",
      tariffUse: "evidence-only",
      reviewNotes: "Future UtilityHub meter and consumption selection. Does not drive tariffs."
    },
    {
      id: `${referenceSuffix}-boundary-meter`,
      group: "boundary-meter",
      sourceSystem: "utilityhub",
      sourceEntityType: "boundary_meter_summary",
      sourceEntityId: "",
      displayName: "Reference-year boundary meters",
      selectionStatus: "available",
      reviewStatus: "not-reviewed",
      tariffUse: "evidence-only",
      reviewNotes: "Future UtilityHub boundary meter selection. Does not drive tariffs."
    },
    {
      id: `${referenceSuffix}-reference-data`,
      group: "reference-data",
      sourceSystem: "reference-data",
      sourceEntityType: "tariff_reference_data_pack",
      sourceEntityId: "",
      displayName: "CPI, TLM, transmission and distribution references",
      selectionStatus: "available",
      reviewStatus: "not-reviewed",
      tariffUse: "evidence-only",
      reviewNotes: "Future reference-data selection. Does not drive tariffs."
    }
  ];
}

export function summariseInputSelectionReadiness(
  selections: TariffYearInputSelection[]
): InputSelectionReadinessSummary {
  const groupSummaries = requiredGroups.map(({ group, label }) =>
    summariseGroup(selections, group, label)
  );
  const blockedCount = groupSummaries.filter((summary) => summary.status === "Blocked").length;
  const warningCount = groupSummaries.filter((summary) =>
    ["Not started", "Needs review"].includes(summary.status)
  ).length;

  return {
    status:
      blockedCount > 0
        ? "Blocked"
        : groupSummaries.every((summary) => summary.status === "Not started")
          ? "Not started"
          : warningCount > 0
            ? "Needs review"
            : "Ready for input review",
    groupSummaries,
    blockedCount,
    warningCount
  };
}
