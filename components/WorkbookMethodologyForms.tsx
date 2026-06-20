"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { isProjectArchived } from "@/lib/project-state";
import {
  createAssetInput,
  createDefaultMethodologyInputs,
  createDirectCostInput,
  createEmployeeCostInput,
  createIndirectOverheadInput,
  createPotllSupplyInput,
  createTenantInput,
  getProjectMethodologyInputs,
  saveProjectMethodologyInputs
} from "@/lib/project-storage";
import type {
  AssetInput,
  DirectCostInput,
  EmployeeCostInput,
  EmployeeRoleType,
  IndirectOverheadInput,
  PotllSupplyInput,
  ProjectMethodologyInputs,
  SupplyChargeInput,
  TariffAssumptions,
  TenantInput,
  WorkbookVoltage
} from "@/types/project";

type WorkbookFormProps = {
  projectId: string;
};

type AssumptionNumberField = keyof Pick<
  TariffAssumptions,
  | "weightedAverageCostOfCapitalPercent"
  | "cpiPercent"
  | "annualRevenue"
  | "annualUtilityRecoveries"
  | "averageAssetAgeYears"
  | "averageMeteringAssetAgeYears"
  | "potllEhvLossPercent"
  | "potllHvLossPercent"
  | "potllLvLossPercent"
>;

type AssumptionDateField = keyof Pick<
  TariffAssumptions,
  "referenceYearStart" | "referenceYearEnd" | "tariffYearStart" | "tariffYearEnd"
>;

type SupplyChargeField = keyof SupplyChargeInput;

const voltages: WorkbookVoltage[] = ["EHV", "HV", "LV MD", "LV"];
const assetVoltages: AssetInput["voltage"][] = ["EHV", "HV", "LV MD", "LV", "Metering"];
const potllSupplyVoltages: PotllSupplyInput["voltage"][] = ["EHV", "HV", "LV MD", "LV", "Losses"];
const roleTypes: EmployeeRoleType[] = [
  "Exco",
  "Director",
  "Head",
  "Senior Manager",
  "Manager",
  "Colleague"
];

function toNumber(value: string) {
  return Number(value) || 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value);
}

function getAnnualTenantKwh(row: TenantInput) {
  return row.monthlyKwh.reduce((total, monthValue) => total + monthValue, 0);
}

function getQuarterTotal(row: PotllSupplyInput) {
  return row.quarterKwh.reduce((total, quarterValue) => total + quarterValue, 0);
}

function getEmployeeAnnualCost(row: EmployeeCostInput) {
  return row.fte * (row.timePercent / 100) * row.hourlyRate * 8 * 5 * 52;
}

function validateAssumptions(assumptions: TariffAssumptions) {
  const errors: string[] = [];

  if (
    assumptions.referenceYearStart &&
    assumptions.referenceYearEnd &&
    assumptions.referenceYearEnd < assumptions.referenceYearStart
  ) {
    errors.push("Reference year end must be after the start date.");
  }

  if (
    assumptions.tariffYearStart &&
    assumptions.tariffYearEnd &&
    assumptions.tariffYearEnd < assumptions.tariffYearStart
  ) {
    errors.push("Tariff year end must be after the start date.");
  }

  if (assumptions.weightedAverageCostOfCapitalPercent < 0) {
    errors.push("WACC cannot be negative.");
  }

  if (
    assumptions.potllEhvLossPercent < 0 ||
    assumptions.potllHvLossPercent < 0 ||
    assumptions.potllLvLossPercent < 0
  ) {
    errors.push("Network loss percentages cannot be negative.");
  }

  return errors;
}

function useWorkbookMethodology(projectId: string) {
  const [methodologyInputs, setMethodologyInputs] = useState<ProjectMethodologyInputs>(
    () => createDefaultMethodologyInputs(projectId)
  );
  const [saveState, setSaveState] = useState("");
  const [isArchived, setIsArchived] = useState(false);

  useEffect(() => {
    setMethodologyInputs(getProjectMethodologyInputs(projectId));
    setIsArchived(isProjectArchived(projectId));
  }, [projectId]);

  function save(nextInputs: ProjectMethodologyInputs, message: string) {
    if (isArchived) {
      setSaveState("Archived projects are read-only. Restore the project in Settings to edit.");
      return;
    }

    saveProjectMethodologyInputs(nextInputs);
    setMethodologyInputs(getProjectMethodologyInputs(projectId));
    setSaveState(message);
  }

  return {
    methodologyInputs,
    setMethodologyInputs,
    saveState,
    isArchived,
    save
  };
}

export function WorkbookAssumptionsForm({ projectId }: WorkbookFormProps) {
  const { methodologyInputs, setMethodologyInputs, saveState, isArchived, save } =
    useWorkbookMethodology(projectId);
  const validationErrors = useMemo(
    () => (methodologyInputs ? validateAssumptions(methodologyInputs.assumptions) : []),
    [methodologyInputs]
  );

  function updateNumber(field: AssumptionNumberField, value: string) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      assumptions: {
        ...methodologyInputs.assumptions,
        [field]: toNumber(value)
      }
    });
  }

  function updateDate(field: AssumptionDateField, value: string) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      assumptions: {
        ...methodologyInputs.assumptions,
        [field]: value
      }
    });
  }

  function updateNotes(event: ChangeEvent<HTMLTextAreaElement>) {
    if (isArchived) return;
    setMethodologyInputs({ ...methodologyInputs, notes: event.target.value });
  }

  return (
    <section className="rounded-md border border-line bg-white p-6 shadow-sm">
      <div>
        <h2 className="font-semibold">Workbook methodology assumptions</h2>
        <p className="mt-1 text-sm text-ink/70">
          Source: Inputs and Selections A14:B29.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <NumberInput
          label="WACC %"
          value={methodologyInputs.assumptions.weightedAverageCostOfCapitalPercent}
          disabled={isArchived}
          onChange={(value) => updateNumber("weightedAverageCostOfCapitalPercent", value)}
        />
        <NumberInput
          label="CPI %"
          value={methodologyInputs.assumptions.cpiPercent}
          disabled={isArchived}
          onChange={(value) => updateNumber("cpiPercent", value)}
        />
        <NumberInput
          label="Annual revenue"
          value={methodologyInputs.assumptions.annualRevenue}
          disabled={isArchived}
          onChange={(value) => updateNumber("annualRevenue", value)}
        />
        <NumberInput
          label="Annual utility recoveries"
          value={methodologyInputs.assumptions.annualUtilityRecoveries}
          disabled={isArchived}
          onChange={(value) => updateNumber("annualUtilityRecoveries", value)}
        />
        <NumberInput
          label="Average asset age"
          value={methodologyInputs.assumptions.averageAssetAgeYears}
          disabled={isArchived}
          onChange={(value) => updateNumber("averageAssetAgeYears", value)}
        />
        <NumberInput
          label="Average metering asset age"
          value={methodologyInputs.assumptions.averageMeteringAssetAgeYears}
          disabled={isArchived}
          onChange={(value) => updateNumber("averageMeteringAssetAgeYears", value)}
        />
        <NumberInput
          label="POTLL EHV losses %"
          value={methodologyInputs.assumptions.potllEhvLossPercent}
          disabled={isArchived}
          onChange={(value) => updateNumber("potllEhvLossPercent", value)}
        />
        <NumberInput
          label="POTLL HV losses %"
          value={methodologyInputs.assumptions.potllHvLossPercent}
          disabled={isArchived}
          onChange={(value) => updateNumber("potllHvLossPercent", value)}
        />
        <NumberInput
          label="POTLL LV losses %"
          value={methodologyInputs.assumptions.potllLvLossPercent}
          disabled={isArchived}
          onChange={(value) => updateNumber("potllLvLossPercent", value)}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <DateInput
          label="Reference start"
          value={methodologyInputs.assumptions.referenceYearStart}
          disabled={isArchived}
          onChange={(value) => updateDate("referenceYearStart", value)}
        />
        <DateInput
          label="Reference end"
          value={methodologyInputs.assumptions.referenceYearEnd}
          disabled={isArchived}
          onChange={(value) => updateDate("referenceYearEnd", value)}
        />
        <DateInput
          label="Tariff start"
          value={methodologyInputs.assumptions.tariffYearStart}
          disabled={isArchived}
          onChange={(value) => updateDate("tariffYearStart", value)}
        />
        <DateInput
          label="Tariff end"
          value={methodologyInputs.assumptions.tariffYearEnd}
          disabled={isArchived}
          onChange={(value) => updateDate("tariffYearEnd", value)}
        />
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-medium">Methodology notes</span>
        <textarea
          value={methodologyInputs.notes}
          disabled={isArchived}
          rows={3}
          onChange={updateNotes}
          className="mt-2 w-full resize-y rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
        />
      </label>

      <SaveFooter
        disabled={isArchived || validationErrors.length > 0}
        saveState={saveState}
        validationErrors={validationErrors}
        onSave={() => save(methodologyInputs, "Workbook assumptions saved locally.")}
      />
    </section>
  );
}

export function WorkbookCustomerInputsForm({ projectId }: WorkbookFormProps) {
  const { methodologyInputs, setMethodologyInputs, saveState, isArchived, save } =
    useWorkbookMethodology(projectId);

  function updateTenant(rowId: string, updates: Partial<TenantInput>) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      tenants: methodologyInputs.tenants.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    });
  }

  function updateMonthlyKwh(row: TenantInput, index: number, value: string) {
    const monthlyKwh = row.monthlyKwh.map((monthValue, monthIndex) =>
      monthIndex === index ? toNumber(value) : monthValue
    );
    updateTenant(row.id, { monthlyKwh });
  }

  function updatePotllSupply(rowId: string, updates: Partial<PotllSupplyInput>) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      potllSupplies: methodologyInputs.potllSupplies.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    });
  }

  function updateQuarterKwh(row: PotllSupplyInput, index: number, value: string) {
    const quarterKwh = row.quarterKwh.map((quarterValue, quarterIndex) =>
      quarterIndex === index ? toNumber(value) : quarterValue
    );
    updatePotllSupply(row.id, { quarterKwh });
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Workbook tenant inputs</h2>
            <p className="mt-1 text-sm text-ink/70">Source: Tenant Data A12:Y199.</p>
          </div>
          <button
            type="button"
            disabled={isArchived}
            onClick={() =>
              setMethodologyInputs({
                ...methodologyInputs,
                tenants: [...methodologyInputs.tenants, createTenantInput()]
              })
            }
            className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
          >
            Add tenant
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Ref</th>
                <th className="px-4 py-3 font-semibold">Voltage</th>
                <th className="px-4 py-3 font-semibold">Capacity kVA</th>
                <th className="px-4 py-3 font-semibold">Tariff type</th>
                <th className="px-4 py-3 font-semibold">Supply</th>
                <th className="px-4 py-3 font-semibold">Monthly kWh</th>
                <th className="px-4 py-3 font-semibold">Annual kWh</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {methodologyInputs.tenants.map((row) => (
                <tr key={row.id} className="border-t border-line align-top">
                  <td className="px-4 py-3">
                    <input
                      value={row.customerName}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateTenant(row.id, { customerName: event.target.value })
                      }
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={row.tariffModelRef}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateTenant(row.id, { tariffModelRef: event.target.value })
                      }
                      className="w-24 rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <VoltageSelect
                      value={row.voltage}
                      disabled={isArchived}
                      onChange={(value) => updateTenant(row.id, { voltage: value })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      value={row.capacityKva}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateTenant(row.id, { capacityKva: toNumber(event.target.value) })
                      }
                      className="w-28 rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <VoltageSelect
                      value={row.tariffType}
                      disabled={isArchived}
                      onChange={(value) => updateTenant(row.id, { tariffType: value })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={row.supplyIncluded}
                      disabled={isArchived}
                      onChange={(event) =>
                        updateTenant(row.id, { supplyIncluded: event.target.checked })
                      }
                      className="h-5 w-5"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="grid grid-cols-4 gap-2">
                      {row.monthlyKwh.map((monthValue, index) => (
                        <input
                          key={`${row.id}-month-${index}`}
                          type="number"
                          value={monthValue}
                          disabled={isArchived}
                          onChange={(event) => updateMonthlyKwh(row, index, event.target.value)}
                          className="w-20 rounded-md border border-line px-2 py-1 outline-none focus:border-semarts"
                          aria-label={`Month ${index + 1} kWh`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatNumber(getAnnualTenantKwh(row))}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isArchived}
                      onClick={() =>
                        setMethodologyInputs({
                          ...methodologyInputs,
                          tenants: methodologyInputs.tenants.filter(
                            (tenant) => tenant.id !== row.id
                          )
                        })
                      }
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
      </section>

      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">POTLL own-use supplies</h2>
            <p className="mt-1 text-sm text-ink/70">Source: POTLL Supplies A12:G43.</p>
          </div>
          <button
            type="button"
            disabled={isArchived}
            onClick={() =>
              setMethodologyInputs({
                ...methodologyInputs,
                potllSupplies: [
                  ...methodologyInputs.potllSupplies,
                  createPotllSupplyInput()
                ]
              })
            }
            className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
          >
            Add supply
          </button>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Voltage</th>
                <th className="px-4 py-3 font-semibold">Quarterly kWh</th>
                <th className="px-4 py-3 font-semibold">Annual kWh</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {methodologyInputs.potllSupplies.map((row) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <input
                      value={row.location}
                      disabled={isArchived}
                      onChange={(event) =>
                        updatePotllSupply(row.id, { location: event.target.value })
                      }
                      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.voltage}
                      disabled={isArchived}
                      onChange={(event) =>
                        updatePotllSupply(row.id, {
                          voltage: event.target.value as PotllSupplyInput["voltage"]
                        })
                      }
                      className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                    >
                      {potllSupplyVoltages.map((voltage) => (
                        <option key={voltage}>{voltage}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {row.quarterKwh.map((quarterValue, index) => (
                        <input
                          key={`${row.id}-quarter-${index}`}
                          type="number"
                          value={quarterValue}
                          disabled={isArchived}
                          onChange={(event) => updateQuarterKwh(row, index, event.target.value)}
                          className="w-24 rounded-md border border-line px-2 py-1 outline-none focus:border-semarts"
                          aria-label={`Quarter ${index + 1} kWh`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatNumber(getQuarterTotal(row))}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isArchived}
                      onClick={() =>
                        setMethodologyInputs({
                          ...methodologyInputs,
                          potllSupplies: methodologyInputs.potllSupplies.filter(
                            (supply) => supply.id !== row.id
                          )
                        })
                      }
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
      </section>

      <SaveFooter
        disabled={isArchived}
        saveState={saveState}
        validationErrors={[]}
        onSave={() => save(methodologyInputs, "Workbook customer inputs saved locally.")}
      />
    </div>
  );
}

export function WorkbookCostInputsForm({ projectId }: WorkbookFormProps) {
  const { methodologyInputs, setMethodologyInputs, saveState, isArchived, save } =
    useWorkbookMethodology(projectId);

  function updateSupplyCharge(field: SupplyChargeField, value: string) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      supplyCharges: {
        ...methodologyInputs.supplyCharges,
        [field]: toNumber(value)
      }
    });
  }

  function updateDirectCost(rowId: string, updates: Partial<DirectCostInput>) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      directCosts: methodologyInputs.directCosts.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    });
  }

  function updateEmployeeCost(rowId: string, updates: Partial<EmployeeCostInput>) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      employeeCosts: methodologyInputs.employeeCosts.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    });
  }

  function updateOverhead(rowId: string, updates: Partial<IndirectOverheadInput>) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      indirectOverheads: methodologyInputs.indirectOverheads.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    });
  }

  function updateAsset(rowId: string, updates: Partial<AssetInput>) {
    if (isArchived) return;
    setMethodologyInputs({
      ...methodologyInputs,
      assets: methodologyInputs.assets.map((row) =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <WorkbookTableSection
        title="Direct non-employee costs"
        source="Inputs and Selections A34:E72"
        addLabel="Add direct cost"
        onAdd={() =>
          setMethodologyInputs({
            ...methodologyInputs,
            directCosts: [...methodologyInputs.directCosts, createDirectCostInput()]
          })
        }
        disabled={isArchived}
      >
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-field text-left text-xs uppercase text-ink/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Cost centre</th>
              <th className="px-4 py-3 font-semibold">Expense head</th>
              <th className="px-4 py-3 font-semibold">Cost type</th>
              <th className="px-4 py-3 font-semibold">Annual value</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {methodologyInputs.directCosts.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <TextInput
                    value={row.description}
                    disabled={isArchived}
                    onChange={(value) => updateDirectCost(row.id, { description: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <TextInput
                    value={row.costCentre}
                    disabled={isArchived}
                    onChange={(value) => updateDirectCost(row.id, { costCentre: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <TextInput
                    value={row.expenseHead}
                    disabled={isArchived}
                    onChange={(value) => updateDirectCost(row.id, { expenseHead: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <TextInput
                    value={row.costType}
                    disabled={isArchived}
                    onChange={(value) => updateDirectCost(row.id, { costType: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <NumberCell
                    value={row.annualValue}
                    disabled={isArchived}
                    onChange={(value) => updateDirectCost(row.id, { annualValue: toNumber(value) })}
                  />
                </td>
                <td className="px-4 py-3">
                  <RemoveButton
                    disabled={isArchived}
                    onClick={() =>
                      setMethodologyInputs({
                        ...methodologyInputs,
                        directCosts: methodologyInputs.directCosts.filter(
                          (cost) => cost.id !== row.id
                        )
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </WorkbookTableSection>

      <WorkbookTableSection
        title="Employee costs"
        source="Inputs and Selections A75:G85"
        addLabel="Add employee cost"
        onAdd={() =>
          setMethodologyInputs({
            ...methodologyInputs,
            employeeCosts: [...methodologyInputs.employeeCosts, createEmployeeCostInput()]
          })
        }
        disabled={isArchived}
      >
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead className="bg-field text-left text-xs uppercase text-ink/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Role type</th>
              <th className="px-4 py-3 font-semibold">FTE</th>
              <th className="px-4 py-3 font-semibold">% time</th>
              <th className="px-4 py-3 font-semibold">Hourly rate</th>
              <th className="px-4 py-3 font-semibold">Annual cost</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {methodologyInputs.employeeCosts.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <TextInput
                    value={row.role}
                    disabled={isArchived}
                    onChange={(value) => updateEmployeeCost(row.id, { role: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={row.roleType}
                    disabled={isArchived}
                    onChange={(event) =>
                      updateEmployeeCost(row.id, {
                        roleType: event.target.value as EmployeeRoleType
                      })
                    }
                    className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                  >
                    {roleTypes.map((roleType) => (
                      <option key={roleType}>{roleType}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <NumberCell
                    value={row.fte}
                    disabled={isArchived}
                    onChange={(value) => updateEmployeeCost(row.id, { fte: toNumber(value) })}
                  />
                </td>
                <td className="px-4 py-3">
                  <NumberCell
                    value={row.timePercent}
                    disabled={isArchived}
                    onChange={(value) =>
                      updateEmployeeCost(row.id, { timePercent: toNumber(value) })
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <NumberCell
                    value={row.hourlyRate}
                    disabled={isArchived}
                    onChange={(value) =>
                      updateEmployeeCost(row.id, { hourlyRate: toNumber(value) })
                    }
                  />
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatNumber(getEmployeeAnnualCost(row))}
                </td>
                <td className="px-4 py-3">
                  <RemoveButton
                    disabled={isArchived}
                    onClick={() =>
                      setMethodologyInputs({
                        ...methodologyInputs,
                        employeeCosts: methodologyInputs.employeeCosts.filter(
                          (cost) => cost.id !== row.id
                        )
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </WorkbookTableSection>

      <WorkbookTableSection
        title="Indirect overheads"
        source="Inputs and Selections A88:E97"
        addLabel="Add overhead"
        onAdd={() =>
          setMethodologyInputs({
            ...methodologyInputs,
            indirectOverheads: [
              ...methodologyInputs.indirectOverheads,
              createIndirectOverheadInput()
            ]
          })
        }
        disabled={isArchived}
      >
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead className="bg-field text-left text-xs uppercase text-ink/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Annual cost</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {methodologyInputs.indirectOverheads.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <TextInput
                    value={row.description}
                    disabled={isArchived}
                    onChange={(value) => updateOverhead(row.id, { description: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <NumberCell
                    value={row.annualCost}
                    disabled={isArchived}
                    onChange={(value) => updateOverhead(row.id, { annualCost: toNumber(value) })}
                  />
                </td>
                <td className="px-4 py-3">
                  <RemoveButton
                    disabled={isArchived}
                    onClick={() =>
                      setMethodologyInputs({
                        ...methodologyInputs,
                        indirectOverheads: methodologyInputs.indirectOverheads.filter(
                          (cost) => cost.id !== row.id
                        )
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </WorkbookTableSection>

      <WorkbookTableSection
        title="Asset register"
        source="Asset Data A12:N60"
        addLabel="Add asset"
        onAdd={() =>
          setMethodologyInputs({
            ...methodologyInputs,
            assets: [...methodologyInputs.assets, createAssetInput()]
          })
        }
        disabled={isArchived}
      >
        <table className="w-full min-w-[1080px] border-collapse text-sm">
          <thead className="bg-field text-left text-xs uppercase text-ink/60">
            <tr>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Voltage</th>
              <th className="px-4 py-3 font-semibold">Network level</th>
              <th className="px-4 py-3 font-semibold">Life years</th>
              <th className="px-4 py-3 font-semibold">Asset value</th>
              <th className="px-4 py-3 font-semibold">Chargeable</th>
              <th className="px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {methodologyInputs.assets.map((row) => (
              <tr key={row.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <TextInput
                    value={row.description}
                    disabled={isArchived}
                    onChange={(value) => updateAsset(row.id, { description: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <TextInput
                    value={row.assetCategory}
                    disabled={isArchived}
                    onChange={(value) => updateAsset(row.id, { assetCategory: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={row.voltage}
                    disabled={isArchived}
                    onChange={(event) =>
                      updateAsset(row.id, { voltage: event.target.value as AssetInput["voltage"] })
                    }
                    className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
                  >
                    {assetVoltages.map((voltage) => (
                      <option key={voltage}>{voltage}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <TextInput
                    value={row.networkLevel}
                    disabled={isArchived}
                    onChange={(value) => updateAsset(row.id, { networkLevel: value })}
                  />
                </td>
                <td className="px-4 py-3">
                  <NumberCell
                    value={row.lifeYears}
                    disabled={isArchived}
                    onChange={(value) => updateAsset(row.id, { lifeYears: toNumber(value) })}
                  />
                </td>
                <td className="px-4 py-3">
                  <NumberCell
                    value={row.priorYearAssetValue}
                    disabled={isArchived}
                    onChange={(value) =>
                      updateAsset(row.id, { priorYearAssetValue: toNumber(value) })
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={row.isChargeableOnElectricityTariff}
                    disabled={isArchived}
                    onChange={(event) =>
                      updateAsset(row.id, {
                        isChargeableOnElectricityTariff: event.target.checked
                      })
                    }
                    className="h-5 w-5"
                  />
                </td>
                <td className="px-4 py-3">
                  <RemoveButton
                    disabled={isArchived}
                    onClick={() =>
                      setMethodologyInputs({
                        ...methodologyInputs,
                        assets: methodologyInputs.assets.filter((asset) => asset.id !== row.id)
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </WorkbookTableSection>

      <section className="rounded-md border border-line bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Supply, DUoS, TNUoS and margin inputs</h2>
        <p className="mt-1 text-sm text-ink/70">
          Source: Inputs and Selections A112:B146.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {(Object.keys(methodologyInputs.supplyCharges) as SupplyChargeField[]).map((field) => (
            <NumberInput
              key={field}
              label={field.replace(/([A-Z])/g, " $1")}
              value={methodologyInputs.supplyCharges[field]}
              disabled={isArchived}
              onChange={(value) => updateSupplyCharge(field, value)}
            />
          ))}
        </div>
      </section>

      <SaveFooter
        disabled={isArchived}
        saveState={saveState}
        validationErrors={[]}
        onSave={() => save(methodologyInputs, "Workbook cost inputs saved locally.")}
      />
    </div>
  );
}

function WorkbookTableSection({
  title,
  source,
  addLabel,
  disabled,
  onAdd,
  children
}: {
  title: string;
  source: string;
  addLabel: string;
  disabled: boolean;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-md border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-ink/70">Source: {source}.</p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onAdd}
          className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
        >
          {addLabel}
        </button>
      </div>
      <div className="mt-5 overflow-x-auto">{children}</div>
    </section>
  );
}

function NumberInput({
  label,
  value,
  disabled,
  onChange
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="number"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
      />
    </label>
  );
}

function DateInput({
  label,
  value,
  disabled,
  onChange
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="date"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
      />
    </label>
  );
}

function TextInput({
  value,
  disabled,
  onChange
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
    />
  );
}

function NumberCell({
  value,
  disabled,
  onChange
}: {
  value: number;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="w-28 rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
    />
  );
}

function VoltageSelect({
  value,
  disabled,
  onChange
}: {
  value: WorkbookVoltage;
  disabled: boolean;
  onChange: (value: WorkbookVoltage) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as WorkbookVoltage)}
      className="w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
    >
      {voltages.map((voltage) => (
        <option key={voltage}>{voltage}</option>
      ))}
    </select>
  );
}

function RemoveButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
    >
      Remove
    </button>
  );
}

function SaveFooter({
  disabled,
  saveState,
  validationErrors,
  onSave
}: {
  disabled: boolean;
  saveState: string;
  validationErrors: string[];
  onSave: () => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={onSave}
        className="rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark disabled:cursor-not-allowed disabled:bg-ink/30"
      >
        Save workbook inputs
      </button>
      {saveState ? <span className="text-sm font-medium text-semarts-dark">{saveState}</span> : null}
      {validationErrors.length > 0 ? (
        <span className="text-sm font-medium text-red-700">{validationErrors.join(" ")}</span>
      ) : null}
    </div>
  );
}
