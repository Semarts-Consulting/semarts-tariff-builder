import type { Project, ProjectSection } from "@/types/project";

export const sampleProjects: Project[] = [
  {
    id: "demo-private-network",
    name: "Demo Private Network Tariff Review",
    networkName: "Semarts Embedded Electricity Network",
    tariffYear: 2026,
    effectiveDate: "2026-07-01",
    billingPeriod: "Monthly",
    customerClasses: ["Residential", "Small business", "Common area"],
    status: "Draft",
    lastUpdated: "20 June 2026"
  }
];

export const projectSections: ProjectSection[] = [
  {
    title: "Settings",
    description: "Project details, status, and lifecycle controls.",
    href: "settings"
  },
  {
    title: "Data inputs",
    description: "Customer counts, forecast kWh, demand values, and billing periods.",
    href: "data-inputs"
  },
  {
    title: "Cost inputs",
    description: "Recoverable operating, maintenance, asset, pass-through, and admin costs.",
    href: "cost-pools"
  },
  {
    title: "Allocation methods",
    description: "Rules for assigning cost pools across tariff classes and charge types.",
    href: "allocation-methods"
  },
  {
    title: "Tariff calculations",
    description: "Formula execution, indicative rates, and revenue reconciliation.",
    href: "tariff-calculations"
  },
  {
    title: "Reports",
    description: "Tariff schedule and methodology summary outputs.",
    href: "reports"
  }
];

export function getProject(projectId: string): Project {
  return sampleProjects.find((project) => project.id === projectId) ?? sampleProjects[0];
}
