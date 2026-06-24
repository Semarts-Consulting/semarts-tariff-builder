import { describe, expect, it } from "vitest";
import { summariseSiteSubmeterReadiness } from "@/lib/site-submeter-readiness";
import type { SiteSubmeterValidationIssue } from "@/lib/site-submeter-inputs";
import type { UtilityhubHierarchyMappingSummary } from "@/lib/utilityhub-hierarchy-mapping";

const emptyHierarchySummary: UtilityhubHierarchyMappingSummary = {
  totalSubmeters: 0,
  mappedSubmeters: 0,
  reviewSubmeters: 0,
  missingMeterCount: 0,
  missingLocationCount: 0,
  unmappedMeterCount: 0,
  unmappedLocationCount: 0
};

describe("site submeter readiness", () => {
  it("reports no records when no evidence exists", () => {
    const summary = summariseSiteSubmeterReadiness({
      submeterIssues: [],
      consumptionIssues: [],
      tlmIssues: [],
      hierarchySummary: emptyHierarchySummary,
      unknownMeterRecordCount: 0,
      recordCount: 0
    });

    expect(summary.status).toBe("No records");
    expect(summary.messages).toContain(
      "No submeter, consumption, TLM or boundary evidence has been recorded yet."
    );
  });

  it("prioritises correction when validation errors or unknown meters exist", () => {
    const issue: SiteSubmeterValidationIssue = {
      code: "Missing meter",
      severity: "Error",
      message: "Meter is required.",
      rowId: "row-1"
    };
    const summary = summariseSiteSubmeterReadiness({
      submeterIssues: [issue],
      consumptionIssues: [],
      tlmIssues: [],
      hierarchySummary: emptyHierarchySummary,
      unknownMeterRecordCount: 1,
      recordCount: 2
    });

    expect(summary.status).toBe("Needs correction");
    expect(summary.errorCount).toBe(1);
    expect(summary.unknownMeterRecordCount).toBe(1);
  });

  it("reports review when warnings or hierarchy mapping gaps remain", () => {
    const summary = summariseSiteSubmeterReadiness({
      submeterIssues: [],
      consumptionIssues: [],
      tlmIssues: [],
      hierarchySummary: { ...emptyHierarchySummary, reviewSubmeters: 2 },
      unknownMeterRecordCount: 0,
      recordCount: 2
    });

    expect(summary.status).toBe("Needs review");
    expect(summary.messages).toContain("2 submeters need Utilityhub hierarchy mapping review.");
  });

  it("reports ready when recorded evidence has no readiness gaps", () => {
    const summary = summariseSiteSubmeterReadiness({
      submeterIssues: [],
      consumptionIssues: [],
      tlmIssues: [],
      hierarchySummary: { ...emptyHierarchySummary, totalSubmeters: 1, mappedSubmeters: 1 },
      unknownMeterRecordCount: 0,
      recordCount: 3
    });

    expect(summary.status).toBe("Ready for review");
    expect(summary.messages).toEqual(["Submeter evidence is ready for review."]);
  });
});
