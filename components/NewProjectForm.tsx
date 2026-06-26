"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { CustomerClassTableEditor } from "@/components/CustomerClassTableEditor";
import { parseCustomerClasses } from "@/lib/customer-classes";
import { createProjectId, saveProject } from "@/lib/project-storage";
import { saveProjectToSupabase } from "@/lib/supabase-sync";
import { readInternalUtilityHubSelectorApi } from "@/lib/utilityhub-selector-api-client";
import type { UtilityHubCustomerSiteContextItem } from "@/lib/utilityhub-customer-site-selector-adapter";
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
  const [utilityHubUserId, setUtilityHubUserId] = useState("user-admin");
  const [customerSiteOptions, setCustomerSiteOptions] = useState<
    UtilityHubCustomerSiteContextItem[]
  >([]);
  const [selectorStatus, setSelectorStatus] = useState("");
  const [selectorLoading, setSelectorLoading] = useState(false);
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

  async function loadCustomerSiteOptions() {
    const customerId = utilityHubCustomerId.trim();
    const userId = utilityHubUserId.trim();

    if (!customerId || !userId) {
      setSelectorStatus("Enter a UtilityHub customer ref and user ref before loading sites.");
      return;
    }

    setSelectorLoading(true);
    setSelectorStatus("Loading UtilityHub customer/site options.");

    try {
      const response = await readInternalUtilityHubSelectorApi<UtilityHubCustomerSiteContextItem>({
        resource: "customer-site-context",
        scope: {
          customerId,
          userId
        }
      });

      setCustomerSiteOptions(response.envelope.items);
      setSelectorStatus(
        response.envelope.state === "available"
          ? `${response.envelope.items.length} UtilityHub customer/site option${
              response.envelope.items.length === 1 ? "" : "s"
            } loaded.`
          : (response.envelope.message ?? `UtilityHub selector state: ${response.envelope.state}.`)
      );
    } catch (loadError) {
      setCustomerSiteOptions([]);
      setSelectorStatus(
        loadError instanceof Error
          ? `UtilityHub selector load failed: ${loadError.message}`
          : "UtilityHub selector load failed."
      );
    } finally {
      setSelectorLoading(false);
    }
  }

  function selectCustomerSite(value: string) {
    const option = customerSiteOptions.find(
      (candidate) => `${candidate.customerId}|${candidate.siteId}` === value
    );

    if (!option) {
      return;
    }

    setUtilityHubCustomerId(option.customerId);
    setUtilityHubSiteId(option.siteId);

    if (!networkName.trim()) {
      setNetworkName(option.siteName);
    }
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

      <section className="rounded-md border border-line bg-field p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">UtilityHub customer/site selector</h2>
            <p className="mt-1 text-sm text-ink/70">
              Load customer and site options from UtilityHub. Selected values populate the refs
              above and remain evidence-only until selected-input persistence is approved.
            </p>
          </div>
          <button
            type="button"
            onClick={loadCustomerSiteOptions}
            disabled={selectorLoading}
            className="w-fit rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold hover:border-semarts disabled:cursor-not-allowed disabled:bg-ink/10"
          >
            {selectorLoading ? "Loading" : "Load sites"}
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium">UtilityHub user ref</span>
            <input
              type="text"
              value={utilityHubUserId}
              onChange={(event) => setUtilityHubUserId(event.target.value)}
              className="mt-2 w-full rounded-md border border-line px-3 py-2 outline-none focus:border-semarts"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium">Available customer/site options</span>
            <select
              value={
                utilityHubCustomerId && utilityHubSiteId
                  ? `${utilityHubCustomerId}|${utilityHubSiteId}`
                  : ""
              }
              onChange={(event) => selectCustomerSite(event.target.value)}
              className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 outline-none focus:border-semarts"
            >
              <option value="">Select a loaded UtilityHub site</option>
              {customerSiteOptions.map((option) => (
                <option
                  key={`${option.customerId}|${option.siteId}`}
                  value={`${option.customerId}|${option.siteId}`}
                >
                  {option.customerName} / {option.siteName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectorStatus ? (
          <p className="mt-3 text-sm font-medium text-semarts-dark">{selectorStatus}</p>
        ) : null}
      </section>

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
