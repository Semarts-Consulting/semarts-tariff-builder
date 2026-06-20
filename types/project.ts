export type ProjectStatus = "Draft" | "Ready for review" | "Locked";

export type Project = {
  id: string;
  name: string;
  networkName: string;
  tariffYear: number;
  effectiveDate: string;
  billingPeriod: string;
  customerClasses: string[];
  status: ProjectStatus;
  lastUpdated: string;
};

export type DataInputRow = {
  id: string;
  customerClass: string;
  customerCount: number;
  annualKwh: number;
  peakDemandKw: number;
  notes: string;
};

export type ProjectDataInputs = {
  projectId: string;
  rows: DataInputRow[];
  assumptions: string;
  lastUpdated: string;
};

export type ProjectSection = {
  title: string;
  description: string;
  href: string;
};
