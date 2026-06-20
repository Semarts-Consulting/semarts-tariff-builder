"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { createProjectId, saveProject } from "@/lib/project-storage";
import type { Project } from "@/types/project";

const todayFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

function getTodayLabel() {
  return todayFormatter.format(new Date());
}

function splitCustomerClasses(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function NewProjectForm() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [networkName, setNetworkName] = useState("");
  const [tariffYear, setTariffYear] = useState(new Date().getFullYear().toString());
  const [effectiveDate, setEffectiveDate] = useState("");
  const [billingPeriod, setBillingPeriod] = useState("Monthly");
  const [customerClasses, setCustomerClasses] = useState(
    "Residential, Small business, Common area"
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setError("Complete the required fields before saving the project.");
      return;
    }

    const project: Project = {
      id: createProjectId(projectName),
      name: projectName.trim(),
      networkName: networkName.trim(),
      tariffYear: Number(tariffYear),
      effectiveDate,
      billingPeriod,
      customerClasses: splitCustomerClasses(customerClasses),
      status: "Draft",
      lastUpdated: getTodayLabel()
    };

    saveProject(project);
    router.push(`/projects/${project.id}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-6 rounded-md border border-line bg-white p-6 shadow-sm"
    >
      <label className="block">
        <span className="text-sm font-medium">Project name</span>
        <input
          type="text"
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          placeholder="2026 Private Network Tariff Review"
          className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
        />
      </label>

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

      <div className="grid gap-5 md:grid-cols-[0.75fr_1.25fr]">
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

        <label className="block">
          <span className="text-sm font-medium">Customer classes</span>
          <input
            type="text"
            value={customerClasses}
            onChange={(event) => setCustomerClasses(event.target.value)}
            className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
          />
        </label>
      </div>

      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-md bg-semarts px-4 py-2 text-sm font-semibold text-white hover:bg-semarts-dark disabled:cursor-not-allowed disabled:bg-ink/30"
      >
        Save draft
      </button>
    </form>
  );
}
