"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  calculateAllocationShares,
  getProjectAllocationMethods,
  getProjectCostPools,
  saveProjectAllocationMethods
} from "@/lib/project-storage";
import { isProjectArchived } from "@/lib/project-state";
import { saveAllocationMethodsToSupabase } from "@/lib/supabase-sync";
import type {
  AllocationBasis,
  AllocationMethodRow,
  ProjectAllocationMethods,
  TariffComponent
} from "@/types/project";

type AllocationMethodsFormProps = {
  projectId: string;
};

const allocationBases: AllocationBasis[] = [
  "Customer count",
  "Annual kWh",
  "Peak demand",
  "Equal share",
  "Manual"
];

const tariffComponents: TariffComponent[] = ["Fixed", "Energy", "Demand", "Pass-through"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0
  }).format(value);
}

function getShareTotal(row: AllocationMethodRow) {
  return Number(
    row.classShares.reduce((total, share) => total + share.percent, 0).toFixed(2)
  );
}

function isBalanced(row: AllocationMethodRow) {
  return Math.abs(getShareTotal(row) - 100) < 0.01;
}

export function AllocationMethodsForm({ projectId }: AllocationMethodsFormProps) {
  const [allocationMethods, setAllocationMethods] = useState<ProjectAllocationMethods>({
    projectId,
    rows: [],
    assumptions: "",
    lastUpdated: ""
  });
  const [saveState, setSaveState] = useState("");
  const [isArchived, setIsArchived] = useState(false);

  useEffect(() => {
    setAllocationMethods(getProjectAllocationMethods(projectId));
    setIsArchived(isProjectArchived(projectId));
  }, [projectId]);

  const costPools = useMemo(() => getProjectCostPools(projectId), [projectId]);
  const recoverableCostByPool = useMemo(
    () =>
      new Map(
        costPools.rows.map((row) => [
          row.id,
          row.annualAmount * (row.recoverablePercent / 100)
        ])
      ),
    [costPools.rows]
  );
  const totals = useMemo(() => {
    const allocatedCost = allocationMethods.rows.reduce(
      (total, row) => total + (recoverableCostByPool.get(row.costPoolId) ?? 0),
      0
    );
    const rowsNeedingReview = allocationMethods.rows.filter(
      (row) => row.requiresReview || !isBalanced(row)
    ).length;

    return {
      allocatedCost,
      rowsNeedingReview,
      ruleCount: allocationMethods.rows.length
    };
  }, [allocationMethods.rows, recoverableCostByPool]);

  function updateRow(rowId: string, updates: Partial<AllocationMethodRow>, clearsReview = true) {
    if (isArchived) return;
    setAllocationMethods((current) => ({
      ...current,
      rows: current.rows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              ...updates,
              requiresReview: clearsReview ? false : row.requiresReview
            }
          : row
      )
    }));
    setSaveState("");
  }

  function updateBasis(row: AllocationMethodRow, basis: AllocationBasis) {
    if (isArchived) return;
    updateRow(row.id, {
      basis,
      classShares:
        basis === "Manual" ? row.classShares : calculateAllocationShares(projectId, basis)
    });
  }

  function updateShare(row: AllocationMethodRow, customerClass: string, value: string) {
    if (isArchived) return;
    updateRow(row.id, {
      basis: "Manual",
      classShares: row.classShares.map((share) =>
        share.customerClass === customerClass
          ? { ...share, percent: Number(value) || 0 }
          : share
      )
    });
  }

  function updateAssumptions(event: ChangeEvent<HTMLTextAreaElement>) {
    if (isArchived) return;
    setAllocationMethods((current) => ({
      ...current,
      assumptions: event.target.value
    }));
    setSaveState("");
  }

  async function saveInputs() {
    if (isArchived) {
      setSaveState("Archived projects are read-only. Restore the project in Settings to edit.");
      return;
    }

    saveProjectAllocationMethods(allocationMethods);
    const savedAllocationMethods = getProjectAllocationMethods(projectId);
    setAllocationMethods(savedAllocationMethods);

    try {
      const cloudSaved = await saveAllocationMethodsToSupabase(savedAllocationMethods);
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
          <p className="text-xs font-semibold uppercase text-ink/50">Allocated cost</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totals.allocatedCost)}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Allocation rules</p>
          <p className="mt-2 text-2xl font-semibold">{totals.ruleCount}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-ink/50">Rows needing review</p>
          <p className="mt-2 text-2xl font-semibold">{totals.rowsNeedingReview}</p>
        </div>
      </div>

      <div className="space-y-4">
        {allocationMethods.rows.map((row) => {
          const shareTotal = getShareTotal(row);
          const balanced = isBalanced(row);

          return (
            <section key={row.id} className="rounded-md border border-line bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{row.costPoolName}</h2>
                    {row.requiresReview ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                        Needs review before approval
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-ink/60">
                    Recoverable cost {formatCurrency(recoverableCostByPool.get(row.costPoolId) ?? 0)}
                  </p>
                  {row.requiresReview ? (
                    <p className="mt-2 text-sm leading-6 text-amber-800">
                      This allocation method was created during reconciliation. Review and save the
                      method when the basis, component, shares, and notes are correct.
                    </p>
                  ) : null}
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    balanced ? "bg-field text-semarts-dark" : "bg-red-50 text-red-700"
                  }`}
                >
                  {shareTotal}% allocated
                </span>
              </div>

              <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-3">
                <label className="block">
                  <span className="text-sm font-medium">Allocation basis</span>
                  <select
                    value={row.basis}
                    disabled={isArchived}
                    onChange={(event) => updateBasis(row, event.target.value as AllocationBasis)}
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                  >
                    {allocationBases.map((basis) => (
                      <option key={basis}>{basis}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium">Tariff component</span>
                  <select
                    value={row.tariffComponent}
                    disabled={isArchived}
                    onChange={(event) =>
                      updateRow(row.id, {
                        tariffComponent: event.target.value as TariffComponent
                      })
                    }
                    className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                  >
                    {tariffComponents.map((component) => (
                      <option key={component}>{component}</option>
                    ))}
                  </select>
                </label>

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
              </div>

              <div className="grid gap-3 border-t border-line bg-field/40 p-4 sm:p-5 md:grid-cols-3">
                {row.classShares.map((share) => (
                  <label key={share.customerClass} className="block">
                    <span className="text-sm font-medium">{share.customerClass}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={share.percent}
                      disabled={isArchived}
                      onChange={(event) => updateShare(row, share.customerClass, event.target.value)}
                      className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </label>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <label className="block rounded-md border border-line bg-white p-4 shadow-sm">
        <span className="text-sm font-semibold">Allocation assumptions</span>
        <textarea
          value={allocationMethods.assumptions}
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
          Save allocation methods
        </button>
        {saveState ? <span className="text-sm font-medium text-semarts-dark">{saveState}</span> : null}
      </div>
    </div>
  );
}
