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
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${
              filter === item.id
                ? "border-semarts bg-semarts text-white"
                : "border-line bg-white text-ink hover:border-semarts"
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
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
