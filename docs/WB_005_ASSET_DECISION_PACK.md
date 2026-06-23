# WB-005 Asset Chargeability And Annual Amount Decision Pack

Date: 2026-06-23

Status: decision pack for owner review.

## Purpose

This pack asks for the minimum decisions needed before WB-005 asset-cost allocation can move from proposal-only to test-only fixture coverage, and later to production implementation.

This pack does not approve production asset import parsing, asset valuation, annuity calculation, WACC/CPI methodology, storage changes, shared DTOs, report total changes, exports, UI changes, or tariff calculation behaviour.

## Decision Required

The immediate decision is whether WB-005 may proceed as a test-only fixture using pre-set annual asset amounts, while keeping all production behaviour unchanged.

## Recommended Decision

Approve WB-005 test-only fixture coverage with pre-set annual asset amounts only.

Recommended constraints:

1. Use local fixture metadata only.
2. Do not calculate annual asset amounts from asset value, age, life, WACC, CPI, or depreciation.
3. Treat only explicitly approved, chargeable electrical distribution asset rows as calculation inputs.
4. Keep non-electrical, non-chargeable, shared-use, low-confidence, unresolved, or manual-review assets outside tariff calculation inputs.
5. Use existing tariff engine inputs only: cost pools, customer data, and allocation methods.
6. Do not introduce shared DTOs, storage fields, import parser changes, report total changes, export fields, or UI changes.

Reason:

- This gives regression evidence for airport/port asset flexibility without locking the product into one workbook valuation method.
- It preserves the principle that methodology decisions come before production calculation semantics.
- It keeps the next package small, reviewable, and reversible.

## Options

| Option | Description | Delivery Impact | Risk | Recommendation |
| --- | --- | --- | --- | --- |
| A | Approve test-only fixture with pre-set annual asset amounts. | Enables safe WB-005 regression coverage now. | Low/Medium | Recommended. |
| B | Hold all WB-005 fixture work until full asset methodology is approved. | Slower; leaves asset coverage gap. | Low | Acceptable if owner wants no implied asset treatment. |
| C | Approve production asset valuation/annuity implementation now. | Larger production change. | High | Not recommended without a separate methodology decision pack. |

## Proposed Test-Only Treatment

If Option A is approved, the WB-005 fixture should represent asset evidence locally in tests.

Suggested fixture rows:

| Asset evidence row | Treatment | Expected test assertion |
| --- | --- | --- |
| Chargeable HV distribution asset with approved annual amount | Calculation input | May become a cost pool passed to `calculateTariffs`. |
| Chargeable LV metering asset needing review | Manual review required | Remains outside tariff inputs. |
| Non-electrical building asset | Excluded pending review | Remains outside tariff inputs. |
| Shared-use site infrastructure | Evidence-only | Remains outside tariff inputs. |
| Unresolved asset row | Excluded pending review | Remains outside tariff inputs and has a review issue. |

The approved annual amount should be represented directly as a test value. The test should not derive it from:

- replacement value,
- prior-year asset value,
- life years,
- average age,
- WACC,
- CPI,
- depreciation,
- annuity factors.

## Production Questions Still Open

These are not required for Option A test-only coverage, but must be answered before production implementation:

1. Which asset categories are chargeable through electricity tariffs?
2. Does voltage determine methodology, allocation, reporting only, or all three?
3. How should mixed-use or shared-site infrastructure be treated?
4. Are asset annual amounts imported directly, calculated in-app, or manually approved?
5. If calculated in-app, what formula is used and what source data is required?
6. Should non-chargeable or unresolved asset evidence block report readiness?
7. Should asset source mapping be retained in reports or only in audit data?

## Acceptance Criteria For Option A

WB-005 test-only coverage is acceptable if it proves:

1. Chargeable and non-chargeable asset evidence can be represented separately.
2. Only explicitly approved calculation-input asset rows feed tariff cost pools.
3. Non-electrical, unresolved, evidence-only, and manual-review assets do not feed `calculateTariffs`.
4. The calculation still reconciles using existing cost pool and allocation behaviour.
5. No production asset valuation logic is introduced.
6. No production import, storage, shared DTO, report total, export, UI, or calculation behaviour changes are introduced.

## File Boundaries For Next Package

Allowed files for Option A test-only implementation:

- `tests/fixtures/workbook-derived-scenarios.ts`
- `tests/workbook-derived-scenarios.test.ts`
- `docs/LONG_RUN_PROGRESS_LOG.md`
- manager docs after validation.

Out of scope:

- `types/project.ts`
- `lib/calculation-engine.ts`
- `lib/*-import.ts`
- `lib/project-storage.ts`
- `components/*`
- report/export code
- new dependencies

## Required Checks

Before handoff, run:

- focused workbook-derived scenario test,
- lint,
- type-check,
- full tests,
- build.

## Decision Record

Pending owner decision:

- Approve Option A: test-only fixture with pre-set annual asset amounts.
- Hold under Option B.
- Request separate production methodology decision pack before any fixture or implementation.
