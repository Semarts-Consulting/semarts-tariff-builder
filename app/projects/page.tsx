import Link from "next/link";
import { sampleProjects } from "@/lib/sample-data";

export default function ProjectsPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-2 text-ink/70">
            Manage tariff methodology models for private electricity networks.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark"
        >
          New project
        </Link>
      </div>

      <div className="mt-8 grid gap-4">
        {sampleProjects.map((project) => (
          <Link
            key={project.id}
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
            <p className="mt-4 text-sm text-ink/60">
              Tariff year {project.tariffYear} · Last updated {project.lastUpdated}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
