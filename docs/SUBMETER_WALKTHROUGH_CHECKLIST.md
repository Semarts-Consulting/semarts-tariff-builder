# Site Submeter Walkthrough Checklist

Use this checklist to test the current evidence-only submeter workflow. The workflow supports private network submeters for tenants, network operators, landlord supplies, shared assets, EV assets, plant rooms, infrastructure, and other internal site uses.

## Walkthrough Path

1. Open a project.
2. Go to Data Inputs.
3. Open Site Submeters.
4. Add or import site submeter register rows.
5. Add or import consumption records.
6. Add or import Transmission Loss Multiplier rows.
7. Review validation panels and issue-only filters.
8. Open Reports.
9. Review submeter and loss evidence.
10. Confirm tariff totals remain driven by aggregate customer-class inputs.

## Expected Evidence

- Submeter register accepts meters without tenants where responsibility is not Tenant.
- Tenant responsibility requires Tenant Name.
- Imports append by default and show duplicate review messages rather than replacing rows silently.
- Import review catches duplicates against existing records and duplicates inside the imported file.
- Import duplicate detection ignores casing and surrounding whitespace for meter references and GSP groups.
- Consumption records can be entered as half-hourly, monthly, quarterly, or annual.
- Half-hourly rows require 48 settlement periods.
- Monthly coverage review shows expected periods, missing periods, duplicates, and unknown meter records.
- Boundary-to-submeter reconciliation appears in report evidence where boundary and submeter data exist.
- Loss-adjusted consumption appears as evidence where half-hourly consumption and TLM rows exist.
- Responsibility category evidence distinguishes recoverable candidates from evidence-only/internal-use categories.

## Non-Tariff-Impacting Guardrail

Submeter and TLM evidence does not currently change:

- Aggregate customer-class annual kWh.
- Cost pools.
- Allocation percentages.
- Revenue requirement.
- Tariff rates.
- Report totals.
- Export DTOs.

## Utilityhub Alignment

Future structured customer, site, building, floor, location, supply point, tenant, meter, meter reading, document upload, permission and audit hierarchy should mirror Semarts UtilityHub and UtilityMap / Meter Map contracts. Until those shared contracts are confirmed, Tariff Builder keeps location and tenant fields as source/display text and treats submeter-derived allocation as evidence-only.

Meter Map may later provide mapped areas, meter-to-area allocations, allocation confidence, area usage metrics and map-specific data-quality issues. Tariff Builder should consume that evidence through shared UtilityHub IDs rather than creating competing masters.

## Current Decision Boundaries

- Submeter-derived aggregate tariff input is blocked until reviewed aggregate generation is approved.
- Supply energy p/kWh affects tariffs only through explicit reviewed application rows.
- Methodology cost evidence does not create cost pools automatically.
- Asset evidence does not calculate annual asset recovery automatically.
- Report evidence sections distinguish tariff-driving values from evidence-only values.

## Stop Points

Pause before implementing any change that would:

- Promote submeter consumption into tariff denominators.
- Apply loss-adjusted consumption to tariff outputs.
- Replace free-text location with a new hierarchy not aligned to Utilityhub.
- Create local building, floor, supply point, meter-reading or document-upload masters.
- Convert methodology cost or asset evidence into tariff cost pools without an approved mapping or valuation package.
- Change storage, shared DTOs, exports, or report totals.
