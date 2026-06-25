import type { DataInputRow } from "@/types/project";

export type MeterConsumptionSelectorState = {
  status: "Aggregate input active" | "Awaiting UtilityHub meter service";
  aggregateCustomerClassCount: number;
  aggregateAnnualKwh: number;
  aggregatePeakDemandKw: number;
  messages: string[];
};

export function summariseMeterConsumptionSelectorState(
  aggregateRows: DataInputRow[]
): MeterConsumptionSelectorState {
  const aggregateCustomerClassCount = aggregateRows.filter((row) => row.customerClass.trim()).length;
  const aggregateAnnualKwh = aggregateRows.reduce((total, row) => total + row.annualKwh, 0);
  const aggregatePeakDemandKw = aggregateRows.reduce((total, row) => total + row.peakDemandKw, 0);
  const hasAggregateInput =
    aggregateCustomerClassCount > 0 || aggregateAnnualKwh > 0 || aggregatePeakDemandKw > 0;

  return {
    status: hasAggregateInput ? "Aggregate input active" : "Awaiting UtilityHub meter service",
    aggregateCustomerClassCount,
    aggregateAnnualKwh,
    aggregatePeakDemandKw,
    messages: [
      "UtilityHub meter and monthly consumption selector contracts are available, but live services are not connected in Tariff Builder yet.",
      hasAggregateInput
        ? "Current customer-class aggregate rows remain the tariff-driving input path."
        : "Add reviewed aggregate customer-class inputs until UtilityHub meter summaries are available.",
      "UtilityHub meter and consumption data must remain evidence-only until a reviewed aggregate generation package is approved."
    ]
  };
}
