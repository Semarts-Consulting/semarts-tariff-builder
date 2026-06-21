import Link from "next/link";
import { CloudSyncPanel } from "@/components/CloudSyncPanel";
import { CloudRestoreOnProjects } from "@/components/CloudRestoreOnProjects";
import { ProjectBackupPanel } from "@/components/ProjectBackupPanel";
import { ProjectsList } from "@/components/ProjectsList";

export default function ProjectsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Projects</h1>
          <p className="mt-2 text-ink/70">
            Manage tariff methodology models for private electricity networks.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="w-full rounded-md bg-semarts px-4 py-2 text-center text-sm font-semibold text-white hover:bg-semarts-dark sm:w-fit"
        >
          New project
        </Link>
      </div>

      <CloudRestoreOnProjects />
      <ProjectBackupPanel />
      <CloudSyncPanel />
      <ProjectsList />
    </section>
  );
}
