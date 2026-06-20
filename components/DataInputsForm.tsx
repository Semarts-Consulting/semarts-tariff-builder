"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  createDataInputRow,
  getProjectDataInputs,
  saveProjectDataInputs
} from "@/lib/project-storage";
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

  useEffect(() => {
    setDataInputs(getProjectDataInputs(projectId));
  }, [projectId]);

  const totals = useMemo(() => getTotals(dataInputs.rows), [dataInputs.rows]);

  function updateRow(rowId: string, updates: Partial<DataInputRow>) {
    setDataInputs((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === rowId ? { ...row, ...updates } : row))
    }));
    setSaveState("");
  }

  function updateNumber(rowId: string, field: NumberField, value: string) {
    updateRow(rowId, { [field]: Number(value) || 0 });
  }

  function updateAssumptions(event: ChangeEvent<HTMLTextAreaElement>) {
    setDataInputs((current) => ({
      ...current,
      assumptions: event.target.value
    }));
    setSaveState("");
  }

  function addRow() {
    setDataInputs((current) => ({
      ...current,
      rows: [...current.rows, createDataInputRow()]
    }));
    setSaveState("");
  }

  function removeRow(rowId: string) {
    setDataInputs((current) => ({
      ...current,
      rows: current.rows.filter((row) => row.id !== rowId)
    }));
    setSaveState("");
  }

  function saveInputs() {
    saveProjectDataInputs(dataInputs);
    setDataInputs(getProjectDataInputs(projectId));
    setSaveState("Saved");
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
                      onChange={(event) => updateNumber(row.id, "annualKwh", event.target.value)}
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={row.peakDemandKw}
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
                      onChange={(event) => updateRow(row.id, { notes: event.target.value })}
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
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
          rows={4}
          className="mt-2 w-full resize-y rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveInputs}
          className="rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark"
        >
          Save inputs
        </button>
        {saveState ? <span className="text-sm font-medium text-semarts-dark">{saveState}</span> : null}
      </div>
    </div>
  );
}
