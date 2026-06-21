"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createDefaultSupplyReferenceData,
  getSupplyReferenceData
} from "@/lib/project-storage";
import { loadSupplyReferenceDataFromSupabase } from "@/lib/supabase-sync";
import type {
  DnoNetworkAreaReference,
  SupplyContractDayOfWeek,
  SupplyContractMonth,
  SupplyReferenceData,
  SupplyReferenceDataSet,
  SupplyTimeOfUseDefinition
} from "@/types/project";

const daysOfWeek: SupplyContractDayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];
const months: SupplyContractMonth[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function updateDnoNetworkArea(
  rows: DnoNetworkAreaReference[],
  distributorId: string,
  updates: Partial<DnoNetworkAreaReference>
) {
  return rows.map((row) => (row.distributorId === distributorId ? { ...row, ...updates } : row));
}

function updateReferenceDataSet(
  rows: SupplyReferenceDataSet[],
  rowId: string,
  updates: Partial<SupplyReferenceDataSet>
) {
  return rows.map((row) => (row.id === rowId ? { ...row, ...updates } : row));
}

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((existingValue) => existingValue !== value)
    : [...values, value];
}

function updateTimeOfUseDefinition(
  dataSet: SupplyReferenceDataSet,
  definitionId: SupplyTimeOfUseDefinition["id"],
  updates: Partial<SupplyTimeOfUseDefinition>
) {
  return dataSet.timeOfUseDefinitions.map((definition) =>
    definition.id === definitionId ? { ...definition, ...updates } : definition
  );
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

  useEffect(() => {
    loadReferenceDataFromCloud().catch(() => {
      setReferenceData(getSupplyReferenceData());
      setStatusMessage("Cloud reference data could not be loaded. Showing built-in fallback data.");
    });
  }, []);

  async function loadReferenceDataFromCloud() {
    const cloudReferenceData = await loadSupplyReferenceDataFromSupabase();

    if (!cloudReferenceData) {
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
            <h2 className="font-semibold">MPAN to DNO mapping</h2>
            <p className="mt-1 text-sm text-ink/70">
              The app uses the first two digits of the MPAN core to derive the DNO/network area.
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
        <fieldset disabled className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-3 py-2 font-semibold">Distributor ID</th>
                <th className="px-3 py-2 font-semibold">DNO</th>
                <th className="px-3 py-2 font-semibold">Network Area</th>
                <th className="px-3 py-2 font-semibold">Operator Code</th>
                <th className="px-3 py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {sortedNetworkAreas.map((row) => (
                <tr key={row.distributorId} className="border-t border-line">
                  <td className="px-3 py-2 font-semibold">{row.distributorId}</td>
                  <td className="px-3 py-2">
                    <input
                      value={row.dnoName}
                      onChange={(event) =>
                        setReferenceData({
                          ...referenceData,
                          dnoNetworkAreas: updateDnoNetworkArea(
                            referenceData.dnoNetworkAreas,
                            row.distributorId,
                            { dnoName: event.target.value }
                          )
                        })
                      }
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.networkArea}
                      onChange={(event) =>
                        setReferenceData({
                          ...referenceData,
                          dnoNetworkAreas: updateDnoNetworkArea(
                            referenceData.dnoNetworkAreas,
                            row.distributorId,
                            { networkArea: event.target.value }
                          )
                        })
                      }
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.operatorCode}
                      onChange={(event) =>
                        setReferenceData({
                          ...referenceData,
                          dnoNetworkAreas: updateDnoNetworkArea(
                            referenceData.dnoNetworkAreas,
                            row.distributorId,
                            { operatorCode: event.target.value }
                          )
                        })
                      }
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={row.notes}
                      onChange={(event) =>
                        setReferenceData({
                          ...referenceData,
                          dnoNetworkAreas: updateDnoNetworkArea(
                            referenceData.dnoNetworkAreas,
                            row.distributorId,
                            { notes: event.target.value }
                          )
                        })
                      }
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </fieldset>
      </section>

      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">LC14 source files</h2>
            <p className="mt-1 text-sm text-ink/70">
              Store the document location and review status for each DNO and charging year.
            </p>
          </div>
        </div>
        <fieldset disabled className="mt-5 space-y-4">
          {referenceData.dataSets.map((row) => (
            <div key={row.id} className="rounded-md border border-line bg-field p-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium">DNO / Network Area</span>
                  <select
                    value={row.distributorId}
                    onChange={(event) =>
                      setReferenceData({
                        ...referenceData,
                        dataSets: updateReferenceDataSet(referenceData.dataSets, row.id, {
                          distributorId: event.target.value
                        })
                      })
                    }
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                  >
                    <option value="">Select</option>
                    {sortedNetworkAreas.map((networkArea) => (
                      <option key={networkArea.distributorId} value={networkArea.distributorId}>
                        {networkArea.distributorId} - {networkArea.networkArea}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Charging year</span>
                  <input
                    value={row.chargingYear}
                    onChange={(event) =>
                      setReferenceData({
                        ...referenceData,
                        dataSets: updateReferenceDataSet(referenceData.dataSets, row.id, {
                          chargingYear: event.target.value
                        })
                      })
                    }
                    placeholder="2026/27"
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Review status</span>
                  <input
                    value={row.reviewStatus}
                    readOnly
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Reviewed date</span>
                  <input
                    type="date"
                    value={row.sourceReviewedAt}
                    onChange={(event) =>
                      setReferenceData({
                        ...referenceData,
                        dataSets: updateReferenceDataSet(referenceData.dataSets, row.id, {
                          sourceReviewedAt: event.target.value
                        })
                      })
                    }
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                  />
                </label>
                <label className="block lg:col-span-2">
                  <span className="text-sm font-medium">Source document title</span>
                  <input
                    value={row.sourceDocumentTitle}
                    onChange={(event) =>
                      setReferenceData({
                        ...referenceData,
                        dataSets: updateReferenceDataSet(referenceData.dataSets, row.id, {
                          sourceDocumentTitle: event.target.value
                        })
                      })
                    }
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Source URL or file path</span>
                  <input
                    value={row.sourceDocumentUrl}
                    onChange={(event) =>
                      setReferenceData({
                        ...referenceData,
                        dataSets: updateReferenceDataSet(referenceData.dataSets, row.id, {
                          sourceDocumentUrl: event.target.value
                        })
                      })
                    }
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                  />
                </label>
                <label className="block lg:col-span-3">
                  <span className="text-sm font-medium">Notes</span>
                  <textarea
                    value={row.sourceNotes}
                    onChange={(event) =>
                      setReferenceData({
                        ...referenceData,
                        dataSets: updateReferenceDataSet(referenceData.dataSets, row.id, {
                          sourceNotes: event.target.value
                        })
                      })
                    }
                    rows={3}
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                  />
                </label>
              </div>
              <div className="mt-5 space-y-4">
                {row.timeOfUseDefinitions.map((definition) => (
                  <div key={definition.id} className="rounded-md border border-line bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <h3 className="font-semibold">{definition.label}</h3>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="block">
                          <span className="text-sm font-medium">Start time</span>
                          <input
                            type="time"
                            value={definition.startTime}
                            onChange={(event) =>
                              setReferenceData({
                                ...referenceData,
                                dataSets: updateReferenceDataSet(referenceData.dataSets, row.id, {
                                  timeOfUseDefinitions: updateTimeOfUseDefinition(
                                    row,
                                    definition.id,
                                    { startTime: event.target.value }
                                  )
                                })
                              })
                            }
                            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium">End time</span>
                          <input
                            type="time"
                            value={definition.endTime}
                            onChange={(event) =>
                              setReferenceData({
                                ...referenceData,
                                dataSets: updateReferenceDataSet(referenceData.dataSets, row.id, {
                                  timeOfUseDefinitions: updateTimeOfUseDefinition(
                                    row,
                                    definition.id,
                                    { endTime: event.target.value }
                                  )
                                })
                              })
                            }
                            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                          />
                        </label>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium">Days of week</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {daysOfWeek.map((day) => (
                            <label
                              key={day}
                              className="flex items-center gap-2 rounded-md border border-line bg-field px-3 py-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={definition.daysOfWeek.includes(day)}
                                onChange={() =>
                                  setReferenceData({
                                    ...referenceData,
                                    dataSets: updateReferenceDataSet(
                                      referenceData.dataSets,
                                      row.id,
                                      {
                                        timeOfUseDefinitions: updateTimeOfUseDefinition(
                                          row,
                                          definition.id,
                                          {
                                            daysOfWeek: toggleValue(
                                              definition.daysOfWeek,
                                              day
                                            )
                                          }
                                        )
                                      }
                                    )
                                  })
                                }
                              />
                              {day}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Months</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {months.map((month) => (
                            <label
                              key={month}
                              className="flex items-center gap-2 rounded-md border border-line bg-field px-3 py-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={definition.months.includes(month)}
                                onChange={() =>
                                  setReferenceData({
                                    ...referenceData,
                                    dataSets: updateReferenceDataSet(
                                      referenceData.dataSets,
                                      row.id,
                                      {
                                        timeOfUseDefinitions: updateTimeOfUseDefinition(
                                          row,
                                          definition.id,
                                          {
                                            months: toggleValue(definition.months, month)
                                          }
                                        )
                                      }
                                    )
                                  })
                                }
                              />
                              {month}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Bank holidays</p>
                        <label className="mt-2 flex items-center gap-2 rounded-md border border-line bg-field px-3 py-2 text-sm">
                          <input
                            type="checkbox"
                            checked={definition.appliesOnBankHolidays}
                            onChange={(event) =>
                              setReferenceData({
                                ...referenceData,
                                dataSets: updateReferenceDataSet(referenceData.dataSets, row.id, {
                                  timeOfUseDefinitions: updateTimeOfUseDefinition(
                                    row,
                                    definition.id,
                                    { appliesOnBankHolidays: event.target.checked }
                                  )
                                })
                              })
                            }
                          />
                          Included
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {referenceData.dataSets.length === 0 ? (
            <div className="rounded-md border border-line bg-field p-4 text-sm text-ink/60">
              No LC14 source files recorded yet.
            </div>
          ) : null}
        </fieldset>
      </section>
    </div>
  );
}
