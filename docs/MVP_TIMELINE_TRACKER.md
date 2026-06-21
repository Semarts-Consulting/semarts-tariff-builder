# MVP Timeline Tracker

Baseline created: 2026-06-22

Status values: `Not started`, `In progress`, `Complete`, `At risk`, `Blocked`.

This tracker is a lightweight delivery layer for the internal MVP candidate timeline. It must not expand MVP scope.

## Timeline Status

| Milestone | Baseline date | Status | Evidence | Owner | Date variance | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| MVP validation pack prepared with representative scenario, reconciliation test, sign-off pack, and local checks passed | Mon 22 Jun 2026 | Complete | PR #7 merged; `docs/MVP_CANDIDATE_SIGNOFF.md`; `tests/mvp-candidate-scenario.test.ts`; lint, type-check, full tests, and build passed locally | PM / manager thread | On track | Use sign-off pack during MVP candidate review |
| Commit, push, and PR for MVP validation pack | Mon 22 / Tue 23 Jun 2026 | Complete | PR #7 opened and merged | User, with PM handoff commands | On track | None |
| Merge validation pack into `main` | Tue 23 Jun 2026 | Complete | `main` includes merge commit `a78cf7c` for PR #7 | User / PM | On track | Continue with manual demo path check |
| Manual demo path check from inputs to allocation, calculation, audit trace, output, and reconciliation | Tue 23 Jun 2026 | In progress | `docs/MVP_DEMO_PATH_CHECK.md` added with route checklist and acceptance questions; built app route smoke passed for selected key routes; manual content walkthrough still required | PM plus user | On track | Run local app and follow demo checklist |
| MVP candidate review: stable calculation workflow, visible audit trace, outputs reconcile to recoverable cost base | Wed 24 Jun 2026 | Not started | Representative scenario validates reconciliation in automated test; manual review pending | User sign-off owner, PM support | On track | Review `docs/MVP_CANDIDATE_SIGNOFF.md` and demo evidence |
| Internal MVP candidate decision: accepted, accepted with limitations, or fixes required | Wed 24 / Thu 25 Jun 2026 | Not started | Decision pending validation pack merge and manual review | User sign-off owner | On track | Decide after scenario/demo review |
| Fixes or stakeholder-demo preparation depending on review outcome | Thu 25 Jun 2026 onward | Not started | Depends on MVP candidate decision | PM plus relevant delivery owner | On track | If accepted, prepare stakeholder-demo path; if fixes required, split into narrow packages |

## Current Delivery Basis

- Audit trace must be visible in the calculation workflow and linked to tariff output.
- Formal report/export audit trace is post-MVP or MVP+ unless delivered without delaying the core calculation workflow.
- MVP validation prioritises calculation defensibility, cost-base reconciliation, audit visibility, and limitations documentation.
- Formal export DTOs, UI polish, advanced export logic, and additional tariff scenarios remain outside current MVP unless separately approved.

## Reporting Rule

Future manager handoffs must include:

- Current milestone status.
- Evidence completed since the previous handoff.
- Date variance against this baseline.
- Next action and owner.
- Any `At risk` or `Blocked` milestone with reason and recovery action.
