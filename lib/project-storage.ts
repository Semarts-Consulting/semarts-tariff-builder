import { sampleProjects } from "@/lib/sample-data";
import type { Project } from "@/types/project";

const storageKey = "semarts.projects";

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
