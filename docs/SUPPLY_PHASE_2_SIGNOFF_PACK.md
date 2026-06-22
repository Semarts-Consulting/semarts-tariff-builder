# Supply Phase 2 Sign-Off Pack

Date: 2026-06-22

Status: prepared for business review.

Purpose: capture the business-rule decisions required before supply annual amount calculation or tariff integration starts.

## Delivery Position

Supply Phase 1 normalisation is merged as a disconnected pure service. It can normalise supply rows, convert rates, and identify unresolved calculation statuses.

Phase 2 must not start implementation until the decisions below are answered and accepted by the user as calculation sign-off owner.

## Phase 2 Scope To Approve

Phase 2 should be limited to annual amount calculation inside the supply calculation service.

Allowed scope after sign-off:

- Calculate annual supply charge amounts for supported fixed, capacity, and consumption charge lines.
- Keep outputs disconnected from tariff recovery until a separate tariff integration package is approved.
- Preserve unresolved statuses where signed-off rules are still unavailable.
- Add focused tests for each approved annual amount rule.

Out of scope:

- Feeding supply values into `calculateTariffs`.
- Changing report totals or export DTOs.
- Changing import parsing behavior.
- Changing storage schema or project DTOs unless explicitly approved.

## Required Decisions

| Decision | Required answer | Blocks annual amount calculation? | Blocks tariff integration? | Current status |
| --- | --- | --- | --- | --- |
| Losses basis | Define `CM`, `GSP`, and `NBP`; identify source volume and adjustment direction | Yes | Yes | Open |
| Capacity conversion | Confirm whether kVA converts to kW, and what power factor applies | Yes | Yes | Open |
| Annualisation | Confirm day, month, year, and billing-period basis for fixed and capacity charges | Yes | Yes | Open |
| Time bands | Confirm whether DUoS time bands are workbook-configured, DNO-specific, tariff-year-specific, or static | Yes | Yes | Open |
| Custom time windows | Confirm bank holiday treatment and whether windows can cross midnight | Yes | Yes | Open |
| Input validity | Confirm whether blank charge names and incompatible charge/time-of-use combinations block calculation | Yes | Yes | Open |
| Allocation destination | Confirm whether supply charges later allocate by MPAN, tenant, network level, or customer class | No | Yes | Open |
| Pass-through treatment | Confirm whether pass-through lines are excluded from recovery or reported separately | No | Yes | Open |

## Proposed Minimum Sign-Off For Phase 2

To start Phase 2 without expanding scope, the minimum accepted answers are:

1. Annualisation rules for fixed and capacity charges.
2. Capacity conversion rule for kVA-based charges.
3. Input validity rule for blank charge names and incompatible charge/time-of-use combinations.
4. Explicit list of charge lines that remain `Needs business rule` or `Needs volume data`.

Loss-adjusted consumption amounts, tariff allocation, pass-through recovery treatment, report totals, and export fields can remain blocked if they are documented as out of Phase 2 scope.

## Acceptance Criteria

Phase 2 can be accepted only if:

- All approved calculations are pure functions in `lib/supply-calculation-engine.ts`.
- Annual amount outputs include traceable source row and rule basis.
- Unsupported cases remain explicit and do not silently calculate.
- Focused tests cover approved charge types, invalid inputs, and unresolved statuses.
- Full lint, type-check, test, and build checks pass.
- PM confirms no tariff, report, export, import, or storage integration has slipped into the package.

## Owner Decisions Needed

User sign-off owner:

- Confirm the minimum Phase 2 decision answers.
- Confirm whether Phase 2 should calculate annual amounts only, or whether tariff integration is wanted immediately after.

Tariff Engine:

- Convert signed-off answers into a narrow implementation proposal.
- List exact files and tests before coding.

PM:

- Keep tariff integration, report totals, and export fields in separate packages.
- Use QA review before approving any supply result that affects commercial outputs.
