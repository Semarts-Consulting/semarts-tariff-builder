# Current Package Merge Readiness

## Scope Included

The current package adds the site submeter and Transmission Loss Multiplier input foundation:

- Site submeter register for tenant, network operator, landlord, shared asset, EV asset, plant room, infrastructure and other internal use meters.
- Consumption by meter in half-hourly, monthly, quarterly and annual formats.
- Transmission Loss Multiplier input table with manual entry, Excel import and structured JSON refresh support.
- Validation for register, consumption and TLM data.
- Data Inputs navigation entry for Site Submeters.
- Documentation for purpose, fields, assumptions, limitations and next steps.
- Focused unit coverage for submeter validation, TLM parsing and refresh support.

## Blocking Issues

None identified from the current review.

## Non-Blocking Issues

- Location is still free text and should be replaced or supplemented by a structured hierarchy after approval.
- Tenant Name is a text field rather than a formal customer relationship.
- TLM automatic refresh depends on confirming the authoritative Elexon source.
- CSV template support is not included yet.
- The package does not feed submeter data into tariff calculations.

## Checks Run

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed.
- `npm.cmd run build`: passed.
- Manual walkthrough of Data Inputs > Site Submeters: completed by user.

## Suggested Commit Message

`Add site submeter and TLM input foundation`

## Suggested PR Title

`Add site submeter and TLM input foundation`

## Suggested PR Description

Adds site submeter register, consumption-by-meter inputs, Transmission Loss Multiplier inputs, validation, UI wiring, tests, and documentation.

Does not change existing tariff calculation behaviour, imports, exports, shared export DTOs, report totals, or the aggregate customer-class calculation path.

Checks passed: lint, type-check, full tests, build, and manual walkthrough.

## Suggested Walkthrough Checklist

1. Open a project.
2. Go to Data Inputs > Site Submeters.
3. Add a tenant meter with tenant name.
4. Add non-tenant meters for network operator, landlord or shared asset use.
5. Add monthly, annual and half-hourly consumption records.
6. Confirm unknown meter, missing tenant name, invalid period, duplicate and overlap warnings appear.
7. Add or import TLM rows.
8. Confirm TLM validation updates when coverage exists.
9. Confirm tariff calculations remain unchanged unless existing aggregate inputs are edited separately.
