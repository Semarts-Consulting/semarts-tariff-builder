import { describe, expect, it } from "vitest";
import { getSupplyReferenceExtractionSummary } from "@/lib/supply-reference-extraction";
import type {
  SupplyReferenceLossCandidate,
  SupplyReferenceSourceDocument,
  SupplyReferenceTouCandidate
} from "@/types/project";

const sourceDocument: SupplyReferenceSourceDocument = {
  id: "source-1",
  distributorId: "10",
  chargingYear: "2026/27",
  title: "UKPN LC14",
  sourceUrl: "https://example.com/source",
  fileName: "ukpn.pdf",
  fileType: "PDF",
  extractionStatus: "Extracted",
  extractionNotes: "",
  uploadedAt: "2026-06-21T00:00:00.000Z"
};

const touCandidate: SupplyReferenceTouCandidate = {
  id: "tou-1",
  sourceDocumentId: sourceDocument.id,
  distributorId: "10",
  chargingYear: "2026/27",
  bandName: "Red",
  daysOfWeek: ["Monday"],
  appliesOnBankHolidays: false,
  months: ["January"],
  startTime: "16:00",
  endTime: "19:00",
  sourceReference: "Page 1",
  confidence: 0.8,
  status: "Approved"
};

const lossCandidate: SupplyReferenceLossCandidate = {
  id: "loss-1",
  sourceDocumentId: sourceDocument.id,
  distributorId: "10",
  chargingYear: "2026/27",
  voltage: "LV",
  lossFactorName: "LV losses",
  lossPercent: 5,
  lossMultiplier: 1.05,
  sourceReference: "Page 2",
  confidence: 0.7,
  status: "Needs review"
};

describe("getSupplyReferenceExtractionSummary", () => {
  it("summarises extracted TOU and loss candidates by review state", () => {
    const summary = getSupplyReferenceExtractionSummary({
      sourceDocuments: [sourceDocument],
      touCandidates: [touCandidate],
      lossCandidates: [lossCandidate]
    });

    expect(summary).toEqual({
      sourceDocumentCount: 1,
      touCandidateCount: 1,
      lossCandidateCount: 1,
      approvedTouCandidateCount: 1,
      approvedLossCandidateCount: 0,
      rejectedCandidateCount: 0,
      needsReviewCandidateCount: 1
    });
  });
});
