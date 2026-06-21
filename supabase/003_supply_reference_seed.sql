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
