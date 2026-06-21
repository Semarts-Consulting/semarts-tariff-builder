import type {
  SupplyReferenceCandidateStatus,
  SupplyReferenceLossCandidate,
  SupplyReferenceSourceDocument,
  SupplyReferenceTouCandidate
} from "@/types/project";

export type SupplyReferenceExtractionSummary = {
  sourceDocumentCount: number;
  touCandidateCount: number;
  lossCandidateCount: number;
  approvedTouCandidateCount: number;
  approvedLossCandidateCount: number;
  rejectedCandidateCount: number;
  needsReviewCandidateCount: number;
};

function countByStatus<T extends { status: SupplyReferenceCandidateStatus }>(
  rows: T[],
  status: SupplyReferenceCandidateStatus
) {
  return rows.filter((row) => row.status === status).length;
}

export function getSupplyReferenceExtractionSummary({
  sourceDocuments,
  touCandidates,
  lossCandidates
}: {
  sourceDocuments: SupplyReferenceSourceDocument[];
  touCandidates: SupplyReferenceTouCandidate[];
  lossCandidates: SupplyReferenceLossCandidate[];
}): SupplyReferenceExtractionSummary {
  return {
    sourceDocumentCount: sourceDocuments.length,
    touCandidateCount: touCandidates.length,
    lossCandidateCount: lossCandidates.length,
    approvedTouCandidateCount: countByStatus(touCandidates, "Approved"),
    approvedLossCandidateCount: countByStatus(lossCandidates, "Approved"),
    rejectedCandidateCount:
      countByStatus(touCandidates, "Rejected") + countByStatus(lossCandidates, "Rejected"),
    needsReviewCandidateCount:
      countByStatus(touCandidates, "Needs review") +
      countByStatus(lossCandidates, "Needs review") +
      countByStatus(touCandidates, "Extracted") +
      countByStatus(lossCandidates, "Extracted")
  };
}
