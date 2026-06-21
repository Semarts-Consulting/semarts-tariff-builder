insert into public.supply_reference_dno_network_areas (
  distributor_id,
  dno_name,
  network_area,
  operator_code,
  notes
)
values
  ('10', 'UK Power Networks', 'Eastern England', 'EPN', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.'),
  ('11', 'National Grid Electricity Distribution', 'East Midlands', 'EMID', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.'),
  ('12', 'UK Power Networks', 'London', 'LPN', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.'),
  ('13', 'SP Energy Networks', 'Merseyside and North Wales', 'MANW', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.'),
  ('14', 'National Grid Electricity Distribution', 'West Midlands', 'WMID', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.'),
  ('15', 'Northern Powergrid', 'North East', 'NPGN', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.'),
  ('16', 'Electricity North West', 'North West', 'ENWL', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.'),
  ('17', 'Scottish and Southern Electricity Networks', 'North Scotland', 'SSEN-N', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.'),
  ('18', 'SP Energy Networks', 'South Scotland', 'SPD', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.'),
  ('19', 'UK Power Networks', 'South East England', 'SPN', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.'),
  ('20', 'Scottish and Southern Electricity Networks', 'Southern England', 'SSEN-S', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.'),
  ('21', 'National Grid Electricity Distribution', 'South Wales', 'SWALES', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.'),
  ('22', 'National Grid Electricity Distribution', 'South West England', 'SWEST', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.'),
  ('23', 'Northern Powergrid', 'Yorkshire', 'NPGY', 'Initial Semarts-maintained reference. Review against current industry source before calculation use.')
on conflict (distributor_id) do update
set
  dno_name = excluded.dno_name,
  network_area = excluded.network_area,
  operator_code = excluded.operator_code,
  notes = excluded.notes;

insert into public.supply_reference_data_sets (
  id,
  distributor_id,
  charging_year,
  review_status,
  source_document_title,
  source_document_url,
  source_reviewed_at,
  source_notes,
  time_of_use_definitions
)
select
  'lc14-' || distributor_id || '-2026-27',
  distributor_id,
  '2026/27',
  'Source required',
  'LC14 charging statement source required',
  '',
  null,
  'Placeholder record. Semarts admin must add the official DNO LC14 source and reviewed time bands before calculation use.',
  '[]'::jsonb
from public.supply_reference_dno_network_areas
where distributor_id in ('10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23')
on conflict (distributor_id, charging_year) do update
set
  review_status = excluded.review_status,
  source_document_title = excluded.source_document_title,
  source_document_url = excluded.source_document_url,
  source_reviewed_at = excluded.source_reviewed_at,
  source_notes = excluded.source_notes,
  time_of_use_definitions = excluded.time_of_use_definitions;

update public.supply_reference_data_sets
set
  review_status = 'Pending review',
  source_document_title = 'National Grid Electricity Distribution - Use of System Charges',
  source_document_url = 'https://commercial.nationalgrid.co.uk/our-network/use-of-system-charges',
  source_notes = 'Official NGED source page located. Semarts admin must review the charging statement and schedule documents before entering time bands.',
  time_of_use_definitions = '[]'::jsonb
where charging_year = '2026/27'
  and distributor_id in ('11', '14', '21', '22');

update public.supply_reference_data_sets
set
  review_status = 'Pending review',
  source_document_title = 'SP Electricity North West - Current charging information',
  source_document_url = 'https://www.enwl.co.uk/about-us/regulatory-information/use-of-system-charges/current-charging-information/',
  source_notes = 'Official ENWL source page located. Semarts admin must review the 2026/27 charging statement and schedule documents before entering time bands.',
  time_of_use_definitions = '[]'::jsonb
where charging_year = '2026/27'
  and distributor_id = '16';

update public.supply_reference_data_sets
set
  review_status = 'Pending review',
  source_document_title = 'SSEN - Scottish Hydro Electric Power Distribution charging statements',
  source_document_url = 'https://www.ssen.co.uk/about-ssen/library/charging-statements-and-information/scottish-hydro-electric-power-distribution/',
  source_notes = 'Official SSEN SHEPD source page located. Semarts admin must review the 2026/27 DUoS charges and schedule documents before entering time bands.',
  time_of_use_definitions = '[]'::jsonb
where charging_year = '2026/27'
  and distributor_id = '17';

update public.supply_reference_data_sets
set
  review_status = 'Pending review',
  source_document_title = 'SSEN - Southern Electric Power Distribution charging statements',
  source_document_url = 'https://www.ssen.co.uk/about-ssen/library/charging-statements-and-information/southern-electric-power-distribution/',
  source_notes = 'Official SSEN SEPD source page located. Semarts admin must review the 2026/27 DUoS charges and schedule documents before entering time bands.',
  time_of_use_definitions = '[]'::jsonb
where charging_year = '2026/27'
  and distributor_id = '20';

update public.supply_reference_data_sets
set
  review_status = 'Pending review',
  source_document_title = 'SP Energy Networks - Connections, Use of System and Metering Services',
  source_document_url = 'https://www.spenergynetworks.co.uk/pages/connections_use_of_system_and_metering_services.aspx',
  source_notes = 'Official SP Energy Networks document library page located. It links to LC14 Charging Statement and Schedule of Charges. Semarts admin must review the 2026/27 documents before entering time bands.',
  time_of_use_definitions = '[]'::jsonb
where charging_year = '2026/27'
  and distributor_id in ('13', '18');

update public.supply_reference_data_sets
set
  review_status = 'Pending review',
  source_document_title = 'UK Power Networks - Distribution Use of System Charges',
  source_document_url = 'https://www.ukpowernetworks.co.uk/our-company/distribution-use-of-system-charges',
  source_notes = 'Official UK Power Networks DUoS source page located. It covers documents for all three UKPN network areas. Semarts admin must review the 2026/27 documents before entering time bands.',
  time_of_use_definitions = '[]'::jsonb
where charging_year = '2026/27'
  and distributor_id in ('10', '12', '19');

update public.supply_reference_data_sets
set
  review_status = 'Pending review',
  source_document_title = 'Northern Powergrid - Use of System Charges document library',
  source_document_url = 'https://www.northernpowergrid.com/document-library/Charges/Use-of-System-Charges-2024-25',
  source_notes = 'Official Northern Powergrid document library route located. Semarts admin must filter the library to the correct 2026/27 Use of System Charges documents before entering time bands.',
  time_of_use_definitions = '[]'::jsonb
where charging_year = '2026/27'
  and distributor_id in ('15', '23');
