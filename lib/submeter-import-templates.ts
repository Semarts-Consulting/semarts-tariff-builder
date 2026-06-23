import { siteSubmeterHeaders, submeterConsumptionHeaders } from "@/lib/site-submeter-inputs";
import { transmissionLossMultiplierHeaders } from "@/lib/transmission-loss-multipliers";

export type WorkbookTemplate = {
  fileName: string;
  sheetName: string;
  rows: (string | number)[][];
};

const exampleNote = "Example row - delete or replace before import";

export function createSiteSubmeterRegisterTemplate(): WorkbookTemplate {
  return {
    fileName: "site-submeter-register-template.xlsx",
    sheetName: "Site Submeters",
    rows: [
      siteSubmeterHeaders,
      ["EXAMPLE-DELETE-ME-001", "Terminal 1 / Retail unit", "Tenant", "Example tenant", exampleNote],
      ["EXAMPLE-DELETE-ME-002", "Plant room", "Plant Room", "", exampleNote]
    ]
  };
}

export function createSubmeterConsumptionTemplate(): WorkbookTemplate {
  return {
    fileName: "submeter-consumption-template.xlsx",
    sheetName: "Submeter Consumption",
    rows: [
      submeterConsumptionHeaders,
      [
        "EXAMPLE-DELETE-ME-001",
        "Monthly",
        "2026-04-01",
        "2026-04-30",
        1000,
        exampleNote,
        ...Array.from({ length: 48 }, () => "")
      ],
      [
        "EXAMPLE-DELETE-ME-001",
        "Half-hourly",
        "2026-04-01",
        "2026-04-01",
        48,
        exampleNote,
        ...Array.from({ length: 48 }, () => 1)
      ]
    ]
  };
}

export function createTransmissionLossMultiplierTemplate(): WorkbookTemplate {
  return {
    fileName: "transmission-loss-multiplier-template.xlsx",
    sheetName: "TLM",
    rows: [
      transmissionLossMultiplierHeaders,
      [
        "2026-04-01",
        1,
        1.02,
        "_A",
        "2026-04-01",
        exampleNote,
        "2026-04-01T00:00:00.000Z",
        "example-run"
      ]
    ]
  };
}
