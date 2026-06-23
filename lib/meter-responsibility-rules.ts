import type { SiteSubmeterRecord } from "@/types/project";

export type MeterResponsibilityTreatment =
  | "Recoverable from named tenant"
  | "Excluded from customer charging"
  | "Allocated to all users"
  | "Allocated to specific customer class"
  | "Landlord/common area"
  | "Informational only";

export type MeterResponsibilityAllocationRule = {
  responsibility: SiteSubmeterRecord["responsibility"];
  recoverable: boolean;
  excludedFromCustomerCharging: boolean;
  allocateToAllUsers: boolean;
  allocatedCustomerClass: string;
  landlordOrCommonArea: boolean;
  informationalOnly: boolean;
  treatment: MeterResponsibilityTreatment;
  auditExplanation: string;
};

export type MeterResponsibilityRuleApplication = {
  rule: MeterResponsibilityAllocationRule;
  includedSourceRecordIds: string[];
  excludedSourceRecordIds: string[];
  auditExplanation: string;
};

export const defaultMeterResponsibilityAllocationRules: MeterResponsibilityAllocationRule[] = [
  {
    responsibility: "Tenant",
    recoverable: true,
    excludedFromCustomerCharging: false,
    allocateToAllUsers: false,
    allocatedCustomerClass: "",
    landlordOrCommonArea: false,
    informationalOnly: false,
    treatment: "Recoverable from named tenant",
    auditExplanation:
      "Tenant meters are candidates for direct tenant consumption allocation, subject to approved tariff methodology."
  },
  {
    responsibility: "Network Operator",
    recoverable: false,
    excludedFromCustomerCharging: true,
    allocateToAllUsers: false,
    allocatedCustomerClass: "",
    landlordOrCommonArea: false,
    informationalOnly: true,
    treatment: "Informational only",
    auditExplanation:
      "Network operator meters are retained for reconciliation evidence and are not customer-charging denominators by default."
  },
  {
    responsibility: "Landlord",
    recoverable: true,
    excludedFromCustomerCharging: false,
    allocateToAllUsers: true,
    allocatedCustomerClass: "",
    landlordOrCommonArea: true,
    informationalOnly: false,
    treatment: "Landlord/common area",
    auditExplanation:
      "Landlord meters may represent common-area consumption to be allocated across users only after methodology approval."
  },
  {
    responsibility: "Shared Asset",
    recoverable: true,
    excludedFromCustomerCharging: false,
    allocateToAllUsers: true,
    allocatedCustomerClass: "",
    landlordOrCommonArea: true,
    informationalOnly: false,
    treatment: "Allocated to all users",
    auditExplanation:
      "Shared asset meters may support all-user allocation where the shared-use basis is approved."
  },
  {
    responsibility: "EV Asset",
    recoverable: true,
    excludedFromCustomerCharging: false,
    allocateToAllUsers: false,
    allocatedCustomerClass: "",
    landlordOrCommonArea: false,
    informationalOnly: false,
    treatment: "Allocated to specific customer class",
    auditExplanation:
      "EV asset meters need explicit customer-class or usage allocation before tariff-impacting treatment."
  },
  {
    responsibility: "Plant Room",
    recoverable: true,
    excludedFromCustomerCharging: false,
    allocateToAllUsers: true,
    allocatedCustomerClass: "",
    landlordOrCommonArea: true,
    informationalOnly: false,
    treatment: "Landlord/common area",
    auditExplanation:
      "Plant room meters are treated as common-area candidates until an approved methodology says otherwise."
  },
  {
    responsibility: "Infrastructure",
    recoverable: true,
    excludedFromCustomerCharging: false,
    allocateToAllUsers: true,
    allocatedCustomerClass: "",
    landlordOrCommonArea: true,
    informationalOnly: false,
    treatment: "Allocated to all users",
    auditExplanation:
      "Infrastructure meters are candidates for all-user allocation and require audit evidence before tariff impact."
  },
  {
    responsibility: "Other Internal Use",
    recoverable: false,
    excludedFromCustomerCharging: true,
    allocateToAllUsers: false,
    allocatedCustomerClass: "",
    landlordOrCommonArea: false,
    informationalOnly: true,
    treatment: "Informational only",
    auditExplanation:
      "Other internal use is retained for reconciliation and should not be customer-charged without classification review."
  }
];

export function getMeterResponsibilityAllocationRule(
  responsibility: SiteSubmeterRecord["responsibility"],
  rules: MeterResponsibilityAllocationRule[] = defaultMeterResponsibilityAllocationRules
) {
  return rules.find((rule) => rule.responsibility === responsibility);
}

export function applyMeterResponsibilityAllocationRule({
  submeter,
  sourceRecordIds,
  rules = defaultMeterResponsibilityAllocationRules
}: {
  submeter: SiteSubmeterRecord;
  sourceRecordIds: string[];
  rules?: MeterResponsibilityAllocationRule[];
}): MeterResponsibilityRuleApplication {
  const rule =
    getMeterResponsibilityAllocationRule(submeter.responsibility, rules) ??
    defaultMeterResponsibilityAllocationRules[
      defaultMeterResponsibilityAllocationRules.length - 1
    ];

  return {
    rule,
    includedSourceRecordIds:
      rule.informationalOnly || rule.excludedFromCustomerCharging ? [] : sourceRecordIds,
    excludedSourceRecordIds:
      rule.informationalOnly || rule.excludedFromCustomerCharging ? sourceRecordIds : [],
    auditExplanation: `${submeter.meter}: ${rule.auditExplanation}`
  };
}
