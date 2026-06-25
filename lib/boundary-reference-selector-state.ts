export type SelectorEvidenceState = {
  status: "Local evidence active" | "Awaiting UtilityHub service";
  evidenceCount: number;
  messages: string[];
};

export function summariseBoundaryMeterSelectorState(input: {
  submeterCount: number;
  consumptionRecordCount: number;
}): SelectorEvidenceState {
  const hasLocalEvidence = input.submeterCount > 0 || input.consumptionRecordCount > 0;

  return {
    status: hasLocalEvidence ? "Local evidence active" : "Awaiting UtilityHub service",
    evidenceCount: input.submeterCount + input.consumptionRecordCount,
    messages: [
      "UtilityHub boundary meter selector contract is available, but live boundary meter services are not connected in Tariff Builder yet.",
      hasLocalEvidence
        ? "Current local submeter and consumption rows remain review evidence only."
        : "Boundary meter selection will use UtilityHub shared meter IDs when the live service is available.",
      "Boundary meter inclusion must remain an explicit tariff-year review decision."
    ]
  };
}

export function summariseReferenceDataSelectorState(input: {
  reviewedDataSetCount: number;
  totalDataSetCount: number;
}): SelectorEvidenceState {
  const hasReviewedData = input.reviewedDataSetCount > 0;

  return {
    status: hasReviewedData ? "Local evidence active" : "Awaiting UtilityHub service",
    evidenceCount: input.totalDataSetCount,
    messages: [
      "UtilityHub reference-data selector contract is available, but live shared reference services are not connected in Tariff Builder yet.",
      hasReviewedData
        ? `${input.reviewedDataSetCount} reviewed local reference data set${input.reviewedDataSetCount === 1 ? "" : "s"} available as interim evidence.`
        : "TLM, CPI, transmission, distribution and supply contract references should be selected from shared services when available.",
      "Reference data source versioning must be preserved before selected records can support a public-release tariff year."
    ]
  };
}
