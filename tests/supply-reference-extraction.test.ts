import { describe, expect, it } from "vitest";
import {
  getSupplyReferenceExtractionSummary,
  parseSupplyReferenceExtractionWorkbook,
  supplyReferenceLossCandidateHeaders,
  supplyReferenceTouCandidateHeaders
} from "@/lib/supply-reference-extraction";
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

describe("parseSupplyReferenceExtractionWorkbook", () => {
  it("parses valid TOU and loss candidate rows", () => {
    const result = parseSupplyReferenceExtractionWorkbook({
      fileName: "source.xlsx",
      uploadedAt: "2026-06-21T00:00:00.000Z",
      touRows: [
        [...supplyReferenceTouCandidateHeaders],
        [
          "10",
          "2026/27",
          "Red",
          "Monday, Tuesday",
          "Excluded",
          "January, February",
          "16:00",
          "19:00",
          "Page 4",
          0.9
        ]
      ],
      lossRows: [
        [...supplyReferenceLossCandidateHeaders],
        ["10", "2026/27", "LV", "LV losses", 5, 1.05, "Page 8", 0.8]
      ]
    });

    expect(result.errors).toHaveLength(0);
    expect(result.sourceDocument).toMatchObject({
      distributorId: "10",
      chargingYear: "2026/27",
      fileType: "Excel",
      extractionStatus: "Extracted"
    });
    expect(result.touCandidates).toHaveLength(1);
    expect(result.lossCandidates).toHaveLength(1);
  });

  it("returns validation errors for unrecognised values", () => {
    const result = parseSupplyReferenceExtractionWorkbook({
      fileName: "source.xlsx",
      uploadedAt: "2026-06-21T00:00:00.000Z",
      touRows: [
        [...supplyReferenceTouCandidateHeaders],
        ["1", "2026/27", "Purple", "Weekday", "Excluded", "January", "", "", "", 0.9]
      ],
      lossRows: [[...supplyReferenceLossCandidateHeaders]]
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        "TOU row 2: distributor ID must be two digits.",
        "TOU row 2: band name is not recognised."
      ])
    );
  });

  it("skips blank rows and normalises confidence values", () => {
    const result = parseSupplyReferenceExtractionWorkbook({
      fileName: "source.xlsx",
      uploadedAt: "2026-06-21T00:00:00.000Z",
      touRows: [
        [...supplyReferenceTouCandidateHeaders],
        ["", "", "", "", "", "", "", "", "", ""],
        [
          "10",
          "2026/27",
          "Green",
          "Monday",
          "Yes",
          "March",
          "00:00",
          "07:00",
          "",
          85
        ]
      ],
      lossRows: [
        [...supplyReferenceLossCandidateHeaders],
        ["", "", "", "", "", "", "", ""],
        ["10", "2026/27", "HV", "HV losses", 1.5, 1.015, "", 1.5]
      ]
    });

    expect(result.errors).toEqual([]);
    expect(result.touCandidates).toHaveLength(1);
    expect(result.lossCandidates).toHaveLength(1);
    expect(result.touCandidates[0]).toMatchObject({
      bandName: "Green",
      appliesOnBankHolidays: true,
      sourceReference: "source.xlsx",
      confidence: 0.85
    });
    expect(result.lossCandidates[0]).toMatchObject({
      voltage: "HV",
      sourceReference: "source.xlsx",
      confidence: 0.015
    });
  });
});
