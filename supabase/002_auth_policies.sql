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
