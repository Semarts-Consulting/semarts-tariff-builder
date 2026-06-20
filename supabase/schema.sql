create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  local_id text unique not null,
  name text not null,
  network_name text not null,
  tariff_year integer not null,
  effective_date date not null,
  billing_period text not null,
  customer_classes text[] not null default '{}',
  status text not null default 'Draft',
  last_updated text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_data_inputs (
  project_local_id text primary key references public.projects(local_id) on delete cascade,
  rows jsonb not null default '[]'::jsonb,
  assumptions text not null default '',
  last_updated text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.project_cost_pools (
  project_local_id text primary key references public.projects(local_id) on delete cascade,
  rows jsonb not null default '[]'::jsonb,
  assumptions text not null default '',
  last_updated text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.project_allocation_methods (
  project_local_id text primary key references public.projects(local_id) on delete cascade,
  rows jsonb not null default '[]'::jsonb,
  assumptions text not null default '',
  last_updated text not null,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists project_data_inputs_set_updated_at on public.project_data_inputs;
create trigger project_data_inputs_set_updated_at
before update on public.project_data_inputs
for each row execute function public.set_updated_at();

drop trigger if exists project_cost_pools_set_updated_at on public.project_cost_pools;
create trigger project_cost_pools_set_updated_at
before update on public.project_cost_pools
for each row execute function public.set_updated_at();

drop trigger if exists project_allocation_methods_set_updated_at on public.project_allocation_methods;
create trigger project_allocation_methods_set_updated_at
before update on public.project_allocation_methods
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_data_inputs enable row level security;
alter table public.project_cost_pools enable row level security;
alter table public.project_allocation_methods enable row level security;

-- RLS policies should be added with authentication.
-- Until auth is implemented, keep the app on local browser storage.
