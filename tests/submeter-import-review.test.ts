import { describe, expect, it } from "vitest";
import {
  createImportConflictMessages,
  findSubmeterConsumptionImportConflicts,
  findSubmeterRegisterImportConflicts,
  findTransmissionLossMultiplierImportConflicts
} from "@/lib/submeter-import-review";
import type {
  SiteSubmeterRecord,
  SubmeterConsumptionRecord,
  TransmissionLossMultiplierInput
} from "@/types/project";

function submeter(overrides: Partial<SiteSubmeterRecord> = {}): SiteSubmeterRecord {
  return {
    id: overrides.id ?? "submeter-existing",
    meter: overrides.meter ?? "MTR-001",
    location: "Terminal",
    responsibility: "Tenant",
    tenantName: "Tenant A",
    notes: "",
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
    id: overrides.id ?? "consumption-existing",
    meter: overrides.meter ?? "MTR-001",
    format: overrides.format ?? "Monthly",
    periodStart: overrides.periodStart ?? "2026-04-01",
    periodEnd: overrides.periodEnd ?? "2026-04-30",
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

function tlm(
  overrides: Partial<TransmissionLossMultiplierInput> = {}
): TransmissionLossMultiplierInput {
  return {
    id: overrides.id ?? "tlm-existing",
    settlementDate: overrides.settlementDate ?? "2026-04-01",
    settlementPeriod: overrides.settlementPeriod ?? 1,
    transmissionLossMultiplier: 1.02,
    gspGroup: overrides.gspGroup ?? "_A",
    effectiveFromDate: "2026-04-01",
    source: "Manual",
    retrievedAt: "2026-06-23T08:00:00.000Z",
    version: "v1",
    importBatchId: "",
    rowFingerprint: "",
    ...overrides
  };
}

describe("submeter import review", () => {
  it("flags duplicate register meters without removing imported rows", () => {
    const conflicts = findSubmeterRegisterImportConflicts({
      existingRows: [submeter()],
      importedRows: [submeter({ id: "submeter-imported" })]
    });

    expect(conflicts).toEqual([
      expect.objectContaining({
        code: "Duplicate meter",
        existingRowId: "submeter-existing",
        importedRowId: "submeter-imported"
      })
    ]);
    expect(createImportConflictMessages(conflicts)[0]).toContain("MTR-001");
  });

  it("flags duplicate consumption periods by meter, format and dates", () => {
    const conflicts = findSubmeterConsumptionImportConflicts({
      existingRows: [consumption()],
      importedRows: [consumption({ id: "consumption-imported" })]
    });

    expect(conflicts).toEqual([
      expect.objectContaining({
        code: "Duplicate consumption period",
        existingRowId: "consumption-existing",
        importedRowId: "consumption-imported"
      })
    ]);
  });

  it("flags duplicate TLM periods by date, settlement period and GSP group", () => {
    const conflicts = findTransmissionLossMultiplierImportConflicts({
      existingRows: [tlm()],
      importedRows: [tlm({ id: "tlm-imported" })]
    });

    expect(conflicts).toEqual([
      expect.objectContaining({
        code: "Duplicate TLM period",
        existingRowId: "tlm-existing",
        importedRowId: "tlm-imported"
      })
    ]);
  });
});
