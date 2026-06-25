import type { DataInputRow } from "@/types/project";
import type { MeterSelectorServiceResult } from "@/lib/meter-selector-service";
import type { MonthlyConsumptionSelectorServiceResult } from "@/lib/monthly-consumption-selector-service";

export type MeterConsumptionSelectorState = {
  status: "Aggregate input active" | "Awaiting UtilityHub meter service";
  aggregateCustomerClassCount: number;
  aggregateAnnualKwh: number;
  aggregatePeakDemandKw: number;
  meterOptionCount: number;
  boundaryMeterCandidateCount: number;
  monthlyConsumptionRecordCount: number;
  monthlyImportKwh: number;
  selectorValidationIssueCount: number;
  selectorSourceVersion?: string;
  messages: string[];
};

export function summariseMeterConsumptionSelectorState(
  aggregateRows: DataInputRow[],
  selectorResults?: {
    meterSelector?: MeterSelectorServiceResult;
    monthlyConsumptionSelector?: MonthlyConsumptionSelectorServiceResult;
  }
): MeterConsumptionSelectorState {
  const aggregateCustomerClassCount = aggregateRows.filter((row) => row.customerClass.trim()).length;
  const aggregateAnnualKwh = aggregateRows.reduce((total, row) => total + row.annualKwh, 0);
  const aggregatePeakDemandKw = aggregateRows.reduce((total, row) => total + row.peakDemandKw, 0);
  const hasAggregateInput =
    aggregateCustomerClassCount > 0 || aggregateAnnualKwh > 0 || aggregatePeakDemandKw > 0;
  const meterOptionCount = selectorResults?.meterSelector?.options.length ?? 0;
  const boundaryMeterCandidateCount =
    selectorResults?.meterSelector?.boundaryMeterCandidateCount ?? 0;
  const monthlyConsumptionRecordCount =
    selectorResults?.monthlyConsumptionSelector?.options.length ?? 0;
  const monthlyImportKwh = selectorResults?.monthlyConsumptionSelector?.totalImportKwh ?? 0;
  const selectorValidationIssueCount =
    (selectorResults?.meterSelector?.validationIssueCount ?? 0) +
    (selectorResults?.monthlyConsumptionSelector?.validationIssueCount ?? 0);
  const selectorSourceVersion =
    selectorResults?.meterSelector?.sourceVersion ??
    selectorResults?.monthlyConsumptionSelector?.sourceVersion;

  return {
    status: hasAggregateInput ? "Aggregate input active" : "Awaiting UtilityHub meter service",
    aggregateCustomerClassCount,
    aggregateAnnualKwh,
    aggregatePeakDemandKw,
    meterOptionCount,
    boundaryMeterCandidateCount,
    monthlyConsumptionRecordCount,
    monthlyImportKwh,
    selectorValidationIssueCount,
    selectorSourceVersion,
    messages: [
      selectorResults?.meterSelector?.message ??
        "UtilityHub meter selector contract is available, but the live service is not connected in Tariff Builder yet.",
      selectorResults?.monthlyConsumptionSelector?.message ??
        "UtilityHub monthly consumption selector contract is available, but the live service is not connected in Tariff Builder yet.",
      hasAggregateInput
        ? "Current customer-class aggregate rows remain the tariff-driving input path."
        : "Add reviewed aggregate customer-class inputs until UtilityHub meter summaries are available.",
      "UtilityHub meter and consumption data must remain evidence-only until a reviewed aggregate generation package is approved."
    ]
  };
}
