import { getProjectById } from "@/lib/project-storage";

export function isProjectArchived(projectId: string) {
  return getProjectById(projectId).status === "Archived";
}
