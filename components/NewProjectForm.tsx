"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { CustomerClassTableEditor } from "@/components/CustomerClassTableEditor";
import { parseCustomerClasses } from "@/lib/customer-classes";
import { createProjectId, saveProject } from "@/lib/project-storage";
import { saveProjectToSupabase } from "@/lib/supabase-sync";
import type { InputReadinessStatus, Project } from "@/types/project";

const todayFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

function getTodayLabel() {
  return todayFormatter.format(new Date());
}

export function NewProjectForm() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [tariffModelName, setTariffModelName] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [utilityHubCustomerId, setUtilityHubCustomerId] = useState("");
  const [utilityHubSiteId, setUtilityHubSiteId] = useState("");
  const [tariffYear, setTariffYear] = useState(new Date().getFullYear().toString());
  const [referencePeriodStart, setReferencePeriodStart] = useState("");
  const [referencePeriodEnd, setReferencePeriodEnd] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [billingPeriod, setBillingPeriod] = useState("Monthly");
  const [customerClasses, setCustomerClasses] = useState<string[]>(
    parseCustomerClasses("Residential, Small business, Common area")
  );
  const [error, setError] = useState("");

  const canSubmit = useMemo(
    () =>
      projectName.trim().length > 0 &&
      networkName.trim().length > 0 &&
      Number(tariffYear) > 0 &&
      effectiveDate.length > 0,
    [effectiveDate, networkName, projectName, tariffYear]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setError("Complete the required fields before saving the project.");
      return;
    }

    const project: Project = {
      id: createProjectId(projectName),
      name: projectName.trim(),
      tariffModelName: tariffModelName.trim() || projectName.trim(),
      networkName: networkName.trim(),
      utilityHubCustomerId: utilityHubCustomerId.trim(),
      utilityHubSiteId: utilityHubSiteId.trim(),
      tariffYear: Number(tariffYear),
      referencePeriodStart,
      referencePeriodEnd,
      effectiveDate,
      billingPeriod,
      customerClasses,
      inputReadinessStatus: "not-started" satisfies InputReadinessStatus,
      status: "Draft",
      lastUpdated: getTodayLabel()
    };

    saveProject(project);
    try {
      await saveProjectToSupabase(project);
    } catch (cloudError) {
      setError(
        cloudError instanceof Error
          ? `Project saved locally. Cloud save failed: ${cloudError.message}`
          : "Project saved locally. Cloud save failed."
      );
      return;
    }
    router.push(`/projects/${project.id}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-6 rounded-md border border-line bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Tariff model name</span>
          <input
            type="text"
            value={tariffModelName}
            onChange={(event) => setTariffModelName(event.target.value)}
            placeholder="POTLL Tariffs"
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Tariff year name</span>
          <input
            type="text"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="2026 Private Network Tariff Review"
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium">Network name</span>
          <input
            type="text"
            value={networkName}
            onChange={(event) => setNetworkName(event.target.value)}
            placeholder="Semarts Private Electricity Network"
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">UtilityHub customer ref</span>
          <input
            type="text"
            value={utilityHubCustomerId}
            onChange={(event) => setUtilityHubCustomerId(event.target.value)}
            placeholder="Future UtilityHub ID"
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">UtilityHub site ref</span>
          <input
            type="text"
            value={utilityHubSiteId}
            onChange={(event) => setUtilityHubSiteId(event.target.value)}
            placeholder="Future UtilityHub ID"
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Tariff year</span>
          <input
            type="number"
            min="2000"
            max="2100"
            value={tariffYear}
            onChange={(event) => setTariffYear(event.target.value)}
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Effective date</span>
          <input
            type="date"
            value={effectiveDate}
            onChange={(event) => setEffectiveDate(event.target.value)}
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Reference period start</span>
          <input
            type="date"
            value={referencePeriodStart}
            onChange={(event) => setReferencePeriodStart(event.target.value)}
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Reference period end</span>
          <input
            type="date"
            value={referencePeriodEnd}
            onChange={(event) => setReferencePeriodEnd(event.target.value)}
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Billing period</span>
          <select
            value={billingPeriod}
            onChange={(event) => setBillingPeriod(event.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
          >
            <option>Monthly</option>
            <option>Quarterly</option>
            <option>Annual</option>
          </select>
        </label>
      </div>

      <CustomerClassTableEditor
        customerClasses={customerClasses}
        onChange={setCustomerClasses}
      />

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:border-t-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0">
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark disabled:cursor-not-allowed disabled:bg-ink/30 sm:w-fit"
        >
          Save draft
        </button>
      </div>
    </form>
  );
}
