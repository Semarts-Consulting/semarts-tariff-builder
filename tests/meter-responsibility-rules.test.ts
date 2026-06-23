import { describe, expect, it } from "vitest";
import {
  applyMeterResponsibilityAllocationRule,
  defaultMeterResponsibilityAllocationRules,
  getMeterResponsibilityAllocationRule
} from "@/lib/meter-responsibility-rules";
import type { SiteSubmeterRecord } from "@/types/project";

function submeter(
  responsibility: SiteSubmeterRecord["responsibility"]
): SiteSubmeterRecord {
  return {
    id: `submeter-${responsibility}`,
    meter: `MTR-${responsibility}`,
    location: "Terminal",
    responsibility,
    tenantName: responsibility === "Tenant" ? "Tenant A" : "",
    notes: "",
    sourceFileName: "",
    uploadedAt: "",
    importBatchId: "",
    rowFingerprint: ""
  };
}

describe("meter responsibility rules", () => {
  it("defines a rule for every supported responsibility category", () => {
    expect(defaultMeterResponsibilityAllocationRules.map((rule) => rule.responsibility)).toEqual([
      "Tenant",
      "Network Operator",
      "Landlord",
      "Shared Asset",
      "EV Asset",
      "Plant Room",
      "Infrastructure",
      "Other Internal Use"
    ]);
  });

  it("keeps network operator and internal-use records out of customer charging by default", () => {
    const networkOperator = applyMeterResponsibilityAllocationRule({
      submeter: submeter("Network Operator"),
      sourceRecordIds: ["consumption-1"]
    });
    const otherInternalUse = applyMeterResponsibilityAllocationRule({
      submeter: submeter("Other Internal Use"),
      sourceRecordIds: ["consumption-2"]
    });

    expect(networkOperator.includedSourceRecordIds).toEqual([]);
    expect(networkOperator.excludedSourceRecordIds).toEqual(["consumption-1"]);
    expect(otherInternalUse.includedSourceRecordIds).toEqual([]);
    expect(otherInternalUse.excludedSourceRecordIds).toEqual(["consumption-2"]);
  });

  it("keeps tenant records eligible for inclusion without applying tariff denominators", () => {
    const result = applyMeterResponsibilityAllocationRule({
      submeter: submeter("Tenant"),
      sourceRecordIds: ["consumption-1"]
    });

    expect(result.includedSourceRecordIds).toEqual(["consumption-1"]);
    expect(result.excludedSourceRecordIds).toEqual([]);
    expect(result.rule.treatment).toBe("Recoverable from named tenant");
    expect(result.auditExplanation).toContain("Tenant meters are candidates");
  });

  it("allows custom rules for a responsibility category", () => {
    const defaultRule = getMeterResponsibilityAllocationRule("EV Asset");
    const result = applyMeterResponsibilityAllocationRule({
      submeter: submeter("EV Asset"),
      sourceRecordIds: ["ev-consumption"],
      rules: [
        {
          ...defaultRule!,
          excludedFromCustomerCharging: true,
          informationalOnly: true,
          treatment: "Informational only"
        }
      ]
    });

    expect(result.includedSourceRecordIds).toEqual([]);
    expect(result.excludedSourceRecordIds).toEqual(["ev-consumption"]);
    expect(result.rule.treatment).toBe("Informational only");
  });
});
