# Supply Evidence Implementation Proposal

Date: 2026-06-22

Status: proposed for Tariff Engine, UI Flow, QA, and PM review.

Owner: Tariff Engine for evidence/reconciliation semantics, UI Flow for display only, QA for regression coverage, PM for scope control and merge sequencing.

Purpose: define the narrow production package for evidence-only supply presentation and separate supply reconciliation after the user approved the supply integration decision answers.

## Approved Scope

Implement evidence-only supply visibility and separate supply reconciliation without changing tariff outputs.

Allowed outcomes:

- show approved supply annual amounts as evidence;
- show pass-through supply lines separately from recoverable tariff revenue;
- show a separate supply reconciliation that does not affect network revenue recovery;
- preserve source row, rule basis, status, rate, quantity, unit, and annual amount where already produced by the disconnected supply service;
- keep unresolved supply lines visible as unresolved evidence.

## Explicitly Out Of Scope

This package must not:

- feed supply annual amounts into `calculateTariffs`;
- alter tariff rates;
- alter network revenue requirement;
- add supply annual amounts to recoverable network cost pools;
- change `isRevenueRecovered`;
- change report totals used for network tariff recovery;
- change imports;
- change storage schema or persistence behavior;
- change export DTOs;
- change shared project DTOs unless PM approves a separate contract proposal first;
- implement billing-period daily annualisation.

## Proposed File Ownership

Expected production files, subject to worker review:

| File | Owner | Allowed change |
| --- | --- | --- |
| `components/ReportsSummary.tsx` | UI Flow | Display evidence-only supply section if data is already available from existing project/methodology state and supply service output can be derived without persistence changes. |
| `lib/supply-calculation-engine.ts` | Tariff Engine | Add service-local evidence/reconciliation helper only if needed; do not change tariff integration. |
| `tests/report-readiness.test.tsx` or focused report tests | QA plus UI Flow | Cover evidence-only labels and no change to tariff totals. |
| `tests/supply-calculation-engine.test.ts` | QA plus Tariff Engine | Cover any service-local reconciliation helper if added. |
| `docs/APP_CONTRACTS.md` | PM | Record evidence-only supply display contract if production behavior changes. |

Files requiring separate approval before edit:

- `types/project.ts`
- `lib/calculation-engine.ts`
- `lib/project-storage.ts`
- import parser files
- export DTO or download code

## Required Behaviour

Evidence-only supply display:

- Must be clearly labelled as evidence-only.
- Must not be presented as tariff-impacting.
- Must show unresolved lines separately from calculated annual amounts.
- Must show pass-through lines separately from recoverable tariff revenue.

Separate supply reconciliation:

- Must reconcile supply annual evidence separately from network cost recovery.
- Must not affect `revenueRequirement`, `allocatedCost`, `unallocatedCost`, `isRevenueRecovered`, class tariff outputs, or tariff audit trace.
- Must identify excluded/pass-through lines separately from included evidence totals.

Customer applicability and reporting category:

- Must not be inferred silently from charge names.
- If current data cannot represent applicability or category safely without shared DTO changes, the implementation must show the limitation rather than inventing a default.

## Required Tests

Before merge, the implementation package must prove:

- tariff calculation results are unchanged when supply evidence is displayed;
- evidence-only supply values do not change network report totals;
- pass-through supply lines are visible separately and excluded from recoverable tariff revenue;
- unresolved supply lines remain visible and are not silently calculated;
- any new supply reconciliation helper handles calculated, excluded, invalid, and unresolved lines;
- lint, type-check, full tests, and build pass.

## Review Gate

Tariff Engine must confirm:

- no tariff-output semantics changed;
- no supply values feed `calculateTariffs`;
- no billing-period daily annualisation was implemented.

UI Flow must confirm:

- supply values are labelled evidence-only;
- report presentation does not imply tariff impact;
- no unrelated UI polish was added.

QA must confirm:

- tests cover unchanged tariff totals and separate supply evidence;
- full quality checks passed.

PM must confirm:

- file ownership stayed within this proposal;
- any shared DTO, storage, import, export, or report-total change was rejected or moved to a separate proposal.

## Next Step

If this proposal is accepted, delegate production implementation to the relevant delivery threads:

1. Tariff Engine: service-local evidence/reconciliation helper only if required.
2. UI Flow: evidence-only report presentation.
3. QA: focused regression coverage and full checks.

Manager should not implement production code directly for this package.
