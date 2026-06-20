export type ProjectStatus = "Draft" | "Ready for review" | "Locked";

export type Project = {
  id: string;
  name: string;
  networkName: string;
  tariffYear: number;
  status: ProjectStatus;
  lastUpdated: string;
};

export type ProjectSection = {
  title: string;
  description: string;
  href: string;
};
