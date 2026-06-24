# UtilityHub Selector Contract Closeout

Date: 2026-06-24

Status: UtilityHub contract baseline received

## Summary

UtilityHub has merged the Tariff Builder selector contract package.

Merged UtilityHub PR:

- `https://github.com/Semarts-Consulting/semarts-utilityhub/pull/2`

New UtilityHub-side contract files:

- `docs/TARIFF_SELECTOR_CONTRACT.md`
- `src/services/tariff-selector-contract.ts`

## Contract Scope Now Available

The UtilityHub contract baseline covers:

- Customer/site context selector.
- Meter selector.
- Monthly consumption summary selector.
- Boundary meter summary selector.
- Reference data selector.
- Provenance metadata.
- Empty, unavailable and access-denied response states.

## Confirmed Boundaries

The UtilityHub package was contract-only:

- No live API routes.
- No schema changes.
- No UtilityHub UI changes.
- No Tariff Builder calculation changes.

Tariff Builder must continue to reference UtilityHub shared IDs and must not duplicate customer, site, building, floor, supply point, meter, raw reading, document upload, permission or audit masters.

## Tariff Builder Impact

This clears the first contract blocker for live selector planning.

It does not yet approve:

- Live API integration.
- Tariff Builder storage migration.
- Automatic population of tariff-year inputs.
- Raw UtilityHub meter reading ingestion.
- Tariff-impacting use of selected UtilityHub data.
- Calculation, report total, export or shared DTO changes.

## Recommended Next Package

The next Tariff Builder package should be customer/site selector implementation planning.

Recommended scope:

- Read the UtilityHub contract files.
- Define the Tariff Builder adapter boundary.
- Define empty, unavailable and access-denied UI states.
- Keep existing local/demo projects working.
- Keep selected UtilityHub records evidence-only by default.
- Avoid meter, consumption, boundary meter and reference-data selector implementation until customer/site selection is stable.

## Validation Evidence

UtilityHub reported:

- `npm.cmd run release:check`: passed before merge.

Tariff Builder validation for this closeout package should remain docs-only baseline validation.
