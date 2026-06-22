# Scenario Coverage Closeout

Date: 2026-06-22

Status: SCN-001 through SCN-006 are merged to `main`.

Purpose: record the completed post-demo scenario coverage baseline and the remaining release risks before starting further work.

## Merged Scenario Coverage

| Scenario | Coverage | Evidence |
| --- | --- | --- |
| SCN-001 small two-class site | Simple residential/commercial tariff build-up and reconciliation | Merged PR #19 |
| SCN-002 high fixed-cost site | Fixed charge sensitivity where customer count drives most recovery | Merged PR #22 |
| SCN-003 high consumption-cost site | Energy charge sensitivity where annual kWh drives most recovery | Merged PR #23 |
| SCN-004 capacity-heavy site | Demand charge sensitivity where peak demand drives most recovery | Merged PR #24 |
| SCN-005 non-recoverable cost element | Partial and zero recoverability excluded from tariff recovery | Merged PR #20 |
| SCN-006 validation issue scenario | Existing validation warnings/errors surfaced without silent correction | Merged PR #25 |

## Current Evidence

Scenario evidence is implemented in:

- `tests/fixtures/additional-scenarios.ts`
- `tests/additional-scenarios.test.ts`

The latest package-level evidence before this closeout was:

- Focused scenario tests: 6 tests passed.
- Full tests: 14 files and 71 tests passed.
- Lint, type-check, and production build passed.

## Delivery Position

The planned additional scenario set is complete. This improves confidence in tariff calculation behavior across fixed, energy, demand, recoverability, and validation-readiness cases.

This does not remove the accepted MVP limitations. The following remain controlled follow-up risks:

- Supply calculation design remains unresolved.
- Report readiness UI and report/export regression coverage remain follow-up work.
- Formal machine-readable export DTO remains outside MVP.
- Save-blocking validation policy remains undecided.
- Further scenarios should be driven by stakeholder feedback or external release criteria, not added by default.

## Operating Decision

Further production changes should return to the developer-team model:

- Tariff Engine owns calculation semantics.
- Data Import owns parser/import behavior.
- UI Flow owns report and workflow presentation.
- QA owns release-risk review and regression expansion.
- Manager owns scope, file ownership, merge sequencing, and handoff.
