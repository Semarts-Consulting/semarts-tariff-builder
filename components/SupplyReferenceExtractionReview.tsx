"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { readSheet } from "read-excel-file/browser";
import writeXlsxFile from "write-excel-file/browser";
import type { SheetData } from "write-excel-file/browser";
import {
  getProjects,
  getStoredMethodologyInputs,
  getSupplyReferenceData
} from "@/lib/project-storage";
import {
  getSupplyReferenceExtractionTaskId,
  getSupplyReferenceRequirementQueue
} from "@/lib/supply-reference-requirements";
import {
  getSupplyReferenceExtractionSummary,
  parseSupplyReferenceExtractionWorkbook,
  supplyReferenceLossCandidateHeaders,
  supplyReferenceTouCandidateHeaders
} from "@/lib/supply-reference-extraction";
import {
  createSupplyReferenceExtractionTaskInSupabase,
  isCurrentUserSemartsAdmin,
  loadSupplyReferenceDataFromSupabase,
  loadSupplyReferenceExtractionFromSupabase,
  saveSupplyReferenceExtractionToSupabase
} from "@/lib/supabase-sync";
import type {
  SupplyReferenceCandidateStatus,
  SupplyReferenceExtractionStatus,
  SupplyReferenceLossCandidate,
  SupplyReferenceData,
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

function getRequirementTaskTitle({
  distributorId,
  networkArea,
  chargingYear
}: {
  distributorId: string;
  networkArea: string;
  chargingYear: string;
}) {
  return `${distributorId} ${networkArea} ${chargingYear} reference extraction`;
}

export function SupplyReferenceExtractionReview() {
  const [extractionState, setExtractionState] =
    useState<ExtractionState>(emptyExtractionState);
  const [statusMessage, setStatusMessage] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [referenceData, setReferenceData] = useState<SupplyReferenceData>(() =>
    getSupplyReferenceData()
  );

  const summary = useMemo(
    () => getSupplyReferenceExtractionSummary(extractionState),
    [extractionState]
  );
  const requirementQueue = useMemo(
    () =>
      getSupplyReferenceRequirementQueue({
        projects: getProjects(),
        methodologyInputs: getStoredMethodologyInputs(),
        referenceData
      }),
    [referenceData]
  );

  useEffect(() => {
    loadExtractionData().catch((error: unknown) => {
      setStatusMessage(
        error instanceof Error ? `Cloud load failed: ${error.message}` : "Cloud load failed."
      );
    });
    loadSupplyReferenceDataFromSupabase()
      .then((cloudReferenceData) => {
        setReferenceData(cloudReferenceData ?? getSupplyReferenceData());
      })
      .catch(() => setReferenceData(getSupplyReferenceData()));
    isCurrentUserSemartsAdmin()
      .then(setIsAdmin)
      .catch(() => setIsAdmin(false));
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

  async function downloadTemplate() {
    const touSheetData: SheetData = [
        supplyReferenceTouCandidateHeaders.map((header) => ({
          value: header,
          type: String,
          fontWeight: "bold"
        }))
    ];
    const lossSheetData: SheetData = [
        supplyReferenceLossCandidateHeaders.map((header) => ({
          value: header,
          type: String,
          fontWeight: "bold"
        }))
    ];

    const file = await writeXlsxFile([
      { sheet: "TOU Candidates", data: touSheetData },
      { sheet: "Loss Candidates", data: lossSheetData }
    ]);
    await file.toFile("supply-reference-extraction-template.xlsx");
  }

  async function importWorkbook(file: File) {
    if (!isAdmin) {
      setImportErrors(["Only Semarts admin users can import extraction candidates."]);
      return;
    }

    const uploadedAt = new Date().toISOString();
    const touRows = await readSheet(file, "TOU Candidates");
    const lossRows = await readSheet(file, "Loss Candidates");
    const result = parseSupplyReferenceExtractionWorkbook({
      fileName: file.name,
      uploadedAt,
      touRows,
      lossRows
    });

    if (result.errors.length > 0) {
      setImportErrors(result.errors.slice(0, 12));
      setStatusMessage("");
      return;
    }

    const cloudSaved = await saveSupplyReferenceExtractionToSupabase(result);

    setImportErrors([]);
    setStatusMessage(
      cloudSaved
        ? `Imported ${result.touCandidates.length} TOU candidates and ${result.lossCandidates.length} loss candidates.`
        : "Supabase is not configured. Import was parsed but not saved."
    );

    await loadExtractionData();
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    importWorkbook(file).catch((error: unknown) => {
      setImportErrors([
        error instanceof Error
          ? `Import failed: ${error.message}`
          : "Import failed. Check the file format and try again."
      ]);
      setStatusMessage("");
    });
    event.target.value = "";
  }

  async function createExtractionTask(requirement: {
    distributorId: string;
    networkArea: string;
    chargingYear: string;
  }) {
    if (!isAdmin) {
      setStatusMessage("Only Semarts admin users can create extraction tasks.");
      return;
    }

    const sourceDocument: SupplyReferenceSourceDocument = {
      id: getSupplyReferenceExtractionTaskId(requirement),
      distributorId: requirement.distributorId,
      chargingYear: requirement.chargingYear,
      title: getRequirementTaskTitle(requirement),
      sourceUrl: "",
      fileName: "",
      fileType: "Other",
      extractionStatus: "Pending extraction",
      extractionNotes: "Created from project MPAN reference requirement.",
      uploadedAt: new Date().toISOString()
    };

    const created = await createSupplyReferenceExtractionTaskInSupabase(sourceDocument);

    setStatusMessage(
      created
        ? `Extraction task created for ${requirement.networkArea} ${requirement.chargingYear}.`
        : "Supabase is not configured. Extraction task was not saved."
    );

    await loadExtractionData();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Extraction staging</h2>
            <p className="mt-1 text-sm text-ink/70">
              Extracted values are candidates only. The target workflow is on-demand extraction from
              project MPAN requirements; manual import is an admin fallback.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    downloadTemplate().catch((error: unknown) => {
                      setStatusMessage(
                        error instanceof Error
                          ? `Template download failed: ${error.message}`
                          : "Template download failed."
                      );
                    });
                  }}
                  className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
                >
                  Download template
                </button>
                <label className="cursor-pointer rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts">
                  Import workbook
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </>
            ) : (
              <span className="rounded-md border border-line bg-field px-3 py-2 text-sm font-semibold text-ink/60">
                Read-only access
              </span>
            )}
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
        </div>
        {statusMessage ? (
          <p className="mt-3 text-sm font-medium text-semarts-dark">{statusMessage}</p>
        ) : null}
        {importErrors.length > 0 ? (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Import errors</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {importErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="mt-4 rounded-md border border-line bg-field p-4 text-sm text-ink/70">
          <p className="font-semibold text-ink">On-demand reference workflow</p>
          <p className="mt-1">
            When a project MPAN maps to a DNO/year without reviewed TOU bands or distribution
            losses, the app should create a Semarts review requirement. Manual staging import is
            retained for controlled testing and fallback data entry.
          </p>
        </div>
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
        <h2 className="font-semibold">Reference requirement queue</h2>
        <p className="mt-1 text-sm text-ink/70">
          Requirements are generated from project MPANs and grouped by DNO/network area.
        </p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-3 py-2 font-semibold">DNO</th>
                <th className="px-3 py-2 font-semibold">Network area</th>
                <th className="px-3 py-2 font-semibold">Charging year</th>
                <th className="px-3 py-2 font-semibold">Required review</th>
                <th className="px-3 py-2 font-semibold">MPANs</th>
                <th className="px-3 py-2 font-semibold">Projects</th>
                <th className="px-3 py-2 font-semibold">Task</th>
              </tr>
            </thead>
            <tbody>
              {requirementQueue.map((requirement) => {
                const taskId = getSupplyReferenceExtractionTaskId(requirement);
                const existingTask = extractionState.sourceDocuments.find(
                  (document) => document.id === taskId
                );

                return (
                  <tr key={requirement.id} className="border-t border-line align-top">
                    <td className="px-3 py-3 font-semibold">{requirement.distributorId}</td>
                    <td className="px-3 py-3">{requirement.networkArea}</td>
                    <td className="px-3 py-3">{requirement.chargingYear || "Unknown"}</td>
                    <td className="px-3 py-3">
                      {[
                        requirement.requiresTimeOfUseReview ? "TOU bands" : "",
                        requirement.requiresLossesReview ? "Distribution losses" : ""
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </td>
                    <td className="px-3 py-3">{requirement.mpans.join(", ")}</td>
                    <td className="px-3 py-3">{requirement.projectNames.join(", ")}</td>
                    <td className="px-3 py-3">
                      {existingTask ? (
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${extractionStatusStyles[existingTask.extractionStatus]}`}
                        >
                          {existingTask.extractionStatus}
                        </span>
                      ) : isAdmin ? (
                        <button
                          type="button"
                          onClick={() => {
                            createExtractionTask(requirement).catch((error: unknown) => {
                              setStatusMessage(
                                error instanceof Error
                                  ? `Task creation failed: ${error.message}`
                                  : "Task creation failed."
                              );
                            });
                          }}
                          className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
                        >
                          Create extraction task
                        </button>
                      ) : (
                        <span className="text-ink/60">No task</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {requirementQueue.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={7} className="px-3 py-4 text-center text-ink/60">
                    No project MPANs currently require Semarts reference review.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
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
