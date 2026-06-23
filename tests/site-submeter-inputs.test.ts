import { describe, expect, it } from "vitest";
import {
  createSiteSubmeterRecord,
  createSubmeterConsumptionRecord,
  parseSiteSubmeterRows,
  parseSubmeterConsumptionRows,
  siteSubmeterHeaders,
  submeterConsumptionHeaders,
  validateRequiredTransmissionLossMultipliers,
  validateSiteSubmeters,
  validateSubmeterConsumption
} from "@/lib/site-submeter-inputs";
import type {
  SiteSubmeterRecord,
  SubmeterConsumptionRecord,
  TransmissionLossMultiplierInput
} from "@/types/project";

function submeter(overrides: Partial<SiteSubmeterRecord> = {}): SiteSubmeterRecord {
  return {
    ...createSiteSubmeterRecord(),
    id: overrides.id ?? "meter-row-1",
    meter: overrides.meter ?? "MTR-001",
    location: overrides.location ?? "Terminal 1",
    responsibility: overrides.responsibility ?? "Tenant",
    tenantName: overrides.tenantName ?? "Tenant A",
    ...overrides
  };
}

function consumption(
  overrides: Partial<SubmeterConsumptionRecord> = {}
): SubmeterConsumptionRecord {
  return {
    ...createSubmeterConsumptionRecord(),
    id: overrides.id ?? "consumption-row-1",
    meter: overrides.meter ?? "MTR-001",
    format: overrides.format ?? "Monthly",
    periodStart: overrides.periodStart ?? "2026-04-01",
    periodEnd: overrides.periodEnd ?? "2026-04-30",
    consumptionValue: overrides.consumptionValue ?? 1000,
    ...overrides
  };
}

function tlm(overrides: Partial<TransmissionLossMultiplierInput> = {}): TransmissionLossMultiplierInput {
  return {
    id: overrides.id ?? "tlm-1",
    settlementDate: overrides.settlementDate ?? "2026-04-01",
    settlementPeriod: overrides.settlementPeriod ?? 1,
    transmissionLossMultiplier: overrides.transmissionLossMultiplier ?? 1.02,
    gspGroup: overrides.gspGroup ?? "",
    effectiveFromDate: overrides.effectiveFromDate ?? "2026-04-01",
    source: overrides.source ?? "test",
    retrievedAt: overrides.retrievedAt ?? "2026-06-23T08:00:00.000Z",
    version: overrides.version ?? "v1",
    importBatchId: overrides.importBatchId ?? "batch-1",
    rowFingerprint: overrides.rowFingerprint ?? "fingerprint",
    ...overrides
  };
}

describe("site submeter inputs", () => {
  it("validates submeter register required fields and tenant responsibility", () => {
    const issues = validateSiteSubmeters([
      submeter({ meter: "", location: "", responsibility: "Tenant", tenantName: "" }),
      submeter({ id: "meter-row-2", meter: "MTR-002", responsibility: "Network Operator", tenantName: "" }),
      submeter({ id: "meter-row-3", meter: "MTR-002" })
    ]);

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "Missing meter",
        "Missing location",
        "Missing tenant name",
        "Duplicate meter"
      ])
    );
  });

  it("parses submeter register imports and rejects invalid responsibility labels", () => {
    const result = parseSiteSubmeterRows(
      [
        siteSubmeterHeaders,
        ["MTR-001", "Terminal 1", "Tenant", "Tenant A", "Retail meter"],
        ["MTR-002", "Plant room", "Unsupported", "", ""]
      ],
      "submeters.xlsx",
      "2026-06-23T08:00:00.000Z",
      "batch-1"
    );

    expect(result.parsedRows).toHaveLength(2);
    expect(result.errors).toContain("Row 3: Responsibility is invalid.");
  });

  it("validates supported consumption formats without forcing conversion", () => {
    const rows = [
      consumption({ id: "monthly", format: "Monthly" }),
      consumption({
        id: "quarterly",
        format: "Quarterly",
        periodStart: "2026-07-01",
        periodEnd: "2026-09-30"
      }),
      consumption({
        id: "annual",
        format: "Annual",
        periodStart: "2027-04-01",
        periodEnd: "2028-03-31"
      }),
      consumption({
        id: "hh",
        format: "Half-hourly",
        periodStart: "2026-05-01",
        periodEnd: "2026-05-01",
        settlementPeriodKwh: Array.from({ length: 48 }, () => 1),
        consumptionValue: 48
      })
    ];

    expect(validateSubmeterConsumption(rows, [submeter()])).toEqual([]);
  });

  it("detects missing, negative, duplicate, overlapping and unknown consumption records", () => {
    const issues = validateSubmeterConsumption(
      [
        consumption({ id: "bad", meter: "", periodStart: "2026-05-01", periodEnd: "2026-04-01", consumptionValue: -1 }),
        consumption({ id: "duplicate-a", meter: "MTR-001" }),
        consumption({ id: "duplicate-b", meter: "MTR-001" }),
        consumption({ id: "unknown", meter: "UNKNOWN", periodStart: "2026-04-15", periodEnd: "2026-05-15" })
      ],
      [submeter()]
    );

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "Missing meter reference",
        "Negative consumption value",
        "Invalid date range",
        "Duplicate consumption record",
        "Overlapping consumption period",
        "Unknown meter"
      ])
    );
  });

  it("validates half-hourly period count and parses SP1 to SP48 imports", () => {
    const parsed = parseSubmeterConsumptionRows(
      [
        submeterConsumptionHeaders,
        [
          "MTR-001",
          "Half-hourly",
          "2026-04-01",
          "2026-04-01",
          48,
          "HH import",
          ...Array.from({ length: 48 }, () => 1)
        ]
      ],
      "consumption.xlsx",
      "2026-06-23T08:00:00.000Z",
      "batch-1"
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.parsedRows[0]?.settlementPeriodKwh).toHaveLength(48);
    expect(
      validateSubmeterConsumption(
        [consumption({ format: "Half-hourly", settlementPeriodKwh: [1, 2] })],
        [submeter()]
      ).map((issue) => issue.code)
    ).toContain("Incorrect half-hourly settlement periods");
  });

  it("reports missing Transmission Loss Multipliers for required half-hourly periods", () => {
    const rows = [
      consumption({
        format: "Half-hourly",
        periodStart: "2026-04-01",
        periodEnd: "2026-04-01",
        settlementPeriodKwh: Array.from({ length: 48 }, () => 1)
      })
    ];
    const multipliers = Array.from({ length: 47 }, (_, index) =>
      tlm({ settlementPeriod: index + 1 })
    );

    const issues = validateRequiredTransmissionLossMultipliers(rows, multipliers);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      code: "Missing Transmission Loss Multiplier",
      settlementPeriod: 48
    });
  });
});
