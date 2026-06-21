alter table public.projects
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.project_data_inputs
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.project_cost_pools
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.project_allocation_methods
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.boundary_meter_import_batches
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.boundary_meter_data
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.asset_import_batches
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.asset_data
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.direct_cost_import_batches
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.direct_cost_data
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.employee_cost_import_batches
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.employee_cost_data
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.indirect_overhead_import_batches
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.indirect_overhead_data
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.supply_details
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.supply_contract_charges
add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists semarts_admin_users_user_id_idx on public.semarts_admin_users(user_id);
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists project_data_inputs_user_id_idx on public.project_data_inputs(user_id);
create index if not exists project_cost_pools_user_id_idx on public.project_cost_pools(user_id);
create index if not exists project_allocation_methods_user_id_idx on public.project_allocation_methods(user_id);
create index if not exists boundary_meter_import_batches_user_id_idx on public.boundary_meter_import_batches(user_id);
create index if not exists boundary_meter_import_batches_project_idx on public.boundary_meter_import_batches(project_local_id);
create index if not exists boundary_meter_data_user_id_idx on public.boundary_meter_data(user_id);
create index if not exists boundary_meter_data_project_idx on public.boundary_meter_data(project_local_id);
create index if not exists boundary_meter_data_batch_idx on public.boundary_meter_data(import_batch_id);
create index if not exists asset_import_batches_user_id_idx on public.asset_import_batches(user_id);
create index if not exists asset_import_batches_project_idx on public.asset_import_batches(project_local_id);
create index if not exists asset_data_user_id_idx on public.asset_data(user_id);
create index if not exists asset_data_project_idx on public.asset_data(project_local_id);
create index if not exists asset_data_batch_idx on public.asset_data(import_batch_id);
create index if not exists direct_cost_import_batches_user_id_idx on public.direct_cost_import_batches(user_id);
create index if not exists direct_cost_import_batches_project_idx on public.direct_cost_import_batches(project_local_id);
create index if not exists direct_cost_data_user_id_idx on public.direct_cost_data(user_id);
create index if not exists direct_cost_data_project_idx on public.direct_cost_data(project_local_id);
create index if not exists direct_cost_data_batch_idx on public.direct_cost_data(import_batch_id);
create index if not exists employee_cost_import_batches_user_id_idx on public.employee_cost_import_batches(user_id);
create index if not exists employee_cost_import_batches_project_idx on public.employee_cost_import_batches(project_local_id);
create index if not exists employee_cost_data_user_id_idx on public.employee_cost_data(user_id);
create index if not exists employee_cost_data_project_idx on public.employee_cost_data(project_local_id);
create index if not exists employee_cost_data_batch_idx on public.employee_cost_data(import_batch_id);
create index if not exists indirect_overhead_import_batches_user_id_idx on public.indirect_overhead_import_batches(user_id);
create index if not exists indirect_overhead_import_batches_project_idx on public.indirect_overhead_import_batches(project_local_id);
create index if not exists indirect_overhead_data_user_id_idx on public.indirect_overhead_data(user_id);
create index if not exists indirect_overhead_data_project_idx on public.indirect_overhead_data(project_local_id);
create index if not exists indirect_overhead_data_batch_idx on public.indirect_overhead_data(import_batch_id);
create index if not exists supply_details_user_id_idx on public.supply_details(user_id);
create index if not exists supply_details_project_idx on public.supply_details(project_local_id);
create index if not exists supply_contract_charges_user_id_idx on public.supply_contract_charges(user_id);
create index if not exists supply_contract_charges_project_idx on public.supply_contract_charges(project_local_id);
create index if not exists supply_contract_charges_supply_detail_idx on public.supply_contract_charges(supply_detail_id);
create index if not exists supply_reference_dno_network_areas_distributor_idx on public.supply_reference_dno_network_areas(distributor_id);
create index if not exists supply_reference_data_sets_distributor_year_idx on public.supply_reference_data_sets(distributor_id, charging_year);
create index if not exists supply_reference_source_documents_distributor_year_idx on public.supply_reference_source_documents(distributor_id, charging_year);
create index if not exists supply_reference_source_documents_status_idx on public.supply_reference_source_documents(extraction_status);
create index if not exists supply_reference_tou_candidates_document_idx on public.supply_reference_tou_candidates(source_document_id);
create index if not exists supply_reference_tou_candidates_distributor_year_idx on public.supply_reference_tou_candidates(distributor_id, charging_year);
create index if not exists supply_reference_tou_candidates_status_idx on public.supply_reference_tou_candidates(status);
create index if not exists supply_reference_loss_candidates_document_idx on public.supply_reference_loss_candidates(source_document_id);
create index if not exists supply_reference_loss_candidates_distributor_year_idx on public.supply_reference_loss_candidates(distributor_id, charging_year);
create index if not exists supply_reference_loss_candidates_status_idx on public.supply_reference_loss_candidates(status);

drop policy if exists "Semarts admins can read their admin marker" on public.semarts_admin_users;
create policy "Semarts admins can read their admin marker"
on public.semarts_admin_users for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage Semarts admin markers" on public.semarts_admin_users;

drop policy if exists "Users can read their projects" on public.projects;
create policy "Users can read their projects"
on public.projects for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert their projects" on public.projects;
create policy "Users can insert their projects"
on public.projects for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their projects" on public.projects;
create policy "Users can update their projects"
on public.projects for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their projects" on public.projects;
create policy "Users can delete their projects"
on public.projects for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read their data inputs" on public.project_data_inputs;
create policy "Users can read their data inputs"
on public.project_data_inputs for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can upsert their data inputs" on public.project_data_inputs;
create policy "Users can upsert their data inputs"
on public.project_data_inputs for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their cost pools" on public.project_cost_pools;
create policy "Users can read their cost pools"
on public.project_cost_pools for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can upsert their cost pools" on public.project_cost_pools;
create policy "Users can upsert their cost pools"
on public.project_cost_pools for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their allocation methods" on public.project_allocation_methods;
create policy "Users can read their allocation methods"
on public.project_allocation_methods for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can upsert their allocation methods" on public.project_allocation_methods;
create policy "Users can upsert their allocation methods"
on public.project_allocation_methods for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their boundary meter import batches" on public.boundary_meter_import_batches;
create policy "Users can read their boundary meter import batches"
on public.boundary_meter_import_batches for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage their boundary meter import batches" on public.boundary_meter_import_batches;
create policy "Users can manage their boundary meter import batches"
on public.boundary_meter_import_batches for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their boundary meter data" on public.boundary_meter_data;
create policy "Users can read their boundary meter data"
on public.boundary_meter_data for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage their boundary meter data" on public.boundary_meter_data;
create policy "Users can manage their boundary meter data"
on public.boundary_meter_data for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their asset import batches" on public.asset_import_batches;
create policy "Users can read their asset import batches"
on public.asset_import_batches for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage their asset import batches" on public.asset_import_batches;
create policy "Users can manage their asset import batches"
on public.asset_import_batches for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their asset data" on public.asset_data;
create policy "Users can read their asset data"
on public.asset_data for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage their asset data" on public.asset_data;
create policy "Users can manage their asset data"
on public.asset_data for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their direct cost import batches" on public.direct_cost_import_batches;
create policy "Users can read their direct cost import batches"
on public.direct_cost_import_batches for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage their direct cost import batches" on public.direct_cost_import_batches;
create policy "Users can manage their direct cost import batches"
on public.direct_cost_import_batches for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their direct cost data" on public.direct_cost_data;
create policy "Users can read their direct cost data"
on public.direct_cost_data for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage their direct cost data" on public.direct_cost_data;
create policy "Users can manage their direct cost data"
on public.direct_cost_data for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their employee cost import batches" on public.employee_cost_import_batches;
create policy "Users can read their employee cost import batches"
on public.employee_cost_import_batches for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage their employee cost import batches" on public.employee_cost_import_batches;
create policy "Users can manage their employee cost import batches"
on public.employee_cost_import_batches for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their employee cost data" on public.employee_cost_data;
create policy "Users can read their employee cost data"
on public.employee_cost_data for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage their employee cost data" on public.employee_cost_data;
create policy "Users can manage their employee cost data"
on public.employee_cost_data for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their indirect overhead import batches" on public.indirect_overhead_import_batches;
create policy "Users can read their indirect overhead import batches"
on public.indirect_overhead_import_batches for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage their indirect overhead import batches" on public.indirect_overhead_import_batches;
create policy "Users can manage their indirect overhead import batches"
on public.indirect_overhead_import_batches for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their indirect overhead data" on public.indirect_overhead_data;
create policy "Users can read their indirect overhead data"
on public.indirect_overhead_data for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage their indirect overhead data" on public.indirect_overhead_data;
create policy "Users can manage their indirect overhead data"
on public.indirect_overhead_data for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their supply details" on public.supply_details;
create policy "Users can read their supply details"
on public.supply_details for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage their supply details" on public.supply_details;
create policy "Users can manage their supply details"
on public.supply_details for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read their supply contract charges" on public.supply_contract_charges;
create policy "Users can read their supply contract charges"
on public.supply_contract_charges for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can manage their supply contract charges" on public.supply_contract_charges;
create policy "Users can manage their supply contract charges"
on public.supply_contract_charges for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read supply DNO reference data" on public.supply_reference_dno_network_areas;
create policy "Users can read supply DNO reference data"
on public.supply_reference_dno_network_areas for select
to anon, authenticated
using (true);

drop policy if exists "Users can manage their DNO reference data" on public.supply_reference_dno_network_areas;

drop policy if exists "Users can read supply reference data sets" on public.supply_reference_data_sets;
create policy "Users can read supply reference data sets"
on public.supply_reference_data_sets for select
to anon, authenticated
using (true);

drop policy if exists "Users can manage their supply reference data sets" on public.supply_reference_data_sets;

drop policy if exists "Semarts admins can manage supply reference data sets" on public.supply_reference_data_sets;
create policy "Semarts admins can manage supply reference data sets"
on public.supply_reference_data_sets for all
to authenticated
using (public.is_semarts_admin())
with check (public.is_semarts_admin());

drop policy if exists "Users can read supply reference source documents" on public.supply_reference_source_documents;
create policy "Users can read supply reference source documents"
on public.supply_reference_source_documents for select
to anon, authenticated
using (true);

drop policy if exists "Users can manage supply reference source documents" on public.supply_reference_source_documents;

drop policy if exists "Semarts admins can manage supply reference source documents" on public.supply_reference_source_documents;
create policy "Semarts admins can manage supply reference source documents"
on public.supply_reference_source_documents for all
to authenticated
using (public.is_semarts_admin())
with check (public.is_semarts_admin());

drop policy if exists "Users can read supply reference TOU candidates" on public.supply_reference_tou_candidates;
create policy "Users can read supply reference TOU candidates"
on public.supply_reference_tou_candidates for select
to anon, authenticated
using (true);

drop policy if exists "Users can manage supply reference TOU candidates" on public.supply_reference_tou_candidates;

drop policy if exists "Semarts admins can manage supply reference TOU candidates" on public.supply_reference_tou_candidates;
create policy "Semarts admins can manage supply reference TOU candidates"
on public.supply_reference_tou_candidates for all
to authenticated
using (public.is_semarts_admin())
with check (public.is_semarts_admin());

drop policy if exists "Users can read supply reference loss candidates" on public.supply_reference_loss_candidates;
create policy "Users can read supply reference loss candidates"
on public.supply_reference_loss_candidates for select
to anon, authenticated
using (true);

drop policy if exists "Users can manage supply reference loss candidates" on public.supply_reference_loss_candidates;

drop policy if exists "Semarts admins can manage supply reference loss candidates" on public.supply_reference_loss_candidates;
create policy "Semarts admins can manage supply reference loss candidates"
on public.supply_reference_loss_candidates for all
to authenticated
using (public.is_semarts_admin())
with check (public.is_semarts_admin());
