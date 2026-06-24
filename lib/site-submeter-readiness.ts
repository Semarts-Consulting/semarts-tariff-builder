import type {
  SiteSubmeterValidationIssue,
  SubmeterConsumptionValidationIssue
} from "@/lib/site-submeter-inputs";
import type { UtilityhubHierarchyMappingSummary } from "@/lib/utilityhub-hierarchy-mapping";

export type SiteSubmeterReadinessStatus =
  | "No records"
  | "Needs correction"
  | "Needs review"
  | "Ready for review";

export type SiteSubmeterReadinessSummary = {
  status: SiteSubmeterReadinessStatus;
  errorCount: number;
  warningCount: number;
  hierarchyReviewCount: number;
  unknownMeterRecordCount: number;
  messages: string[];
};

type ReadinessIssue = {
  severity: "Error" | "Warning";
  message: string;
};

export function summariseSiteSubmeterReadiness({
  submeterIssues,
  consumptionIssues,
  tlmIssues,
  hierarchySummary,
  unknownMeterRecordCount,
  recordCount
}: {
  submeterIssues: SiteSubmeterValidationIssue[];
  consumptionIssues: SubmeterConsumptionValidationIssue[];
  tlmIssues: ReadinessIssue[];
  hierarchySummary: UtilityhubHierarchyMappingSummary;
  unknownMeterRecordCount: number;
  recordCount: number;
}): SiteSubmeterReadinessSummary {
  const allIssues = [...submeterIssues, ...consumptionIssues, ...tlmIssues];
  const errorCount = allIssues.filter((issue) => issue.severity === "Error").length;
  const warningCount = allIssues.filter((issue) => issue.severity === "Warning").length;
  const hierarchyReviewCount = hierarchySummary.reviewSubmeters;
  const messages: string[] = [];

  if (recordCount === 0) {
    return {
      status: "No records",
      errorCount,
      warningCount,
      hierarchyReviewCount,
      unknownMeterRecordCount,
      messages: ["No submeter, consumption, TLM or boundary evidence has been recorded yet."]
    };
  }

  if (errorCount > 0) {
    messages.push(`${errorCount} validation error${errorCount === 1 ? "" : "s"} need correction.`);
  }

  if (warningCount > 0) {
    messages.push(`${warningCount} warning${warningCount === 1 ? "" : "s"} should be reviewed.`);
  }

  if (hierarchyReviewCount > 0) {
    messages.push(
      `${hierarchyReviewCount} submeter${hierarchyReviewCount === 1 ? "" : "s"} need Utilityhub hierarchy mapping review.`
    );
  }

  if (unknownMeterRecordCount > 0) {
    messages.push(
      `${unknownMeterRecordCount} consumption record${unknownMeterRecordCount === 1 ? "" : "s"} reference unknown meters.`
    );
  }

  if (messages.length === 0) {
    messages.push("Submeter evidence is ready for review.");
  }

  return {
    status:
      errorCount > 0 || unknownMeterRecordCount > 0
        ? "Needs correction"
        : warningCount > 0 || hierarchyReviewCount > 0
          ? "Needs review"
          : "Ready for review",
    errorCount,
    warningCount,
    hierarchyReviewCount,
    unknownMeterRecordCount,
    messages
  };
}
