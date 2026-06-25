import type {
  UtilityHubMeterSelectorItem,
  MeterSelectorOption
} from "@/lib/utilityhub-meter-selector-adapter";
import type { UtilityHubSelectorEnvelope } from "@/lib/utilityhub-customer-site-selector-adapter";
import { adaptUtilityHubMeterSelector } from "@/lib/utilityhub-meter-selector-adapter";

export type BoundaryMeterSelectorAdapterResult = {
  status: "ready" | "empty" | "unavailable" | "access-denied";
  message: string;
  options: MeterSelectorOption[];
  sourceVersion?: string;
  retrievedAt: string;
  validationIssueCount: number;
};

export function adaptUtilityHubBoundaryMeterSelector(
  envelope: UtilityHubSelectorEnvelope<UtilityHubMeterSelectorItem>
): BoundaryMeterSelectorAdapterResult {
  const meterResult = adaptUtilityHubMeterSelector(envelope);
  const options = meterResult.options.filter((option) => option.boundaryMeterCandidate);

  if (meterResult.status !== "ready") {
    return {
      status: meterResult.status,
      message: meterResult.message,
      options,
      sourceVersion: meterResult.sourceVersion,
      retrievedAt: meterResult.retrievedAt,
      validationIssueCount: meterResult.validationIssueCount
    };
  }

  if (options.length === 0) {
    return {
      status: "empty",
      message: "No UtilityHub boundary meter candidates match this scope.",
      options,
      sourceVersion: meterResult.sourceVersion,
      retrievedAt: meterResult.retrievedAt,
      validationIssueCount: 0
    };
  }

  return {
    status: "ready",
    message: "UtilityHub boundary meter candidates are available as evidence.",
    options,
    sourceVersion: meterResult.sourceVersion,
    retrievedAt: meterResult.retrievedAt,
    validationIssueCount: options.reduce(
      (total, option) => total + option.validationIssueCount,
      0
    )
  };
}
