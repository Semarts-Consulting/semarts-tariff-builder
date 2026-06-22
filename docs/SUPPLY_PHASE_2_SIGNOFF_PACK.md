# Supply Phase 2 Sign-Off Pack

Date: 2026-06-22

Status: minimum Phase 2 decision set approved and annual-amount implementation complete.

Purpose: capture the business-rule decisions required before supply annual amount calculation and identify the separate decisions still required before tariff integration starts.

Plain-English decision route: `docs/SUPPLY_PHASE_2_DECISION_BRIEF.md`.

Tariff integration decision route: `docs/SUPPLY_INTEGRATION_OPEN_DECISIONS.md`.

## Delivery Position

Supply Phase 1 normalisation is merged as a disconnected pure service. It can normalise supply rows, convert rates, and identify unresolved calculation statuses.

Supply Phase 2 annual amount calculation is merged as a disconnected pure service for approved fixed and kVA capacity lines. It does not feed tariff outputs, report totals, exports, imports, storage, or shared DTOs.

Tariff integration remains blocked by the open decisions in `docs/SUPPLY_INTEGRATION_OPEN_DECISIONS.md`.

## Approved Phase 2 Scope

Phase 2 should be limited to annual amount calculation inside the supply calculation service.

Approved implemented scope:

- Calculate annual supply charge amounts for supported fixed and kVA capacity charge lines only.
- Keep consumption-based annual amounts blocked unless separately approved.
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
| Losses basis | Define `CM`, `GSP`, and `NBP`; identify source volume and adjustment direction | Yes | Yes | Blocked beyond Phase 2 |
| Capacity conversion | Confirm whether kVA converts to kW, and what power factor applies | Yes | Yes | Approved for Phase 2: calculate kVA charges against entered kVA; kW charges remain blocked |
| Annualisation | Confirm day, month, year, and billing-period basis for fixed and capacity charges | Yes | Yes | Approved for Phase 2: per day 365, per Month 12, annual direct |
| Time bands | Confirm whether DUoS time bands are workbook-configured, DNO-specific, tariff-year-specific, or static | Yes | Yes | Blocked beyond Phase 2 |
| Custom time windows | Confirm bank holiday treatment and whether windows can cross midnight | Yes | Yes | Blocked beyond Phase 2 |
| Input validity | Confirm whether blank charge names and incompatible charge/time-of-use combinations block calculation | Yes | Yes | Approved for Phase 2: blank names and negative rates block the line; invalid MPAN is row-level validation |
| Allocation destination | Confirm whether supply charges later allocate by MPAN, tenant, network level, or customer class | No | Yes | Open |
| Pass-through treatment | Confirm whether pass-through lines are excluded from recovery or reported separately | No | Yes | Open |

The remaining tariff-integration decisions are tracked in `docs/SUPPLY_INTEGRATION_OPEN_DECISIONS.md`.

## Historical Minimum Sign-Off For Phase 2

Phase 2 proceeded without expanding scope because the minimum accepted answers were:

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

- Approved Option A in `docs/SUPPLY_PHASE_2_DECISION_BRIEF.md`.
- Phase 2 is annual amount calculation only.
- Tariff integration remains a separate later decision.

Tariff Engine:

- Keep the annual-amount service disconnected until the open integration decisions are answered.
- Prepare a separate implementation proposal only after user sign-off on tariff impact, applicability, pass-through treatment, reconciliation, and reporting.

PM:

- Keep tariff integration, report totals, and export fields in separate packages.
- Use QA review before approving any supply result that affects commercial outputs.
