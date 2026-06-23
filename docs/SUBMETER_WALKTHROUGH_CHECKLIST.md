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

Future structured customer, site, area, location, tenant, and meter hierarchy should mirror Semarts Utilityhub. Until that shared hierarchy contract is confirmed, Tariff Builder keeps location and tenant fields as source/display text and treats submeter-derived allocation as evidence-only.

## Stop Points

Pause before implementing any change that would:

- Promote submeter consumption into tariff denominators.
- Apply loss-adjusted consumption to tariff outputs.
- Replace free-text location with a new hierarchy not aligned to Utilityhub.
- Change storage, shared DTOs, exports, or report totals.
