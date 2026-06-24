# Long Run Progress Log

Date: 2026-06-22

Operating model:

- Docs/tests-led delivery.
- No Git commands.
- No per-file checkpoint folders for docs/test-only packages.
- No production behaviour changes.
- Full validation every two to three packages and at final closeout.

## Package A: WB-001 Fixture Implementation Proposal

Files changed:

- `docs/WB_001_FIXTURE_IMPLEMENTATION_PROPOSAL.md`
- `docs/WB_001_AIRPORT_CUSTOMER_CLASS_SCENARIO.md`

Reason for change:

- Converted WB-001 from a scenario proposal into an exact test-only implementation proposal.
- Defined synthetic customer inputs, recoverable cost pools, allocation shares, expected class outputs, evidence-only metadata, and test acceptance criteria.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 19 test files and 124 tests.
- `npm.cmd run build`: passed.
- `npm.cmd test`: passed, 18 test files and 120 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- Capacity values will be represented through the current `peakDemandKw`/Demand calculation path for test-only coverage.
- No production calculation or shared DTO change is approved.

Suggested future Git commit message:

- `Add WB-001 fixture implementation proposal`

## Package B: WB-001 Fixture And Regression Test

Files changed:

- `tests/fixtures/workbook-derived-scenarios.ts`
- `tests/workbook-derived-scenarios.test.ts`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason for change:

- Added the approved WB-001 airport customer-class fixture.
- Added a regression test proving the current calculation engine can reconcile the fixture without including evidence-only or unresolved workbook values in tariff recovery.

Validation performed:

- `npx.cmd vitest run tests/workbook-derived-scenarios.test.ts`: passed, 1 test.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 19 test files and 121 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- Capacity values are represented through the existing `peakDemandKw`/Demand path for test-only coverage.
- Evidence-only and unresolved workbook values are local fixture metadata only; no shared DTO or production import contract has been introduced.

Suggested future Git commit message:

- `Add WB-001 workbook-derived regression test`

## Package C: WB-006 Weak Mapping Confidence Scenario Proposal

Files changed:

- `docs/WB_006_WEAK_MAPPING_CONFIDENCE_SCENARIO.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason for change:

- Added a planning-only scenario for weak, low-confidence, and unresolved workbook mappings.
- Defined how future test-only metadata should prove uncertain workbook values cannot silently feed tariff-impacting calculations.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.

Risks or follow-up decisions:

- Production source-mapping DTOs remain unapproved.
- Business owner still needs to confirm confidence thresholds and manual override treatment before production import behaviour changes.

Suggested future Git commit message:

- `Add weak mapping confidence scenario proposal`

## Package D: WB-006 Weak Mapping Confidence Regression Test

Files changed:

- `tests/fixtures/workbook-derived-scenarios.ts`
- `tests/workbook-derived-scenarios.test.ts`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason for change:

- Added a test-only weak mapping fixture using local metadata.
- Added regression coverage proving only high-confidence calculation-input workbook rows feed tariff inputs, while low-confidence, unresolved, evidence-only, and manual-review rows stay outside tariff calculation inputs.

Validation performed:

- `npx.cmd vitest run tests/workbook-derived-scenarios.test.ts`: passed, 2 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 19 test files and 122 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This is local test metadata only; it does not introduce a production source-mapping DTO.
- Owner still needs to decide production confidence thresholds before workbook parser implementation.

Suggested future Git commit message:

- `Add WB-006 weak mapping regression test`

## Package E: WB-005 Asset Allocation Scenario Proposal

Files changed:

- `docs/WB_005_ASSET_ALLOCATION_SCENARIO.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason for change:

- Added a planning-only scenario for future asset-cost allocation by voltage, local class, and chargeability.
- Kept production asset valuation, annuity calculation, import parsing, storage, shared DTOs, report totals, export, UI, and calculation behaviour out of scope.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.

Risks or follow-up decisions:

- Asset annual amount treatment is a methodology decision and remains unapproved.
- WB-005 should not become a test fixture until chargeability and annual amount rules are confirmed.

Suggested future Git commit message:

- `Add asset allocation scenario proposal`

## Package F: Non-Ready Report Download Regression

Files changed:

- `tests/report-readiness.test.tsx`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason for change:

- Added regression coverage for downloading a non-ready stakeholder report.
- Ensured the exported HTML preserves readiness issues, revenue variance, and validation messages.

Validation performed:

- `npx.cmd vitest run tests/report-readiness.test.tsx`: passed, 6 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 19 test files and 123 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- No report presentation behaviour was changed.

Suggested future Git commit message:

- `Add non-ready report download regression`

## Package G: Manager Control Closeout

Files changed:

- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason for change:

- Updated the project control docs to reflect completed WB-001 and WB-006 test-only coverage.
- Recorded WB-005 as proposal-only and blocked from fixture implementation until asset annual amount and chargeability rules are approved.
- Recorded non-ready report HTML regression coverage.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 19 test files and 123 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- Git has not been used during this session, so these changes still need normal review and commit grouping later.

Suggested future Git commit message:

- `Record workbook-derived scenario coverage closeout`

## Package H: WB-002 TLM And Local Losses Evidence Scenario

Files changed:

- `docs/WB_002_TLM_LOCAL_LOSSES_SCENARIO.md`
- `tests/fixtures/workbook-derived-scenarios.ts`
- `tests/workbook-derived-scenarios.test.ts`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason for change:

- Added a planning document and test-only fixture for TLM/local loss evidence.
- Added regression coverage proving loss-adjusted evidence remains outside `calculateTariffs` volume inputs until loss methodology is approved.

Validation performed:

- `npx.cmd vitest run tests/workbook-derived-scenarios.test.ts`: passed, 3 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.

Risks or follow-up decisions:

- Loss treatment remains a business methodology decision.
- This package does not approve production loss uplift, report total changes, import parsing, storage, shared DTOs, exports, or UI behaviour.

Suggested future Git commit message:

- `Add WB-002 loss evidence regression`

## Package I: WB-003 Port Tenant Recovery Forecast Scenario Proposal

Files changed:

- `docs/WB_003_PORT_TENANT_RECOVERY_SCENARIO.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason for change:

- Added a planning-only scenario for Port of Tilbury-style tenant recovery forecasts, tenant references, tariff model references, and local charging evidence.
- Kept tenant import parsing, recovery forecast calculations, local charging methodology, storage, shared DTOs, report totals, exports, UI, and tariff calculation behaviour out of scope.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.

Risks or follow-up decisions:

- Tenant reference mapping and local charging methodology remain unapproved.
- WB-003 should not become production behaviour until tenant-to-tariff-class treatment is approved.

Suggested future Git commit message:

- `Add port tenant recovery scenario proposal`

## Package J: WB-004 Generation And Export Evidence Scenario Proposal

Files changed:

- `docs/WB_004_GENERATION_EXPORT_EVIDENCE_SCENARIO.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason for change:

- Added a planning-only scenario for generation, export, wind, and local production evidence.
- Kept generation/export methodology, netting, export credits, storage, shared DTOs, import parsing, report totals, exports, UI, and tariff calculation behaviour out of scope.

Validation performed:

- `npx.cmd vitest run tests/workbook-derived-scenarios.test.ts`: passed, 4 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 19 test files and 125 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- Generation/export treatment remains unapproved and must not be inferred from workbook evidence.
- WB-004 should not become production behaviour until generation/export treatment is approved.

Suggested future Git commit message:

- `Add generation export evidence scenario proposal`

## Package K: WB-004 Generation And Export Evidence Regression

Files changed:

- `tests/fixtures/workbook-derived-scenarios.ts`
- `tests/workbook-derived-scenarios.test.ts`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason for change:

- Added test-only generation/export evidence metadata.
- Added regression coverage proving generation/export volumes and credit evidence do not net tariff consumption, reduce recoverable cost, or change revenue requirement.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.

Risks or follow-up decisions:

- This is local fixture metadata only and does not approve generation/export methodology.
- Production netting or export credit logic remains blocked pending owner approval.

Suggested future Git commit message:

- `Add WB-004 generation export regression`

## Package L: Workbook-Derived Coverage Closeout

Files changed:

- `docs/WORKBOOK_DERIVED_COVERAGE_CLOSEOUT.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason for change:

- Added a concise closeout for workbook-derived scenario coverage.
- Summarised completed test-only scenarios, proposal-only scenarios, validation evidence, remaining business decisions, and recommended commit grouping.

Validation performed:

- `npx.cmd vitest run tests/workbook-derived-scenarios.test.ts`: passed, 5 tests.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 19 test files and 126 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This is a no-Git working-tree closeout and still needs normal review/commit grouping later.

Suggested future Git commit message:

- `Record workbook-derived coverage closeout`

## Package M: WB-003 Port Tenant Recovery Regression

Files changed:

- `tests/fixtures/workbook-derived-scenarios.ts`
- `tests/workbook-derived-scenarios.test.ts`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason for change:

- Added test-only tenant recovery metadata.
- Added regression coverage proving tenant names, tariff model references, customer references, SA numbers, forecast kWh, and forecast recovery amounts do not automatically become tariff customer classes, cost pools, or revenue requirements.

Validation performed:

- Pending.

Risks or follow-up decisions:

- This is local fixture metadata only and does not approve tenant import parsing, storage, local charging methodology, shared DTOs, report total changes, export, UI, or calculation behaviour.
- WB-005 remains held until asset chargeability and annual amount treatment are approved.

Suggested future Git commit message:

- `Add WB-003 tenant recovery regression`
# Long-Run Evidence Batch 01 - 2026-06-24

## Package: Report Utilityhub Mapping Evidence

Files changed:

- `components/ReportsSummary.tsx`
- `tests/report-readiness.test.tsx`

Reason:

- Stakeholder reports should show whether submeter evidence can be mapped to Utilityhub-style Customer, Site, Building, Location and Meter references before any tariff-impacting hierarchy use.

Validation performed:

- Focused report readiness regression passed.

Risks or follow-up decisions:

- No Utilityhub IDs are persisted yet. Future persistent mapping remains gated by shared hierarchy contract approval.

Suggested commit message:

- `Add report hierarchy mapping evidence`

## Package: Site Submeter Readiness Summary

Files changed:

- `lib/site-submeter-readiness.ts`
- `tests/site-submeter-readiness.test.ts`
- `components/SiteSubmeterInputsForm.tsx`

Reason:

- The Site Submeters screen now has a single readiness status combining validation, TLM coverage, Utilityhub mapping readiness and unknown meter references.

Validation performed:

- Focused readiness and type-check validation passed.

Risks or follow-up decisions:

- Status is evidence/readiness only and does not block save or alter tariff calculations.

Suggested commit message:

- `Add site submeter readiness summary`

## Package: Import Conflict Summary

Files changed:

- `lib/submeter-import-review.ts`
- `tests/submeter-import-review.test.ts`
- `components/SiteSubmeterInputsForm.tsx`
- `docs/SITE_SUBMETER_AND_TLM_INPUTS.md`

Reason:

- Import review now has summary counts for duplicate meters, duplicate consumption periods and duplicate TLM periods.
- The Site Submeters screen now shows a summary message before detailed duplicate import messages.

Validation performed:

- Focused import review regression passed.

Risks or follow-up decisions:

- Existing import behaviour is unchanged: rows append and conflicts are review evidence only.

Suggested commit message:

- `Add submeter import conflict summary`

## Package: Asset Evidence Readiness

Files changed:

- `lib/asset-readiness.ts`
- `tests/asset-readiness.test.ts`
- `components/ReportsSummary.tsx`
- `tests/fixtures/report-readiness.ts`
- `tests/report-readiness.test.tsx`

Reason:

- Asset values are now summarised as evidence-only report content, including total value, chargeable value, non-chargeable value, voltage grouping and readiness messages.

Validation performed:

- Focused asset readiness and report readiness regressions passed.

Risks or follow-up decisions:

- Asset evidence still does not calculate annuity, depreciation, recoverable cost, allocation or tariff recovery automatically.

Suggested commit message:

- `Add asset evidence readiness reporting`

## Package: Limitations Register Refresh

Files changed:

- `docs/KNOWN_LIMITATIONS_REGISTER.md`
- `tests/report-readiness.test.tsx`

Reason:

- The limitations register now reflects that reconciliation, loss-adjusted consumption, Utilityhub mapping, import review summaries and asset evidence are visible as evidence/readiness items while remaining non-tariff-impacting.
- The HTML report download regression now confirms asset and Utilityhub hierarchy evidence are preserved in exported HTML.

Validation performed:

- Focused report readiness regression passed.

Risks or follow-up decisions:

- Limitations remain open until methodology, storage or tariff-impacting decisions are approved and implemented.

Suggested commit message:

- `Refresh evidence limitations and export coverage`

## Package: Supply Energy Evidence Readiness

Files changed:

- `lib/supply-energy-report-evidence.ts`
- `tests/supply-energy-report-evidence.test.ts`
- `components/ReportsSummary.tsx`
- `tests/report-readiness.test.tsx`

Reason:

- Supply p/kWh report evidence now has a readiness status and messages so the report distinguishes missing, review-needed and ready supply energy evidence.

Validation performed:

- Focused supply energy report evidence and report readiness regressions passed.

Risks or follow-up decisions:

- This remains report evidence only. It does not persist applied supply rows or infer customer-specific final p/kWh.

Suggested commit message:

- `Add supply energy evidence readiness`
