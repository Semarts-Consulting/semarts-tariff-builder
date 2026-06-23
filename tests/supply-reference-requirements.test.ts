import { describe, expect, it } from "vitest";
import {
  createDefaultMethodologyInputs,
  createDefaultSupplyReferenceData,
  createSupplyDetailsInput
} from "@/lib/project-storage";
import {
  getSupplyReferenceExtractionTaskId,
  getSupplyReferenceRequirementQueue
} from "@/lib/supply-reference-requirements";
import type { Project, SupplyReferenceData } from "@/types/project";

const project: Project = {
  id: "project-1",
  name: "Test project",
  networkName: "Test network",
  tariffYear: 2026,
  effectiveDate: "2026-01-01",
  billingPeriod: "Annual",
  customerClasses: [],
  status: "Draft",
  lastUpdated: "21 June 2026"
};

function createSupply(mpan: string) {
  return {
    ...createSupplyDetailsInput(),
    id: `supply-${mpan}`,
    mpan
  };
}

function withPendingReferenceData(): SupplyReferenceData {
  return {
    ...createDefaultSupplyReferenceData(),
    dataSets: [
      {
        id: "lc14-10-2026-27",
        distributorId: "10",
        chargingYear: "2026/27",
        reviewStatus: "Partially reviewed",
        extractionStatus: "Not extracted",
        timeOfUseReviewStatus: "Pending review",
        lossesReviewStatus: "Pending review",
        sourceDocumentTitle: "UKPN source",
        sourceDocumentUrl: "https://example.com/ukpn",
        sourceReviewedAt: "",
        sourceNotes: "",
        timeOfUseDefinitions: [],
        distributionLossFactors: []
      }
    ],
    lastUpdated: "21 June 2026"
  };
}

describe("getSupplyReferenceRequirementQueue", () => {
  it("groups duplicate MPAN requirements by DNO and charging year", () => {
    const inputs = createDefaultMethodologyInputs(project.id);
    inputs.supplyDetails = [createSupply("1000000000000"), createSupply("1000000000001")];

    const queue = getSupplyReferenceRequirementQueue({
      projects: [project],
      methodologyInputs: [inputs],
      referenceData: withPendingReferenceData()
    });

    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      distributorId: "10",
      chargingYear: "2026/27",
      requiresTimeOfUseReview: true,
      requiresLossesReview: true,
      sourceDocumentTitle: "UKPN source",
      sourceDocumentUrl: "https://example.com/ukpn",
      projectNames: ["Test project"]
    });
    expect(queue[0].mpans).toEqual(["1000000000000", "1000000000001"]);
  });

  it("deduplicates formatted MPANs after normalisation", () => {
    const inputs = createDefaultMethodologyInputs(project.id);
    inputs.supplyDetails = [
      createSupply("10 0000 0000 000"),
      createSupply("1000000000000")
    ];

    const queue = getSupplyReferenceRequirementQueue({
      projects: [project],
      methodologyInputs: [inputs],
      referenceData: withPendingReferenceData()
    });

    expect(queue).toHaveLength(1);
    expect(queue[0].mpans).toEqual(["1000000000000"]);
  });

  it("queues unknown DNO requirements without source document metadata", () => {
    const inputs = createDefaultMethodologyInputs(project.id);
    inputs.supplyDetails = [createSupply("9900000000000")];

    const queue = getSupplyReferenceRequirementQueue({
      projects: [project],
      methodologyInputs: [inputs],
      referenceData: createDefaultSupplyReferenceData()
    });

    expect(queue).toEqual([
      {
        id: "99|unknown-year|Unknown",
        distributorId: "99",
        networkArea: "Unknown",
        chargingYear: "",
        requiresTimeOfUseReview: true,
        requiresLossesReview: true,
        sourceDocumentTitle: "",
        sourceDocumentUrl: "",
        sourceNotes: "",
        mpans: ["9900000000000"],
        projectNames: ["Test project"]
      }
    ]);
  });
});

describe("getSupplyReferenceExtractionTaskId", () => {
  it("creates deterministic IDs for DNO and charging year", () => {
    expect(
      getSupplyReferenceExtractionTaskId({
        distributorId: "10",
        chargingYear: "2026/27"
      })
    ).toBe("required-reference-10-2026-27");
  });
});
