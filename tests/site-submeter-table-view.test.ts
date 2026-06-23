import { describe, expect, it } from "vitest";
import {
  filterSiteSubmeters,
  filterSubmeterConsumption,
  filterTransmissionLossMultipliers,
  limitRows
} from "@/lib/site-submeter-table-view";
import type {
  SiteSubmeterRecord,
  SubmeterConsumptionRecord,
  TransmissionLossMultiplierInput
} from "@/types/project";

function submeter(overrides: Partial<SiteSubmeterRecord> = {}): SiteSubmeterRecord {
  return {
    id: overrides.id ?? "submeter-1",
    meter: overrides.meter ?? "MTR-001",
    location: overrides.location ?? "Terminal",
    responsibility: overrides.responsibility ?? "Tenant",
    tenantName: overrides.tenantName ?? "Tenant A",
    notes: overrides.notes ?? "",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: "",
    ...overrides
  };
}

function consumption(
  overrides: Partial<SubmeterConsumptionRecord> = {}
): SubmeterConsumptionRecord {
  return {
    id: overrides.id ?? "consumption-1",
    meter: overrides.meter ?? "MTR-001",
    format: overrides.format ?? "Monthly",
    periodStart: "2026-04-01",
    periodEnd: "2026-04-30",
    consumptionValue: 100,
    unit: "kWh",
    sourceType: "Manual",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: "",
    validationStatus: "Pending review",
    ...overrides
  };
}

function tlm(overrides: Partial<TransmissionLossMultiplierInput> = {}): TransmissionLossMultiplierInput {
  return {
    id: overrides.id ?? "tlm-1",
    settlementDate: overrides.settlementDate ?? "2026-04-01",
    settlementPeriod: overrides.settlementPeriod ?? 1,
    transmissionLossMultiplier: 1.02,
    gspGroup: overrides.gspGroup ?? "_A",
    effectiveFromDate: "2026-04-01",
    source: overrides.source ?? "Manual",
    retrievedAt: "2026-06-23T08:00:00.000Z",
    version: overrides.version ?? "v1",
    importBatchId: "",
    rowFingerprint: "",
    ...overrides
  };
}

describe("site submeter table view helpers", () => {
  it("filters submeters by searchable text and issues-only state", () => {
    const rows = [
      submeter({ id: "tenant", meter: "MTR-TENANT", tenantName: "Retail Tenant" }),
      submeter({ id: "plant", meter: "MTR-PLANT", responsibility: "Plant Room" })
    ];

    expect(
      filterSiteSubmeters({
        rows,
        query: "plant",
        showIssuesOnly: false,
        issueRowIds: new Set()
      }).map((row) => row.id)
    ).toEqual(["plant"]);
    expect(
      filterSiteSubmeters({
        rows,
        query: "",
        showIssuesOnly: true,
        issueRowIds: new Set(["tenant"])
      }).map((row) => row.id)
    ).toEqual(["tenant"]);
  });

  it("filters consumption by meter, format and issues-only state", () => {
    const rows = [
      consumption({ id: "monthly", meter: "MTR-001", format: "Monthly" }),
      consumption({ id: "hh", meter: "MTR-002", format: "Half-hourly" })
    ];

    expect(
      filterSubmeterConsumption(rows, {
        meterQuery: "002",
        format: "All",
        showIssuesOnly: false,
        issueRowIds: new Set()
      }).map((row) => row.id)
    ).toEqual(["hh"]);
    expect(
      filterSubmeterConsumption(rows, {
        meterQuery: "",
        format: "Monthly",
        showIssuesOnly: true,
        issueRowIds: new Set(["monthly"])
      }).map((row) => row.id)
    ).toEqual(["monthly"]);
  });

  it("filters TLM rows by query, settlement date and issues-only state", () => {
    const rows = [
      tlm({ id: "manual", source: "Manual", settlementDate: "2026-04-01" }),
      tlm({ id: "elexon", source: "Elexon import", settlementDate: "2026-04-02" })
    ];

    expect(
      filterTransmissionLossMultipliers(rows, {
        query: "elexon",
        settlementDate: "",
        showIssuesOnly: false,
        issueRowIds: new Set()
      }).map((row) => row.id)
    ).toEqual(["elexon"]);
    expect(
      filterTransmissionLossMultipliers(rows, {
        query: "",
        settlementDate: "2026-04-01",
        showIssuesOnly: true,
        issueRowIds: new Set(["manual"])
      }).map((row) => row.id)
    ).toEqual(["manual"]);
  });

  it("limits displayed rows without mutating source rows", () => {
    const rows = [1, 2, 3, 4];

    expect(limitRows(rows, 2)).toEqual([1, 2]);
    expect(rows).toEqual([1, 2, 3, 4]);
  });
});
