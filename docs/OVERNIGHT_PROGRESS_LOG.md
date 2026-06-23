# Overnight Progress Log

Date: 2026-06-22

Git usage: disabled for this session because the repository metadata lock is currently blocked.

## Baseline Checks

Validation performed before further changes:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 16 test files and 98 tests.
- `npm.cmd run build`: passed.

## Package 1: WB-001 Airport Customer-Class Scenario Proposal

Files changed:

- `docs/WB_001_AIRPORT_CUSTOMER_CLASS_SCENARIO.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`

Reason for change:

- Added a docs-only proposal for the first workbook-derived airport customer-class scenario.
- Kept the package gated before any fixtures, tests, import parsing, calculation changes, storage changes, shared DTO changes, report changes, export changes, or UI changes.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 16 test files and 98 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- Future WB-001 fixture/test implementation still needs review by PM, Tariff Engine, Data Import, QA, and the user sign-off owner.
- Exact tariff output expectations should not be added until the implementation proposal is reviewed.

Suggested future Git commit message:

- `Add WB-001 airport customer-class scenario proposal`

## Package 2: Supply Evidence Reconciliation Regression

Files changed:

- `tests/supply-calculation-engine.test.ts`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2026/supply-calculation-engine.test.ts`

Reason for change:

- Added targeted regression coverage to prove invalid, unresolved, and excluded fixed-recovery supply evidence lines stay out of fixed-recovery annual totals.
- This protects the evidence-only supply boundary without changing production calculation logic.

Validation performed:

- `npx.cmd vitest run tests/supply-calculation-engine.test.ts`: passed, 1 test file and 23 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 16 test files and 99 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No business-rule change made.
- The test confirms current evidence reconciliation semantics; any future change to include unresolved or invalid lines in totals should require PM and Tariff Engine review.

Suggested future Git commit message:

- `Add supply evidence reconciliation regression`

## Package 3: Supply Reference Review Regression

Files changed:

- `tests/supply-reference-review.test.ts`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2028/supply-reference-review.test.ts`

Reason for change:

- Added regression coverage for formatted MPAN review handling and valid MPANs that do not match a configured DNO/network area.
- This strengthens supply-reference review traceability without changing reference data, tariff calculations, imports, storage, reports, exports, shared DTOs, or UI behaviour.

Validation performed:

- `npx.cmd vitest run tests/supply-reference-review.test.ts`: passed, 1 test file and 8 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 16 test files and 102 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No business-rule change made.
- Unknown DNO handling remains a review requirement, not an automatic mapping.

Suggested future Git commit message:

- `Add supply reference review regression`

## Package 4: Supply Reference Requirement Queue Regression

Files changed:

- `tests/supply-reference-requirements.test.ts`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2031/supply-reference-requirements.test.ts`

Reason for change:

- Added regression coverage for formatted duplicate MPANs in the supply-reference requirement queue.
- Added coverage for valid MPANs with unknown DNO prefixes so review tasks remain visible even without source document metadata.

Validation performed:

- `npx.cmd vitest run tests/supply-reference-requirements.test.ts`: passed, 1 test file and 4 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 16 test files and 104 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No production behaviour change made.
- Unknown DNOs remain manual review items.

Suggested future Git commit message:

- `Add supply reference requirement queue regression`

## Package 5: Direct Cost Import Regression

Files changed:

- `tests/direct-cost-import.test.ts`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2033/direct-cost-import.test.ts`

Reason for change:

- Added direct-cost import coverage for case/whitespace-tolerant template headers.
- Added coverage that blank workbook rows are skipped without hiding row-numbered validation errors on later rows.
- Added coverage for decimal values with comma separators.

Validation performed:

- `npx.cmd vitest run tests/direct-cost-import.test.ts`: passed, 1 test file and 5 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 16 test files and 105 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No parser behaviour change made.
- This captures existing import behaviour so future workbook handling changes remain visible.

Suggested future Git commit message:

- `Add direct cost import regression`

## Package 6: Asset Import Regression

Files changed:

- `tests/asset-import.test.ts`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2035/asset-import.test.ts`

Reason for change:

- Added asset import coverage for case/whitespace-tolerant template headers.
- Added coverage that blank workbook rows are skipped without hiding row-numbered validation errors on later rows.

Validation performed:

- `npx.cmd vitest run tests/asset-import.test.ts`: passed, 1 test file and 7 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 16 test files and 106 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No parser behaviour change made.
- Asset import remains governed by the existing template and validation rules.

Suggested future Git commit message:

- `Add asset import regression`

## Package 7: Boundary Meter Import Regression

Files changed:

- `tests/boundary-meter-import.test.ts`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2037/boundary-meter-import.test.ts`

Reason for change:

- Added boundary-meter import coverage for case/whitespace-tolerant template headers.
- Added coverage that blank workbook rows are skipped without hiding row-numbered validation errors on later rows.

Validation performed:

- `npx.cmd vitest run tests/boundary-meter-import.test.ts`: passed, 1 test file and 6 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 16 test files and 107 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No parser behaviour change made.
- Existing short-row import behaviour is left unchanged.

Suggested future Git commit message:

- `Add boundary meter import regression`

## Package 8: Employee Cost Import Regression

Files changed:

- `tests/employee-cost-import.test.ts`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2039/employee-cost-import.test.ts`

Reason for change:

- Added employee-cost import coverage for case/whitespace-tolerant template headers.
- Added coverage that blank workbook rows are skipped without hiding row-numbered validation errors on later rows.

Validation performed:

- `npx.cmd vitest run tests/employee-cost-import.test.ts`: passed, 1 test file and 6 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 16 test files and 108 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No parser behaviour change made.
- Employee role type values remain governed by the existing allowed list.

Suggested future Git commit message:

- `Add employee cost import regression`

## Package 9: Indirect Overhead Import Regression

Files changed:

- `tests/indirect-overhead-import.test.ts`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2041/indirect-overhead-import.test.ts`

Reason for change:

- Added indirect-overhead import coverage for case/whitespace-tolerant template headers.
- Added coverage that blank workbook rows are skipped without hiding row-numbered validation errors on later rows.
- Added coverage for decimal values with comma separators.

Validation performed:

- `npx.cmd vitest run tests/indirect-overhead-import.test.ts`: passed, 1 test file and 5 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 16 test files and 109 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No parser behaviour change made.
- This captures current import behaviour before broader workbook source mapping work.

Suggested future Git commit message:

- `Add indirect overhead import regression`

## Final Session Handover

Completed:

- Added the WB-001 airport customer-class scenario proposal and updated manager control docs.
- Added supply evidence reconciliation regression coverage.
- Added supply reference review and requirement queue regression coverage.
- Added import parser regression coverage for direct costs, assets, boundary meters, employee costs, and indirect overheads.
- Created non-Git checkpoint copies before each test-file package.

Files changed:

- `docs/WB_001_AIRPORT_CUSTOMER_CLASS_SCENARIO.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/OVERNIGHT_PROGRESS_LOG.md`
- `docs/codex-checkpoints/2026-06-22-2026/supply-calculation-engine.test.ts`
- `docs/codex-checkpoints/2026-06-22-2028/supply-reference-review.test.ts`
- `docs/codex-checkpoints/2026-06-22-2031/supply-reference-requirements.test.ts`
- `docs/codex-checkpoints/2026-06-22-2033/direct-cost-import.test.ts`
- `docs/codex-checkpoints/2026-06-22-2035/asset-import.test.ts`
- `docs/codex-checkpoints/2026-06-22-2037/boundary-meter-import.test.ts`
- `docs/codex-checkpoints/2026-06-22-2039/employee-cost-import.test.ts`
- `docs/codex-checkpoints/2026-06-22-2041/indirect-overhead-import.test.ts`
- `tests/supply-calculation-engine.test.ts`
- `tests/supply-reference-review.test.ts`
- `tests/supply-reference-requirements.test.ts`
- `tests/direct-cost-import.test.ts`
- `tests/asset-import.test.ts`
- `tests/boundary-meter-import.test.ts`
- `tests/employee-cost-import.test.ts`
- `tests/indirect-overhead-import.test.ts`

Final validation:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 16 test files and 109 tests.
- `npm.cmd run build`: passed.

What remains:

- WB-001 fixture/test implementation remains gated behind review of `docs/WB_001_AIRPORT_CUSTOMER_CLASS_SCENARIO.md`.
- No tariff-impacting supply integration was attempted.
- No methodology configuration, storage, import shape, export DTO, shared DTO, report total, or UI behaviour change was made.

Risks and assumptions:

- The added tests document existing behaviour; they intentionally avoid changing business rules.
- The checkpoint files are duplicated test snapshots and may be excluded from a future product commit if the team does not want checkpoint artifacts in source control.
- Git was not used at all during this session.

Recommended future commit grouping:

1. `Add WB-001 airport customer-class scenario proposal`
   - `docs/WB_001_AIRPORT_CUSTOMER_CLASS_SCENARIO.md`
   - `docs/MVP_TASK_BOARD.md`
   - `docs/PM_CONTROL.md`
2. `Add overnight delivery progress log`
   - `docs/OVERNIGHT_PROGRESS_LOG.md`
   - optional checkpoint files under `docs/codex-checkpoints/`
3. `Add supply evidence and reference review regressions`
   - `tests/supply-calculation-engine.test.ts`
   - `tests/supply-reference-review.test.ts`
   - `tests/supply-reference-requirements.test.ts`
4. `Add workbook import parser regressions`
   - `tests/direct-cost-import.test.ts`
   - `tests/asset-import.test.ts`
   - `tests/boundary-meter-import.test.ts`
   - `tests/employee-cost-import.test.ts`
   - `tests/indirect-overhead-import.test.ts`

Recommended next task:

- Review whether checkpoint files should be committed or kept only as temporary working-tree evidence.
- Then prepare the WB-001 fixture/test implementation proposal if the scenario proposal is accepted.

## Package 10: Shared Import Utility Regression

Files changed:

- `tests/import-utils.test.ts`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2046/import-utils.ts`

Reason for change:

- Added direct coverage for shared import header normalisation, template validation, required number parsing, and generated imported row ID format.
- This protects the common utility behaviour used by workbook import parsers without changing parser implementation.

Validation performed:

- `npx.cmd vitest run tests/import-utils.test.ts`: passed, 1 test file and 4 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 17 test files and 113 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No utility behaviour change made.
- The row ID test fixes the current ID shape and may need review if ID generation is deliberately changed later.

Suggested future Git commit message:

- `Add shared import utility regression`

## Package 11: Supply Reference Source Discovery Regression

Files changed:

- `tests/supply-reference-source-discovery.test.ts`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2048/supply-reference-source-discovery.test.ts`

Reason for change:

- Added coverage that source discovery deduplicates resolved document URLs.
- Added coverage that decoded HTML entities are preserved in reviewable link titles and URLs.

Validation performed:

- `npx.cmd vitest run tests/supply-reference-source-discovery.test.ts`: initially failed because duplicate URL handling keeps the later title.
- Adjusted the test to match existing behaviour without changing production code.
- `npx.cmd vitest run tests/supply-reference-source-discovery.test.ts`: passed, 1 test file and 3 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 17 test files and 114 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No source discovery behaviour change made.
- Duplicate URL handling currently keeps the later title for the same resolved URL. This is now documented by test behaviour and can be revisited later if needed.

Suggested future Git commit message:

- `Add supply reference source discovery regression`

## Package 12: Supply Reference Extraction Regression

Files changed:

- `tests/supply-reference-extraction.test.ts`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2051/supply-reference-extraction.test.ts`

Reason for change:

- Added coverage that blank extraction rows are skipped.
- Added coverage that missing source references fall back to the source file name.
- Added coverage for existing confidence normalisation behaviour.

Validation performed:

- `npx.cmd vitest run tests/supply-reference-extraction.test.ts`: passed, 1 test file and 4 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 17 test files and 115 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No extraction behaviour change made.
- Existing confidence normalisation treats values above 1 as percentages, including 1.5 becoming 0.015.

Suggested future Git commit message:

- `Add supply reference extraction regression`

## Package 13: Calculation Duplicate Normalisation Regression

Files changed:

- `tests/calculation-engine.test.ts`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2053/calculation-engine.test.ts`

Reason for change:

- Added coverage that duplicate customer classes are detected after whitespace trimming.
- Added coverage that duplicate allocation shares are detected after customer-class whitespace trimming.
- This protects current calculation validation behaviour without changing tariff outputs or calculation semantics.

Validation performed:

- `npx.cmd vitest run tests/calculation-engine.test.ts`: passed, 1 test file and 24 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 17 test files and 117 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No calculation behaviour change made.
- These tests document existing normalisation semantics.

Suggested future Git commit message:

- `Add calculation duplicate normalisation regression`

## Package 14: MPAN Network Area Lookup Regression

Files changed:

- `tests/project-storage.test.ts`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2055/project-storage.ts`

Reason for change:

- Added regression coverage for MPAN distributor lookup used by supply-reference review.
- Covered formatted MPANs, incomplete MPANs, and unknown distributor prefixes.

Validation performed:

- `npx.cmd vitest run tests/project-storage.test.ts`: passed, 1 test file and 3 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 18 test files and 120 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No storage behaviour change made.
- This test documents current lookup behaviour only.

Suggested future Git commit message:

- `Add MPAN network area lookup regression`

## Continuation Handover

Additional packages completed after the first handover:

- Shared import utility regression.
- Supply reference source discovery regression.
- Supply reference extraction regression.
- Calculation duplicate normalisation regression.
- MPAN network area lookup regression.

Additional files changed:

- `tests/import-utils.test.ts`
- `tests/supply-reference-source-discovery.test.ts`
- `tests/supply-reference-extraction.test.ts`
- `tests/calculation-engine.test.ts`
- `tests/project-storage.test.ts`
- `docs/codex-checkpoints/2026-06-22-2046/import-utils.ts`
- `docs/codex-checkpoints/2026-06-22-2048/supply-reference-source-discovery.test.ts`
- `docs/codex-checkpoints/2026-06-22-2051/supply-reference-extraction.test.ts`
- `docs/codex-checkpoints/2026-06-22-2053/calculation-engine.test.ts`
- `docs/codex-checkpoints/2026-06-22-2055/project-storage.ts`

Latest final validation:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 18 test files and 120 tests.
- `npm.cmd run build`: passed.

Updated recommended future commit grouping:

1. `Add WB-001 airport customer-class scenario proposal`
   - `docs/WB_001_AIRPORT_CUSTOMER_CLASS_SCENARIO.md`
   - `docs/MVP_TASK_BOARD.md`
   - `docs/PM_CONTROL.md`
2. `Add overnight delivery progress log`
   - `docs/OVERNIGHT_PROGRESS_LOG.md`
   - optional checkpoint files under `docs/codex-checkpoints/`
3. `Add supply evidence and reference review regressions`
   - `tests/supply-calculation-engine.test.ts`
   - `tests/supply-reference-review.test.ts`
   - `tests/supply-reference-requirements.test.ts`
   - `tests/supply-reference-source-discovery.test.ts`
   - `tests/supply-reference-extraction.test.ts`
   - `tests/project-storage.test.ts`
4. `Add workbook import parser regressions`
   - `tests/import-utils.test.ts`
   - `tests/direct-cost-import.test.ts`
   - `tests/asset-import.test.ts`
   - `tests/boundary-meter-import.test.ts`
   - `tests/employee-cost-import.test.ts`
   - `tests/indirect-overhead-import.test.ts`
5. `Add calculation duplicate normalisation regression`
   - `tests/calculation-engine.test.ts`

## Package 15: Report HTML Supply Evidence Regression

Files changed:

- `tests/report-readiness.test.tsx`

Checkpoint:

- `docs/codex-checkpoints/2026-06-22-2058/report-readiness.test.tsx`

Reason for change:

- Extended the report HTML download regression to confirm evidence-only supply content is included in the downloaded stakeholder report.

Validation performed:

- `npx.cmd vitest run tests/report-readiness.test.tsx`: passed, 1 test file and 5 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 18 test files and 120 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No report behaviour change made.
- This test documents current stakeholder report content.

Suggested future Git commit message:

- `Add report HTML supply evidence regression`

## Final Continuation Validation

Latest final validation after package 15:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 18 test files and 120 tests.
- `npm.cmd run build`: passed.

Additional recommended future commit grouping:

6. `Add report HTML supply evidence regression`
   - `tests/report-readiness.test.tsx`

Current stop point:

- WB-001 is approved for test-only implementation.
- Checkpoint files are approved for deletion before commit.
- No Git commands were run during this continuation.

## Post-Run Review

Follow-up review document:

- `docs/OVERNIGHT_REVIEW_AND_NEXT_PHASE_PLAN.md`

Purpose:

- Consolidates overnight progress, confirms requirement completion, identifies deliberately unfinished items, and proposes the next longer-run phase plan.
