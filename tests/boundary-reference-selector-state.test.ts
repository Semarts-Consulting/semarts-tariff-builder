import { describe, expect, it } from "vitest";
import {
  summariseBoundaryMeterSelectorState,
  summariseReferenceDataSelectorState
} from "@/lib/boundary-reference-selector-state";

describe("boundary and reference selector states", () => {
  it("reports boundary selector as awaiting UtilityHub service without local evidence", () => {
    const summary = summariseBoundaryMeterSelectorState({
      submeterCount: 0,
      consumptionRecordCount: 0
    });

    expect(summary.status).toBe("Awaiting UtilityHub service");
    expect(summary.evidenceCount).toBe(0);
  });

  it("reports local boundary evidence without making it tariff-driving", () => {
    const summary = summariseBoundaryMeterSelectorState({
      submeterCount: 2,
      consumptionRecordCount: 12
    });

    expect(summary.status).toBe("Local evidence active");
    expect(summary.messages).toContain(
      "Current local submeter and consumption rows remain review evidence only."
    );
  });

  it("reports reference data selector state from reviewed data counts", () => {
    const summary = summariseReferenceDataSelectorState({
      reviewedDataSetCount: 1,
      totalDataSetCount: 3
    });

    expect(summary.status).toBe("Local evidence active");
    expect(summary.evidenceCount).toBe(3);
    expect(summary.messages[1]).toContain("1 reviewed local reference data set");
  });
});
