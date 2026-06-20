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

create table if not exists public.boundary_meter_import_batches (
  import_batch_id text primary key,
  project_local_id text not null references public.projects(local_id) on delete cascade,
  source_file_name text not null,
  uploaded_at timestamptz not null,
  row_count integer not null default 0,
  mpan_count integer not null default 0,
  first_reading_date date,
  last_reading_date date,
  total_half_hour_kwh numeric not null default 0,
  has_issues boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.boundary_meter_data (
  id uuid primary key default gen_random_uuid(),
  project_local_id text not null references public.projects(local_id) on delete cascade,
  import_batch_id text not null references public.boundary_meter_import_batches(import_batch_id) on delete cascade,
  mpan text not null,
  reading_date date not null,
  total_kwh numeric not null,
  settlement_period_kwh numeric[] not null,
  source_file_name text not null,
  uploaded_at timestamptz not null,
  row_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint boundary_meter_data_period_count check (array_length(settlement_period_kwh, 1) = 48),
  constraint boundary_meter_data_project_mpan_date_unique unique (project_local_id, mpan, reading_date)
);

create table if not exists public.asset_import_batches (
  import_batch_id text primary key,
  project_local_id text not null references public.projects(local_id) on delete cascade,
  source_file_name text not null,
  uploaded_at timestamptz not null,
  row_count integer not null default 0,
  total_asset_value numeric not null default 0,
  chargeable_asset_value numeric not null default 0,
  has_issues boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.asset_data (
  id uuid primary key default gen_random_uuid(),
  project_local_id text not null references public.projects(local_id) on delete cascade,
  import_batch_id text not null references public.asset_import_batches(import_batch_id) on delete cascade,
  description text not null,
  asset_category text not null,
  is_electrical_distribution_asset boolean not null,
  is_chargeable_on_electricity_tariff boolean not null,
  voltage text not null,
  network_level text not null,
  life_years numeric not null,
  prior_year_asset_value numeric not null,
  source_file_name text not null,
  uploaded_at timestamptz not null,
  row_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint asset_data_life_years_positive check (life_years > 0),
  constraint asset_data_asset_value_non_negative check (prior_year_asset_value >= 0),
  constraint asset_data_voltage_check check (voltage in ('EHV', 'HV', 'LV', 'Metering')),
  constraint asset_data_network_level_check check (network_level in ('EHV', 'EHV Local', 'HV', 'HV Local', 'LV', 'Metering')),
  constraint asset_data_voltage_network_level_check check (
    (voltage = 'EHV' and network_level in ('EHV', 'EHV Local')) or
    (voltage = 'HV' and network_level in ('HV', 'HV Local')) or
    (voltage = 'LV' and network_level = 'LV') or
    (voltage = 'Metering' and network_level = 'Metering')
  ),
  constraint asset_data_project_asset_unique unique (project_local_id, description, asset_category, voltage, network_level)
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

drop trigger if exists boundary_meter_import_batches_set_updated_at on public.boundary_meter_import_batches;
create trigger boundary_meter_import_batches_set_updated_at
before update on public.boundary_meter_import_batches
for each row execute function public.set_updated_at();

drop trigger if exists boundary_meter_data_set_updated_at on public.boundary_meter_data;
create trigger boundary_meter_data_set_updated_at
before update on public.boundary_meter_data
for each row execute function public.set_updated_at();

drop trigger if exists asset_import_batches_set_updated_at on public.asset_import_batches;
create trigger asset_import_batches_set_updated_at
before update on public.asset_import_batches
for each row execute function public.set_updated_at();

drop trigger if exists asset_data_set_updated_at on public.asset_data;
create trigger asset_data_set_updated_at
before update on public.asset_data
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_data_inputs enable row level security;
alter table public.project_cost_pools enable row level security;
alter table public.project_allocation_methods enable row level security;
alter table public.boundary_meter_import_batches enable row level security;
alter table public.boundary_meter_data enable row level security;
alter table public.asset_import_batches enable row level security;
alter table public.asset_data enable row level security;

-- RLS policies should be added with authentication.
-- Until auth is implemented, keep the app on local browser storage.
