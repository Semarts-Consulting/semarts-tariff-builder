"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  deleteProject,
  getProjectById,
  reconcileProjectCustomerClasses,
  saveProject
} from "@/lib/project-storage";
import {
  deleteProjectFromSupabase,
  saveAllocationMethodsToSupabase,
  saveDataInputsToSupabase,
  saveProjectToSupabase
} from "@/lib/supabase-sync";
import type { Project, ProjectStatus } from "@/types/project";

type ProjectSettingsFormProps = {
  projectId: string;
};

const statuses: ProjectStatus[] = ["Draft", "Ready for review", "Locked", "Archived"];

function getTodayLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

function splitCustomerClasses(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ProjectSettingsForm({ projectId }: ProjectSettingsFormProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [customerClasses, setCustomerClasses] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const nextProject = getProjectById(projectId);
    setProject(nextProject);
    setCustomerClasses(nextProject.customerClasses.join(", "));
  }, [projectId]);

  const canDelete = useMemo(
    () => project !== null && deleteConfirmation === project.name,
    [deleteConfirmation, project]
  );

  async function saveUpdatedProject(nextProject: Project, message = "Project saved") {
    saveProject(nextProject);
    setProject(nextProject);

    try {
      const cloudSaved = await saveProjectToSupabase(nextProject);
      setStatusMessage(cloudSaved ? `${message} locally and to cloud.` : `${message} locally.`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? `${message} locally. Cloud save failed: ${error.message}`
          : `${message} locally. Cloud save failed.`
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!project) {
      return;
    }
    const nextCustomerClasses = splitCustomerClasses(customerClasses);
    const previousCustomerClasses = project.customerClasses.join("|");
    const customerClassesChanged = previousCustomerClasses !== nextCustomerClasses.join("|");
    const reconciledData =
      customerClassesChanged && nextCustomerClasses.length > 0
        ? reconcileProjectCustomerClasses(project.id, nextCustomerClasses)
        : null;

    await saveUpdatedProject({
      ...project,
      customerClasses: nextCustomerClasses,
      lastUpdated: getTodayLabel()
    });

    if (reconciledData) {
      try {
        await Promise.all([
          saveDataInputsToSupabase(reconciledData.dataInputs),
          saveAllocationMethodsToSupabase(reconciledData.allocationMethods)
        ]);
        setStatusMessage("Project saved and customer classes reconciled.");
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? `Project saved and reconciled locally. Cloud reconciliation failed: ${error.message}`
            : "Project saved and reconciled locally. Cloud reconciliation failed."
        );
      }
    }
  }

  async function handleArchiveToggle() {
    if (!project) {
      return;
    }

    await saveUpdatedProject(
      {
        ...project,
        status: project.status === "Archived" ? "Draft" : "Archived",
        lastUpdated: getTodayLabel()
      },
      project.status === "Archived" ? "Project restored" : "Project archived"
    );
  }

  async function handleDelete() {
    if (!project || !canDelete) {
      return;
    }

    deleteProject(project.id);

    try {
      await deleteProjectFromSupabase(project.id);
    } catch {
      // Local delete still wins; manual cloud restore can recover if needed.
    }

    router.push("/projects");
    router.refresh();
  }

  if (!project) {
    return null;
  }

  return (
    <div className="mt-8 space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-md border border-line bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Project name</span>
            <input
              type="text"
              value={project.name}
              onChange={(event) => setProject({ ...project, name: event.target.value })}
              className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Network name</span>
            <input
              type="text"
              value={project.networkName}
              onChange={(event) => setProject({ ...project, networkName: event.target.value })}
              className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <label className="block">
            <span className="text-sm font-medium">Tariff year</span>
            <input
              type="number"
              value={project.tariffYear}
              onChange={(event) =>
                setProject({ ...project, tariffYear: Number(event.target.value) || 0 })
              }
              className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Effective date</span>
            <input
              type="date"
              value={project.effectiveDate}
              onChange={(event) => setProject({ ...project, effectiveDate: event.target.value })}
              className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Billing period</span>
            <select
              value={project.billingPeriod}
              onChange={(event) => setProject({ ...project, billingPeriod: event.target.value })}
              className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
            >
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Annual</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Status</span>
            <select
              value={project.status}
              onChange={(event) =>
                setProject({ ...project, status: event.target.value as ProjectStatus })
              }
              className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
            >
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium">Customer classes</span>
          <input
            type="text"
            value={customerClasses}
            onChange={(event) => setCustomerClasses(event.target.value)}
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>

        <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:flex-row sm:items-center sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0">
          <button
            type="submit"
            className="rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark sm:w-fit"
          >
            Save project
          </button>
          {statusMessage ? (
            <span className="text-sm font-medium text-semarts-dark">{statusMessage}</span>
          ) : null}
        </div>
      </form>

      <section className="rounded-md border border-line bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-semibold">Lifecycle</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleArchiveToggle}
            className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:border-semarts"
          >
            {project.status === "Archived" ? "Restore project" : "Archive project"}
          </button>
        </div>
      </section>

      <section className="rounded-md border border-red-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-semibold text-red-700">Delete project</h2>
        <p className="mt-2 text-sm text-ink/70">
          Type the project name to confirm deletion from this browser and your cloud copy.
        </p>
        <input
          type="text"
          value={deleteConfirmation}
          onChange={(event) => setDeleteConfirmation(event.target.value)}
          className="mt-4 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-red-500"
        />
        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete}
          className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-ink/30"
        >
          Delete project
        </button>
      </section>
    </div>
  );
}
