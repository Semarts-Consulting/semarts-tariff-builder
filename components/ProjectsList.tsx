"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProjects } from "@/lib/project-storage";
import type { Project } from "@/types/project";

type ProjectFilter = "active" | "archived" | "all";

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-md border border-line bg-white p-4 shadow-sm outline-none hover:border-semarts focus:border-semarts sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{project.name}</h2>
          <p className="mt-1 text-sm text-ink/70">{project.networkName}</p>
        </div>
        <span className="w-fit shrink-0 rounded-full bg-field px-3 py-1 text-xs font-medium text-semarts-dark">
          {project.status}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 text-sm text-ink/60 sm:grid-cols-3">
        <div>
          <dt className="font-medium text-ink/50">Tariff year</dt>
          <dd className="mt-1 text-ink/70">{project.tariffYear}</dd>
        </div>
        <div>
          <dt className="font-medium text-ink/50">Billing</dt>
          <dd className="mt-1 text-ink/70">{project.billingPeriod}</dd>
        </div>
        <div>
          <dt className="font-medium text-ink/50">Updated</dt>
          <dd className="mt-1 text-ink/70">{project.lastUpdated}</dd>
        </div>
      </dl>
    </Link>
  );
}

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<ProjectFilter>("active");

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const activeProjects = projects.filter((project) => project.status !== "Archived");
  const archivedProjects = projects.filter((project) => project.status === "Archived");
  const visibleProjects =
    filter === "active" ? activeProjects : filter === "archived" ? archivedProjects : projects;
  const filters: Array<{ id: ProjectFilter; label: string; count: number }> = [
    { id: "active", label: "Active", count: activeProjects.length },
    { id: "archived", label: "Archived", count: archivedProjects.length },
    { id: "all", label: "All", count: projects.length }
  ];

  return (
    <div className="mt-8">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
            className={`shrink-0 rounded-md border px-3 py-2 text-sm font-semibold ${
              filter === item.id
                ? "border-semarts bg-semarts text-white"
                : "border-line bg-white text-ink hover:border-semarts"
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
        </div>
      </div>

      {visibleProjects.length > 0 ? (
        <div className="mt-4 grid gap-4">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-line bg-white p-5 text-sm text-ink/70 shadow-sm">
          No {filter === "all" ? "" : filter} projects found.
        </div>
      )}
    </div>
  );
}
