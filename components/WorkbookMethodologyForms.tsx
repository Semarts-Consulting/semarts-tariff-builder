"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { readSheet } from "read-excel-file/browser";
import writeXlsxFile from "write-excel-file/browser";
import type { SheetData } from "write-excel-file/browser";
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
import {
  clearBoundaryMeterDataFromSupabase,
  deleteBoundaryMeterBatchFromSupabase,
  loadBoundaryMeterDataFromSupabase,
  saveBoundaryMeterDataToSupabase
} from "@/lib/supabase-sync";
import type {
  AssetInput,
  DirectCostInput,
  EmployeeCostInput,
  EmployeeRoleType,
  HalfHourlyImportRow,
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

export type CostInputSection =
  | "asset-data"
  | "direct-non-employee"
  | "direct-employee"
  | "indirect-overheads"
  | "supply";

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
const boundaryMeterHeaders = [
  "MPAN",
  "Date",
  "Total kWh",
  ...Array.from({ length: 48 }, (_, index) => String(index + 1))
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

function normaliseHeader(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normaliseMpan(value: unknown) {
  return String(value ?? "").trim();
}

function excelSerialDateToIso(value: number) {
  const excelEpoch = Date.UTC(1899, 11, 30);
  const parsed = new Date(excelEpoch + value * 24 * 60 * 60 * 1000);

  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function normaliseDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    return excelSerialDateToIso(value);
  }

  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  const parsed = new Date(text);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return text;
}

function parseRequiredNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : null;
}

function createBoundaryMeterFingerprint(row: Pick<
  HalfHourlyImportRow,
  "mpan" | "date" | "totalKwh" | "settlementPeriodKwh"
>) {
  return [
    row.mpan,
    row.date,
    row.totalKwh,
    ...row.settlementPeriodKwh
  ].join("|");
}

function createBoundaryMeterKey(row: Pick<HalfHourlyImportRow, "mpan" | "date">) {
  return `${row.mpan}::${row.date}`;
}

function createImportBatchId() {
  return `hh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function validateBoundaryHeaders(headerRow: unknown[]) {
  return boundaryMeterHeaders.every(
    (header, index) => normaliseHeader(headerRow[index]) === normaliseHeader(header)
  );
}

function parseBoundaryMeterRows(
  rows: unknown[][],
  sourceFileName: string,
  uploadedAt: string,
  importBatchId: string
) {
  const parsedRows: HalfHourlyImportRow[] = [];
  const errors: string[] = [];

  if (rows.length === 0 || !validateBoundaryHeaders(rows[0] ?? [])) {
    return {
      parsedRows,
      errors: [
        "The selected workbook does not match the template headers: MPAN, Date, Total kWh, 1 to 48."
      ]
    };
  }

  rows.slice(1).forEach((row, index) => {
    const excelRowNumber = index + 2;
    const hasValues = row.some((value) => String(value ?? "").trim() !== "");

    if (!hasValues) {
      return;
    }

    const mpan = normaliseMpan(row[0]);
    const date = normaliseDate(row[1]);
    const totalKwh = parseRequiredNumber(row[2]);
    const settlementPeriodKwh = row.slice(3, 51).map(parseRequiredNumber);

    if (!mpan) {
      errors.push(`Row ${excelRowNumber}: MPAN is required.`);
    }

    if (!date) {
      errors.push(`Row ${excelRowNumber}: Date is required.`);
    }

    if (totalKwh === null) {
      errors.push(`Row ${excelRowNumber}: Total kWh must be numeric.`);
    }

    if (settlementPeriodKwh.length !== 48 || settlementPeriodKwh.some((value) => value === null)) {
      errors.push(`Row ${excelRowNumber}: settlement periods 1 to 48 must all be numeric.`);
    }

    if (!mpan || !date || totalKwh === null || settlementPeriodKwh.some((value) => value === null)) {
      return;
    }

    const numericSettlementPeriods = settlementPeriodKwh.map((value) => value ?? 0);
    const baseRow = {
      mpan,
      date,
      totalKwh,
      settlementPeriodKwh: numericSettlementPeriods
    };

    parsedRows.push({
      id: `${importBatchId}-${parsedRows.length + 1}`,
      ...baseRow,
      sourceFileName,
      uploadedAt,
      importBatchId,
      rowFingerprint: createBoundaryMeterFingerprint(baseRow)
    });
  });

  return { parsedRows, errors };
}

function mergeBoundaryMeterRows(existingRows: HalfHourlyImportRow[], incomingRows: HalfHourlyImportRow[]) {
  const byKey = new Map(existingRows.map((row) => [createBoundaryMeterKey(row), row]));
  const seenIncomingFingerprints = new Set<string>();
  let added = 0;
  let replaced = 0;
  let skippedDuplicates = 0;

  incomingRows.forEach((row) => {
    const key = createBoundaryMeterKey(row);
    const existing = byKey.get(key);

    if (seenIncomingFingerprints.has(row.rowFingerprint)) {
      skippedDuplicates += 1;
      return;
    }

    seenIncomingFingerprints.add(row.rowFingerprint);

    if (existing?.rowFingerprint === row.rowFingerprint) {
      skippedDuplicates += 1;
      return;
    }

    if (existing) {
      replaced += 1;
    } else {
      added += 1;
    }

    byKey.set(key, row);
  });

  return {
    rows: Array.from(byKey.values()).sort((a, b) =>
      `${a.mpan}${a.date}`.localeCompare(`${b.mpan}${b.date}`)
    ),
    added,
    replaced,
    skippedDuplicates
  };
}

function getBoundaryMeterSummary(rows: HalfHourlyImportRow[]) {
  const dates = rows.map((row) => row.date).filter(Boolean).sort();
  const mpans = new Set(rows.map((row) => row.mpan).filter(Boolean));
  const rowKeys = new Set<string>();
  let duplicateKeys = 0;
  let actualPeriodCount = 0;
  let invalidPeriodValues = 0;
  let totalFromRows = 0;
  let totalFromHalfHours = 0;

  rows.forEach((row) => {
    const key = createBoundaryMeterKey(row);

    if (rowKeys.has(key)) {
      duplicateKeys += 1;
    }

    rowKeys.add(key);
    totalFromRows += row.totalKwh;

    row.settlementPeriodKwh.forEach((periodValue) => {
      if (Number.isFinite(periodValue)) {
        actualPeriodCount += 1;
        totalFromHalfHours += periodValue;
      } else {
        invalidPeriodValues += 1;
      }
    });

    if (row.settlementPeriodKwh.length < 48) {
      invalidPeriodValues += 48 - row.settlementPeriodKwh.length;
    }
  });

  const expectedPeriodCount = rows.length * 48;
  const variance = totalFromRows - totalFromHalfHours;

  return {
    rowCount: rows.length,
    mpanCount: mpans.size,
    firstDate: dates[0] ?? "",
    lastDate: dates[dates.length - 1] ?? "",
    expectedPeriodCount,
    actualPeriodCount,
    invalidPeriodValues,
    duplicateKeys,
    totalFromRows,
    totalFromHalfHours,
    variance,
    hasIssues:
      invalidPeriodValues > 0 ||
      duplicateKeys > 0 ||
      actualPeriodCount !== expectedPeriodCount ||
      Math.abs(variance) > 0.01
  };
}

function getBoundaryMeterRowReview(row: HalfHourlyImportRow) {
  const periodSum = row.settlementPeriodKwh.reduce(
    (total, periodValue) => total + (Number.isFinite(periodValue) ? periodValue : 0),
    0
  );
  const invalidPeriods =
    row.settlementPeriodKwh.filter((periodValue) => !Number.isFinite(periodValue)).length +
    Math.max(48 - row.settlementPeriodKwh.length, 0);
  const variance = row.totalKwh - periodSum;
  const status =
    invalidPeriods > 0
      ? "Invalid periods"
      : Math.abs(variance) > 0.01
        ? "Variance"
        : "Healthy";

  return {
    periodSum,
    invalidPeriods,
    variance,
    status
  };
}

function getBoundaryMeterUploadBatches(rows: HalfHourlyImportRow[]) {
  const batches = new Map<string, HalfHourlyImportRow[]>();

  rows.forEach((row) => {
    const key = row.importBatchId || "unknown";
    const currentRows = batches.get(key) ?? [];
    currentRows.push(row);
    batches.set(key, currentRows);
  });

  return Array.from(batches.entries())
    .map(([batchId, batchRows]) => {
      const summary = getBoundaryMeterSummary(batchRows);
      const latestRow = [...batchRows].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];

      return {
        batchId,
        rows: batchRows,
        fileName: latestRow?.sourceFileName || "Unknown file",
        uploadedAt: latestRow?.uploadedAt || "",
        ...summary
      };
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
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

export function WorkbookBoundaryMeterDataForm({ projectId }: WorkbookFormProps) {
  const { methodologyInputs, setMethodologyInputs, saveState, isArchived, save } =
    useWorkbookMethodology(projectId);
  const [importStatus, setImportStatus] = useState("");
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [cloudStatus, setCloudStatus] = useState("");
  const [showProblemRowsOnly, setShowProblemRowsOnly] = useState(false);
  const [batchToRemove, setBatchToRemove] = useState("");
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const latestUpload = methodologyInputs.halfHourlyImports
    .filter((row) => row.uploadedAt)
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
  const boundaryMeterSummary = useMemo(
    () => getBoundaryMeterSummary(methodologyInputs.halfHourlyImports),
    [methodologyInputs.halfHourlyImports]
  );
  const reviewRows = useMemo(
    () =>
      methodologyInputs.halfHourlyImports
        .map((row) => ({
          row,
          review: getBoundaryMeterRowReview(row)
        }))
        .filter((item) => !showProblemRowsOnly || item.review.status !== "Healthy")
        .slice(0, 250),
    [methodologyInputs.halfHourlyImports, showProblemRowsOnly]
  );
  const uploadBatches = useMemo(
    () => getBoundaryMeterUploadBatches(methodologyInputs.halfHourlyImports),
    [methodologyInputs.halfHourlyImports]
  );

  useEffect(() => {
    let isMounted = true;

    loadBoundaryMeterDataFromSupabase(projectId)
      .then((cloudRows) => {
        if (!isMounted || cloudRows.length === 0) {
          return;
        }

        const nextInputs = {
          ...getProjectMethodologyInputs(projectId),
          halfHourlyImports: cloudRows
        };

        saveProjectMethodologyInputs(nextInputs);
        setMethodologyInputs(nextInputs);
        setCloudStatus("Loaded boundary meter data from cloud.");
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setCloudStatus(
          error instanceof Error
            ? `Cloud load failed: ${error.message}`
            : "Cloud load failed."
        );
      });

    return () => {
      isMounted = false;
    };
  }, [projectId, setMethodologyInputs]);

  async function downloadTemplate() {
    const sheetData: SheetData = [
      boundaryMeterHeaders.map((header) => ({
        value: header,
        type: String,
        fontWeight: "bold"
      }))
    ];

    const file = await writeXlsxFile(sheetData, { sheet: "HH Import Data" });
    await file.toFile("boundary-meter-data-template.xlsx");
  }

  async function importWorkbook(file: File) {
    const uploadedAt = new Date().toISOString();
    const importBatchId = createImportBatchId();
    const rows = await readSheet(file);
    const result = parseBoundaryMeterRows(rows, file.name, uploadedAt, importBatchId);

    if (result.errors.length > 0) {
      setImportErrors(result.errors.slice(0, 12));
      setImportStatus("");
      return;
    }

    const merged = mergeBoundaryMeterRows(
      methodologyInputs.halfHourlyImports,
      result.parsedRows
    );
    const nextInputs = {
      ...methodologyInputs,
      halfHourlyImports: merged.rows
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Boundary meter data saved locally.");
    setImportErrors([]);
    setImportStatus(
      `Imported ${result.parsedRows.length} rows. Added ${merged.added}, replaced ${merged.replaced}, skipped ${merged.skippedDuplicates} duplicate rows.`
    );

    try {
      const cloudSaved = await saveBoundaryMeterDataToSupabase(projectId, merged.rows);
      setCloudStatus(cloudSaved ? "Boundary meter data saved to cloud." : "Saved locally only.");
    } catch (error) {
      setCloudStatus(
        error instanceof Error
          ? `Saved locally. Cloud save failed: ${error.message}`
          : "Saved locally. Cloud save failed."
      );
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || isArchived) {
      return;
    }

    importWorkbook(file).catch((error: unknown) => {
      setImportErrors([
        error instanceof Error
          ? `Import failed: ${error.message}`
          : "Import failed. Check the file format and try again."
      ]);
      setImportStatus("");
    });
    event.target.value = "";
  }

  async function removeBatch(batchId: string) {
    if (isArchived) return;

    const nextInputs = {
      ...methodologyInputs,
      halfHourlyImports: methodologyInputs.halfHourlyImports.filter(
        (row) => row.importBatchId !== batchId
      )
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Boundary meter upload batch removed locally.");
    setBatchToRemove("");
    setImportStatus("");
    setImportErrors([]);

    try {
      const cloudDeleted = await deleteBoundaryMeterBatchFromSupabase(batchId);
      setCloudStatus(cloudDeleted ? "Upload batch removed from cloud." : "Batch removed locally only.");
    } catch (error) {
      setCloudStatus(
        error instanceof Error
          ? `Batch removed locally. Cloud delete failed: ${error.message}`
          : "Batch removed locally. Cloud delete failed."
      );
    }
  }

  async function clearBoundaryMeterData() {
    if (isArchived) return;

    const nextInputs = {
      ...methodologyInputs,
      halfHourlyImports: []
    };

    setMethodologyInputs(nextInputs);
    save(nextInputs, "Boundary meter data cleared locally.");
    setConfirmClearAll(false);
    setBatchToRemove("");
    setImportStatus("");
    setImportErrors([]);

    try {
      const cloudCleared = await clearBoundaryMeterDataFromSupabase(projectId);
      setCloudStatus(cloudCleared ? "Boundary meter data cleared from cloud." : "Data cleared locally only.");
    } catch (error) {
      setCloudStatus(
        error instanceof Error
          ? `Data cleared locally. Cloud clear failed: ${error.message}`
          : "Data cleared locally. Cloud clear failed."
      );
    }
  }

  return (
    <section className="mt-8 rounded-md border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Boundary meter data</h2>
          <p className="mt-1 text-sm text-ink/70">Source: HH Import Data A12:BA1107.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            downloadTemplate().catch((error: unknown) => {
              setImportErrors([
                error instanceof Error
                  ? `Template download failed: ${error.message}`
                  : "Template download failed."
              ]);
            });
          }}
          className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
        >
          Download template
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-line bg-field p-4">
          <p className="text-xs font-semibold uppercase text-ink/50">Stored rows</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatNumber(methodologyInputs.halfHourlyImports.length)}
          </p>
        </div>
        <div className="rounded-md border border-line bg-field p-4">
          <p className="text-xs font-semibold uppercase text-ink/50">Latest upload</p>
          <p className="mt-2 text-sm font-medium">
            {latestUpload ? new Date(latestUpload.uploadedAt).toLocaleString("en-GB") : "No uploads"}
          </p>
        </div>
        <div className="rounded-md border border-line bg-field p-4">
          <p className="text-xs font-semibold uppercase text-ink/50">Latest file</p>
          <p className="mt-2 break-words text-sm font-medium">
            {latestUpload?.sourceFileName || "No file uploaded"}
          </p>
        </div>
      </div>

      <label className="mt-5 block rounded-md border border-dashed border-line bg-field p-5">
        <span className="text-sm font-semibold">Upload completed template</span>
        <input
          type="file"
          accept=".xlsx,.xls"
          disabled={isArchived}
          onChange={handleFileChange}
          className="mt-3 block w-full text-sm"
        />
      </label>

      <div className="mt-5 rounded-md border border-line bg-white p-4 text-sm text-ink/70">
        <p className="font-semibold text-ink">Required headers</p>
        <p className="mt-2 break-words">
          {boundaryMeterHeaders.join(", ")}
        </p>
      </div>

      <section className="mt-5 rounded-md border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Uploaded data summary</h3>
            <p className="mt-1 text-sm text-ink/70">
              Coverage, completeness and total half-hourly volume currently stored.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              boundaryMeterSummary.hasIssues
                ? "bg-red-50 text-red-700"
                : "bg-field text-semarts-dark"
            }`}
          >
            {boundaryMeterSummary.hasIssues ? "Needs review" : "Healthy"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <SummaryMetric
            label="Period covered"
            value={
              boundaryMeterSummary.firstDate
                ? `${boundaryMeterSummary.firstDate} to ${boundaryMeterSummary.lastDate}`
                : "No data"
            }
          />
          <SummaryMetric label="MPANs" value={formatNumber(boundaryMeterSummary.mpanCount)} />
          <SummaryMetric label="Rows" value={formatNumber(boundaryMeterSummary.rowCount)} />
          <SummaryMetric
            label="HH periods"
            value={`${formatNumber(boundaryMeterSummary.actualPeriodCount)} / ${formatNumber(
              boundaryMeterSummary.expectedPeriodCount
            )}`}
          />
          <SummaryMetric
            label="Total kWh from row totals"
            value={formatNumber(boundaryMeterSummary.totalFromRows)}
          />
          <SummaryMetric
            label="Total kWh from HH periods"
            value={formatNumber(boundaryMeterSummary.totalFromHalfHours)}
          />
          <SummaryMetric
            label="Total variance"
            value={formatNumber(boundaryMeterSummary.variance)}
          />
          <SummaryMetric
            label="Data issues"
            value={`${formatNumber(boundaryMeterSummary.invalidPeriodValues)} invalid periods, ${formatNumber(
              boundaryMeterSummary.duplicateKeys
            )} duplicate keys`}
          />
        </div>
      </section>

      {importStatus ? (
        <p className="mt-4 text-sm font-medium text-semarts-dark">{importStatus}</p>
      ) : null}
      {cloudStatus ? (
        <p className="mt-2 text-sm font-medium text-semarts-dark">{cloudStatus}</p>
      ) : null}
      {saveState ? <p className="mt-2 text-sm font-medium text-semarts-dark">{saveState}</p> : null}
      {importErrors.length > 0 ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Import needs review</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {importErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="mt-5 rounded-md border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Upload batches</h3>
            <p className="mt-1 text-sm text-ink/70">
              Remove a specific upload if a file was selected in error.
            </p>
          </div>
          {methodologyInputs.halfHourlyImports.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {confirmClearAll ? (
                <>
                  <button
                    type="button"
                    disabled={isArchived}
                    onClick={clearBoundaryMeterData}
                    className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
                  >
                    Confirm clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={isArchived}
                  onClick={() => setConfirmClearAll(true)}
                  className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-700"
                >
                  Clear all boundary data
                </button>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">File</th>
                <th className="px-4 py-3 font-semibold">Uploaded</th>
                <th className="px-4 py-3 font-semibold">Rows</th>
                <th className="px-4 py-3 font-semibold">MPANs</th>
                <th className="px-4 py-3 font-semibold">Period</th>
                <th className="px-4 py-3 font-semibold">HH kWh</th>
                <th className="px-4 py-3 font-semibold">Health</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {uploadBatches.map((batch) => (
                <tr key={batch.batchId} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{batch.fileName}</td>
                  <td className="px-4 py-3">
                    {batch.uploadedAt ? new Date(batch.uploadedAt).toLocaleString("en-GB") : ""}
                  </td>
                  <td className="px-4 py-3">{formatNumber(batch.rowCount)}</td>
                  <td className="px-4 py-3">{formatNumber(batch.mpanCount)}</td>
                  <td className="px-4 py-3">
                    {batch.firstDate ? `${batch.firstDate} to ${batch.lastDate}` : "No dates"}
                  </td>
                  <td className="px-4 py-3">{formatNumber(batch.totalFromHalfHours)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        batch.hasIssues ? "bg-red-50 text-red-700" : "bg-field text-semarts-dark"
                      }`}
                    >
                      {batch.hasIssues ? "Needs review" : "Healthy"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {batchToRemove === batch.batchId ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isArchived}
                          onClick={() => removeBatch(batch.batchId)}
                          className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setBatchToRemove("")}
                          className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isArchived}
                        onClick={() => setBatchToRemove(batch.batchId)}
                        className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:border-red-700"
                      >
                        Remove batch
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {uploadBatches.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={8} className="px-4 py-6 text-center text-ink/60">
                    No upload batches found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 rounded-md border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Import review</h3>
            <p className="mt-1 text-sm text-ink/70">
              First 250 rows currently stored for this project.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={showProblemRowsOnly}
              onChange={(event) => setShowProblemRowsOnly(event.target.checked)}
              className="h-4 w-4"
            />
            Show problem rows only
          </label>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="px-4 py-3 font-semibold">MPAN</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Total kWh</th>
                <th className="px-4 py-3 font-semibold">HH sum</th>
                <th className="px-4 py-3 font-semibold">Variance</th>
                <th className="px-4 py-3 font-semibold">Invalid periods</th>
                <th className="px-4 py-3 font-semibold">Source file</th>
                <th className="px-4 py-3 font-semibold">Uploaded</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {reviewRows.map(({ row, review }) => (
                <tr key={row.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{row.mpan}</td>
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">{formatNumber(row.totalKwh)}</td>
                  <td className="px-4 py-3">{formatNumber(review.periodSum)}</td>
                  <td className="px-4 py-3">{formatNumber(review.variance)}</td>
                  <td className="px-4 py-3">{formatNumber(review.invalidPeriods)}</td>
                  <td className="px-4 py-3">{row.sourceFileName}</td>
                  <td className="px-4 py-3">
                    {row.uploadedAt ? new Date(row.uploadedAt).toLocaleString("en-GB") : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        review.status === "Healthy"
                          ? "bg-field text-semarts-dark"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {review.status}
                    </span>
                  </td>
                </tr>
              ))}
              {reviewRows.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={9} className="px-4 py-6 text-center text-ink/60">
                    No boundary meter rows to review.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export function WorkbookCostInputsForm({
  projectId,
  section
}: WorkbookFormProps & { section?: CostInputSection }) {
  const { methodologyInputs, setMethodologyInputs, saveState, isArchived, save } =
    useWorkbookMethodology(projectId);
  const showAllSections = section === undefined;

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
      {showAllSections || section === "direct-non-employee" ? (
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
      ) : null}

      {showAllSections || section === "direct-employee" ? (
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
      ) : null}

      {showAllSections || section === "indirect-overheads" ? (
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
      ) : null}

      {showAllSections || section === "asset-data" ? (
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
      ) : null}

      {showAllSections || section === "supply" ? (
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
      ) : null}

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

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-field p-4">
      <p className="text-xs font-semibold uppercase text-ink/50">{label}</p>
      <p className="mt-2 break-words text-sm font-semibold">{value}</p>
    </div>
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
