import { describe, expect, it } from "vitest";
import {
  createSiteSubmeterRegisterTemplate,
  createSubmeterConsumptionTemplate,
  createTransmissionLossMultiplierTemplate
} from "@/lib/submeter-import-templates";
import {
  parseSiteSubmeterRows,
  parseSubmeterConsumptionRows,
  siteSubmeterHeaders,
  submeterConsumptionHeaders
} from "@/lib/site-submeter-inputs";
import {
  parseTransmissionLossMultiplierRows,
  transmissionLossMultiplierHeaders
} from "@/lib/transmission-loss-multipliers";

describe("submeter import templates", () => {
  it("creates a submeter register template compatible with the parser", () => {
    const template = createSiteSubmeterRegisterTemplate();
    const result = parseSiteSubmeterRows(
      template.rows,
      template.fileName,
      "2026-06-23T08:00:00.000Z",
      "batch-1"
    );

    expect(template.rows[0]).toEqual(siteSubmeterHeaders);
    expect(template.fileName).toBe("site-submeter-register-template.xlsx");
    expect(result.errors).toEqual([]);
    expect(result.parsedRows).toHaveLength(2);
    expect(result.parsedRows[0]?.meter).toContain("EXAMPLE-DELETE-ME");
  });

  it("creates a consumption template compatible with monthly and half-hourly parser paths", () => {
    const template = createSubmeterConsumptionTemplate();
    const result = parseSubmeterConsumptionRows(
      template.rows,
      template.fileName,
      "2026-06-23T08:00:00.000Z",
      "batch-1"
    );

    expect(template.rows[0]).toEqual(submeterConsumptionHeaders);
    expect(template.fileName).toBe("submeter-consumption-template.xlsx");
    expect(result.errors).toEqual([]);
    expect(result.parsedRows.map((row) => row.format)).toEqual(["Monthly", "Half-hourly"]);
    expect(result.parsedRows[1]?.settlementPeriodKwh).toHaveLength(48);
  });

  it("creates a TLM template compatible with the TLM parser", () => {
    const template = createTransmissionLossMultiplierTemplate();
    const result = parseTransmissionLossMultiplierRows(template.rows, "tlm-batch-1");

    expect(template.rows[0]).toEqual(transmissionLossMultiplierHeaders);
    expect(template.fileName).toBe("transmission-loss-multiplier-template.xlsx");
    expect(result.errors).toEqual([]);
    expect(result.parsedRows[0]).toMatchObject({
      settlementDate: "2026-04-01",
      settlementPeriod: 1,
      transmissionLossMultiplier: 1.02,
      source: "Example row - delete or replace before import"
    });
  });
});
