import type { InputSelectionGroup, Project, TariffYearInputSelection } from "@/types/project";

export type UtilityHubSelectorKey =
  | "customer-site-context"
  | "meter"
  | "monthly-consumption"
  | "boundary-meter"
  | "reference-data";

export type UtilityHubSelectorServiceStatus =
  | "contract-ready"
  | "selected-evidence"
  | "awaiting-service"
  | "blocked";

export type UtilityHubSelectorReadinessItem = {
  key: UtilityHubSelectorKey;
  label: string;
  status: UtilityHubSelectorServiceStatus;
  contractFile: string;
  selectedEvidenceCount: number;
  tariffDrivingCount: number;
  message: string;
};

export type UtilityHubSelectorReadinessSummary = {
  status: "Contract ready" | "Selected evidence present" | "Blocked";
  contractReadyCount: number;
  selectedEvidenceCount: number;
  tariffDrivingCount: number;
  liveServiceConnectedCount: number;
  items: UtilityHubSelectorReadinessItem[];
};

const contractFile = "UtilityHub: src/services/tariff-selector-contract.ts";

const selectorDefinitions: Array<{
  key: UtilityHubSelectorKey;
  group: InputSelectionGroup;
  label: string;
  sourceEntityTypes: string[];
}> = [
  {
    key: "customer-site-context",
    group: "customer-site-context",
    label: "Customer/site selector",
    sourceEntityTypes: ["customer_site_context"]
  },
  {
    key: "meter",
    group: "meter-consumption",
    label: "Meter selector",
    sourceEntityTypes: ["meter", "meter_consumption_summary"]
  },
  {
    key: "monthly-consumption",
    group: "meter-consumption",
    label: "Monthly consumption selector",
    sourceEntityTypes: ["monthly_consumption_summary", "meter_consumption_summary"]
  },
  {
    key: "boundary-meter",
    group: "boundary-meter",
    label: "Boundary meter selector",
    sourceEntityTypes: ["boundary_meter_summary"]
  },
  {
    key: "reference-data",
    group: "reference-data",
    label: "Reference data selector",
    sourceEntityTypes: ["tariff_reference_data_pack", "reference_data"]
  }
];

function countSelectedEvidence(
  selections: TariffYearInputSelection[],
  definition: (typeof selectorDefinitions)[number]
) {
  return selections.filter(
    (selection) =>
      selection.group === definition.group &&
      definition.sourceEntityTypes.includes(selection.sourceEntityType) &&
      selection.selectionStatus === "selected"
  ).length;
}

function countTariffDriving(
  selections: TariffYearInputSelection[],
  definition: (typeof selectorDefinitions)[number]
) {
  return selections.filter(
    (selection) =>
      selection.group === definition.group &&
      definition.sourceEntityTypes.includes(selection.sourceEntityType) &&
      selection.tariffUse === "tariff-driving"
  ).length;
}

export function summariseUtilityHubSelectorReadiness(
  project: Project
): UtilityHubSelectorReadinessSummary {
  const selections = project.inputSelections ?? [];
  const items = selectorDefinitions.map((definition): UtilityHubSelectorReadinessItem => {
    const selectedEvidenceCount = countSelectedEvidence(selections, definition);
    const tariffDrivingCount = countTariffDriving(selections, definition);

    if (tariffDrivingCount > 0) {
      return {
        key: definition.key,
        label: definition.label,
        status: "blocked",
        contractFile,
        selectedEvidenceCount,
        tariffDrivingCount,
        message:
          "Tariff-driving selected UtilityHub data is present and needs explicit owner sign-off."
      };
    }

    if (selectedEvidenceCount > 0) {
      return {
        key: definition.key,
        label: definition.label,
        status: "selected-evidence",
        contractFile,
        selectedEvidenceCount,
        tariffDrivingCount,
        message:
          "Contract baseline exists and selected records remain evidence-only pending live service implementation."
      };
    }

    return {
      key: definition.key,
      label: definition.label,
      status: "awaiting-service",
      contractFile,
      selectedEvidenceCount,
      tariffDrivingCount,
      message:
        "Contract baseline exists. Live UtilityHub service connection has not been implemented in Tariff Builder."
    };
  });

  const selectedEvidenceCount = items.reduce((total, item) => total + item.selectedEvidenceCount, 0);
  const tariffDrivingCount = items.reduce((total, item) => total + item.tariffDrivingCount, 0);

  return {
    status:
      tariffDrivingCount > 0
        ? "Blocked"
        : selectedEvidenceCount > 0
          ? "Selected evidence present"
          : "Contract ready",
    contractReadyCount: items.length,
    selectedEvidenceCount,
    tariffDrivingCount,
    liveServiceConnectedCount: 0,
    items
  };
}
