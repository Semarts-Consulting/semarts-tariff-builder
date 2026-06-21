import { describe, expect, it } from "vitest";
import {
  createDefaultSupplyReferenceData,
  createSupplyDetailsInput
} from "@/lib/project-storage";
import { getSupplyReferenceReviewIssues } from "@/lib/supply-reference-review";
import type { SupplyReferenceData } from "@/types/project";

function createSupply(mpan: string) {
  return {
    ...createSupplyDetailsInput(),
    id: `supply-${mpan}`,
    mpan
  };
}

function withReviewedDistributor(
  referenceData: SupplyReferenceData,
  distributorId: string
): SupplyReferenceData {
  const dataSet = {
    id: `lc14-${distributorId}-2026-27`,
    distributorId,
    chargingYear: "2026/27",
    reviewStatus: "Reviewed" as const,
    extractionStatus: "Extracted" as const,
    timeOfUseReviewStatus: "Reviewed" as const,
    lossesReviewStatus: "Reviewed" as const,
    sourceDocumentTitle: "Reviewed source",
    sourceDocumentUrl: "https://example.com/reviewed",
    sourceReviewedAt: "2026-06-21",
    sourceNotes: "Reviewed test source.",
    timeOfUseDefinitions: [],
    distributionLossFactors: []
  };

  return {
    ...referenceData,
    dataSets: [
      ...referenceData.dataSets.filter((existingDataSet) => existingDataSet.distributorId !== distributorId),
      dataSet
    ]
  };
}

function withPendingDistributor(
  referenceData: SupplyReferenceData,
  distributorId: string
): SupplyReferenceData {
  return {
    ...referenceData,
    dataSets: [
      ...referenceData.dataSets.filter((dataSet) => dataSet.distributorId !== distributorId),
      {
        id: `lc14-${distributorId}-2026-27`,
        distributorId,
        chargingYear: "2026/27",
        reviewStatus: "Partially reviewed",
        extractionStatus: "Not extracted",
        timeOfUseReviewStatus: "Pending review",
        lossesReviewStatus: "Pending review",
        sourceDocumentTitle: "Pending source",
        sourceDocumentUrl: "https://example.com/pending",
        sourceReviewedAt: "",
        sourceNotes: "Pending test source.",
        timeOfUseDefinitions: [],
        distributionLossFactors: []
      }
    ]
  };
}

describe("getSupplyReferenceReviewIssues", () => {
  it("returns no issues for reviewed MPAN reference data", () => {
    const referenceData = withReviewedDistributor(createDefaultSupplyReferenceData(), "10");

    const issues = getSupplyReferenceReviewIssues([createSupply("1000000000000")], referenceData);

    expect(issues).toHaveLength(0);
  });

  it("flags valid MPANs where the DNO reference data is not reviewed", () => {
    const referenceData = withPendingDistributor(createDefaultSupplyReferenceData(), "10");

    const issues = getSupplyReferenceReviewIssues([createSupply("1000000000000")], referenceData);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      distributorId: "10",
      status: "Partially reviewed"
    });
  });

  it("ignores incomplete MPANs because input validation handles them separately", () => {
    const referenceData = createDefaultSupplyReferenceData();

    const issues = getSupplyReferenceReviewIssues([createSupply("10")], referenceData);

    expect(issues).toHaveLength(0);
  });
});
