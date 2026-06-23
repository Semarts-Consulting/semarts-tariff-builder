import { describe, expect, it, vi } from "vitest";
import {
  createTransmissionLossMultiplierInput,
  parseTransmissionLossMultiplierJson,
  parseTransmissionLossMultiplierRows,
  refreshTransmissionLossMultipliersFromJson,
  transmissionLossMultiplierHeaders,
  validateTransmissionLossMultipliers
} from "@/lib/transmission-loss-multipliers";

describe("transmission loss multiplier inputs", () => {
  it("parses structured workbook rows", () => {
    const result = parseTransmissionLossMultiplierRows(
      [
        transmissionLossMultiplierHeaders,
        [
          "2026-04-01",
          1,
          1.021,
          "_A",
          "2026-04-01",
          "Elexon structured import",
          "2026-06-23T08:00:00.000Z",
          "run-1"
        ]
      ],
      "tlm-batch-1"
    );

    expect(result.errors).toEqual([]);
    expect(result.parsedRows[0]).toMatchObject({
      settlementDate: "2026-04-01",
      settlementPeriod: 1,
      transmissionLossMultiplier: 1.021,
      gspGroup: "_A",
      effectiveFromDate: "2026-04-01",
      source: "Elexon structured import",
      version: "run-1"
    });
  });

  it("reports invalid periods and non-positive multipliers", () => {
    const result = parseTransmissionLossMultiplierRows(
      [transmissionLossMultiplierHeaders, ["2026-04-01", 0, -1, "_A", "", "", "", ""]],
      "tlm-batch-1"
    );

    expect(result.parsedRows).toEqual([]);
    expect(result.errors).toContain("Row 2: Settlement period must be between 1 and 50.");
    expect(result.errors).toContain("Row 2: Transmission loss multiplier must be positive.");
  });

  it("validates manually entered multiplier rows", () => {
    const issues = validateTransmissionLossMultipliers([
      {
        ...createTransmissionLossMultiplierInput(),
        settlementDate: "",
        settlementPeriod: 51,
        transmissionLossMultiplier: 0
      }
    ]);

    expect(issues.map((issue) => issue.code)).toEqual([
      "Missing settlement date",
      "Invalid settlement period",
      "Invalid Transmission Loss Multiplier"
    ]);
  });

  it("parses structured JSON rows for refresh workflows", () => {
    const result = parseTransmissionLossMultiplierJson(
      [
        {
          settlementDate: "2026-04-01",
          settlementPeriod: 2,
          transmissionLossMultiplier: 1.03,
          gspGroup: "_B",
          version: "run-2"
        }
      ],
      "tlm-batch-2",
      "2026-06-23T08:00:00.000Z"
    );

    expect(result.errors).toEqual([]);
    expect(result.parsedRows[0]).toMatchObject({
      settlementDate: "2026-04-01",
      settlementPeriod: 2,
      transmissionLossMultiplier: 1.03,
      source: "Elexon structured JSON",
      retrievedAt: "2026-06-23T08:00:00.000Z"
    });
  });

  it("refreshes from an injected structured JSON endpoint", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        data: [
          {
            settlementDate: "2026-04-01",
            settlementPeriod: 3,
            transmissionLossMultiplier: 1.04
          }
        ]
      })
    })) as unknown as typeof fetch;

    const result = await refreshTransmissionLossMultipliersFromJson(
      "https://example.test/tlm",
      fetchMock
    );

    expect(fetchMock).toHaveBeenCalledWith("https://example.test/tlm");
    expect(result.errors).toEqual([]);
    expect(result.parsedRows[0]).toMatchObject({
      settlementDate: "2026-04-01",
      settlementPeriod: 3,
      transmissionLossMultiplier: 1.04
    });
  });
});
