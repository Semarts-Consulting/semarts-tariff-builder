import { getDnoNetworkAreaForMpan } from "@/lib/project-storage";
import type {
  SupplyDetailsInput,
  SupplyReferenceData,
  SupplyReferenceDataSet
} from "@/types/project";

export type SupplyReferenceReviewIssue = {
  supplyId: string;
  mpan: string;
  distributorId: string;
  networkArea: string;
  chargingYear: string;
  status: SupplyReferenceDataSet["reviewStatus"] | "Missing";
  message: string;
};

export type SupplyReferenceRequirement = {
  supplyId: string;
  mpan: string;
  distributorId: string;
  networkArea: string;
  chargingYear: string;
  requiresTimeOfUseReview: boolean;
  requiresLossesReview: boolean;
  message: string;
};

function getReferenceDataSet(
  distributorId: string,
  referenceData: SupplyReferenceData
) {
  return referenceData.dataSets
    .filter((dataSet) => dataSet.distributorId === distributorId)
    .sort((first, second) => second.chargingYear.localeCompare(first.chargingYear))[0];
}

export function getSupplyReferenceReviewIssues(
  supplyDetails: SupplyDetailsInput[],
  referenceData: SupplyReferenceData
): SupplyReferenceReviewIssue[] {
  return supplyDetails.flatMap((supply): SupplyReferenceReviewIssue[] => {
    const mpan = supply.mpan.replace(/\D/g, "");

    if (!/^\d{13}$/.test(mpan)) {
      return [];
    }

    const networkArea = getDnoNetworkAreaForMpan(mpan, referenceData);

    if (!networkArea) {
      return [
        {
          supplyId: supply.id,
          mpan,
          distributorId: mpan.slice(0, 2),
          networkArea: "Unknown",
          chargingYear: "",
          status: "Missing",
          message: `MPAN ${mpan} does not match a configured DNO/network area.`
        }
      ];
    }

    const dataSet = getReferenceDataSet(networkArea.distributorId, referenceData);

    if (!dataSet) {
      return [
        {
          supplyId: supply.id,
          mpan,
          distributorId: networkArea.distributorId,
          networkArea: networkArea.networkArea,
          chargingYear: "",
          status: "Missing",
          message: `${networkArea.networkArea} has no LC14 reference dataset.`
        }
      ];
    }

    if (dataSet.reviewStatus === "Reviewed") {
      return [];
    }

    return [
      {
        supplyId: supply.id,
        mpan,
        distributorId: networkArea.distributorId,
        networkArea: networkArea.networkArea,
        chargingYear: dataSet.chargingYear,
        status: dataSet.reviewStatus,
        message: `${networkArea.networkArea} ${dataSet.chargingYear} reference data is ${dataSet.reviewStatus.toLowerCase()}.`
      }
    ];
  });
}

export function getSupplyReferenceRequirements(
  supplyDetails: SupplyDetailsInput[],
  referenceData: SupplyReferenceData
): SupplyReferenceRequirement[] {
  return supplyDetails.flatMap((supply): SupplyReferenceRequirement[] => {
    const mpan = supply.mpan.replace(/\D/g, "");

    if (!/^\d{13}$/.test(mpan)) {
      return [];
    }

    const networkArea = getDnoNetworkAreaForMpan(mpan, referenceData);

    if (!networkArea) {
      return [
        {
          supplyId: supply.id,
          mpan,
          distributorId: mpan.slice(0, 2),
          networkArea: "Unknown",
          chargingYear: "",
          requiresTimeOfUseReview: true,
          requiresLossesReview: true,
          message: `MPAN ${mpan} does not match a configured DNO/network area.`
        }
      ];
    }

    const dataSet = getReferenceDataSet(networkArea.distributorId, referenceData);

    if (!dataSet) {
      return [
        {
          supplyId: supply.id,
          mpan,
          distributorId: networkArea.distributorId,
          networkArea: networkArea.networkArea,
          chargingYear: "",
          requiresTimeOfUseReview: true,
          requiresLossesReview: true,
          message: `${networkArea.networkArea} has no reference dataset.`
        }
      ];
    }

    const requiresTimeOfUseReview = dataSet.timeOfUseReviewStatus !== "Reviewed";
    const requiresLossesReview = dataSet.lossesReviewStatus !== "Reviewed";

    if (!requiresTimeOfUseReview && !requiresLossesReview) {
      return [];
    }

    const missingItems = [
      requiresTimeOfUseReview ? "TOU bands" : "",
      requiresLossesReview ? "distribution losses" : ""
    ].filter(Boolean);

    return [
      {
        supplyId: supply.id,
        mpan,
        distributorId: networkArea.distributorId,
        networkArea: networkArea.networkArea,
        chargingYear: dataSet.chargingYear,
        requiresTimeOfUseReview,
        requiresLossesReview,
        message: `${networkArea.networkArea} ${dataSet.chargingYear} requires Semarts review for ${missingItems.join(" and ")}.`
      }
    ];
  });
}
