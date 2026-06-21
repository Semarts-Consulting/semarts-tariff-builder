"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  createCostPoolRow,
  getProjectCostPools,
  saveProjectCostPools
} from "@/lib/project-storage";
import { isProjectArchived } from "@/lib/project-state";
import { saveCostPoolsToSupabase } from "@/lib/supabase-sync";
import type { CostPoolCategory, CostPoolRow, ProjectCostPools } from "@/types/project";

type CostPoolsFormProps = {
  projectId: string;
};

type NumberField = "annualAmount" | "recoverablePercent";

const categories: CostPoolCategory[] = [
  "Operations",
  "Maintenance",
  "Administration",
  "Network services",
  "Asset recovery",
  "Taxes and levies",
  "Other"
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(value);
}

function getRecoverableAmount(row: CostPoolRow) {
  return row.annualAmount * (row.recoverablePercent / 100);
}

function getTotals(rows: CostPoolRow[]) {
  return rows.reduce(
    (totals, row) => ({
      annualAmount: totals.annualAmount + row.annualAmount,
      recoverableAmount: totals.recoverableAmount + getRecoverableAmount(row)
    }),
    { annualAmount: 0, recoverableAmount: 0 }
  );
}

export function CostPoolsForm({ projectId }: CostPoolsFormProps) {
  const [costPools, setCostPools] = useState<ProjectCostPools>({
    projectId,
    rows: [],
    assumptions: "",
    lastUpdated: ""
  });
  const [saveState, setSaveState] = useState("");
  const [isArchived, setIsArchived] = useState(false);

  useEffect(() => {
    setCostPools(getProjectCostPools(projectId));
    setIsArchived(isProjectArchived(projectId));
  }, [projectId]);

  const totals = useMemo(() => getTotals(costPools.rows), [costPools.rows]);

  function updateRow(rowId: string, updates: Partial<CostPoolRow>) {
    if (isArchived) return;
    setCostPools((current) => ({
      ...current,
      rows: current.rows.map((row) => (row.id === rowId ? { ...row, ...updates } : row))
    }));
    setSaveState("");
  }

  function updateNumber(rowId: string, field: NumberField, value: string) {
    if (isArchived) return;
    const parsedValue = Number(value) || 0;
    updateRow(rowId, {
      [field]: field === "recoverablePercent" ? Math.min(parsedValue, 100) : parsedValue
    });
  }

  function updateAssumptions(event: ChangeEvent<HTMLTextAreaElement>) {
    if (isArchived) return;
    setCostPools((current) => ({
      ...current,
      assumptions: event.target.value
    }));
    setSaveState("");
  }

  function addRow() {
    if (isArchived) return;
    setCostPools((current) => ({
      ...current,
      rows: [...current.rows, createCostPoolRow()]
    }));
    setSaveState("");
  }

  function removeRow(rowId: string) {
    if (isArchived) return;
    setCostPools((current) => ({
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

    saveProjectCostPools(costPools);
    const savedCostPools = getProjectCostPools(projectId);
    setCostPools(savedCostPools);

    try {
      const cloudSaved = await saveCostPoolsToSupabase(savedCostPools);
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
          <p className="text-xs font-semibold uppercase text-ink/50">Gross annual costs</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totals.annualAmount)}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Recoverable costs</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCurrency(totals.recoverableAmount)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Cost pools</p>
          <p className="mt-2 text-2xl font-semibold">{costPools.rows.length}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
          <h2 className="font-semibold">Recoverable cost pools</h2>
          <button
            type="button"
            onClick={addRow}
            disabled={isArchived}
            className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
          >
            Add pool
          </button>
        </div>

        <div className="divide-y divide-line md:hidden">
          {costPools.rows.map((row) => (
            <section key={row.id} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-ink">{row.name || "Cost pool"}</h3>
                  <p className="mt-1 text-sm text-ink/60">
                    Recoverable {formatCurrency(getRecoverableAmount(row))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={isArchived}
                  className="shrink-0 rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
                >
                  Remove
                </button>
              </div>

              <label className="block">
                <span className="text-sm font-medium">Cost pool</span>
                <input
                  type="text"
                  value={row.name}
                  disabled={isArchived}
                  onChange={(event) => updateRow(row.id, { name: event.target.value })}
                  className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Category</span>
                <select
                  value={row.category}
                  disabled={isArchived}
                  onChange={(event) =>
                    updateRow(row.id, { category: event.target.value as CostPoolCategory })
                  }
                  className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Annual amount</span>
                  <input
                    type="number"
                    min="0"
                    value={row.annualAmount}
                    disabled={isArchived}
                    onChange={(event) =>
                      updateNumber(row.id, "annualAmount", event.target.value)
                    }
                    className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Recoverable %</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={row.recoverablePercent}
                    disabled={isArchived}
                    onChange={(event) =>
                      updateNumber(row.id, "recoverablePercent", event.target.value)
                    }
                    className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium">Notes</span>
                <input
                  type="text"
                  value={row.notes}
                  disabled={isArchived}
                  onChange={(event) => updateRow(row.id, { notes: event.target.value })}
                  className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                />
              </label>
            </section>
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1040px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Cost pool</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Annual amount</th>
                <th className="px-4 py-3 font-semibold">Recoverable %</th>
                <th className="px-4 py-3 font-semibold">Recoverable amount</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {costPools.rows.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.name}
                      disabled={isArchived}
                      onChange={(event) => updateRow(row.id, { name: event.target.value })}
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.category}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateRow(row.id, { category: event.target.value as CostPoolCategory })
                      }
                      className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                    >
                      {categories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={row.annualAmount}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateNumber(row.id, "annualAmount", event.target.value)
                      }
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={row.recoverablePercent}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateNumber(row.id, "recoverablePercent", event.target.value)
                      }
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(getRecoverableAmount(row))}
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
        <span className="text-sm font-semibold">Cost recovery assumptions</span>
        <textarea
          value={costPools.assumptions}
          onChange={updateAssumptions}
          disabled={isArchived}
          rows={4}
          className="mt-2 w-full resize-y rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
        />
      </label>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-line bg-field/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0">
        <button
          type="button"
          onClick={saveInputs}
          disabled={isArchived}
          className="rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark disabled:cursor-not-allowed disabled:bg-ink/30 sm:w-fit"
        >
          Save cost pools
        </button>
        {saveState ? <span className="text-sm font-medium text-semarts-dark">{saveState}</span> : null}
      </div>
    </div>
  );
}
