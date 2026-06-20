import { sampleProjects } from "@/lib/sample-data";
import type { DataInputRow, Project, ProjectDataInputs } from "@/types/project";

const storageKey = "semarts.projects";
const dataInputsStorageKey = "semarts.project-data-inputs";

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseProjects(value: string | null): Project[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseProjectDataInputs(value: string | null): ProjectDataInputs[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

export function createProjectId(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${slug || "project"}-${Date.now().toString(36)}`;
}

export function getStoredProjects() {
  if (!hasBrowserStorage()) {
    return [];
  }

  return parseProjects(window.localStorage.getItem(storageKey));
}

export function getProjects() {
  const storedProjects = getStoredProjects();
  const storedIds = new Set(storedProjects.map((project) => project.id));

  return [
    ...storedProjects,
    ...sampleProjects.filter((project) => !storedIds.has(project.id))
  ];
}

export function getProjectById(projectId: string) {
  return getProjects().find((project) => project.id === projectId) ?? sampleProjects[0];
}

export function saveProject(project: Project) {
  if (!hasBrowserStorage()) {
    return;
  }

  const projects = getStoredProjects();
  const nextProjects = [
    project,
    ...projects.filter((storedProject) => storedProject.id !== project.id)
  ];

  window.localStorage.setItem(storageKey, JSON.stringify(nextProjects));
}

export function createDataInputRow(customerClass = ""): DataInputRow {
  return {
    id: `input-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    customerClass,
    customerCount: 0,
    annualKwh: 0,
    peakDemandKw: 0,
    notes: ""
  };
}

export function createDefaultDataInputs(project: Project): ProjectDataInputs {
  return {
    projectId: project.id,
    rows: project.customerClasses.map((customerClass) => createDataInputRow(customerClass)),
    assumptions: "",
    lastUpdated: todayLabel()
  };
}

export function getStoredDataInputs() {
  if (!hasBrowserStorage()) {
    return [];
  }

  return parseProjectDataInputs(window.localStorage.getItem(dataInputsStorageKey));
}

export function getProjectDataInputs(projectId: string) {
  const project = getProjectById(projectId);
  return (
    getStoredDataInputs().find((dataInputs) => dataInputs.projectId === projectId) ??
    createDefaultDataInputs(project)
  );
}

export function saveProjectDataInputs(dataInputs: ProjectDataInputs) {
  if (!hasBrowserStorage()) {
    return;
  }

  const storedDataInputs = getStoredDataInputs();
  const nextDataInputs = [
    {
      ...dataInputs,
      lastUpdated: todayLabel()
    },
    ...storedDataInputs.filter((storedInput) => storedInput.projectId !== dataInputs.projectId)
  ];

  window.localStorage.setItem(dataInputsStorageKey, JSON.stringify(nextDataInputs));
}
