"use client";

import { ReactNode, useEffect, useState } from "react";
import { ProjectNav } from "@/components/ProjectNav";
import { getProjectById } from "@/lib/project-storage";
import { sampleProjects } from "@/lib/sample-data";
import type { Project } from "@/types/project";

type ProjectShellProps = {
  children: ReactNode;
  projectId: string;
};

export function ProjectShell({ children, projectId }: ProjectShellProps) {
  const [project, setProject] = useState<Project>(() => sampleProjects[0]);

  useEffect(() => {
    setProject(getProjectById(projectId));
  }, [projectId]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="border-b border-line pb-6">
        <p className="text-sm font-medium text-semarts-dark">{project.networkName}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{project.name}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-ink/60">
          <span>Tariff year {project.tariffYear}</span>
          <span>-</span>
          <span>{project.billingPeriod} billing</span>
          <span>-</span>
          <span>{project.status}</span>
        </div>
        {project.status === "Archived" ? (
          <div className="mt-5 rounded-md border border-warm-gold/40 bg-white p-4 text-sm text-ink/70">
            This project is archived. Workflow pages are read-only until the project is
            restored in Settings.
          </div>
        ) : null}
        <ProjectNav projectId={projectId} />
      </div>
      <div className="py-8">{children}</div>
    </section>
  );
}
