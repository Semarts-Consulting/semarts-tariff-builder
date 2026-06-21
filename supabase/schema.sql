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

create table if not exists public.direct_cost_import_batches (
  import_batch_id text primary key,
  project_local_id text not null references public.projects(local_id) on delete cascade,
  source_file_name text not null,
  uploaded_at timestamptz not null,
  row_count integer not null default 0,
  total_annual_value numeric not null default 0,
  has_issues boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.direct_cost_data (
  id uuid primary key default gen_random_uuid(),
  project_local_id text not null references public.projects(local_id) on delete cascade,
  import_batch_id text not null references public.direct_cost_import_batches(import_batch_id) on delete cascade,
  description text not null,
  cost_by_type text not null,
  annual_value numeric not null,
  source_file_name text not null,
  uploaded_at timestamptz not null,
  row_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint direct_cost_data_annual_value_non_negative check (annual_value >= 0),
  constraint direct_cost_data_project_cost_unique unique (project_local_id, description, cost_by_type)
);

create table if not exists public.employee_cost_import_batches (
  import_batch_id text primary key,
  project_local_id text not null references public.projects(local_id) on delete cascade,
  source_file_name text not null,
  uploaded_at timestamptz not null,
  row_count integer not null default 0,
  total_fte numeric not null default 0,
  weighted_fte numeric not null default 0,
  has_issues boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employee_cost_data (
  id uuid primary key default gen_random_uuid(),
  project_local_id text not null references public.projects(local_id) on delete cascade,
  import_batch_id text not null references public.employee_cost_import_batches(import_batch_id) on delete cascade,
  role text not null,
  role_type text not null,
  fte numeric not null,
  time_percent numeric not null,
  source_file_name text not null,
  uploaded_at timestamptz not null,
  row_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_cost_data_fte_non_negative check (fte >= 0),
  constraint employee_cost_data_time_percent_range check (time_percent >= 0 and time_percent <= 100),
  constraint employee_cost_data_role_type_check check (
    role_type in ('Exco', 'Director', 'Head', 'Senior Manager', 'Manager', 'Colleague')
  ),
  constraint employee_cost_data_project_role_unique unique (project_local_id, role, role_type)
);

create table if not exists public.indirect_overhead_import_batches (
  import_batch_id text primary key,
  project_local_id text not null references public.projects(local_id) on delete cascade,
  source_file_name text not null,
  uploaded_at timestamptz not null,
  row_count integer not null default 0,
  total_annual_cost numeric not null default 0,
  has_issues boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.indirect_overhead_data (
  id uuid primary key default gen_random_uuid(),
  project_local_id text not null references public.projects(local_id) on delete cascade,
  import_batch_id text not null references public.indirect_overhead_import_batches(import_batch_id) on delete cascade,
  description text not null,
  annual_cost numeric not null,
  source_file_name text not null,
  uploaded_at timestamptz not null,
  row_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint indirect_overhead_data_annual_cost_non_negative check (annual_cost >= 0),
  constraint indirect_overhead_data_project_description_unique unique (project_local_id, description)
);

create table if not exists public.supply_details (
  id text primary key,
  project_local_id text not null references public.projects(local_id) on delete cascade,
  mpan text not null,
  supply_capacity_kva numeric not null,
  voltage text not null,
  transmission text not null,
  distribution text not null,
  tnuos_non_locational_charge_per_day numeric not null default 0,
  tnuos_triad_charge_per_kw numeric not null default 0,
  duos_fixed_charge_per_day numeric not null default 0,
  duos_import_capacity_pence_per_kva_per_day numeric not null default 0,
  duos_red_unit_pence_per_kwh numeric not null default 0,
  duos_amber_unit_pence_per_kwh numeric not null default 0,
  duos_green_unit_pence_per_kwh numeric not null default 0,
  duos_super_red_unit_pence_per_kwh numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supply_details_capacity_non_negative check (supply_capacity_kva >= 0),
  constraint supply_details_voltage_check check (voltage in ('EHV', 'HV', 'LV')),
  constraint supply_details_transmission_check check (transmission in ('Fixed', 'Pass Through')),
  constraint supply_details_distribution_check check (distribution in ('Fixed', 'Pass Through')),
  constraint supply_details_charges_non_negative check (
    tnuos_non_locational_charge_per_day >= 0 and
    tnuos_triad_charge_per_kw >= 0 and
    duos_fixed_charge_per_day >= 0 and
    duos_import_capacity_pence_per_kva_per_day >= 0 and
    duos_red_unit_pence_per_kwh >= 0 and
    duos_amber_unit_pence_per_kwh >= 0 and
    duos_green_unit_pence_per_kwh >= 0 and
    duos_super_red_unit_pence_per_kwh >= 0
  )
);

create table if not exists public.supply_contract_charges (
  id text primary key,
  project_local_id text not null references public.projects(local_id) on delete cascade,
  supply_detail_id text not null references public.supply_details(id) on delete cascade,
  charge_name text not null,
  losses text not null,
  charge_type text not null,
  unit_of_measurement text not null,
  time_of_use text not null default 'All times',
  custom_time_of_use jsonb not null default '{}'::jsonb,
  rate_unit text not null,
  rate numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supply_contract_charges_losses_check check (losses in ('CM', 'GSP', 'NBP')),
  constraint supply_contract_charges_charge_type_check check (charge_type in ('Consumption', 'Fixed', 'Capacity')),
  constraint supply_contract_charges_unit_check check (
    unit_of_measurement in (
      'per kWh',
      'per MWh',
      'per day',
      'per Month',
      'per year',
      'per kVA per day',
      'per kVA per Month'
    )
  ),
  constraint supply_contract_charges_time_of_use_check check (
    time_of_use in ('All times', 'Red', 'Amber', 'Green', 'Super Red', 'Day', 'Night', 'Custom')
  ),
  constraint supply_contract_charges_rate_unit_check check (rate_unit in (U&'\00A3', 'p')),
  constraint supply_contract_charges_rate_non_negative check (rate >= 0)
);

create table if not exists public.supply_reference_dno_network_areas (
  distributor_id text primary key,
  dno_name text not null,
  network_area text not null,
  operator_code text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supply_reference_dno_distributor_id_check check (distributor_id ~ '^[0-9]{2}$')
);

create table if not exists public.supply_reference_data_sets (
  id text primary key,
  distributor_id text not null,
  charging_year text not null,
  review_status text not null default 'Source required',
  source_document_title text not null,
  source_document_url text not null default '',
  source_reviewed_at date,
  source_notes text not null default '',
  time_of_use_definitions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint supply_reference_data_sets_distributor_id_check check (distributor_id ~ '^[0-9]{2}$'),
  constraint supply_reference_data_sets_review_status_check check (
    review_status in ('Source required', 'Pending review', 'Reviewed')
  ),
  constraint supply_reference_data_sets_distributor_fkey foreign key (distributor_id)
    references public.supply_reference_dno_network_areas(distributor_id) on delete restrict,
  constraint supply_reference_data_sets_distributor_year_unique unique (distributor_id, charging_year),
  constraint supply_reference_data_sets_tou_array_check check (jsonb_typeof(time_of_use_definitions) = 'array')
);

alter table public.supply_reference_data_sets
drop constraint if exists supply_reference_data_sets_distributor_id_check;

alter table public.supply_reference_data_sets
add constraint supply_reference_data_sets_distributor_id_check check (distributor_id ~ '^[0-9]{2}$');

alter table public.supply_reference_data_sets
add column if not exists review_status text not null default 'Source required';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'supply_reference_data_sets_review_status_check'
      and conrelid = 'public.supply_reference_data_sets'::regclass
  ) then
    alter table public.supply_reference_data_sets
    add constraint supply_reference_data_sets_review_status_check check (
      review_status in ('Source required', 'Pending review', 'Reviewed')
    );
  end if;
end $$;

alter table public.supply_contract_charges
add column if not exists time_of_use text not null default 'All times';

alter table public.supply_contract_charges
add column if not exists custom_time_of_use jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'supply_contract_charges_time_of_use_check'
      and conrelid = 'public.supply_contract_charges'::regclass
  ) then
    alter table public.supply_contract_charges
    add constraint supply_contract_charges_time_of_use_check check (
      time_of_use in ('All times', 'Red', 'Amber', 'Green', 'Super Red', 'Day', 'Night', 'Custom')
    );
  end if;
end $$;

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

drop trigger if exists direct_cost_import_batches_set_updated_at on public.direct_cost_import_batches;
create trigger direct_cost_import_batches_set_updated_at
before update on public.direct_cost_import_batches
for each row execute function public.set_updated_at();

drop trigger if exists direct_cost_data_set_updated_at on public.direct_cost_data;
create trigger direct_cost_data_set_updated_at
before update on public.direct_cost_data
for each row execute function public.set_updated_at();

drop trigger if exists employee_cost_import_batches_set_updated_at on public.employee_cost_import_batches;
create trigger employee_cost_import_batches_set_updated_at
before update on public.employee_cost_import_batches
for each row execute function public.set_updated_at();

drop trigger if exists employee_cost_data_set_updated_at on public.employee_cost_data;
create trigger employee_cost_data_set_updated_at
before update on public.employee_cost_data
for each row execute function public.set_updated_at();

drop trigger if exists indirect_overhead_import_batches_set_updated_at on public.indirect_overhead_import_batches;
create trigger indirect_overhead_import_batches_set_updated_at
before update on public.indirect_overhead_import_batches
for each row execute function public.set_updated_at();

drop trigger if exists indirect_overhead_data_set_updated_at on public.indirect_overhead_data;
create trigger indirect_overhead_data_set_updated_at
before update on public.indirect_overhead_data
for each row execute function public.set_updated_at();

drop trigger if exists supply_details_set_updated_at on public.supply_details;
create trigger supply_details_set_updated_at
before update on public.supply_details
for each row execute function public.set_updated_at();

drop trigger if exists supply_contract_charges_set_updated_at on public.supply_contract_charges;
create trigger supply_contract_charges_set_updated_at
before update on public.supply_contract_charges
for each row execute function public.set_updated_at();

drop trigger if exists supply_reference_dno_network_areas_set_updated_at on public.supply_reference_dno_network_areas;
create trigger supply_reference_dno_network_areas_set_updated_at
before update on public.supply_reference_dno_network_areas
for each row execute function public.set_updated_at();

drop trigger if exists supply_reference_data_sets_set_updated_at on public.supply_reference_data_sets;
create trigger supply_reference_data_sets_set_updated_at
before update on public.supply_reference_data_sets
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_data_inputs enable row level security;
alter table public.project_cost_pools enable row level security;
alter table public.project_allocation_methods enable row level security;
alter table public.boundary_meter_import_batches enable row level security;
alter table public.boundary_meter_data enable row level security;
alter table public.asset_import_batches enable row level security;
alter table public.asset_data enable row level security;
alter table public.direct_cost_import_batches enable row level security;
alter table public.direct_cost_data enable row level security;
alter table public.employee_cost_import_batches enable row level security;
alter table public.employee_cost_data enable row level security;
alter table public.indirect_overhead_import_batches enable row level security;
alter table public.indirect_overhead_data enable row level security;
alter table public.supply_details enable row level security;
alter table public.supply_contract_charges enable row level security;
alter table public.supply_reference_dno_network_areas enable row level security;
alter table public.supply_reference_data_sets enable row level security;

-- RLS policies should be added with authentication.
-- Until auth is implemented, keep the app on local browser storage.
