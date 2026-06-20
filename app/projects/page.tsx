import Link from "next/link";
import { CloudSyncPanel } from "@/components/CloudSyncPanel";
import { ProjectBackupPanel } from "@/components/ProjectBackupPanel";
import { ProjectsList } from "@/components/ProjectsList";

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

      <ProjectBackupPanel />
      <CloudSyncPanel />
      <ProjectsList />
    </section>
  );
}
