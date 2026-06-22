# Supply Phase 2 Implementation Proposal

Date: 2026-06-22

Status: proposed for Tariff Engine review.

Owner: Tariff Engine, with PM and QA review.

Purpose: define the narrow implementation package for supply annual amount calculation after user approval of Option A.

## Approved Scope

Implement annual amount calculation inside the existing disconnected supply calculation service only.

Allowed production files:

- `lib/supply-calculation-engine.ts`

Allowed test files:

- `tests/supply-calculation-engine.test.ts`

Allowed documentation files:

- `docs/APP_CONTRACTS.md`
- Manager docs if status or ownership changes

Do not edit without separate PM approval:

- `types/project.ts`
- `lib/calculation-engine.ts`
- `components/ReportsSummary.tsx`
- `components/TariffCalculationsSummary.tsx`
- import parser files
- storage files
- export DTOs

## Approved Calculation Rules

Annualisation:

- `per day` uses 365 days.
- `per Month` uses 12 months.
- Annual charges use the entered annual value directly.
- Billing-period and leap-year variants remain out of scope.

Capacity:

- kVA-based capacity charges calculate against entered kVA.
- Do not convert kVA to kW.
- kW-based charges remain `Needs business rule` until power factor is approved.

Input validity:

- Blank charge names block annual amount calculation for that line.
- Negative rates block annual amount calculation for that line.
- Invalid MPAN length remains a row-level validation issue and must not block other valid rows.
- Unsupported charge/time-of-use combinations remain `Needs business rule`.

Supported charge lines:

- Fixed annual.
- Fixed monthly.
- Fixed daily.
- Capacity charges where unit and denominator are clear.

## Explicitly Out Of Scope

- Loss-adjusted consumption calculation.
- DUoS time-band consumption.
- TNUoS triad calculation.
- Custom time windows.
- Bank holiday logic.
- Supply charge allocation into customer classes.
- Pass-through recovery treatment.
- Feeding supply amounts into `calculateTariffs`.
- Changing report totals.
- Adding export DTO fields.
- Changing imports, storage, or shared project DTOs.

## Expected Output Behaviour

For each normalised supply line, Phase 2 should either:

- produce an annual amount with source row, rule basis, unit, quantity, rate, and calculation trace; or
- preserve an explicit unresolved status such as `Needs business rule`, `Needs volume data`, or invalid input.

The implementation must not silently calculate unsupported cases.

## Required Tests

Focused tests should cover:

- Fixed annual charges use the entered annual amount.
- Fixed monthly charges multiply by 12.
- Fixed daily charges multiply by 365.
- kVA capacity charges calculate from entered kVA without kW conversion.
- kW capacity charges remain unresolved.
- Blank charge names block the line.
- Negative rates block the line.
- Invalid MPAN length does not block other valid rows.
- Unsupported time-of-use or consumption cases remain unresolved.
- Existing Phase 1 normalisation behavior remains unchanged.

## Review Gate

Before merge, Tariff Engine must provide:

- exact files changed;
- calculation examples for each supported annual amount rule;
- full test output;
- confirmation that tariff/report/export/import/storage integration has not been added.

QA should review the test coverage because this affects calculation confidence.

PM should review before merge to confirm scope boundaries were respected.
