import {
  getSupplyReferenceRequirements,
  type SupplyReferenceRequirement
} from "@/lib/supply-reference-review";
import type {
  Project,
  ProjectMethodologyInputs,
  SupplyReferenceData
} from "@/types/project";

export type SupplyReferenceRequirementQueueItem = {
  id: string;
  distributorId: string;
  networkArea: string;
  chargingYear: string;
  requiresTimeOfUseReview: boolean;
  requiresLossesReview: boolean;
  sourceDocumentTitle: string;
  sourceDocumentUrl: string;
  sourceNotes: string;
  mpans: string[];
  projectNames: string[];
};

export function getSupplyReferenceExtractionTaskId({
  distributorId,
  chargingYear
}: {
  distributorId: string;
  chargingYear: string;
}) {
  return `required-reference-${distributorId}-${chargingYear.replace(/[^a-zA-Z0-9]+/g, "-")}`;
}

function getQueueKey(requirement: SupplyReferenceRequirement) {
  return [
    requirement.distributorId,
    requirement.chargingYear || "unknown-year",
    requirement.networkArea
  ].join("|");
}

export function getSupplyReferenceRequirementQueue({
  projects,
  methodologyInputs,
  referenceData
}: {
  projects: Project[];
  methodologyInputs: ProjectMethodologyInputs[];
  referenceData: SupplyReferenceData;
}): SupplyReferenceRequirementQueueItem[] {
  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));
  const dataSetByDistributorYear = new Map(
    referenceData.dataSets.map((dataSet) => [
      `${dataSet.distributorId}|${dataSet.chargingYear}`,
      dataSet
    ])
  );
  const groupedRequirements = new Map<string, SupplyReferenceRequirementQueueItem>();

  methodologyInputs.forEach((inputs) => {
    const projectName = projectNameById.get(inputs.projectId) ?? inputs.projectId;
    const requirements = getSupplyReferenceRequirements(inputs.supplyDetails, referenceData);

    requirements.forEach((requirement) => {
      const key = getQueueKey(requirement);
      const existingRequirement = groupedRequirements.get(key);

      if (!existingRequirement) {
        const dataSet = dataSetByDistributorYear.get(
          `${requirement.distributorId}|${requirement.chargingYear}`
        );

        groupedRequirements.set(key, {
          id: key,
          distributorId: requirement.distributorId,
          networkArea: requirement.networkArea,
          chargingYear: requirement.chargingYear,
          requiresTimeOfUseReview: requirement.requiresTimeOfUseReview,
          requiresLossesReview: requirement.requiresLossesReview,
          sourceDocumentTitle: dataSet?.sourceDocumentTitle ?? "",
          sourceDocumentUrl: dataSet?.sourceDocumentUrl ?? "",
          sourceNotes: dataSet?.sourceNotes ?? "",
          mpans: [requirement.mpan],
          projectNames: [projectName]
        });
        return;
      }

      groupedRequirements.set(key, {
        ...existingRequirement,
        requiresTimeOfUseReview:
          existingRequirement.requiresTimeOfUseReview || requirement.requiresTimeOfUseReview,
        requiresLossesReview:
          existingRequirement.requiresLossesReview || requirement.requiresLossesReview,
        mpans: Array.from(new Set([...existingRequirement.mpans, requirement.mpan])).sort(),
        projectNames: Array.from(new Set([...existingRequirement.projectNames, projectName])).sort()
      });
    });
  });

  return Array.from(groupedRequirements.values()).sort((first, second) =>
    first.id.localeCompare(second.id)
  );
}
