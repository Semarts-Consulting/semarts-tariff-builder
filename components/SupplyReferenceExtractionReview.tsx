"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupplyReferenceExtractionSummary } from "@/lib/supply-reference-extraction";
import { loadSupplyReferenceExtractionFromSupabase } from "@/lib/supabase-sync";
import type {
  SupplyReferenceCandidateStatus,
  SupplyReferenceExtractionStatus,
  SupplyReferenceLossCandidate,
  SupplyReferenceSourceDocument,
  SupplyReferenceTouCandidate
} from "@/types/project";

type ExtractionState = {
  sourceDocuments: SupplyReferenceSourceDocument[];
  touCandidates: SupplyReferenceTouCandidate[];
  lossCandidates: SupplyReferenceLossCandidate[];
};

const emptyExtractionState: ExtractionState = {
  sourceDocuments: [],
  touCandidates: [],
  lossCandidates: []
};

const candidateStatusStyles: Record<SupplyReferenceCandidateStatus, string> = {
  Extracted: "border-blue-200 bg-blue-50 text-blue-800",
  Approved: "border-green-200 bg-green-50 text-green-800",
  Rejected: "border-red-200 bg-red-50 text-red-800",
  "Needs review": "border-amber-200 bg-amber-50 text-amber-800"
};

const extractionStatusStyles: Record<SupplyReferenceExtractionStatus, string> = {
  "Pending extraction": "border-amber-200 bg-amber-50 text-amber-800",
  Extracted: "border-blue-200 bg-blue-50 text-blue-800",
  "Extraction failed": "border-red-200 bg-red-50 text-red-800",
  Reviewed: "border-green-200 bg-green-50 text-green-800",
  Rejected: "border-red-200 bg-red-50 text-red-800"
};

function formatDateTime(value: string) {
  return value ? new Date(value).toLocaleString("en-GB") : "";
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 1,
    style: "percent"
  }).format(value);
}

function joinValues(values: string[]) {
  return values.length > 0 ? values.join(", ") : "Not extracted";
}

export function SupplyReferenceExtractionReview() {
  const [extractionState, setExtractionState] =
    useState<ExtractionState>(emptyExtractionState);
  const [statusMessage, setStatusMessage] = useState("");

  const summary = useMemo(
    () => getSupplyReferenceExtractionSummary(extractionState),
    [extractionState]
  );

  useEffect(() => {
    loadExtractionData().catch((error: unknown) => {
      setStatusMessage(
        error instanceof Error ? `Cloud load failed: ${error.message}` : "Cloud load failed."
      );
    });
  }, []);

  async function loadExtractionData() {
    const cloudExtractionState = await loadSupplyReferenceExtractionFromSupabase();

    if (!cloudExtractionState) {
      setExtractionState(emptyExtractionState);
      setStatusMessage("Supabase is not configured. No extraction staging data loaded.");
      return;
    }

    setExtractionState(cloudExtractionState);
    setStatusMessage("Extraction staging data loaded from cloud.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Extraction staging</h2>
            <p className="mt-1 text-sm text-ink/70">
              Extracted values are candidates only. They do not update approved reference data until
              Semarts admin review is added.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              loadExtractionData().catch((error: unknown) => {
                setStatusMessage(
                  error instanceof Error
                    ? `Cloud load failed: ${error.message}`
                    : "Cloud load failed."
                );
              });
            }}
            className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
          >
            Refresh from cloud
          </button>
        </div>
        {statusMessage ? (
          <p className="mt-3 text-sm font-medium text-semarts-dark">{statusMessage}</p>
        ) : null}
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-md border border-line bg-field p-4">
            <p className="text-sm text-ink/60">Source documents</p>
            <p className="mt-1 text-2xl font-semibold">{summary.sourceDocumentCount}</p>
          </div>
          <div className="rounded-md border border-line bg-field p-4">
            <p className="text-sm text-ink/60">TOU candidates</p>
            <p className="mt-1 text-2xl font-semibold">{summary.touCandidateCount}</p>
          </div>
          <div className="rounded-md border border-line bg-field p-4">
            <p className="text-sm text-ink/60">Loss candidates</p>
            <p className="mt-1 text-2xl font-semibold">{summary.lossCandidateCount}</p>
          </div>
          <div className="rounded-md border border-line bg-field p-4">
            <p className="text-sm text-ink/60">Needs review</p>
            <p className="mt-1 text-2xl font-semibold">{summary.needsReviewCandidateCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Source documents</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-3 py-2 font-semibold">DNO</th>
                <th className="px-3 py-2 font-semibold">Charging year</th>
                <th className="px-3 py-2 font-semibold">Title</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {extractionState.sourceDocuments.map((document) => (
                <tr key={document.id} className="border-t border-line align-top">
                  <td className="px-3 py-3">{document.distributorId}</td>
                  <td className="px-3 py-3">{document.chargingYear}</td>
                  <td className="px-3 py-3">
                    {document.sourceUrl ? (
                      <a
                        href={document.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-semarts-dark underline-offset-4 hover:underline"
                      >
                        {document.title}
                      </a>
                    ) : (
                      <span className="font-semibold">{document.title}</span>
                    )}
                    {document.fileName ? (
                      <p className="mt-1 text-xs text-ink/60">{document.fileName}</p>
                    ) : null}
                    {document.extractionNotes ? (
                      <p className="mt-1 text-xs text-ink/60">{document.extractionNotes}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">{document.fileType}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${extractionStatusStyles[document.extractionStatus]}`}
                    >
                      {document.extractionStatus}
                    </span>
                  </td>
                  <td className="px-3 py-3">{formatDateTime(document.uploadedAt)}</td>
                </tr>
              ))}
              {extractionState.sourceDocuments.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={6} className="px-3 py-4 text-center text-ink/60">
                    No source documents have been staged yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <h2 className="font-semibold">TOU candidates</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-3 py-2 font-semibold">DNO</th>
                <th className="px-3 py-2 font-semibold">Year</th>
                <th className="px-3 py-2 font-semibold">Band</th>
                <th className="px-3 py-2 font-semibold">Days</th>
                <th className="px-3 py-2 font-semibold">Months</th>
                <th className="px-3 py-2 font-semibold">Bank holidays</th>
                <th className="px-3 py-2 font-semibold">Time</th>
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold">Confidence</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {extractionState.touCandidates.map((candidate) => (
                <tr key={candidate.id} className="border-t border-line align-top">
                  <td className="px-3 py-3">{candidate.distributorId}</td>
                  <td className="px-3 py-3">{candidate.chargingYear}</td>
                  <td className="px-3 py-3 font-semibold">{candidate.bandName}</td>
                  <td className="px-3 py-3">{joinValues(candidate.daysOfWeek)}</td>
                  <td className="px-3 py-3">{joinValues(candidate.months)}</td>
                  <td className="px-3 py-3">
                    {candidate.appliesOnBankHolidays ? "Included" : "Excluded"}
                  </td>
                  <td className="px-3 py-3">
                    {candidate.startTime} - {candidate.endTime}
                  </td>
                  <td className="px-3 py-3">{candidate.sourceReference || "Not extracted"}</td>
                  <td className="px-3 py-3">{formatPercent(candidate.confidence)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${candidateStatusStyles[candidate.status]}`}
                    >
                      {candidate.status}
                    </span>
                  </td>
                </tr>
              ))}
              {extractionState.touCandidates.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={10} className="px-3 py-4 text-center text-ink/60">
                    No TOU candidates have been extracted yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Distribution loss candidates</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-3 py-2 font-semibold">DNO</th>
                <th className="px-3 py-2 font-semibold">Year</th>
                <th className="px-3 py-2 font-semibold">Voltage</th>
                <th className="px-3 py-2 font-semibold">Loss factor</th>
                <th className="px-3 py-2 font-semibold">Loss %</th>
                <th className="px-3 py-2 font-semibold">Multiplier</th>
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold">Confidence</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {extractionState.lossCandidates.map((candidate) => (
                <tr key={candidate.id} className="border-t border-line align-top">
                  <td className="px-3 py-3">{candidate.distributorId}</td>
                  <td className="px-3 py-3">{candidate.chargingYear}</td>
                  <td className="px-3 py-3">{candidate.voltage}</td>
                  <td className="px-3 py-3 font-semibold">{candidate.lossFactorName}</td>
                  <td className="px-3 py-3">{candidate.lossPercent}</td>
                  <td className="px-3 py-3">{candidate.lossMultiplier}</td>
                  <td className="px-3 py-3">{candidate.sourceReference || "Not extracted"}</td>
                  <td className="px-3 py-3">{formatPercent(candidate.confidence)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${candidateStatusStyles[candidate.status]}`}
                    >
                      {candidate.status}
                    </span>
                  </td>
                </tr>
              ))}
              {extractionState.lossCandidates.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={9} className="px-3 py-4 text-center text-ink/60">
                    No distribution loss candidates have been extracted yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
