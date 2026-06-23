import type {
  SiteSubmeterRecord,
  SubmeterConsumptionFormat,
  SubmeterConsumptionRecord,
  TransmissionLossMultiplierInput
} from "@/types/project";

export type ConsumptionTableFilters = {
  meterQuery: string;
  format: SubmeterConsumptionFormat | "All";
  showIssuesOnly: boolean;
  issueRowIds: Set<string>;
};

export type TlmTableFilters = {
  query: string;
  settlementDate: string;
  showIssuesOnly: boolean;
  issueRowIds: Set<string>;
};

function normaliseQuery(value: string) {
  return value.trim().toLowerCase();
}

export function limitRows<T>(rows: T[], limit: number) {
  return rows.slice(0, Math.max(0, limit));
}

export function filterSiteSubmeters({
  rows,
  query,
  showIssuesOnly,
  issueRowIds
}: {
  rows: SiteSubmeterRecord[];
  query: string;
  showIssuesOnly: boolean;
  issueRowIds: Set<string>;
}) {
  const needle = normaliseQuery(query);

  return rows.filter((row) => {
    const matchesQuery =
      !needle ||
      [row.meter, row.location, row.responsibility, row.tenantName, row.notes]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    const matchesIssueFilter = !showIssuesOnly || issueRowIds.has(row.id);

    return matchesQuery && matchesIssueFilter;
  });
}

export function filterSubmeterConsumption(
  rows: SubmeterConsumptionRecord[],
  filters: ConsumptionTableFilters
) {
  const needle = normaliseQuery(filters.meterQuery);

  return rows.filter((row) => {
    const matchesMeter = !needle || row.meter.toLowerCase().includes(needle);
    const matchesFormat = filters.format === "All" || row.format === filters.format;
    const matchesIssueFilter = !filters.showIssuesOnly || filters.issueRowIds.has(row.id);

    return matchesMeter && matchesFormat && matchesIssueFilter;
  });
}

export function filterTransmissionLossMultipliers(
  rows: TransmissionLossMultiplierInput[],
  filters: TlmTableFilters
) {
  const needle = normaliseQuery(filters.query);

  return rows.filter((row) => {
    const matchesQuery =
      !needle ||
      [row.settlementDate, row.settlementPeriod, row.gspGroup, row.source, row.version]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    const matchesDate =
      !filters.settlementDate || row.settlementDate === filters.settlementDate;
    const matchesIssueFilter = !filters.showIssuesOnly || filters.issueRowIds.has(row.id);

    return matchesQuery && matchesDate && matchesIssueFilter;
  });
}
