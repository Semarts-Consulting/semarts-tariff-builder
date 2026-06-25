"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CustomerClassTableEditor } from "@/components/CustomerClassTableEditor";
import { createLocalCustomerSiteSelectorEnvelope } from "@/lib/customer-site-selector-local-envelope";
import { summariseCustomerSiteSelectorState } from "@/lib/customer-site-selector-state";
import { adaptUtilityHubCustomerSiteSelector } from "@/lib/utilityhub-customer-site-selector-adapter";
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
import type { InputReadinessStatus, Project, ProjectStatus } from "@/types/project";

type ProjectSettingsFormProps = {
  projectId: string;
};

const statuses: ProjectStatus[] = ["Draft", "Ready for review", "Locked", "Archived"];
const inputReadinessStatuses: InputReadinessStatus[] = [
  "not-started",
  "in-progress",
  "needs-review",
  "blocked",
  "ready-for-calculation"
];

function getTodayLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
}

export function ProjectSettingsForm({ projectId }: ProjectSettingsFormProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [customerClasses, setCustomerClasses] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const nextProject = getProjectById(projectId);
    setProject(nextProject);
    setCustomerClasses(nextProject.customerClasses);
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
    const nextCustomerClasses = customerClasses;
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

  const customerSiteSelectorResult = adaptUtilityHubCustomerSiteSelector(
    createLocalCustomerSiteSelectorEnvelope(project),
    project
  );
  const customerSiteSelectorState = summariseCustomerSiteSelectorState(
    project,
    customerSiteSelectorResult
  );

  return (
    <div className="mt-8 space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-md border border-line bg-white p-4 shadow-sm sm:p-6"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Tariff model name</span>
            <input
              type="text"
              value={project.tariffModelName ?? project.name}
              onChange={(event) =>
                setProject({ ...project, tariffModelName: event.target.value })
              }
              className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Tariff year name</span>
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

        <div className="grid gap-5 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium">UtilityHub customer ref</span>
            <input
              type="text"
              value={project.utilityHubCustomerId ?? ""}
              onChange={(event) =>
                setProject({ ...project, utilityHubCustomerId: event.target.value })
              }
              className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">UtilityHub site ref</span>
            <input
              type="text"
              value={project.utilityHubSiteId ?? ""}
              onChange={(event) =>
                setProject({ ...project, utilityHubSiteId: event.target.value })
              }
              className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Input readiness</span>
            <select
              value={project.inputReadinessStatus ?? "not-started"}
              onChange={(event) =>
                setProject({
                  ...project,
                  inputReadinessStatus: event.target.value as InputReadinessStatus
                })
              }
              className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
            >
              {inputReadinessStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-md border border-line bg-field p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold">Customer/site selector</h2>
              <p className="mt-1 text-sm text-ink/70">
                UtilityHub owns customer and site records. Tariff Builder can hold manual
                references for now; live selection will be connected after the shared service is
                available.
              </p>
            </div>
            <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-semarts-dark">
              {customerSiteSelectorState.status}
            </span>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-ink/70">
            {customerSiteSelectorState.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-md border border-line bg-white p-3">
              <p className="font-medium text-ink/60">Selector options</p>
              <p className="mt-1">{customerSiteSelectorState.optionCount}</p>
            </div>
            <div className="rounded-md border border-line bg-white p-3">
              <p className="font-medium text-ink/60">Selected site</p>
              <p className="mt-1">
                {customerSiteSelectorResult.selectedOption?.hierarchyLabel ?? "Not selected"}
              </p>
            </div>
            <div className="rounded-md border border-line bg-white p-3">
              <p className="font-medium text-ink/60">Source version</p>
              <p className="mt-1 break-words">
                {customerSiteSelectorState.sourceVersion ?? "No selector version"}
              </p>
            </div>
          </div>
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
            <span className="text-sm font-medium">Reference start</span>
            <input
              type="date"
              value={project.referencePeriodStart ?? ""}
              onChange={(event) =>
                setProject({ ...project, referencePeriodStart: event.target.value })
              }
              className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Reference end</span>
            <input
              type="date"
              value={project.referencePeriodEnd ?? ""}
              onChange={(event) =>
                setProject({ ...project, referencePeriodEnd: event.target.value })
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

        <CustomerClassTableEditor
          customerClasses={customerClasses}
          onChange={setCustomerClasses}
        />

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
