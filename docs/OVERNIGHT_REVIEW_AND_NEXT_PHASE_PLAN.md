# Overnight Review And Next Phase Plan

Date: 2026-06-22

Status: review and planning document.

Git usage: none during the overnight delivery session.

## Executive Summary

The overnight session made safe, useful progress without touching Git or changing production business behaviour.

Main outcomes:

- Added a docs-only WB-001 airport customer-class scenario proposal.
- Strengthened regression coverage across supply evidence, supply reference review, workbook imports, calculation validation, and report HTML export.
- Increased automated coverage from 16 test files and 98 tests at baseline to 18 test files and 120 tests.
- Kept lint, type-check, full tests, and production build green after every package.
- Created non-Git checkpoint copies before important test-file changes.

No tariff calculation semantics, storage behaviour, import record shapes, export DTOs, shared DTOs, report totals, or UI behaviour were intentionally changed.

## Completed Packages

| Package | Area | Files Changed | Outcome |
| --- | --- | --- | --- |
| 1 | WB-001 scenario proposal | `docs/WB_001_AIRPORT_CUSTOMER_CLASS_SCENARIO.md`, manager docs | Docs-only airport customer-class scenario proposal added. |
| 2 | Supply evidence reconciliation | `tests/supply-calculation-engine.test.ts` | Invalid, unresolved, and excluded fixed-recovery lines are covered. |
| 3 | Supply reference review | `tests/supply-reference-review.test.ts` | Formatted MPAN and unknown DNO review handling covered. |
| 4 | Supply reference requirement queue | `tests/supply-reference-requirements.test.ts` | Duplicate formatted MPAN and unknown DNO queue behaviour covered. |
| 5 | Direct cost import | `tests/direct-cost-import.test.ts` | Header tolerance, blank rows, and decimal import values covered. |
| 6 | Asset import | `tests/asset-import.test.ts` | Header tolerance and blank-row handling covered. |
| 7 | Boundary meter import | `tests/boundary-meter-import.test.ts` | Header tolerance and blank-row handling covered. |
| 8 | Employee cost import | `tests/employee-cost-import.test.ts` | Header tolerance and blank-row handling covered. |
| 9 | Indirect overhead import | `tests/indirect-overhead-import.test.ts` | Header tolerance, blank rows, and decimal import values covered. |
| 10 | Shared import utility | `tests/import-utils.test.ts` | Header normalisation, number parsing, and imported row ID format covered. |
| 11 | Supply source discovery | `tests/supply-reference-source-discovery.test.ts` | URL deduplication and HTML entity decoding covered. |
| 12 | Supply extraction | `tests/supply-reference-extraction.test.ts` | Blank-row skipping, source-reference fallback, and confidence normalisation covered. |
| 13 | Calculation duplicate normalisation | `tests/calculation-engine.test.ts` | Whitespace-normalised duplicate customer class and allocation share validation covered. |
| 14 | MPAN network area lookup | `tests/project-storage.test.ts` | Formatted, incomplete, and unknown-prefix MPAN lookup covered. |
| 15 | Report HTML supply evidence | `tests/report-readiness.test.tsx` | Downloaded HTML report must include evidence-only supply content. |

## Validation Evidence

Baseline before overnight continuation:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 16 test files and 98 tests.
- `npm.cmd run build`: passed.

Final validation after all packages:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 18 test files and 120 tests.
- `npm.cmd run build`: passed.

## Requirement Completion Review

| Overnight Requirement | Status | Evidence |
| --- | --- | --- |
| Do not use Git | Complete | No Git commands were run in the overnight process after the instruction. |
| Continue development in working tree | Complete | All changes were made directly in the working tree. |
| Create non-Git checkpoint copies | Complete | Checkpoints created under `docs/codex-checkpoints/`. |
| Maintain progress log | Complete | `docs/OVERNIGHT_PROGRESS_LOG.md` records each package. |
| Update log after each package | Complete | Each package has files, reason, validation, risks, and suggested commit message. |
| Work in small safe batches | Complete | Packages were test-only or docs-only and independently validated. |
| Prefer existing code over new dependencies | Complete | No new dependencies were added. |
| Run validation regularly | Complete | Focused tests plus full lint/type-check/test/build gates were run repeatedly. |
| Fix or revert failures | Complete | One source-discovery test expectation failed; the test was corrected to match existing behaviour without production changes. |
| Preserve business logic | Complete | No production logic changes were made. |
| Stop for material business decisions | Complete | WB-001 implementation remains gated behind review. |

## Items Not Completed During Overnight

These were intentionally left incomplete because they required review, Git cleanup, or business approval:

- Commit/PR creation for the working-tree changes.
- WB-001 fixture/test implementation proposal.
- WB-001 fixture/test implementation.
- Any production import/source-mapping implementation.
- Any tariff-impacting supply integration.
- Any methodology configuration implementation.

Follow-up decision now recorded:

- `docs/codex-checkpoints/` should be discarded before commit.
- WB-001 is approved for test-only implementation.

## Current Risks

- The working tree contains many useful changes but has not been committed because Git was intentionally disabled.
- Checkpoint files are useful as temporary safety evidence but may create repository noise if committed.
- WB-001 is still proposal-only; exact tariff output expectations should not be implemented until reviewed.
- Source discovery currently keeps the later title when duplicate links resolve to the same URL. This is documented by tests and can be revisited later.
- Confidence normalisation currently treats `1.5` as `0.015`, because values above `1` are treated as percentages. This is existing behaviour and now covered by tests.

## Recommended Cleanup Before Longer Run

1. Discard `docs/codex-checkpoints/` before commit.
2. Restore Git usability separately from product work.
3. Split the overnight changes into reviewable commits:
   - WB-001 proposal.
   - Progress log and optional checkpoints.
   - Supply/reference regressions.
   - Workbook import regressions.
   - Calculation duplicate normalisation regression.
   - Report HTML supply evidence regression.
4. Merge the current safe regression baseline before starting production implementation.

## Next Phase Plan

The next longer run should start from a clean committed baseline if possible. If Git remains unavailable, it should still use non-Git checkpointing and a single run log.

### Phase 1: WB-001 Fixture/Test Proposal

Type: documentation and test-design planning.

Status: approved to start.

Goal:

- Convert `docs/WB_001_AIRPORT_CUSTOMER_CLASS_SCENARIO.md` into a concrete fixture/test implementation proposal.

Allowed files:

- `docs/WB_001_AIRPORT_CUSTOMER_CLASS_SCENARIO.md`
- future `docs/WB_001_FIXTURE_IMPLEMENTATION_PROPOSAL.md`
- manager control docs only if needed.

Out of scope:

- Production calculation changes.
- Import parser changes.
- Storage changes.
- Report/export changes.
- Shared DTO changes.

Acceptance criteria:

- Exact synthetic inputs are listed.
- Expected recoverable cost base is listed.
- Expected allocation basis by cost line is listed.
- Expected tariff output/reconciliation approach is listed.
- Open decisions are explicit.

### Phase 2: WB-001 Fixture/Test Implementation

Type: test-only implementation.

Status: approved to start after Phase 1 has passing validation.

Goal:

- Add a representative WB-001 fixture and regression test after the proposal is accepted.

Likely files:

- `tests/fixtures/workbook-derived-scenarios.ts`
- `tests/workbook-derived-scenarios.test.ts`
- possibly manager docs.

Guardrails:

- Use existing `calculateTariffs` behaviour only.
- Do not change calculation logic to make the fixture pass.
- Do not add import parsing or source-mapping contracts.

Acceptance criteria:

- Fixture is small and manually reviewable.
- Recoverable costs reconcile to expected recovery.
- Evidence-only/pass-through/excluded items stay outside tariff recovery.
- Low-confidence/unresolved mapping expectations are documented, not silently calculated.

### Phase 3: Workbook Source Mapping Contract Decision

Type: architecture decision and contract planning.

Goal:

- Decide whether to implement a lightweight source-mapping contract.

Likely files:

- `docs/WORKBOOK_SOURCE_MAPPING_PROPOSAL.md`
- future contract proposal document.
- no production code until approved.

Decision points:

- Whether mapping records live only in tests/docs first.
- Whether mapping confidence can be represented without changing shared project DTOs.
- Whether manual overrides are in scope.

### Phase 4: Import Review Surface

Type: implementation only if Phase 3 is approved.

Goal:

- Improve visibility of import confidence, skipped rows, and validation issues.

Likely files:

- import parser tests first.
- `components/WorkbookMethodologyForms.tsx` only after Data Import/UI review.

Guardrails:

- No save-blocking policy changes.
- No shared DTO change without approval.
- Keep parser output shape stable unless reviewed.

### Phase 5: Additional Workbook-Derived Scenarios

Type: scenario coverage.

Goal:

- Add one scenario at a time from `docs/WORKBOOK_DERIVED_SCENARIO_PLAN.md`.

Recommended order:

1. WB-001 airport customer-class fixture/test.
2. WB-006 weak workbook mapping confidence.
3. WB-005 asset-cost allocation by voltage/local class.
4. WB-002 TLM/local losses evidence only.
5. WB-003 port tenant recovery forecast.
6. WB-004 generation/export evidence.

Guardrails:

- Scenarios should not force production calculation changes.
- Evidence-only cases must stay evidence-only unless a decision pack approves tariff impact.

### Phase 6: Report And Demo Hardening

Type: UI/report regression and manual review support.

Goal:

- Make stakeholder review output easier to trust.

Possible work:

- More report HTML regression tests.
- Manual demo checklist refresh.
- Screenshot/manual test notes.
- Clearer limitation wording where needed.

Guardrails:

- Do not convert report UI into export DTO.
- Do not change tariff totals or supply impact.

## Recommended Longer Overnight Run Setup

Before starting:

- Use a clean branch or explicitly continue non-Git with a new run log.
- Define allowed files for the run.
- Decide whether the run may modify production code.
- Do not create per-file checkpoints for docs/test-only work.
- Run full validation every two to three packages and at the end.
- Set a target: for example, "complete WB-001 proposal plus fixture/test implementation, no production code."

Suggested long-run objective:

> Complete WB-001 fixture/test implementation from the approved proposal, then add WB-006 weak mapping confidence as docs/test-only coverage, while keeping production calculation/import/storage/report/export behaviour unchanged.

Expected high-value output from that run:

- WB-001 accepted fixture and regression test.
- WB-006 weak mapping confidence fixture/proposal.
- Updated manager docs.
- Full green validation.
- Clear commit grouping.

## Execution Brief

Detailed execution instructions for the next long unattended run are maintained in:

- `docs/NEXT_LONG_RUN_BRIEF.md`
