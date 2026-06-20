alter table public.projects
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.project_data_inputs
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.project_cost_pools
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.project_allocation_methods
add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists project_data_inputs_user_id_idx on public.project_data_inputs(user_id);
create index if not exists project_cost_pools_user_id_idx on public.project_cost_pools(user_id);
create index if not exists project_allocation_methods_user_id_idx on public.project_allocation_methods(user_id);

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
