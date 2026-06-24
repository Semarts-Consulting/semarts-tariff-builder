import type { Project } from "@/types/project";

export type InputFoundationSeverity = "Info" | "Warning" | "Error";

export type InputFoundationCheck = {
  code: string;
  label: string;
  severity: InputFoundationSeverity;
  message: string;
};

export type InputFoundationReadinessStatus =
  | "Ready for input selection"
  | "Needs UtilityHub references"
  | "Needs setup";

export type InputFoundationReadinessSummary = {
  status: InputFoundationReadinessStatus;
  errorCount: number;
  warningCount: number;
  checks: InputFoundationCheck[];
};

function hasValue(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function createCheck({
  code,
  label,
  severity,
  message
}: InputFoundationCheck): InputFoundationCheck {
  return { code, label, severity, message };
}

export function summariseInputFoundationReadiness(
  project: Project
): InputFoundationReadinessSummary {
  const checks: InputFoundationCheck[] = [];

  if (!hasValue(project.tariffModelName) && !hasValue(project.name)) {
    checks.push(
      createCheck({
        code: "missing-tariff-model-name",
        label: "Tariff model",
        severity: "Error",
        message: "Tariff model name is required before selecting inputs."
      })
    );
  }

  if (!hasValue(project.networkName)) {
    checks.push(
      createCheck({
        code: "missing-network-name",
        label: "Network",
        severity: "Error",
        message: "Network name is required before selecting inputs."
      })
    );
  }

  if (project.tariffYear <= 0) {
    checks.push(
      createCheck({
        code: "missing-tariff-year",
        label: "Tariff year",
        severity: "Error",
        message: "Tariff year must be set before selecting inputs."
      })
    );
  }

  if (!hasValue(project.referencePeriodStart) || !hasValue(project.referencePeriodEnd)) {
    checks.push(
      createCheck({
        code: "missing-reference-period",
        label: "Reference period",
        severity: "Warning",
        message: "Reference period should be set before reviewing consumption inputs."
      })
    );
  }

  if (!hasValue(project.utilityHubCustomerId)) {
    checks.push(
      createCheck({
        code: "missing-utilityhub-customer",
        label: "UtilityHub customer",
        severity: "Warning",
        message: "UtilityHub customer reference is not linked yet."
      })
    );
  }

  if (!hasValue(project.utilityHubSiteId)) {
    checks.push(
      createCheck({
        code: "missing-utilityhub-site",
        label: "UtilityHub site",
        severity: "Warning",
        message: "UtilityHub site reference is not linked yet."
      })
    );
  }

  if (project.customerClasses.length === 0) {
    checks.push(
      createCheck({
        code: "missing-customer-classes",
        label: "Customer classes",
        severity: "Error",
        message: "At least one customer class is required for tariff inputs."
      })
    );
  }

  const errorCount = checks.filter((check) => check.severity === "Error").length;
  const warningCount = checks.filter((check) => check.severity === "Warning").length;

  return {
    status:
      errorCount > 0
        ? "Needs setup"
        : warningCount > 0
          ? "Needs UtilityHub references"
          : "Ready for input selection",
    errorCount,
    warningCount,
    checks
  };
}
