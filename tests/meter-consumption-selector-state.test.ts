import { describe, expect, it } from "vitest";
import { summariseMeterConsumptionSelectorState } from "@/lib/meter-consumption-selector-state";
import type { DataInputRow } from "@/types/project";

const aggregateRows: DataInputRow[] = [
  {
    id: "row-1",
    customerClass: "LV",
    customerCount: 10,
    annualKwh: 1000,
    peakDemandKw: 50,
    notes: ""
  }
];

describe("meter consumption selector state", () => {
  it("reports aggregate input as active when customer-class rows exist", () => {
    const summary = summariseMeterConsumptionSelectorState(aggregateRows);

    expect(summary.status).toBe("Aggregate input active");
    expect(summary.aggregateCustomerClassCount).toBe(1);
    expect(summary.aggregateAnnualKwh).toBe(1000);
    expect(summary.aggregatePeakDemandKw).toBe(50);
  });

  it("reports awaiting UtilityHub meter service when no aggregate rows exist", () => {
    const summary = summariseMeterConsumptionSelectorState([]);

    expect(summary.status).toBe("Awaiting UtilityHub meter service");
    expect(summary.messages).toContain(
      "Add reviewed aggregate customer-class inputs until UtilityHub meter summaries are available."
    );
  });

  it("keeps UtilityHub meter data evidence-only by default", () => {
    const summary = summariseMeterConsumptionSelectorState(aggregateRows);

    expect(summary.messages).toContain(
      "UtilityHub meter and consumption data must remain evidence-only until a reviewed aggregate generation package is approved."
    );
  });
});
