"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createDefaultSupplyReferenceData,
  getSupplyReferenceData
} from "@/lib/project-storage";
import { loadSupplyReferenceDataFromSupabase } from "@/lib/supabase-sync";
import type {
  DnoNetworkAreaReference,
  SupplyReferenceData,
  SupplyReferenceDataSet
} from "@/types/project";

const statusStyles: Record<SupplyReferenceDataSet["reviewStatus"], string> = {
  "Source required": "border-red-200 bg-red-50 text-red-800",
  "Pending review": "border-amber-200 bg-amber-50 text-amber-800",
  Reviewed: "border-green-200 bg-green-50 text-green-800"
};

function getNetworkAreaLabel(
  dataSet: SupplyReferenceDataSet,
  networkAreas: DnoNetworkAreaReference[]
) {
  const networkArea = networkAreas.find(
    (row) => row.distributorId === dataSet.distributorId
  );

  if (!networkArea) {
    return `Distributor ${dataSet.distributorId}`;
  }

  return `${networkArea.distributorId} - ${networkArea.networkArea}`;
}

function getReviewedLabel(sourceReviewedAt: string) {
  return sourceReviewedAt ? sourceReviewedAt : "Not reviewed";
}

function getTimeBandSummary(dataSet: SupplyReferenceDataSet) {
  const populatedBands = dataSet.timeOfUseDefinitions.filter(
    (definition) => definition.startTime && definition.endTime
  );

  if (populatedBands.length === 0) {
    return "No reviewed time bands recorded";
  }

  return `${populatedBands.length} time band${populatedBands.length === 1 ? "" : "s"} recorded`;
}

export function SupplyReferenceDataForm() {
  const [referenceData, setReferenceData] = useState<SupplyReferenceData>(() =>
    createDefaultSupplyReferenceData()
  );
  const [statusMessage, setStatusMessage] = useState("");

  const sortedNetworkAreas = useMemo(
    () =>
      [...referenceData.dnoNetworkAreas].sort((first, second) =>
        first.distributorId.localeCompare(second.distributorId)
      ),
    [referenceData.dnoNetworkAreas]
  );

  const sortedDataSets = useMemo(
    () =>
      [...referenceData.dataSets].sort((first, second) =>
        first.distributorId.localeCompare(second.distributorId)
      ),
    [referenceData.dataSets]
  );

  const reviewSummary = useMemo(
    () =>
      sortedDataSets.reduce(
        (summary, dataSet) => ({
          ...summary,
          [dataSet.reviewStatus]: summary[dataSet.reviewStatus] + 1
        }),
        {
          "Source required": 0,
          "Pending review": 0,
          Reviewed: 0
        } satisfies Record<SupplyReferenceDataSet["reviewStatus"], number>
      ),
    [sortedDataSets]
  );

  useEffect(() => {
    loadReferenceDataFromCloud().catch(() => {
      setReferenceData(getSupplyReferenceData());
      setStatusMessage("Cloud reference data could not be loaded. Showing built-in fallback data.");
    });
  }, []);

  async function loadReferenceDataFromCloud() {
    const cloudReferenceData = await loadSupplyReferenceDataFromSupabase();

    if (!cloudReferenceData) {
      setReferenceData(getSupplyReferenceData());
      setStatusMessage("No cloud reference data found. Showing built-in fallback data.");
      return;
    }

    setReferenceData(cloudReferenceData);
    setStatusMessage("Reference data loaded from cloud.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Review status</h2>
            <p className="mt-1 text-sm text-ink/70">
              This reference data is universal and read-only for normal users. Semarts admin review
              is required before source data is used in calculations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              loadReferenceDataFromCloud().catch((error: unknown) => {
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

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {Object.entries(reviewSummary).map(([status, count]) => (
            <div key={status} className="rounded-md border border-line bg-field p-4">
              <p className="text-sm text-ink/60">{status}</p>
              <p className="mt-1 text-2xl font-semibold">{count}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold">DNO source register</h2>
          <p className="mt-1 text-sm text-ink/70">
            Source locations are tracked separately from reviewed charging parameters.
          </p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-3 py-2 font-semibold">Network area</th>
                <th className="px-3 py-2 font-semibold">Charging year</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold">Reviewed</th>
                <th className="px-3 py-2 font-semibold">Time bands</th>
              </tr>
            </thead>
            <tbody>
              {sortedDataSets.map((dataSet) => (
                <tr key={dataSet.id} className="border-t border-line align-top">
                  <td className="px-3 py-3 font-semibold">
                    {getNetworkAreaLabel(dataSet, sortedNetworkAreas)}
                  </td>
                  <td className="px-3 py-3">{dataSet.chargingYear}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[dataSet.reviewStatus]}`}
                    >
                      {dataSet.reviewStatus}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {dataSet.sourceDocumentUrl ? (
                      <a
                        href={dataSet.sourceDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-semarts-dark underline-offset-4 hover:underline"
                      >
                        {dataSet.sourceDocumentTitle}
                      </a>
                    ) : (
                      <span className="text-ink/60">{dataSet.sourceDocumentTitle}</span>
                    )}
                    {dataSet.sourceNotes ? (
                      <p className="mt-1 max-w-xl text-xs leading-5 text-ink/60">
                        {dataSet.sourceNotes}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">{getReviewedLabel(dataSet.sourceReviewedAt)}</td>
                  <td className="px-3 py-3">{getTimeBandSummary(dataSet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedDataSets.length === 0 ? (
          <div className="mt-5 rounded-md border border-line bg-field p-4 text-sm text-ink/60">
            No source records are available.
          </div>
        ) : null}
      </section>

      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <div>
          <h2 className="font-semibold">MPAN distributor mapping</h2>
          <p className="mt-1 text-sm text-ink/70">
            The first two digits of the MPAN core determine the DNO/network area.
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sortedNetworkAreas.map((networkArea) => (
            <div key={networkArea.distributorId} className="rounded-md border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-ink/50">Distributor ID</p>
                  <p className="text-lg font-semibold">{networkArea.distributorId}</p>
                </div>
                <span className="rounded-md bg-field px-2 py-1 text-xs font-semibold">
                  {networkArea.operatorCode}
                </span>
              </div>
              <p className="mt-3 font-semibold">{networkArea.networkArea}</p>
              <p className="text-sm text-ink/70">{networkArea.dnoName}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
