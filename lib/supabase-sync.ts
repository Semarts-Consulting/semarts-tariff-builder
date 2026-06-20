import { importLocalProjectBackup } from "@/lib/project-storage";
import { supabase } from "@/lib/supabase";
import type {
  AssetInput,
  LocalProjectBackup,
  HalfHourlyImportRow,
  Project,
  ProjectAllocationMethods,
  ProjectCostPools,
  ProjectDataInputs
} from "@/types/project";

function sumHalfHourlyValues(row: HalfHourlyImportRow) {
  return row.settlementPeriodKwh.reduce((total, value) => total + value, 0);
}

function getBoundaryMeterBatchRows(
  projectId: string,
  rows: HalfHourlyImportRow[],
  userId: string
) {
  const batches = new Map<string, HalfHourlyImportRow[]>();

  rows.forEach((row) => {
    const existingRows = batches.get(row.importBatchId) ?? [];
    existingRows.push(row);
    batches.set(row.importBatchId, existingRows);
  });

  return Array.from(batches.entries()).map(([importBatchId, batchRows]) => {
    const dates = batchRows.map((row) => row.date).sort();
    const mpans = new Set(batchRows.map((row) => row.mpan));
    const latestRow = [...batchRows].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
    const hasIssues = batchRows.some(
      (row) =>
        row.settlementPeriodKwh.length !== 48 ||
        Math.abs(row.totalKwh - sumHalfHourlyValues(row)) > 0.01
    );

    return {
      user_id: userId,
      import_batch_id: importBatchId,
      project_local_id: projectId,
      source_file_name: latestRow?.sourceFileName ?? "Unknown file",
      uploaded_at: latestRow?.uploadedAt || new Date().toISOString(),
      row_count: batchRows.length,
      mpan_count: mpans.size,
      first_reading_date: dates[0] ?? null,
      last_reading_date: dates[dates.length - 1] ?? null,
      total_half_hour_kwh: batchRows.reduce(
        (total, row) => total + sumHalfHourlyValues(row),
        0
      ),
      has_issues: hasIssues
    };
  });
}

function toBoundaryMeterDataRow(
  projectId: string,
  row: HalfHourlyImportRow,
  userId: string
) {
  return {
    user_id: userId,
    project_local_id: projectId,
    import_batch_id: row.importBatchId,
    mpan: row.mpan,
    reading_date: row.date,
    total_kwh: row.totalKwh,
    settlement_period_kwh: row.settlementPeriodKwh,
    source_file_name: row.sourceFileName,
    uploaded_at: row.uploadedAt,
    row_fingerprint: row.rowFingerprint
  };
}

function fromBoundaryMeterDataRow(row: {
  id: string;
  mpan: string;
  reading_date: string;
  total_kwh: number;
  settlement_period_kwh: number[];
  source_file_name: string;
  uploaded_at: string;
  import_batch_id: string;
  row_fingerprint: string;
}): HalfHourlyImportRow {
  return {
    id: row.id,
    mpan: row.mpan,
    date: row.reading_date,
    totalKwh: row.total_kwh,
    settlementPeriodKwh: row.settlement_period_kwh,
    sourceFileName: row.source_file_name,
    uploadedAt: row.uploaded_at,
    importBatchId: row.import_batch_id,
    rowFingerprint: row.row_fingerprint
  };
}

function hasAssetIssues(row: AssetInput) {
  if (!row.description.trim() || !row.assetCategory.trim()) return true;
  if (row.lifeYears <= 0 || row.priorYearAssetValue < 0) return true;

  if (row.voltage === "EHV") return !["EHV", "EHV Local"].includes(row.networkLevel);
  if (row.voltage === "HV") return !["HV", "HV Local"].includes(row.networkLevel);
  if (row.voltage === "LV") return row.networkLevel !== "LV";
  if (row.voltage === "Metering") return row.networkLevel !== "Metering";

  return true;
}

function getAssetBatchRows(projectId: string, rows: AssetInput[], userId: string) {
  const batches = new Map<string, AssetInput[]>();

  rows.forEach((row) => {
    const batchId = row.importBatchId || `manual-${row.id}`;
    const existingRows = batches.get(batchId) ?? [];
    existingRows.push(row);
    batches.set(batchId, existingRows);
  });

  return Array.from(batches.entries()).map(([importBatchId, batchRows]) => {
    const latestRow = [...batchRows].sort((a, b) =>
      (b.uploadedAt || "").localeCompare(a.uploadedAt || "")
    )[0];

    return {
      user_id: userId,
      import_batch_id: importBatchId,
      project_local_id: projectId,
      source_file_name: latestRow?.sourceFileName || "Manual entry",
      uploaded_at: latestRow?.uploadedAt || new Date().toISOString(),
      row_count: batchRows.length,
      total_asset_value: batchRows.reduce((total, row) => total + row.priorYearAssetValue, 0),
      chargeable_asset_value: batchRows
        .filter((row) => row.isChargeableOnElectricityTariff)
        .reduce((total, row) => total + row.priorYearAssetValue, 0),
      has_issues: batchRows.some(hasAssetIssues)
    };
  });
}

function toAssetDataRow(projectId: string, row: AssetInput, userId: string) {
  const uploadedAt = row.uploadedAt || new Date().toISOString();
  const importBatchId = row.importBatchId || `manual-${row.id}`;

  return {
    user_id: userId,
    project_local_id: projectId,
    import_batch_id: importBatchId,
    description: row.description,
    asset_category: row.assetCategory,
    is_electrical_distribution_asset: row.isElectricalDistributionAsset,
    is_chargeable_on_electricity_tariff: row.isChargeableOnElectricityTariff,
    voltage: row.voltage,
    network_level: row.networkLevel,
    life_years: row.lifeYears,
    prior_year_asset_value: row.priorYearAssetValue,
    source_file_name: row.sourceFileName || "Manual entry",
    uploaded_at: uploadedAt,
    row_fingerprint: row.rowFingerprint || row.id
  };
}

function fromAssetDataRow(row: {
  id: string;
  description: string;
  asset_category: string;
  is_electrical_distribution_asset: boolean;
  is_chargeable_on_electricity_tariff: boolean;
  voltage: AssetInput["voltage"];
  network_level: string;
  life_years: number;
  prior_year_asset_value: number;
  source_file_name: string;
  uploaded_at: string;
  import_batch_id: string;
  row_fingerprint: string;
}): AssetInput {
  return {
    id: row.id,
    description: row.description,
    assetCategory: row.asset_category,
    isElectricalDistributionAsset: row.is_electrical_distribution_asset,
    isChargeableOnElectricityTariff: row.is_chargeable_on_electricity_tariff,
    voltage: row.voltage,
    networkLevel: row.network_level,
    lifeYears: row.life_years,
    priorYearAssetValue: row.prior_year_asset_value,
    sourceFileName: row.source_file_name,
    uploadedAt: row.uploaded_at,
    importBatchId: row.import_batch_id,
    rowFingerprint: row.row_fingerprint
  };
}

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

export async function getOptionalSignedInUserId() {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}

export async function saveProjectToSupabase(project: Project) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase.from("projects").upsert(toProjectRow(project, userId), {
    onConflict: "local_id"
  });

  if (error) {
    throw error;
  }

  return true;
}

export async function deleteProjectFromSupabase(projectId: string) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("local_id", projectId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

export async function saveDataInputsToSupabase(dataInputs: ProjectDataInputs) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase.from("project_data_inputs").upsert(
    {
      user_id: userId,
      project_local_id: dataInputs.projectId,
      rows: dataInputs.rows,
      assumptions: dataInputs.assumptions,
      last_updated: dataInputs.lastUpdated
    },
    { onConflict: "project_local_id" }
  );

  if (error) {
    throw error;
  }

  return true;
}

export async function saveCostPoolsToSupabase(costPools: ProjectCostPools) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase.from("project_cost_pools").upsert(
    {
      user_id: userId,
      project_local_id: costPools.projectId,
      rows: costPools.rows,
      assumptions: costPools.assumptions,
      last_updated: costPools.lastUpdated
    },
    { onConflict: "project_local_id" }
  );

  if (error) {
    throw error;
  }

  return true;
}

export async function saveAllocationMethodsToSupabase(
  allocationMethods: ProjectAllocationMethods
) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase.from("project_allocation_methods").upsert(
    {
      user_id: userId,
      project_local_id: allocationMethods.projectId,
      rows: allocationMethods.rows,
      assumptions: allocationMethods.assumptions,
      last_updated: allocationMethods.lastUpdated
    },
    { onConflict: "project_local_id" }
  );

  if (error) {
    throw error;
  }

  return true;
}

export async function saveBoundaryMeterDataToSupabase(
  projectId: string,
  rows: HalfHourlyImportRow[]
) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const batchRows = getBoundaryMeterBatchRows(projectId, rows, userId);
  const dataRows = rows.map((row) => toBoundaryMeterDataRow(projectId, row, userId));

  if (batchRows.length > 0) {
    const { error } = await supabase
      .from("boundary_meter_import_batches")
      .upsert(batchRows, { onConflict: "import_batch_id" });

    if (error) {
      throw error;
    }
  }

  if (dataRows.length > 0) {
    const { error } = await supabase
      .from("boundary_meter_data")
      .upsert(dataRows, { onConflict: "project_local_id,mpan,reading_date" });

    if (error) {
      throw error;
    }
  }

  return true;
}

export async function loadBoundaryMeterDataFromSupabase(projectId: string) {
  if (!supabase) {
    return [];
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("boundary_meter_data")
    .select(
      "id, mpan, reading_date, total_kwh, settlement_period_kwh, source_file_name, uploaded_at, import_batch_id, row_fingerprint"
    )
    .eq("project_local_id", projectId)
    .eq("user_id", userId)
    .order("reading_date", { ascending: true })
    .order("mpan", { ascending: true });

  if (error) {
    throw error;
  }

  return data.map(fromBoundaryMeterDataRow);
}

export async function deleteBoundaryMeterBatchFromSupabase(batchId: string) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from("boundary_meter_import_batches")
    .delete()
    .eq("import_batch_id", batchId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

export async function clearBoundaryMeterDataFromSupabase(projectId: string) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from("boundary_meter_import_batches")
    .delete()
    .eq("project_local_id", projectId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

export async function saveAssetDataToSupabase(projectId: string, rows: AssetInput[]) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const batchRows = getAssetBatchRows(projectId, rows, userId);
  const dataRows = rows.map((row) => toAssetDataRow(projectId, row, userId));

  if (batchRows.length > 0) {
    const { error } = await supabase
      .from("asset_import_batches")
      .upsert(batchRows, { onConflict: "import_batch_id" });

    if (error) {
      throw error;
    }
  }

  if (dataRows.length > 0) {
    const { error } = await supabase
      .from("asset_data")
      .upsert(dataRows, {
        onConflict: "project_local_id,description,asset_category,voltage,network_level"
      });

    if (error) {
      throw error;
    }
  }

  return true;
}

export async function loadAssetDataFromSupabase(projectId: string) {
  if (!supabase) {
    return [];
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("asset_data")
    .select(
      "id, description, asset_category, is_electrical_distribution_asset, is_chargeable_on_electricity_tariff, voltage, network_level, life_years, prior_year_asset_value, source_file_name, uploaded_at, import_batch_id, row_fingerprint"
    )
    .eq("project_local_id", projectId)
    .eq("user_id", userId)
    .order("description", { ascending: true })
    .order("asset_category", { ascending: true });

  if (error) {
    throw error;
  }

  return data.map(fromAssetDataRow);
}

export async function deleteAssetBatchFromSupabase(batchId: string) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from("asset_import_batches")
    .delete()
    .eq("import_batch_id", batchId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

export async function clearAssetDataFromSupabase(projectId: string) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from("asset_import_batches")
    .delete()
    .eq("project_local_id", projectId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
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
    })),
    methodologyInputs: []
  };

  importLocalProjectBackup(backup);
}
