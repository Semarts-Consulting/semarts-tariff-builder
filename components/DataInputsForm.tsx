"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  createDataInputRow,
  getProjectDataInputs,
  saveProjectDataInputs
} from "@/lib/project-storage";
import { isProjectArchived } from "@/lib/project-state";
import { saveDataInputsToSupabase } from "@/lib/supabase-sync";
import type { DataInputRow, ProjectDataInputs } from "@/types/project";

type DataInputsFormProps = {
  projectId: string;
};

type NumberField = "customerCount" | "annualKwh" | "peakDemandKw";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

function getTotals(rows: DataInputRow[]) {
  return rows.reduce(
    (totals, row) => ({
      customerCount: totals.customerCount + row.customerCount,
      annualKwh: totals.annualKwh + row.annualKwh,
      peakDemandKw: totals.peakDemandKw + row.peakDemandKw
    }),
    { customerCount: 0, annualKwh: 0, peakDemandKw: 0 }
  );
}

export function DataInputsForm({ projectId }: DataInputsFormProps) {
  const [dataInputs, setDataInputs] = useState<ProjectDataInputs>({
    projectId,
    rows: [],
    assumptions: "",
    lastUpdated: ""
  });
  const [saveState, setSaveState] = useState("");
  const [isArchived, setIsArchived] = useState(false);

  useEffect(() => {
    setDataInputs(getProjectDataInputs(projectId));
    setIsArchived(isProjectArchived(projectId));
  }, [projectId]);

  const totals = useMemo(() => getTotals(dataInputs.rows), [dataInputs.rows]);

  function updateRow(rowId: string, updates: Partial<DataInputRow>) {
    if (isArchived) return;
    setDataInputs((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === rowId ? { ...row, ...updates } : row))
    }));
    setSaveState("");
  }

  function updateNumber(rowId: string, field: NumberField, value: string) {
    if (isArchived) return;
    updateRow(rowId, { [field]: Number(value) || 0 });
  }

  function updateAssumptions(event: ChangeEvent<HTMLTextAreaElement>) {
    if (isArchived) return;
    setDataInputs((current) => ({
      ...current,
      assumptions: event.target.value
    }));
    setSaveState("");
  }

  function addRow() {
    if (isArchived) return;
    setDataInputs((current) => ({
      ...current,
      rows: [...current.rows, createDataInputRow()]
    }));
    setSaveState("");
  }

  function removeRow(rowId: string) {
    if (isArchived) return;
    setDataInputs((current) => ({
      ...current,
      rows: current.rows.filter((row) => row.id !== rowId)
    }));
    setSaveState("");
  }

  async function saveInputs() {
    if (isArchived) {
      setSaveState("Archived projects are read-only. Restore the project in Settings to edit.");
      return;
    }

    saveProjectDataInputs(dataInputs);
    const savedDataInputs = getProjectDataInputs(projectId);
    setDataInputs(savedDataInputs);

    try {
      const cloudSaved = await saveDataInputsToSupabase(savedDataInputs);
      setSaveState(cloudSaved ? "Saved locally and to cloud" : "Saved locally");
    } catch (error) {
      setSaveState(
        error instanceof Error
          ? `Saved locally. Cloud save failed: ${error.message}`
          : "Saved locally. Cloud save failed."
      );
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Customers</p>
          <p className="mt-2 text-2xl font-semibold">{formatNumber(totals.customerCount)}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Annual kWh</p>
          <p className="mt-2 text-2xl font-semibold">{formatNumber(totals.annualKwh)}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Peak demand kW</p>
          <p className="mt-2 text-2xl font-semibold">{formatNumber(totals.peakDemandKw)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <h2 className="font-semibold">Customer class inputs</h2>
          <button
            type="button"
            onClick={addRow}
            disabled={isArchived}
            className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
          >
            Add class
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer class</th>
                <th className="px-4 py-3 font-semibold">Customers</th>
                <th className="px-4 py-3 font-semibold">Annual kWh</th>
                <th className="px-4 py-3 font-semibold">Peak kW</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {dataInputs.rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.customerClass}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateRow(row.id, { customerClass: event.target.value })
                      }
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={row.customerCount}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateNumber(row.id, "customerCount", event.target.value)
                      }
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={row.annualKwh}
                      disabled={isArchived}
                      onChange={(event) => updateNumber(row.id, "annualKwh", event.target.value)}
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={row.peakDemandKw}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateNumber(row.id, "peakDemandKw", event.target.value)
                      }
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.notes}
                      disabled={isArchived}
                      onChange={(event) => updateRow(row.id, { notes: event.target.value })}
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={isArchived}
                      className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <label className="block rounded-md border border-line bg-white p-4 shadow-sm">
        <span className="text-sm font-semibold">Assumptions</span>
        <textarea
          value={dataInputs.assumptions}
          onChange={updateAssumptions}
          disabled={isArchived}
          rows={4}
          className="mt-2 w-full resize-y rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveInputs}
          disabled={isArchived}
          className="rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          Save inputs
        </button>
        {saveState ? <span className="text-sm font-medium text-semarts-dark">{saveState}</span> : null}
      </div>
    </div>
  );
}
