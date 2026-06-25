# Selector UI Foundation Long Run

Date: 2026-06-25

Branch: `codex/selector-ui-foundation-long-run`

## Purpose

This package continues the UtilityHub selector integration without making selected UtilityHub data tariff-driving.

It adds contract-shaped Tariff Builder service boundaries and evidence/readiness UI support for:

- Meter selector.
- Monthly consumption selector.
- Boundary meter selector.
- Reference data selector.

## Scope

In scope:

- Pure adapters for UtilityHub selector envelope shapes.
- Local contract-envelope service boundaries.
- Existing UI panel readiness counts and messages.
- Regression tests for available, empty, unavailable and access-denied selector states.
- Manager control documentation.

Out of scope:

- Live UtilityHub API calls.
- Storage migration or persistence of selected UtilityHub records.
- Import parser changes.
- Export DTO changes.
- Report total changes.
- Tariff calculation changes.
- Automatic conversion of meter, consumption, boundary or reference evidence into tariff-driving inputs.
- Customer-class aggregate generation from raw or summary meter records.

## Current Behaviour

The Tariff Builder UI can now show that selector contracts are ready and service boundaries exist. Until live UtilityHub calls are implemented, all new selector service boundaries return local contract-envelope results with no UtilityHub-owned records.

The aggregate customer-class input route remains the tariff-driving path.

## Readiness Impact

This package moves the selector foundation forward by making the next live-service package smaller:

- UI panels already consume service-boundary results.
- Adapter behaviour is tested independently.
- Empty, unavailable and access-denied states are explicit.
- Source version, snapshot ID, validation status and issue counts are preserved when records become available.

## Remaining Decisions

No decision is needed for this package.

Future decisions are still required before:

- Calling live UtilityHub APIs from Tariff Builder.
- Persisting selected UtilityHub records against a tariff year.
- Converting monthly consumption summaries into reviewed aggregate customer-class inputs.
- Allowing selected reference data to affect tariff calculations.
- Setting boundary-meter reconciliation tolerance and sign-off workflow.

## Validation

Focused selector tests passed during implementation:

- `tests/utilityhub-meter-selector-adapter.test.ts`
- `tests/monthly-consumption-selector-adapter.test.ts`
- `tests/boundary-meter-selector-adapter.test.ts`
- `tests/reference-data-selector-adapter.test.ts`
- `tests/selector-service-boundaries.test.ts`

Type-check passed during implementation.

Full validation should be run before handoff:

- `npm.cmd run lint`
- `npx.cmd tsc --noEmit --incremental false`
- `npm.cmd test`
- `npm.cmd run build`
