import { importLocalProjectBackup } from "@/lib/project-storage";
import { supabase } from "@/lib/supabase";
import type { LocalProjectBackup, Project } from "@/types/project";

function toProjectRow(project: Project, userId: string) {
  return {
    user_id: userId,
    local_id: project.id,
    name: project.name,
    network_name: project.networkName,
    tariff_year: project.tariffYear,
    effective_date: project.effectiveDate,
    billing_period: project.billingPeriod,
    customer_classes: project.customerClasses,
    status: project.status,
    last_updated: project.lastUpdated
  };
}

function fromProjectRow(row: {
  local_id: string;
  name: string;
  network_name: string;
  tariff_year: number;
  effective_date: string;
  billing_period: string;
  customer_classes: string[];
  status: Project["status"];
  last_updated: string;
}): Project {
  return {
    id: row.local_id,
    name: row.name,
    networkName: row.network_name,
    tariffYear: row.tariff_year,
    effectiveDate: row.effective_date,
    billingPeriod: row.billing_period,
    customerClasses: row.customer_classes,
    status: row.status,
    lastUpdated: row.last_updated
  };
}

async function getSignedInUserId() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("Sign in before syncing projects.");
  }

  return data.user.id;
}

export async function pushBackupToSupabase(backup: LocalProjectBackup) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const userId = await getSignedInUserId();
  const projectRows = backup.projects.map((project) => toProjectRow(project, userId));

  if (projectRows.length > 0) {
    const { error } = await supabase.from("projects").upsert(projectRows, {
      onConflict: "local_id"
    });

    if (error) {
      throw error;
    }
  }

  const dataInputRows = backup.dataInputs.map((item) => ({
    user_id: userId,
    project_local_id: item.projectId,
    rows: item.rows,
    assumptions: item.assumptions,
    last_updated: item.lastUpdated
  }));
  const costPoolRows = backup.costPools.map((item) => ({
    user_id: userId,
    project_local_id: item.projectId,
    rows: item.rows,
    assumptions: item.assumptions,
    last_updated: item.lastUpdated
  }));
  const allocationRows = backup.allocationMethods.map((item) => ({
    user_id: userId,
    project_local_id: item.projectId,
    rows: item.rows,
    assumptions: item.assumptions,
    last_updated: item.lastUpdated
  }));

  if (dataInputRows.length > 0) {
    const { error } = await supabase.from("project_data_inputs").upsert(dataInputRows, {
      onConflict: "project_local_id"
    });
    if (error) throw error;
  }

  if (costPoolRows.length > 0) {
    const { error } = await supabase.from("project_cost_pools").upsert(costPoolRows, {
      onConflict: "project_local_id"
    });
    if (error) throw error;
  }

  if (allocationRows.length > 0) {
    const { error } = await supabase.from("project_allocation_methods").upsert(allocationRows, {
      onConflict: "project_local_id"
    });
    if (error) throw error;
  }
}

export async function pullBackupFromSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  await getSignedInUserId();

  const [projectsResult, dataInputsResult, costPoolsResult, allocationMethodsResult] =
    await Promise.all([
      supabase.from("projects").select("*").order("updated_at", { ascending: false }),
      supabase.from("project_data_inputs").select("*"),
      supabase.from("project_cost_pools").select("*"),
      supabase.from("project_allocation_methods").select("*")
    ]);

  if (projectsResult.error) throw projectsResult.error;
  if (dataInputsResult.error) throw dataInputsResult.error;
  if (costPoolsResult.error) throw costPoolsResult.error;
  if (allocationMethodsResult.error) throw allocationMethodsResult.error;

  const backup: LocalProjectBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: projectsResult.data.map(fromProjectRow),
    dataInputs: dataInputsResult.data.map((item) => ({
      projectId: item.project_local_id,
      rows: item.rows,
      assumptions: item.assumptions,
      lastUpdated: item.last_updated
    })),
    costPools: costPoolsResult.data.map((item) => ({
      projectId: item.project_local_id,
      rows: item.rows,
      assumptions: item.assumptions,
      lastUpdated: item.last_updated
    })),
    allocationMethods: allocationMethodsResult.data.map((item) => ({
      projectId: item.project_local_id,
      rows: item.rows,
      assumptions: item.assumptions,
      lastUpdated: item.last_updated
    }))
  };

  importLocalProjectBackup(backup);
}
