"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProjects } from "@/lib/project-storage";
import type { Project } from "@/types/project";

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="rounded-md border border-line bg-white p-5 shadow-sm hover:border-semarts"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{project.name}</h2>
          <p className="mt-1 text-sm text-ink/70">{project.networkName}</p>
        </div>
        <span className="rounded-full bg-field px-3 py-1 text-xs font-medium text-semarts-dark">
          {project.status}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-ink/60 md:grid-cols-3">
        <p>Tariff year {project.tariffYear}</p>
        <p>{project.billingPeriod} billing</p>
        <p>Updated {project.lastUpdated}</p>
      </div>
    </Link>
  );
}

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  return (
    <div className="mt-8 grid gap-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
