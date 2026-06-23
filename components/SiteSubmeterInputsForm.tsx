"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { readSheet } from "read-excel-file/browser";
import writeXlsxFile from "write-excel-file/browser";
import type { SheetData } from "write-excel-file/browser";
import { isProjectArchived } from "@/lib/project-state";
import {
  getProjectMethodologyInputs,
  saveProjectMethodologyInputs
} from "@/lib/project-storage";
import {
  createSiteSubmeterRegisterTemplate,
  createSubmeterConsumptionTemplate,
  createTransmissionLossMultiplierTemplate
} from "@/lib/submeter-import-templates";
import type { WorkbookTemplate } from "@/lib/submeter-import-templates";
import {
  filterSiteSubmeters,
  filterSubmeterConsumption,
  filterTransmissionLossMultipliers,
  limitRows
} from "@/lib/site-submeter-table-view";
import {
  consumptionFormats,
  createSiteSubmeterRecord,
  createSubmeterConsumptionRecord,
  createSubmeterImportBatchId,
  getConsumptionTotalByMeter,
  parseSiteSubmeterRows,
  parseSubmeterConsumptionRows,
  siteSubmeterResponsibilities,
  submeterConsumptionHeaders,
  validateRequiredTransmissionLossMultipliers,
  validateSiteSubmeters,
  validateSubmeterConsumption
} from "@/lib/site-submeter-inputs";
import {
  createTransmissionLossMultiplierInput,
  createTransmissionLossMultiplierImportBatchId,
  parseTransmissionLossMultiplierRows,
  refreshTransmissionLossMultipliersFromJson,
  transmissionLossMultiplierHeaders,
  validateTransmissionLossMultipliers
} from "@/lib/transmission-loss-multipliers";
import type {
  ProjectMethodologyInputs,
  SiteSubmeterRecord,
  SubmeterConsumptionFormat,
  SubmeterConsumptionRecord,
  SubmeterConsumptionValidationStatus,
  TransmissionLossMultiplierInput
} from "@/types/project";

type SiteSubmeterInputsFormProps = {
  projectId: string;
};

function todayIsoDate() {
  return new Date().toISOString();
}

function formatSettlementPeriods(values: number[] | undefined) {
  return values?.join(", ") ?? "";
}

function parseSettlementPeriodText(value: string) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}

function inputClass() {
  return "w-full rounded-md border border-line px-2 py-1 text-sm";
}

function selectClass() {
  return "w-full rounded-md border border-line bg-white px-2 py-1 text-sm";
}

function compactInputClass() {
  return "rounded-md border border-line px-3 py-2 text-sm";
}

function isPresentText(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0;
}

function workbookRowsToSheetData(template: WorkbookTemplate): SheetData {
  return template.rows.map((row, rowIndex) =>
    row.map((value) => ({
      value,
      type: typeof value === "number" ? Number : String,
      fontWeight: rowIndex === 0 ? "bold" : undefined
    }))
  );
}

export function SiteSubmeterInputsForm({ projectId }: SiteSubmeterInputsFormProps) {
  const [inputs, setInputs] = useState<ProjectMethodologyInputs>(() =>
    getProjectMethodologyInputs(projectId)
  );
  const [saveState, setSaveState] = useState("");
  const [importMessages, setImportMessages] = useState<string[]>([]);
  const [tlmEndpointUrl, setTlmEndpointUrl] = useState("");
  const [submeterQuery, setSubmeterQuery] = useState("");
  const [showSubmeterIssuesOnly, setShowSubmeterIssuesOnly] = useState(false);
  const [consumptionMeterQuery, setConsumptionMeterQuery] = useState("");
  const [consumptionFormatFilter, setConsumptionFormatFilter] = useState<
    SubmeterConsumptionFormat | "All"
  >("All");
  const [showConsumptionIssuesOnly, setShowConsumptionIssuesOnly] = useState(false);
  const [tlmQuery, setTlmQuery] = useState("");
  const [tlmSettlementDateFilter, setTlmSettlementDateFilter] = useState("");
  const [showTlmIssuesOnly, setShowTlmIssuesOnly] = useState(false);
  const isArchived = isProjectArchived(projectId);

  useEffect(() => {
    setInputs(getProjectMethodologyInputs(projectId));
  }, [projectId]);

  const submeterIssues = useMemo(
    () => validateSiteSubmeters(inputs.siteSubmeters),
    [inputs.siteSubmeters]
  );
  const consumptionIssues = useMemo(
    () => validateSubmeterConsumption(inputs.submeterConsumption, inputs.siteSubmeters),
    [inputs.submeterConsumption, inputs.siteSubmeters]
  );
  const tlmIssues = useMemo(
    () =>
      [
        ...validateTransmissionLossMultipliers(inputs.transmissionLossMultipliers),
        ...validateRequiredTransmissionLossMultipliers(
          inputs.submeterConsumption,
          inputs.transmissionLossMultipliers
        )
      ],
    [inputs.submeterConsumption, inputs.transmissionLossMultipliers]
  );
  const consumptionTotals = useMemo(
    () => getConsumptionTotalByMeter(inputs.submeterConsumption),
    [inputs.submeterConsumption]
  );
  const submeterIssueRowIds = useMemo(
    () => new Set(submeterIssues.map((issue) => issue.rowId).filter(isPresentText)),
    [submeterIssues]
  );
  const consumptionIssueRowIds = useMemo(
    () => new Set(consumptionIssues.map((issue) => issue.rowId).filter(isPresentText)),
    [consumptionIssues]
  );
  const tlmIssueRowIds = useMemo(
    () =>
      new Set(
        tlmIssues
          .map((issue) => ("rowId" in issue ? issue.rowId : undefined))
          .filter(isPresentText)
      ),
    [tlmIssues]
  );
  const filteredSubmeters = useMemo(
    () =>
      filterSiteSubmeters({
        rows: inputs.siteSubmeters,
        query: submeterQuery,
        showIssuesOnly: showSubmeterIssuesOnly,
        issueRowIds: submeterIssueRowIds
      }),
    [inputs.siteSubmeters, showSubmeterIssuesOnly, submeterIssueRowIds, submeterQuery]
  );
  const visibleSubmeters = useMemo(() => limitRows(filteredSubmeters, 100), [filteredSubmeters]);
  const filteredConsumption = useMemo(
    () =>
      filterSubmeterConsumption(inputs.submeterConsumption, {
        meterQuery: consumptionMeterQuery,
        format: consumptionFormatFilter,
        showIssuesOnly: showConsumptionIssuesOnly,
        issueRowIds: consumptionIssueRowIds
      }),
    [
      consumptionFormatFilter,
      consumptionIssueRowIds,
      consumptionMeterQuery,
      inputs.submeterConsumption,
      showConsumptionIssuesOnly
    ]
  );
  const visibleConsumption = useMemo(
    () => limitRows(filteredConsumption, 150),
    [filteredConsumption]
  );
  const filteredTlms = useMemo(
    () =>
      filterTransmissionLossMultipliers(inputs.transmissionLossMultipliers, {
        query: tlmQuery,
        settlementDate: tlmSettlementDateFilter,
        showIssuesOnly: showTlmIssuesOnly,
        issueRowIds: tlmIssueRowIds
      }),
    [
      inputs.transmissionLossMultipliers,
      showTlmIssuesOnly,
      tlmIssueRowIds,
      tlmQuery,
      tlmSettlementDateFilter
    ]
  );
  const visibleTlms = useMemo(() => limitRows(filteredTlms, 250), [filteredTlms]);

  function save(nextInputs: ProjectMethodologyInputs, message: string) {
    setInputs(nextInputs);
    saveProjectMethodologyInputs(nextInputs);
    setSaveState(message);
  }

  function updateSubmeter(rowId: string, updates: Partial<SiteSubmeterRecord>) {
    if (isArchived) return;
    save(
      {
        ...inputs,
        siteSubmeters: inputs.siteSubmeters.map((row) =>
          row.id === rowId ? { ...row, ...updates } : row
        )
      },
      "Submeter register saved locally."
    );
  }

  function updateConsumption(rowId: string, updates: Partial<SubmeterConsumptionRecord>) {
    if (isArchived) return;
    save(
      {
        ...inputs,
        submeterConsumption: inputs.submeterConsumption.map((row) =>
          row.id === rowId ? { ...row, ...updates } : row
        )
      },
      "Consumption records saved locally."
    );
  }

  function updateTlm(rowId: string, updates: Partial<TransmissionLossMultiplierInput>) {
    if (isArchived) return;
    save(
      {
        ...inputs,
        transmissionLossMultipliers: inputs.transmissionLossMultipliers.map((row) =>
          row.id === rowId ? { ...row, ...updates } : row
        )
      },
      "Transmission Loss Multipliers saved locally."
    );
  }

  async function importSubmeters(file: File) {
    const result = parseSiteSubmeterRows(
      await readSheet(file),
      file.name,
      todayIsoDate(),
      createSubmeterImportBatchId("site-submeter")
    );

    if (result.errors.length > 0) {
      setImportMessages(result.errors.slice(0, 10));
      return;
    }

    save(
      {
        ...inputs,
        siteSubmeters: [
          ...inputs.siteSubmeters.filter(
            (existing) => !result.parsedRows.some((row) => row.meter === existing.meter)
          ),
          ...result.parsedRows
        ]
      },
      `Imported ${result.parsedRows.length} submeter rows.`
    );
    setImportMessages([]);
  }

  async function importConsumption(file: File) {
    const result = parseSubmeterConsumptionRows(
      await readSheet(file),
      file.name,
      todayIsoDate(),
      createSubmeterImportBatchId("submeter-consumption")
    );

    if (result.errors.length > 0) {
      setImportMessages(result.errors.slice(0, 10));
      return;
    }

    save(
      {
        ...inputs,
        submeterConsumption: [
          ...inputs.submeterConsumption.filter(
            (existing) =>
              !result.parsedRows.some(
                (row) =>
                  row.meter === existing.meter &&
                  row.format === existing.format &&
                  row.periodStart === existing.periodStart &&
                  row.periodEnd === existing.periodEnd
              )
          ),
          ...result.parsedRows
        ]
      },
      `Imported ${result.parsedRows.length} consumption rows.`
    );
    setImportMessages([]);
  }

  async function importTlm(file: File) {
    const result = parseTransmissionLossMultiplierRows(
      await readSheet(file),
      createTransmissionLossMultiplierImportBatchId()
    );

    if (result.errors.length > 0) {
      setImportMessages(result.errors.slice(0, 10));
      return;
    }

    save(
      {
        ...inputs,
        transmissionLossMultipliers: [
          ...inputs.transmissionLossMultipliers.filter(
            (existing) =>
              !result.parsedRows.some(
                (row) =>
                  row.settlementDate === existing.settlementDate &&
                  row.settlementPeriod === existing.settlementPeriod &&
                  row.gspGroup === existing.gspGroup
              )
          ),
          ...result.parsedRows
        ]
      },
      `Imported ${result.parsedRows.length} Transmission Loss Multiplier rows.`
    );
    setImportMessages([]);
  }

  async function refreshTlmEndpoint() {
    if (!tlmEndpointUrl.trim() || isArchived) return;
    const result = await refreshTransmissionLossMultipliersFromJson(tlmEndpointUrl.trim());

    if (result.errors.length > 0) {
      setImportMessages(result.errors.slice(0, 10));
      return;
    }

    save(
      {
        ...inputs,
        transmissionLossMultipliers: result.parsedRows
      },
      `Refreshed ${result.parsedRows.length} Transmission Loss Multiplier rows.`
    );
    setImportMessages([]);
  }

  function handleFile(
    event: ChangeEvent<HTMLInputElement>,
    importer: (file: File) => Promise<void>
  ) {
    const file = event.target.files?.[0];
    if (file) {
      importer(file).catch((error: unknown) => {
        setImportMessages([
          error instanceof Error ? `Import failed: ${error.message}` : "Import failed."
        ]);
      });
    }
    event.target.value = "";
  }

  async function downloadTemplate(template: WorkbookTemplate) {
    const file = await writeXlsxFile(workbookRowsToSheetData(template), {
      sheet: template.sheetName
    });
    await file.toFile(template.fileName);
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-md border border-line bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Site submeter register</h2>
            <p className="mt-1 text-sm text-ink/70">
              Meters can be tenant, network operator, landlord, shared asset or internal site use
              records.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isArchived}
              onClick={() =>
                save(
                  { ...inputs, siteSubmeters: [...inputs.siteSubmeters, createSiteSubmeterRecord()] },
                  "Submeter row added."
                )
              }
              className="rounded-md bg-semarts px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Add meter
            </button>
            <button
              type="button"
              onClick={() => {
                downloadTemplate(createSiteSubmeterRegisterTemplate()).catch((error: unknown) => {
                  setImportMessages([
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
            <label className="rounded-md border border-line px-3 py-2 text-sm font-semibold">
              Import Excel
              <input
                type="file"
                accept=".xlsx"
                disabled={isArchived}
                className="hidden"
                onChange={(event) => handleFile(event, importSubmeters)}
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-line bg-field p-3">
          <input
            value={submeterQuery}
            placeholder="Filter meters, locations or responsibility"
            className={`${compactInputClass()} min-w-[260px] flex-1`}
            onChange={(event) => setSubmeterQuery(event.target.value)}
          />
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={showSubmeterIssuesOnly}
              onChange={(event) => setShowSubmeterIssuesOnly(event.target.checked)}
            />
            Issues only
          </label>
          <span className="text-sm text-ink/70">
            Showing {visibleSubmeters.length} of {filteredSubmeters.length} filtered rows
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="border border-line px-3 py-2">Meter</th>
                <th className="border border-line px-3 py-2">Location</th>
                <th className="border border-line px-3 py-2">Responsibility</th>
                <th className="border border-line px-3 py-2">Tenant name</th>
                <th className="border border-line px-3 py-2">Notes</th>
                <th className="border border-line px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleSubmeters.map((row) => (
                <tr key={row.id}>
                  <td className="border border-line px-3 py-2">
                    <input
                      value={row.meter}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) => updateSubmeter(row.id, { meter: event.target.value })}
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      value={row.location}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) =>
                        updateSubmeter(row.id, { location: event.target.value })
                      }
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <select
                      value={row.responsibility}
                      disabled={isArchived}
                      className={selectClass()}
                      onChange={(event) =>
                        updateSubmeter(row.id, {
                          responsibility: event.target.value as SiteSubmeterRecord["responsibility"]
                        })
                      }
                    >
                      {siteSubmeterResponsibilities.map((responsibility) => (
                        <option key={responsibility}>{responsibility}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      value={row.tenantName}
                      disabled={isArchived || row.responsibility !== "Tenant"}
                      className={inputClass()}
                      onChange={(event) =>
                        updateSubmeter(row.id, { tenantName: event.target.value })
                      }
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      value={row.notes}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) => updateSubmeter(row.id, { notes: event.target.value })}
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <button
                      type="button"
                      disabled={isArchived}
                      onClick={() =>
                        save(
                          {
                            ...inputs,
                            siteSubmeters: inputs.siteSubmeters.filter(
                              (submeter) => submeter.id !== row.id
                            )
                          },
                          "Submeter row removed."
                        )
                      }
                      className="rounded-md border border-line px-3 py-1 font-semibold disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {visibleSubmeters.length === 0 ? (
                <tr>
                  <td className="border border-line px-3 py-4 text-center text-ink/60" colSpan={6}>
                    No submeter rows match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-md border border-line bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">Consumption by meter</h2>
            <p className="mt-1 text-sm text-ink/70">
              Store half-hourly, monthly, quarterly and annual records without forcing profiling.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isArchived}
              onClick={() =>
                save(
                  {
                    ...inputs,
                    submeterConsumption: [
                      ...inputs.submeterConsumption,
                      createSubmeterConsumptionRecord()
                    ]
                  },
                  "Consumption row added."
                )
              }
              className="rounded-md bg-semarts px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Add consumption
            </button>
            <button
              type="button"
              onClick={() => {
                downloadTemplate(createSubmeterConsumptionTemplate()).catch((error: unknown) => {
                  setImportMessages([
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
            <label className="rounded-md border border-line px-3 py-2 text-sm font-semibold">
              Import Excel
              <input
                type="file"
                accept=".xlsx"
                disabled={isArchived}
                className="hidden"
                onChange={(event) => handleFile(event, importConsumption)}
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-line bg-field p-3">
          <input
            value={consumptionMeterQuery}
            placeholder="Filter by meter"
            className={`${compactInputClass()} min-w-[220px]`}
            onChange={(event) => setConsumptionMeterQuery(event.target.value)}
          />
          <select
            value={consumptionFormatFilter}
            className={compactInputClass()}
            onChange={(event) =>
              setConsumptionFormatFilter(event.target.value as SubmeterConsumptionFormat | "All")
            }
          >
            <option>All</option>
            {consumptionFormats.map((format) => (
              <option key={format}>{format}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={showConsumptionIssuesOnly}
              onChange={(event) => setShowConsumptionIssuesOnly(event.target.checked)}
            />
            Issues only
          </label>
          <span className="text-sm text-ink/70">
            Showing {visibleConsumption.length} of {filteredConsumption.length} filtered rows
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1280px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="border border-line px-3 py-2">Meter</th>
                <th className="border border-line px-3 py-2">Format</th>
                <th className="border border-line px-3 py-2">Start</th>
                <th className="border border-line px-3 py-2">End</th>
                <th className="border border-line px-3 py-2">kWh</th>
                <th className="border border-line px-3 py-2">Source</th>
                <th className="border border-line px-3 py-2">Validation</th>
                <th className="border border-line px-3 py-2">HH periods</th>
                <th className="border border-line px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleConsumption.map((row) => (
                <tr key={row.id}>
                  <td className="border border-line px-3 py-2">
                    <input
                      list="site-submeter-list"
                      value={row.meter}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) => updateConsumption(row.id, { meter: event.target.value })}
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <select
                      value={row.format}
                      disabled={isArchived}
                      className={selectClass()}
                      onChange={(event) =>
                        updateConsumption(row.id, {
                          format: event.target.value as SubmeterConsumptionFormat,
                          settlementPeriodKwh:
                            event.target.value === "Half-hourly"
                              ? row.settlementPeriodKwh ?? Array.from({ length: 48 }, () => 0)
                              : undefined
                        })
                      }
                    >
                      {consumptionFormats.map((format) => (
                        <option key={format}>{format}</option>
                      ))}
                    </select>
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      type="date"
                      value={row.periodStart}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) =>
                        updateConsumption(row.id, { periodStart: event.target.value })
                      }
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      type="date"
                      value={row.periodEnd}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) =>
                        updateConsumption(row.id, { periodEnd: event.target.value })
                      }
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      type="number"
                      value={row.consumptionValue}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) =>
                        updateConsumption(row.id, {
                          consumptionValue: Number(event.target.value)
                        })
                      }
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      value={row.sourceType}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) =>
                        updateConsumption(row.id, { sourceType: event.target.value })
                      }
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <select
                      value={row.validationStatus}
                      disabled={isArchived}
                      className={selectClass()}
                      onChange={(event) =>
                        updateConsumption(row.id, {
                          validationStatus:
                            event.target.value as SubmeterConsumptionValidationStatus
                        })
                      }
                    >
                      <option>Pending review</option>
                      <option>Validated</option>
                      <option>Needs correction</option>
                    </select>
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      value={formatSettlementPeriods(row.settlementPeriodKwh)}
                      disabled={isArchived || row.format !== "Half-hourly"}
                      className={inputClass()}
                      onChange={(event) =>
                        updateConsumption(row.id, {
                          settlementPeriodKwh: parseSettlementPeriodText(event.target.value)
                        })
                      }
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <button
                      type="button"
                      disabled={isArchived}
                      onClick={() =>
                        save(
                          {
                            ...inputs,
                            submeterConsumption: inputs.submeterConsumption.filter(
                              (consumption) => consumption.id !== row.id
                            )
                          },
                          "Consumption row removed."
                        )
                      }
                      className="rounded-md border border-line px-3 py-1 font-semibold disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {visibleConsumption.length === 0 ? (
                <tr>
                  <td className="border border-line px-3 py-4 text-center text-ink/60" colSpan={9}>
                    No consumption rows match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <datalist id="site-submeter-list">
            {inputs.siteSubmeters.map((row) => (
              <option key={row.id} value={row.meter} />
            ))}
          </datalist>
        </div>
      </section>

      <section className="rounded-md border border-line bg-white p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="font-semibold">Transmission Loss Multipliers</h2>
            <p className="mt-1 text-sm text-ink/70">
              Store settlement-period TLM data for future loss-adjusted consumption checks.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isArchived}
              onClick={() =>
                save(
                  {
                    ...inputs,
                    transmissionLossMultipliers: [
                      ...inputs.transmissionLossMultipliers,
                      createTransmissionLossMultiplierInput()
                    ]
                  },
                  "Transmission Loss Multiplier row added."
                )
              }
              className="rounded-md bg-semarts px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Add TLM
            </button>
            <button
              type="button"
              onClick={() => {
                downloadTemplate(createTransmissionLossMultiplierTemplate()).catch(
                  (error: unknown) => {
                    setImportMessages([
                      error instanceof Error
                        ? `Template download failed: ${error.message}`
                        : "Template download failed."
                    ]);
                  }
                );
              }}
              className="rounded-md border border-line px-3 py-2 text-sm font-semibold hover:border-semarts"
            >
              Download template
            </button>
            <label className="rounded-md border border-line px-3 py-2 text-sm font-semibold">
              Import Excel
              <input
                type="file"
                accept=".xlsx"
                disabled={isArchived}
                className="hidden"
                onChange={(event) => handleFile(event, importTlm)}
              />
            </label>
            <input
              value={tlmEndpointUrl}
              disabled={isArchived}
              placeholder="Structured JSON endpoint"
              className="min-w-[260px] rounded-md border border-line px-3 py-2 text-sm"
              onChange={(event) => setTlmEndpointUrl(event.target.value)}
            />
            <button
              type="button"
              disabled={isArchived || !tlmEndpointUrl.trim()}
              onClick={() => {
                refreshTlmEndpoint().catch((error: unknown) => {
                  setImportMessages([
                    error instanceof Error ? error.message : "TLM refresh failed."
                  ]);
                });
              }}
              className="rounded-md bg-semarts px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-line bg-field p-3">
          <input
            value={tlmQuery}
            placeholder="Filter TLM source, GSP or version"
            className={`${compactInputClass()} min-w-[240px] flex-1`}
            onChange={(event) => setTlmQuery(event.target.value)}
          />
          <input
            type="date"
            value={tlmSettlementDateFilter}
            className={compactInputClass()}
            onChange={(event) => setTlmSettlementDateFilter(event.target.value)}
          />
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={showTlmIssuesOnly}
              onChange={(event) => setShowTlmIssuesOnly(event.target.checked)}
            />
            Issues only
          </label>
          <span className="text-sm text-ink/70">
            Showing {visibleTlms.length} of {filteredTlms.length} filtered rows
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-sm">
            <thead className="bg-field text-left text-xs uppercase text-ink/60">
              <tr>
                <th className="border border-line px-3 py-2">Settlement date</th>
                <th className="border border-line px-3 py-2">SP</th>
                <th className="border border-line px-3 py-2">TLM</th>
                <th className="border border-line px-3 py-2">GSP group</th>
                <th className="border border-line px-3 py-2">Effective from</th>
                <th className="border border-line px-3 py-2">Source</th>
                <th className="border border-line px-3 py-2">Version</th>
                <th className="border border-line px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleTlms.map((row) => (
                <tr key={row.id}>
                  <td className="border border-line px-3 py-2">
                    <input
                      type="date"
                      value={row.settlementDate}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) => updateTlm(row.id, { settlementDate: event.target.value })}
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      type="number"
                      value={row.settlementPeriod}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) =>
                        updateTlm(row.id, { settlementPeriod: Number(event.target.value) })
                      }
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      type="number"
                      value={row.transmissionLossMultiplier}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) =>
                        updateTlm(row.id, {
                          transmissionLossMultiplier: Number(event.target.value)
                        })
                      }
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      value={row.gspGroup}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) => updateTlm(row.id, { gspGroup: event.target.value })}
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      type="date"
                      value={row.effectiveFromDate}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) =>
                        updateTlm(row.id, { effectiveFromDate: event.target.value })
                      }
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      value={row.source}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) => updateTlm(row.id, { source: event.target.value })}
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <input
                      value={row.version}
                      disabled={isArchived}
                      className={inputClass()}
                      onChange={(event) => updateTlm(row.id, { version: event.target.value })}
                    />
                  </td>
                  <td className="border border-line px-3 py-2">
                    <button
                      type="button"
                      disabled={isArchived}
                      onClick={() =>
                        save(
                          {
                            ...inputs,
                            transmissionLossMultipliers: inputs.transmissionLossMultipliers.filter(
                              (tlm) => tlm.id !== row.id
                            )
                          },
                          "Transmission Loss Multiplier row removed."
                        )
                      }
                      className="rounded-md border border-line px-3 py-1 font-semibold disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {visibleTlms.length === 0 ? (
                <tr>
                  <td className="border border-line px-3 py-4 text-center text-ink/60" colSpan={8}>
                    No Transmission Loss Multiplier rows match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-md border border-line bg-white p-5">
        <h2 className="font-semibold">Validation and calculation readiness</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <ValidationPanel title="Submeter register" issues={submeterIssues.map((issue) => issue.message)} />
          <ValidationPanel title="Consumption records" issues={consumptionIssues.map((issue) => issue.message)} />
          <ValidationPanel title="TLM coverage" issues={tlmIssues.slice(0, 12).map((issue) => issue.message)} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <SummaryPanel
            title="Consumption totals by meter"
            rows={consumptionTotals.map((row) => `${row.meter || "Missing meter"}: ${row.totalKwh.toLocaleString()} kWh`)}
          />
          <SummaryPanel
            title="Import template headers"
            rows={[
              `Submeter register: Meter, Location, Responsibility, Tenant Name, Notes`,
              `Consumption: ${submeterConsumptionHeaders.slice(0, 7).join(", ")}, SP1 to SP48`,
              `TLM: ${transmissionLossMultiplierHeaders.join(", ")}`
            ]}
          />
        </div>
        {saveState ? <p className="mt-4 text-sm font-medium text-semarts-dark">{saveState}</p> : null}
        {importMessages.length > 0 ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Import needs review</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {importMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ValidationPanel({ title, issues }: { title: string; issues: string[] }) {
  return (
    <div className="rounded-md border border-line bg-field p-4">
      <p className="font-semibold">{title}</p>
      {issues.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
          {issues.map((issue, index) => (
            <li key={`${issue}-${index}`}>{issue}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink/70">No current validation issues.</p>
      )}
    </div>
  );
}

function SummaryPanel({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="rounded-md border border-line bg-field p-4">
      <p className="font-semibold">{title}</p>
      {rows.length > 0 ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/70">
          {rows.map((row) => (
            <li key={row}>{row}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-ink/70">No records yet.</p>
      )}
    </div>
  );
}
