"use client";

import type {
  TariffCalculationTraceEntry,
  TariffCalculationTraceStage,
  TariffCalculationTraceValue
} from "@/types/project";

type TariffAuditTracePanelProps = {
  entries?: TariffCalculationTraceEntry[];
};

const traceStageOrder: TariffCalculationTraceStage[] = [
  "Revenue requirement",
  "Cost allocation",
  "Class total",
  "Rate derivation",
  "Revenue recovery"
];

function formatTraceValue(traceValue: TariffCalculationTraceValue) {
  const formattedValue =
    traceValue.unit === "GBP"
      ? new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "GBP",
          maximumFractionDigits: 10
        }).format(traceValue.value)
      : new Intl.NumberFormat("en-GB", {
          maximumFractionDigits: 10
        }).format(traceValue.value);

  return traceValue.unit === "GBP" ? formattedValue : `${formattedValue} ${traceValue.unit}`;
}

function getSourceReferences(entry: TariffCalculationTraceEntry) {
  return [
    ...entry.sourceRowIds.map((sourceRowId) => `Source row: ${sourceRowId}`),
    entry.costPoolId ? `Cost pool: ${entry.costPoolId}` : "",
    entry.allocationMethodId ? `Allocation method: ${entry.allocationMethodId}` : "",
    entry.dataInputRowId ? `Data input row: ${entry.dataInputRowId}` : "",
    entry.customerClass ? `Customer class: ${entry.customerClass}` : "",
    entry.tariffComponent ? `Tariff component: ${entry.tariffComponent}` : ""
  ].filter(Boolean);
}

export function TariffAuditTracePanel({ entries = [] }: TariffAuditTracePanelProps) {
  if (entries.length === 0) {
    return null;
  }

  const groupedEntries = traceStageOrder
    .map((stage) => ({
      stage,
      entries: entries.filter((entry) => entry.stage === stage)
    }))
    .filter((group) => group.entries.length > 0);

  return (
    <section className="rounded-md border border-line bg-white shadow-sm">
      <div className="border-b border-line p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Calculation audit trace</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/70">
              Trace values use calculation precision from the tariff engine. Report totals may be
              rounded for presentation.
            </p>
          </div>
          <p className="rounded-md border border-line bg-field px-3 py-1 text-sm font-semibold text-ink/70">
            {entries.length} trace entries
          </p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {groupedEntries.map((group) => (
            <div key={group.stage} className="rounded-md border border-line bg-field p-3">
              <p className="text-xs font-semibold uppercase text-ink/50">{group.stage}</p>
              <p className="mt-1 text-lg font-semibold">{group.entries.length}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="divide-y divide-line">
        {groupedEntries.map((group, groupIndex) => (
          <details key={group.stage} className="group" open={groupIndex === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 hover:bg-field">
              <span>
                <span className="font-semibold">{group.stage}</span>
                <span className="ml-2 text-sm text-ink/60">
                  {group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}
                </span>
              </span>
              <span className="text-sm font-semibold text-semarts-dark group-open:hidden">
                Expand
              </span>
              <span className="hidden text-sm font-semibold text-semarts-dark group-open:inline">
                Collapse
              </span>
            </summary>

            <div className="space-y-4 px-5 pb-5">
              {group.entries.map((entry) => {
                const sourceReferences = getSourceReferences(entry);

                return (
                  <article key={entry.id} className="rounded-md border border-line p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{entry.label}</h3>
                        <p className="mt-2 break-words rounded-md bg-field px-3 py-2 font-mono text-xs text-ink/80">
                          {entry.formula}
                        </p>
                      </div>
                      <div className="rounded-md border border-line px-3 py-2 text-sm">
                        <p className="text-xs font-semibold uppercase text-ink/50">Result</p>
                        <p className="mt-1 font-semibold">{formatTraceValue(entry.result)}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-ink/50">Inputs</h4>
                        <dl className="mt-2 grid gap-2 text-sm">
                          {entry.inputs.map((input) => (
                            <div
                              key={`${entry.id}-${input.label}-${input.unit}`}
                              className="flex flex-wrap justify-between gap-2 rounded-md bg-field px-3 py-2"
                            >
                              <dt className="text-ink/70">{input.label}</dt>
                              <dd className="font-medium">{formatTraceValue(input)}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold uppercase text-ink/50">
                          Source references
                        </h4>
                        {sourceReferences.length > 0 ? (
                          <ul className="mt-2 space-y-2 text-sm text-ink/70">
                            {sourceReferences.map((reference) => (
                              <li key={`${entry.id}-${reference}`} className="break-words">
                                {reference}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-ink/60">No source references provided.</p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
