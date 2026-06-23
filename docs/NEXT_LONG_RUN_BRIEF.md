# Next Long Run Brief

Date: 2026-06-22

Status: execution brief for the next extended unattended run.

## Primary Objective

Progress workbook-derived scenario coverage quickly while preserving the current tariff calculation, import, storage, export, shared DTO, report total, and UI behaviour.

Target outcome:

- WB-001 airport customer-class fixture/test implementation completed if the proposal is accepted.
- WB-006 weak workbook mapping confidence proposal or test-design package completed.
- Manager docs updated.
- Full validation green.
- Clear handover and commit grouping ready.

## Operating Mode

Default mode for the next long run:

- Test/docs-led delivery.
- No production behaviour changes unless separately approved.
- Use small packages.
- Keep a run log.
- Do not create per-file checkpoint folders for docs-only or test-only packages.
- Create non-Git checkpoint copies only before production-code edits, and only if those edits are explicitly approved.
- If Git is available, work on a feature branch and commit passing checkpoints.

If Git remains unavailable:

- Do not use Git.
- Do not create per-file checkpoint folders for docs/test-only work.
- Keep `docs/LONG_RUN_PROGRESS_LOG.md`.
- Do not ask Nathan for manual PowerShell during the run unless a material decision is needed.

## Pre-Run Decisions

The following decisions are now recorded:

1. `docs/codex-checkpoints/` should be treated as temporary evidence and discarded before commit.
2. WB-001 is approved for test-only implementation.
3. Manager doc updates are allowed where they record completed packages and risks.
4. New test fixture files under `tests/fixtures/` are allowed.
5. Git should only be used if the `.git/index.lock` issue is resolved before the run starts.
6. Full validation should run every two to three packages, and at the end, rather than after every small docs/test-only package.

Outstanding before the next long run:

- Confirm whether Git is available or still disabled.
- If Git is available, start from a clean feature branch.
- If Git is still unavailable, continue with `docs/LONG_RUN_PROGRESS_LOG.md` and new non-Git checkpoints only if needed.

## Package Plan

### Package A: WB-001 Fixture Implementation Proposal

Type: docs-only.

Status: approved to start.

Estimated effort: 20-30 minutes.

Allowed files:

- `docs/WB_001_FIXTURE_IMPLEMENTATION_PROPOSAL.md`
- `docs/WB_001_AIRPORT_CUSTOMER_CLASS_SCENARIO.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- run log.

Deliverables:

- Exact customer classes.
- Exact cost lines.
- Exact recoverable cost base.
- Expected allocation shares.
- Expected class-level allocated costs.
- Explicit evidence-only and excluded values.
- Test acceptance criteria.

Validation:

- `npm.cmd run lint`
- `npx.cmd tsc --noEmit --incremental false`
- `npm.cmd test`
- `npm.cmd run build`

Stop conditions:

- Stop if exact expected outputs cannot be derived from existing `calculateTariffs` semantics.
- Stop if capacity charging cannot be represented by current demand tariff component without changing production logic.

### Package B: WB-001 Fixture And Regression Test

Type: test-only.

Status: approved to start after Package A has passing validation.

Estimated effort: 45-75 minutes.

Allowed files:

- `tests/fixtures/workbook-derived-scenarios.ts`
- `tests/workbook-derived-scenarios.test.ts`
- run log.
- manager docs only after green validation.

Out of scope:

- `lib/calculation-engine.ts`
- `types/project.ts`
- import parsers.
- UI/report components.
- storage.
- export DTOs.

Fixture shape:

- One project ID.
- Three customer classes:
  - Terminal retail.
  - Airside operations.
  - EV charging.
- Three recoverable cost pools:
  - Network asset annuity: 180,000 allocated by demand/capacity.
  - Network maintenance: 90,000 allocated by annual kWh.
  - Customer administration: 36,000 allocated by meter count.
- Evidence-only rows represented in fixture metadata, not fed into `calculateTariffs`.
- Unresolved workbook row represented in fixture metadata, not fed into `calculateTariffs`.

Expected recoverable revenue target:

- 306,000.

Expected allocation principles:

- Customer administration by meter count:
  - Terminal retail: 12 / 18.
  - Airside operations: 4 / 18.
  - EV charging: 2 / 18.
- Network maintenance by annual kWh:
  - Terminal retail: 2,400,000 / 11,600,000.
  - Airside operations: 8,000,000 / 11,600,000.
  - EV charging: 1,200,000 / 11,600,000.
- Network asset annuity by capacity:
  - Terminal retail: 1,500 / 5,500.
  - Airside operations: 3,000 / 5,500.
  - EV charging: 1,000 / 5,500.

Acceptance criteria:

- `calculateTariffs` returns revenue requirement of 306,000.
- Allocated cost reconciles to 306,000 within tolerance.
- No validation errors are emitted for the approved fixture.
- Audit trace includes revenue requirement, cost allocation, class totals, rate derivation, and revenue recovery entries.
- Evidence-only and unresolved fixture metadata are asserted not to be part of calculation inputs.

Validation:

- Focused test.
- Lint.
- Type-check.
- Full tests.
- Build.

Stop conditions:

- Stop rather than change production calculation logic if expected outputs do not reconcile.
- Stop if evidence-only metadata requires shared DTO changes.

### Package C: WB-006 Weak Mapping Confidence Proposal

Type: docs/test-design.

Estimated effort: 30-45 minutes.

Allowed files:

- `docs/WB_006_WEAK_MAPPING_CONFIDENCE_SCENARIO.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- run log.

Purpose:

- Define a scenario proving low-confidence or unresolved workbook mappings are visible and cannot silently feed tariff-impacting calculations.

Acceptance criteria:

- Clearly separates high-confidence recoverable inputs from low-confidence excluded inputs.
- Defines validation expectations.
- Does not require production source-mapping implementation.
- Identifies future implementation options.

Stop conditions:

- Stop if the proposal would require changing imported record shapes or shared DTOs.

### Package D: WB-006 Test-Only Fixture, If Safe

Type: test-only.

Estimated effort: 45-60 minutes.

Allowed files:

- `tests/fixtures/workbook-derived-scenarios.ts`
- `tests/workbook-derived-scenarios.test.ts`
- run log.

Goal:

- Add fixture metadata showing excluded low-confidence rows and assert that only approved rows feed calculation inputs.

Out of scope:

- A generic source-mapping engine.
- Shared DTO changes.
- Import parser changes.

Stop conditions:

- Stop if representing weak mapping requires production contracts.

### Package E: Closeout And Planning Update

Type: docs-only.

Estimated effort: 20-30 minutes.

Allowed files:

- `docs/LONG_RUN_PROGRESS_LOG.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/OVERNIGHT_REVIEW_AND_NEXT_PHASE_PLAN.md`

Deliverables:

- Completed packages.
- Checks run.
- Risks and assumptions.
- Suggested commit grouping.
- Recommended next package.

### Package F: WB-005 Asset Allocation Scenario Proposal

Type: docs/test-design.

Status: approved to start after WB-001 and WB-006 packages if time remains.

Estimated effort: 30-45 minutes.

Allowed files:

- `docs/WB_005_ASSET_ALLOCATION_SCENARIO.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- run log.

Purpose:

- Define a workbook-derived scenario proving asset chargeability, voltage, network level, and allocation evidence can be represented without changing import parsers or shared DTOs.

Out of scope:

- Production asset import changes.
- Calculation engine changes.
- Source mapping implementation.

### Package G: WB-005 Test-Only Fixture, If Safe

Type: test-only.

Status: approved only if it can use existing calculation inputs and fixture metadata.

Estimated effort: 45-60 minutes.

Allowed files:

- `tests/fixtures/workbook-derived-scenarios.ts`
- `tests/workbook-derived-scenarios.test.ts`
- run log.

Stop conditions:

- Stop if the scenario needs production asset allocation logic or shared DTO changes.

### Package H: Report And Demo Regression Hardening

Type: test/docs-only.

Status: approved if earlier packages are green and time remains.

Estimated effort: 30-60 minutes.

Allowed files:

- `tests/report-readiness.test.tsx`
- `docs/MVP_DEMO_PATH_CHECK.md`
- `docs/MVP_DEMO_REHEARSAL_NOTES.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Purpose:

- Add stakeholder-facing regression coverage or demo notes only where they improve commercial defensibility.

## Validation Cadence

After each docs/test-only package:

- Run focused test if any test file changed.
- Record package outcome in `docs/LONG_RUN_PROGRESS_LOG.md`.

After every two to three packages:

- Run `npm.cmd run lint`.
- Run `npx.cmd tsc --noEmit --incremental false`.
- Run `npm.cmd test`.

After any production-code package, if one is explicitly approved later:

- Run focused tests.
- Run `npm.cmd run lint`.
- Run `npx.cmd tsc --noEmit --incremental false`.
- Run `npm.cmd test`.
- Run `npm.cmd run build` if app/runtime behaviour could be affected.

Before stopping:

- Run `npm.cmd run lint`.
- Run `npx.cmd tsc --noEmit --incremental false`.
- Run `npm.cmd test`.
- Run `npm.cmd run build`.

## Stop Conditions

Stop and report if:

- A required decision affects tariff methodology.
- A change would require shared DTO changes.
- A change would alter calculation semantics.
- A change would alter import/storage/export/report totals.
- A validation failure cannot be fixed with one narrow test or fixture correction.
- Git is required but still blocked and the requested work specifically requires commits.

## Recommended Commit Grouping

If Git is available later:

1. `Add WB-001 fixture implementation proposal`
2. `Add WB-001 workbook-derived scenario regression`
3. `Add WB-006 weak mapping confidence proposal`
4. `Add WB-006 weak mapping confidence regression`
5. `Add WB-005 asset allocation scenario proposal`
6. `Add WB-005 asset allocation regression`
7. `Harden report and demo regression coverage`
8. `Record long-run closeout`

## Expected End State

At the end of the longer run, the project should have:

- A concrete WB-001 test fixture.
- Regression evidence that the current calculation engine can handle a representative airport customer-class scenario.
- A clear WB-006 weak mapping plan or test-only fixture.
- A WB-005 asset allocation proposal or test-only fixture if safe.
- No production behaviour drift.
- Green lint, type-check, tests, and build.
