import { importLocalProjectBackup } from "@/lib/project-storage";
import { supabase } from "@/lib/supabase";
import type {
  AssetInput,
  DirectCostInput,
  EmployeeCostInput,
  IndirectOverheadInput,
  LocalProjectBackup,
  HalfHourlyImportRow,
  Project,
  ProjectAllocationMethods,
  ProjectCostPools,
  ProjectDataInputs,
  SupplyReferenceData,
  SupplyDetailsInput
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

function hasDirectCostIssues(row: DirectCostInput) {
  return !row.description.trim() || !row.costByType.trim() || row.annualValue < 0;
}

function getDirectCostBatchRows(projectId: string, rows: DirectCostInput[], userId: string) {
  const batches = new Map<string, DirectCostInput[]>();

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
      total_annual_value: batchRows.reduce((total, row) => total + row.annualValue, 0),
      has_issues: batchRows.some(hasDirectCostIssues)
    };
  });
}

function toDirectCostDataRow(projectId: string, row: DirectCostInput, userId: string) {
  const uploadedAt = row.uploadedAt || new Date().toISOString();
  const importBatchId = row.importBatchId || `manual-${row.id}`;

  return {
    user_id: userId,
    project_local_id: projectId,
    import_batch_id: importBatchId,
    description: row.description,
    cost_by_type: row.costByType,
    annual_value: row.annualValue,
    source_file_name: row.sourceFileName || "Manual entry",
    uploaded_at: uploadedAt,
    row_fingerprint: row.rowFingerprint || row.id
  };
}

function fromDirectCostDataRow(row: {
  id: string;
  description: string;
  cost_by_type: string;
  annual_value: number;
  source_file_name: string;
  uploaded_at: string;
  import_batch_id: string;
  row_fingerprint: string;
}): DirectCostInput {
  return {
    id: row.id,
    description: row.description,
    costByType: row.cost_by_type,
    annualValue: row.annual_value,
    comment: "",
    sourceFileName: row.source_file_name,
    uploadedAt: row.uploaded_at,
    importBatchId: row.import_batch_id,
    rowFingerprint: row.row_fingerprint
  };
}

function hasEmployeeCostIssues(row: EmployeeCostInput) {
  return !row.role.trim() || row.fte < 0 || row.timePercent < 0 || row.timePercent > 100;
}

function getEmployeeCostBatchRows(projectId: string, rows: EmployeeCostInput[], userId: string) {
  const batches = new Map<string, EmployeeCostInput[]>();

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
      total_fte: batchRows.reduce((total, row) => total + row.fte, 0),
      weighted_fte: batchRows.reduce(
        (total, row) => total + row.fte * (row.timePercent / 100),
        0
      ),
      has_issues: batchRows.some(hasEmployeeCostIssues)
    };
  });
}

function toEmployeeCostDataRow(projectId: string, row: EmployeeCostInput, userId: string) {
  const uploadedAt = row.uploadedAt || new Date().toISOString();
  const importBatchId = row.importBatchId || `manual-${row.id}`;

  return {
    user_id: userId,
    project_local_id: projectId,
    import_batch_id: importBatchId,
    role: row.role,
    role_type: row.roleType,
    fte: row.fte,
    time_percent: row.timePercent,
    source_file_name: row.sourceFileName || "Manual entry",
    uploaded_at: uploadedAt,
    row_fingerprint: row.rowFingerprint || row.id
  };
}

function fromEmployeeCostDataRow(row: {
  id: string;
  role: string;
  role_type: EmployeeCostInput["roleType"];
  fte: number;
  time_percent: number;
  source_file_name: string;
  uploaded_at: string;
  import_batch_id: string;
  row_fingerprint: string;
}): EmployeeCostInput {
  return {
    id: row.id,
    role: row.role,
    roleType: row.role_type,
    fte: row.fte,
    timePercent: row.time_percent,
    comment: "",
    sourceFileName: row.source_file_name,
    uploadedAt: row.uploaded_at,
    importBatchId: row.import_batch_id,
    rowFingerprint: row.row_fingerprint
  };
}

function hasIndirectOverheadIssues(row: IndirectOverheadInput) {
  return !row.description.trim() || row.annualCost < 0;
}

function getIndirectOverheadBatchRows(
  projectId: string,
  rows: IndirectOverheadInput[],
  userId: string
) {
  const batches = new Map<string, IndirectOverheadInput[]>();

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
      total_annual_cost: batchRows.reduce((total, row) => total + row.annualCost, 0),
      has_issues: batchRows.some(hasIndirectOverheadIssues)
    };
  });
}

function toIndirectOverheadDataRow(
  projectId: string,
  row: IndirectOverheadInput,
  userId: string
) {
  const uploadedAt = row.uploadedAt || new Date().toISOString();
  const importBatchId = row.importBatchId || `manual-${row.id}`;

  return {
    user_id: userId,
    project_local_id: projectId,
    import_batch_id: importBatchId,
    description: row.description,
    annual_cost: row.annualCost,
    source_file_name: row.sourceFileName || "Manual entry",
    uploaded_at: uploadedAt,
    row_fingerprint: row.rowFingerprint || row.id
  };
}

function fromIndirectOverheadDataRow(row: {
  id: string;
  description: string;
  annual_cost: number;
  source_file_name: string;
  uploaded_at: string;
  import_batch_id: string;
  row_fingerprint: string;
}): IndirectOverheadInput {
  return {
    id: row.id,
    description: row.description,
    annualCost: row.annual_cost,
    comment: "",
    sourceFileName: row.source_file_name,
    uploadedAt: row.uploaded_at,
    importBatchId: row.import_batch_id,
    rowFingerprint: row.row_fingerprint
  };
}

function toSupplyDetailsDataRow(projectId: string, row: SupplyDetailsInput, userId: string) {
  return {
    id: row.id,
    user_id: userId,
    project_local_id: projectId,
    mpan: row.mpan,
    supply_capacity_kva: row.supplyCapacityKva,
    voltage: row.voltage,
    transmission: row.transmission,
    distribution: row.distribution,
    tnuos_non_locational_charge_per_day: row.tnuosNonLocationalChargePerDay,
    tnuos_triad_charge_per_kw: row.tnuosTriadChargePerKw,
    duos_fixed_charge_per_day: row.duosFixedChargePerDay,
    duos_import_capacity_pence_per_kva_per_day:
      row.duosImportCapacityPencePerKvaPerDay,
    duos_red_unit_pence_per_kwh: row.duosRedUnitPencePerKwh,
    duos_amber_unit_pence_per_kwh: row.duosAmberUnitPencePerKwh,
    duos_green_unit_pence_per_kwh: row.duosGreenUnitPencePerKwh,
    duos_super_red_unit_pence_per_kwh: row.duosSuperRedUnitPencePerKwh
  };
}

function toSupplyContractChargeDataRows(
  projectId: string,
  supplyRows: SupplyDetailsInput[],
  userId: string
) {
  return supplyRows.flatMap((supplyRow) =>
    supplyRow.supplyContractCharges.map((charge) => ({
      id: charge.id,
      user_id: userId,
      project_local_id: projectId,
      supply_detail_id: supplyRow.id,
      charge_name: charge.chargeName,
      losses: charge.losses,
      charge_type: charge.chargeType,
      unit_of_measurement: charge.unitOfMeasurement,
      time_of_use: charge.timeOfUse,
      custom_time_of_use: charge.customTimeOfUse,
      rate_unit: charge.rateUnit,
      rate: charge.rate
    }))
  );
}

function fromSupplyDataRows(
  detailRows: {
    id: string;
    mpan: string;
    supply_capacity_kva: number;
    voltage: SupplyDetailsInput["voltage"];
    transmission: SupplyDetailsInput["transmission"];
    distribution: SupplyDetailsInput["distribution"];
    tnuos_non_locational_charge_per_day: number;
    tnuos_triad_charge_per_kw: number;
    duos_fixed_charge_per_day: number;
    duos_import_capacity_pence_per_kva_per_day: number;
    duos_red_unit_pence_per_kwh: number;
    duos_amber_unit_pence_per_kwh: number;
    duos_green_unit_pence_per_kwh: number;
    duos_super_red_unit_pence_per_kwh: number;
  }[],
  chargeRows: {
    id: string;
    supply_detail_id: string;
    charge_name: string;
    losses: SupplyDetailsInput["supplyContractCharges"][number]["losses"];
    charge_type: SupplyDetailsInput["supplyContractCharges"][number]["chargeType"];
    unit_of_measurement: SupplyDetailsInput["supplyContractCharges"][number]["unitOfMeasurement"];
    time_of_use: SupplyDetailsInput["supplyContractCharges"][number]["timeOfUse"];
    custom_time_of_use: SupplyDetailsInput["supplyContractCharges"][number]["customTimeOfUse"];
    rate_unit: SupplyDetailsInput["supplyContractCharges"][number]["rateUnit"];
    rate: number;
  }[]
): SupplyDetailsInput[] {
  function normaliseCustomTimeOfUse(
    value: Partial<SupplyDetailsInput["supplyContractCharges"][number]["customTimeOfUse"]>
  ): SupplyDetailsInput["supplyContractCharges"][number]["customTimeOfUse"] {
    return {
      daysOfWeek: value.daysOfWeek ?? [],
      appliesOnBankHolidays: value.appliesOnBankHolidays ?? false,
      months: value.months ?? [],
      startTime: value.startTime ?? "00:00",
      endTime: value.endTime ?? "23:30"
    };
  }

  return detailRows.map((row) => ({
    id: row.id,
    mpan: row.mpan,
    supplyCapacityKva: row.supply_capacity_kva,
    voltage: row.voltage,
    transmission: row.transmission,
    distribution: row.distribution,
    tnuosNonLocationalChargePerDay: row.tnuos_non_locational_charge_per_day,
    tnuosTriadChargePerKw: row.tnuos_triad_charge_per_kw,
    duosFixedChargePerDay: row.duos_fixed_charge_per_day,
    duosImportCapacityPencePerKvaPerDay:
      row.duos_import_capacity_pence_per_kva_per_day,
    duosRedUnitPencePerKwh: row.duos_red_unit_pence_per_kwh,
    duosAmberUnitPencePerKwh: row.duos_amber_unit_pence_per_kwh,
    duosGreenUnitPencePerKwh: row.duos_green_unit_pence_per_kwh,
    duosSuperRedUnitPencePerKwh: row.duos_super_red_unit_pence_per_kwh,
    supplyContractCharges: chargeRows
      .filter((charge) => charge.supply_detail_id === row.id)
      .map((charge) => ({
        id: charge.id,
        chargeName: charge.charge_name,
        losses: charge.losses,
        chargeType: charge.charge_type,
        unitOfMeasurement: charge.unit_of_measurement,
        timeOfUse: charge.time_of_use,
        customTimeOfUse: normaliseCustomTimeOfUse(charge.custom_time_of_use),
        rateUnit: charge.rate_unit,
        rate: charge.rate
      }))
  }));
}

function fromSupplyReferenceRows(
  dnoRows: {
    distributor_id: string;
    dno_name: string;
    network_area: string;
    operator_code: string;
    notes: string;
  }[],
  dataSetRows: {
    id: string;
    distributor_id: string;
    charging_year: string;
    review_status: SupplyReferenceData["dataSets"][number]["reviewStatus"];
    extraction_status: SupplyReferenceData["dataSets"][number]["extractionStatus"];
    time_of_use_review_status: SupplyReferenceData["dataSets"][number]["timeOfUseReviewStatus"];
    losses_review_status: SupplyReferenceData["dataSets"][number]["lossesReviewStatus"];
    source_document_title: string;
    source_document_url: string;
    source_reviewed_at: string | null;
    source_notes: string;
    time_of_use_definitions: SupplyReferenceData["dataSets"][number]["timeOfUseDefinitions"];
    distribution_loss_factors: SupplyReferenceData["dataSets"][number]["distributionLossFactors"];
  }[]
): SupplyReferenceData {
  return {
    dnoNetworkAreas: dnoRows.map((row) => ({
      distributorId: row.distributor_id,
      dnoName: row.dno_name,
      networkArea: row.network_area,
      operatorCode: row.operator_code,
      notes: row.notes
    })),
    dataSets: dataSetRows.map((row) => ({
      id: row.id,
      distributorId: row.distributor_id,
      chargingYear: row.charging_year,
      reviewStatus: row.review_status,
      extractionStatus: row.extraction_status,
      timeOfUseReviewStatus: row.time_of_use_review_status,
      lossesReviewStatus: row.losses_review_status,
      sourceDocumentTitle: row.source_document_title,
      sourceDocumentUrl: row.source_document_url,
      sourceReviewedAt: row.source_reviewed_at ?? "",
      sourceNotes: row.source_notes,
      timeOfUseDefinitions: row.time_of_use_definitions,
      distributionLossFactors: row.distribution_loss_factors
    })),
    lastUpdated: new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date())
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

export async function saveDirectCostDataToSupabase(projectId: string, rows: DirectCostInput[]) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const batchRows = getDirectCostBatchRows(projectId, rows, userId);
  const dataRows = rows.map((row) => toDirectCostDataRow(projectId, row, userId));

  if (batchRows.length > 0) {
    const { error } = await supabase
      .from("direct_cost_import_batches")
      .upsert(batchRows, { onConflict: "import_batch_id" });

    if (error) {
      throw error;
    }
  }

  if (dataRows.length > 0) {
    const { error } = await supabase
      .from("direct_cost_data")
      .upsert(dataRows, { onConflict: "project_local_id,description,cost_by_type" });

    if (error) {
      throw error;
    }
  }

  return true;
}

export async function loadDirectCostDataFromSupabase(projectId: string) {
  if (!supabase) {
    return [];
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("direct_cost_data")
    .select(
      "id, description, cost_by_type, annual_value, source_file_name, uploaded_at, import_batch_id, row_fingerprint"
    )
    .eq("project_local_id", projectId)
    .eq("user_id", userId)
    .order("description", { ascending: true })
    .order("cost_by_type", { ascending: true });

  if (error) {
    throw error;
  }

  return data.map(fromDirectCostDataRow);
}

export async function deleteDirectCostBatchFromSupabase(batchId: string) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from("direct_cost_import_batches")
    .delete()
    .eq("import_batch_id", batchId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

export async function clearDirectCostDataFromSupabase(projectId: string) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from("direct_cost_import_batches")
    .delete()
    .eq("project_local_id", projectId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

export async function saveEmployeeCostDataToSupabase(
  projectId: string,
  rows: EmployeeCostInput[]
) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const batchRows = getEmployeeCostBatchRows(projectId, rows, userId);
  const dataRows = rows.map((row) => toEmployeeCostDataRow(projectId, row, userId));

  if (batchRows.length > 0) {
    const { error } = await supabase
      .from("employee_cost_import_batches")
      .upsert(batchRows, { onConflict: "import_batch_id" });

    if (error) {
      throw error;
    }
  }

  if (dataRows.length > 0) {
    const { error } = await supabase
      .from("employee_cost_data")
      .upsert(dataRows, { onConflict: "project_local_id,role,role_type" });

    if (error) {
      throw error;
    }
  }

  return true;
}

export async function loadEmployeeCostDataFromSupabase(projectId: string) {
  if (!supabase) {
    return [];
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("employee_cost_data")
    .select(
      "id, role, role_type, fte, time_percent, source_file_name, uploaded_at, import_batch_id, row_fingerprint"
    )
    .eq("project_local_id", projectId)
    .eq("user_id", userId)
    .order("role", { ascending: true })
    .order("role_type", { ascending: true });

  if (error) {
    throw error;
  }

  return data.map(fromEmployeeCostDataRow);
}

export async function deleteEmployeeCostBatchFromSupabase(batchId: string) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from("employee_cost_import_batches")
    .delete()
    .eq("import_batch_id", batchId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

export async function clearEmployeeCostDataFromSupabase(projectId: string) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from("employee_cost_import_batches")
    .delete()
    .eq("project_local_id", projectId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

export async function saveIndirectOverheadDataToSupabase(
  projectId: string,
  rows: IndirectOverheadInput[]
) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const batchRows = getIndirectOverheadBatchRows(projectId, rows, userId);
  const dataRows = rows.map((row) => toIndirectOverheadDataRow(projectId, row, userId));

  if (batchRows.length > 0) {
    const { error } = await supabase
      .from("indirect_overhead_import_batches")
      .upsert(batchRows, { onConflict: "import_batch_id" });

    if (error) {
      throw error;
    }
  }

  if (dataRows.length > 0) {
    const { error } = await supabase
      .from("indirect_overhead_data")
      .upsert(dataRows, { onConflict: "project_local_id,description" });

    if (error) {
      throw error;
    }
  }

  return true;
}

export async function loadIndirectOverheadDataFromSupabase(projectId: string) {
  if (!supabase) {
    return [];
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("indirect_overhead_data")
    .select(
      "id, description, annual_cost, source_file_name, uploaded_at, import_batch_id, row_fingerprint"
    )
    .eq("project_local_id", projectId)
    .eq("user_id", userId)
    .order("description", { ascending: true });

  if (error) {
    throw error;
  }

  return data.map(fromIndirectOverheadDataRow);
}

export async function deleteIndirectOverheadBatchFromSupabase(batchId: string) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from("indirect_overhead_import_batches")
    .delete()
    .eq("import_batch_id", batchId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

export async function clearIndirectOverheadDataFromSupabase(projectId: string) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from("indirect_overhead_import_batches")
    .delete()
    .eq("project_local_id", projectId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

export async function saveSupplyDetailsToSupabase(
  projectId: string,
  rows: SupplyDetailsInput[]
) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error: deleteError } = await supabase
    .from("supply_details")
    .delete()
    .eq("project_local_id", projectId)
    .eq("user_id", userId);

  if (deleteError) {
    throw deleteError;
  }

  if (rows.length === 0) {
    return true;
  }

  const detailRows = rows.map((row) => toSupplyDetailsDataRow(projectId, row, userId));
  const chargeRows = toSupplyContractChargeDataRows(projectId, rows, userId);

  const { error: detailError } = await supabase.from("supply_details").insert(detailRows);

  if (detailError) {
    throw detailError;
  }

  if (chargeRows.length > 0) {
    const { error: chargeError } = await supabase
      .from("supply_contract_charges")
      .insert(chargeRows);

    if (chargeError) {
      throw chargeError;
    }
  }

  return true;
}

export async function loadSupplyDetailsFromSupabase(projectId: string) {
  if (!supabase) {
    return [];
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return [];
  }

  const { data: detailRows, error: detailError } = await supabase
    .from("supply_details")
    .select(
      "id, mpan, supply_capacity_kva, voltage, transmission, distribution, tnuos_non_locational_charge_per_day, tnuos_triad_charge_per_kw, duos_fixed_charge_per_day, duos_import_capacity_pence_per_kva_per_day, duos_red_unit_pence_per_kwh, duos_amber_unit_pence_per_kwh, duos_green_unit_pence_per_kwh, duos_super_red_unit_pence_per_kwh"
    )
    .eq("project_local_id", projectId)
    .eq("user_id", userId)
    .order("mpan", { ascending: true });

  if (detailError) {
    throw detailError;
  }

  const { data: chargeRows, error: chargeError } = await supabase
    .from("supply_contract_charges")
    .select(
      "id, supply_detail_id, charge_name, losses, charge_type, unit_of_measurement, time_of_use, custom_time_of_use, rate_unit, rate"
    )
    .eq("project_local_id", projectId)
    .eq("user_id", userId)
    .order("charge_name", { ascending: true });

  if (chargeError) {
    throw chargeError;
  }

  return fromSupplyDataRows(detailRows, chargeRows);
}

export async function clearSupplyDetailsFromSupabase(projectId: string) {
  if (!supabase) {
    return false;
  }

  const userId = await getOptionalSignedInUserId();

  if (!userId) {
    return false;
  }

  const { error } = await supabase
    .from("supply_details")
    .delete()
    .eq("project_local_id", projectId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return true;
}

export async function loadSupplyReferenceDataFromSupabase() {
  if (!supabase) {
    return null;
  }

  const { data: dnoRows, error: dnoError } = await supabase
    .from("supply_reference_dno_network_areas")
    .select("distributor_id, dno_name, network_area, operator_code, notes")
    .order("distributor_id", { ascending: true });

  if (dnoError) {
    throw dnoError;
  }

  const { data: dataSetRows, error: dataSetError } = await supabase
    .from("supply_reference_data_sets")
    .select(
      "id, distributor_id, charging_year, review_status, extraction_status, time_of_use_review_status, losses_review_status, source_document_title, source_document_url, source_reviewed_at, source_notes, time_of_use_definitions, distribution_loss_factors"
    )
    .order("distributor_id", { ascending: true })
    .order("charging_year", { ascending: false });

  if (dataSetError) {
    throw dataSetError;
  }

  if ((dnoRows ?? []).length === 0 && (dataSetRows ?? []).length === 0) {
    return null;
  }

  return fromSupplyReferenceRows(dnoRows ?? [], dataSetRows ?? []);
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
