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
| Manual demo path check from inputs to allocation, calculation, audit trace, output, and reconciliation | Tue 23 Jun 2026 | Complete | User accepted data inputs, cost pools, allocation methods, tariff calculations, audit trace, and report view on 2026-06-22; route smoke evidence recorded in `docs/MVP_DEMO_PATH_CHECK.md` | PM plus user | On track | Use accepted demo evidence in MVP candidate review |
| MVP candidate review: stable calculation workflow, visible audit trace, outputs reconcile to recoverable cost base | Wed 24 Jun 2026 | Complete | Representative scenario validates reconciliation in automated test; manual demo path accepted; sign-off pack reviewed for MVP decision | User sign-off owner, PM support | Ahead of baseline | Use accepted-with-limitations decision to prepare stakeholder-demo path |
| Internal MVP candidate decision: accepted, accepted with limitations, or fixes required | Wed 24 / Thu 25 Jun 2026 | Complete | Internal MVP candidate decision recorded as accepted with limitations on 2026-06-22 in `docs/MVP_CANDIDATE_SIGNOFF.md` | User sign-off owner | Ahead of baseline | Track limitations and prepare stakeholder-demo materials without expanding MVP scope |
| Fixes or stakeholder-demo preparation depending on review outcome | Thu 25 Jun 2026 onward | In progress | Outcome is accepted with limitations; stakeholder-demo preparation, rehearsal notes, and limitation closeout created in `docs/MVP_STAKEHOLDER_DEMO_PREP.md`, `docs/MVP_DEMO_REHEARSAL_NOTES.md`, and `docs/MVP_LIMITATIONS_CLOSEOUT.md` | PM plus user sign-off owner | Ahead of baseline | Confirm demo audience, rehearse the walkthrough, and decide whether next package is demo delivery or narrow fixes |

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
