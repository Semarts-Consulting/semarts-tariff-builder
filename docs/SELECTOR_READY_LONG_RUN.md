# Selector-Ready Long Run

Date: 2026-06-24

Status: in progress

## Target End State

Tariff Builder should reach a selector-ready internal release candidate before live UtilityHub API integration.

That means:

- Customer/site, meter, monthly consumption, boundary meter and reference-data selector contracts are visible in the app.
- UtilityHub contract availability is clear to users.
- Live service connections are clearly not connected yet.
- Selected records remain evidence-only unless a later approved package makes them tariff-driving.
- No calculation, import, export, report total, storage migration or shared DTO behaviour changes are introduced.

## Current Package

This package adds a contract-shaped readiness layer for UtilityHub selectors.

It does not:

- Call UtilityHub APIs.
- Add production fixture data.
- Change tariff calculations.
- Change storage architecture.
- Change import or export behaviour.
- Change report totals.

## Customer/Site Selector State

The current settings page keeps manual UtilityHub customer and site reference fields. The first
selector-ready UI package adds a read-only selector state panel beside those fields so users can
see that:

- UtilityHub owns customer and site records.
- Live selector services are not connected yet.
- Manual references can be used as interim evidence.
- Manual references still require review against UtilityHub.

## Meter And Consumption Selector State

The data inputs page now shows the UtilityHub meter and monthly consumption selector state while
keeping aggregate customer-class rows as the only tariff-driving input route.

This means:

- UtilityHub-owned meters and consumption summaries are recognised as the future source.
- Live UtilityHub meter services are not connected yet.
- Aggregate customer-class rows remain the controlled tariff-driving path.
- UtilityHub meter and consumption data must remain evidence-only until reviewed aggregate
  generation is approved.

## Boundary And Reference Selector States

The site submeter input page now shows boundary meter selector readiness while keeping local
submeter and consumption rows as evidence. The supply reference data page now shows reference-data
selector readiness for future TLM, CPI, transmission, distribution and supply contract source
selection.

Both states are non-live and non-tariff-impacting.

## Next Packages

Recommended sequence after this package:

1. Customer/site selector planning and adapter boundary.
2. Customer/site selector unavailable-state UI.
3. Meter selector planning.
4. Meter selector unavailable-state UI.
5. Monthly consumption summary unavailable-state UI.
6. Boundary meter selector unavailable-state UI.
7. Reference data selector unavailable-state UI.
8. Full selector-readiness walkthrough and release decision.
