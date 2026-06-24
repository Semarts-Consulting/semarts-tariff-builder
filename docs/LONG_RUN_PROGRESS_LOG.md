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

## Package: Methodology Cost Evidence Readiness

Files changed:

- `lib/methodology-cost-readiness.ts`
- `tests/methodology-cost-readiness.test.ts`
- `components/ReportsSummary.tsx`
- `components/WorkbookMethodologyForms.tsx`
- `tests/fixtures/report-readiness.ts`
- `tests/report-readiness.test.tsx`
- `docs/KNOWN_LIMITATIONS_REGISTER.md`

Reason:

- Direct non-employee costs, employee costs and indirect overheads now have a pure evidence/readiness summary.
- The report now shows methodology cost evidence as explicitly non-tariff-impacting.
- The workbook cost input screen now shows a combined commercial review status across direct cost, employee cost and overhead evidence.
- The limitations register now records that these workbook cost rows do not automatically create tariff-driving cost pools or allocations.

Validation performed:

- Focused methodology cost readiness tests passed.
- Focused report readiness regression passed.
- Type-check passed.

Risks or follow-up decisions:

- This remains evidence/readiness only. It does not change recoverable cost pools, allocation, revenue requirement, tariff rates, report totals, imports, exports, storage, shared DTOs, or calculation behaviour.
- Future tariff-impacting use needs an approved methodology configuration and cost-pool mapping decision.

Suggested commit message:

- `Add methodology cost evidence readiness`

## Package: Report Evidence Wording Regression

Files changed:

- `tests/report-readiness.test.tsx`
- `docs/MVP_DEMO_REHEARSAL_NOTES.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- The report download regression now protects the stakeholder-facing evidence-only wording for supply, submeter/loss, asset and methodology cost evidence.
- Demo rehearsal notes now tell the presenter to distinguish tariff-driving inputs from evidence-only sections during walkthrough.

Validation performed:

- Focused report readiness regression passed.

Risks or follow-up decisions:

- This package is test/docs-only. It does not change tariff calculation, imports, storage, exports, shared DTOs, report totals or UI behaviour.

Suggested commit message:

- `Harden report evidence wording regression`

## Package: Evidence Batch Closeout And Next Run Planning

Files changed:

- `docs/NEXT_LONG_RUN_BRIEF.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- The next long-run brief was stale after the workbook-derived scenario and evidence-readiness packages landed.
- The refreshed brief now moves the project from evidence accumulation into decision-led implementation planning.
- The task board now lists the next major packages: submeter-to-tariff input decisioning, Utilityhub hierarchy contract proposal, methodology cost to cost-pool mapping, and asset valuation methodology.
- PM control now states that evidence areas remain non-tariff-impacting until a separately approved package changes that behaviour.

Validation performed:

- Lint passed.
- Type-check passed.
- Full test suite passed.
- Production build passed.

Risks or follow-up decisions:

- The next implementation work contains high-risk methodology decisions and should not be run as production code changes without approval.
- Utilityhub hierarchy alignment depends on the Utilityhub source contract.

Suggested commit message:

- `Refresh next long-run implementation plan`

## Package: Current Evidence Closeout

Files changed:

- `docs/OVERNIGHT_REVIEW_AND_NEXT_PHASE_PLAN.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- The original overnight review document was superseded by the merged workbook, submeter, supply, asset, methodology-cost, report and UtilityHub programme integration packages.
- The closeout now records the active baseline after PR #69 and confirms the project should move into decision-led implementation planning before tariff-impacting changes.

Validation performed:

- Lint passed.
- Type-check passed.
- Full test suite passed.
- Production build passed.

Risks or follow-up decisions:

- The next packages carry material methodology and shared-contract risk. They should start as decision/proposal packages rather than production implementation.

Suggested commit message:

- `Record current evidence closeout`

## Package: Submeter To Tariff Input Decision Pack

Files changed:

- `docs/SUBMETER_TO_TARIFF_INPUT_DECISION_PACK.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- The project needed an explicit decision gate before submeter consumption can become tariff-driving aggregate input.
- The new decision pack defines aggregate-only, submeter evidence-only and submeter-derived aggregate modes.
- It recommends preserving the existing aggregate customer-class tariff input path and generating reviewed aggregate rows later, rather than changing `calculateTariffs` to consume raw submeter rows directly.

Validation performed:

- Lint passed.
- Type-check passed.
- Full test suite passed.
- Production build passed.

Risks or follow-up decisions:

- This package does not approve tariff-impacting implementation.
- Future implementation still needs UtilityHub hierarchy mapping, customer-class mapping, reconciliation tolerance, validation blocker, profiling and loss-treatment decisions to be accepted.

Suggested commit message:

- `Add submeter tariff input decision pack`

## Package: UtilityHub Hierarchy Contract Proposal

Files changed:

- `docs/UTILITYHUB_HIERARCHY_CONTRACT_PROPOSAL.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- Tariff Builder needs an explicit shared-hierarchy contract direction before persistent hierarchy references or tariff-impacting submeter use are implemented.
- The proposal confirms UtilityHub owns shared customer, site, building, location, meter, user, permission and audit records.
- It recommends an additive compatibility mapping layer and blocks local master hierarchy duplication.

Validation performed:

- Lint passed.
- Type-check passed.
- Full test suite passed.
- Production build passed.

Risks or follow-up decisions:

- This proposal does not approve storage migration, shared DTO changes, automatic UtilityHub sync or tariff-impacting hierarchy use.
- Future implementation still needs exact UtilityHub entity IDs, compatibility handling, review status, confidence and manual override rules.

Suggested commit message:

- `Add UtilityHub hierarchy contract proposal`

## Package: Supply Energy Tariff Impact Proposal

Files changed:

- `docs/SUPPLY_ENERGY_TARIFF_IMPACT_PROPOSAL.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- Supply p/kWh application is now visible in the tariff calculation workflow, so the project needed a clear boundary between explicit applied rows and automatic supply evidence-to-tariff conversion.
- The proposal confirms explicit reviewed supply p/kWh rows may affect Energy / kWh for a selected customer class.
- It keeps automatic supply evidence derivation, annual amount allocation, report total changes, storage changes and export DTO changes blocked.

Validation performed:

- Lint passed.
- Type-check passed.
- Full test suite passed.
- Production build passed.

Risks or follow-up decisions:

- Future automatic supply derivation still requires customer applicability, reporting category, pass-through, denominator, audit trace and double-recovery decisions.

Suggested commit message:

- `Add supply energy tariff impact proposal`

## Package: Meter Map Programme Alignment

Files changed:

- `AGENTS.md`
- `docs/UTILITYHUB_HIERARCHY_CONTRACT_PROPOSAL.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- Programme Control Pack now recognises UtilityMap / Meter Map as a UtilityHub module.
- Tariff Builder needs its local governance docs to state that buildings, floors, supply points, meters, meter readings, document uploads, shared audit and shared permissions remain UtilityHub-owned.
- Future mapped areas, meter-to-area allocations, allocation confidence, area usage metrics and map-specific data-quality issues should be consumed from UtilityHub/Meter Map contracts, not recreated as Tariff Builder masters.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 38 test files and 200 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This package is docs-only and does not approve production Meter Map integration.
- Future Tariff Builder implementation must wait for UtilityHub/Meter Map shared contracts before touching persistent hierarchy IDs, mapped area inputs, allocation evidence or usage data.

Suggested commit message:

- `Record Meter Map programme alignment`

## Package: Methodology Cost To Cost-Pool Mapping Proposal

Files changed:

- `docs/METHODOLOGY_COST_POOL_MAPPING_PROPOSAL.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- Methodology cost evidence is visible in the application and reports, but direct costs, employee costs and overheads must not automatically become tariff-driving cost pools.
- The proposal defines cost-pool-only, methodology cost evidence-only and methodology-derived cost-pool modes.
- It recommends that future implementation should generate reviewed cost-pool candidates and explicit `CostPoolRow` records, rather than changing `calculateTariffs` to read raw workbook cost evidence directly.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 38 test files and 200 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This package is docs-only and does not approve production mapping implementation.
- Future implementation still needs approval for review statuses, confidence values, duplicate handling, split treatment, persistence, manual override, allocation readiness and report audit evidence.

Suggested commit message:

- `Add methodology cost mapping proposal`

## Package: Asset Valuation Methodology Decision Pack

Files changed:

- `docs/ASSET_VALUATION_METHOD_DECISION_PACK.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- Asset evidence is visible in the application and reports, but prior-year asset values, life years, chargeability and voltage classifications must not automatically calculate tariff recovery.
- The decision pack defines evidence-only, approved annual amount and calculated annual amount modes.
- It recommends that the first production route should use approved annual asset recovery amounts converted into explicit `CostPoolRow` records before any formula-based valuation method is implemented.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 38 test files and 200 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This package is docs-only and does not approve production asset valuation implementation.
- Formula-based valuation still needs owner decisions for chargeability, valuation source, useful life, WACC, CPI, depreciation, annuity, shared-use treatment, allocation basis and report audit evidence.

Suggested commit message:

- `Add asset valuation methodology decision pack`

## Package: Friday Import Review, Walkthrough And Decision-Phase Closeout

Files changed:

- `lib/submeter-import-review.ts`
- `tests/submeter-import-review.test.ts`
- `docs/SUBMETER_WALKTHROUGH_CHECKLIST.md`
- `docs/MVP_STAKEHOLDER_DEMO_PREP.md`
- `docs/MVP_DEMO_REHEARSAL_NOTES.md`
- `docs/FRIDAY_DECISION_PHASE_CLOSEOUT.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- Complete the planned Friday packages in one controlled batch.
- Harden import review duplicate detection without changing parser contracts or tariff behaviour.
- Refresh stakeholder walkthrough material to reflect the latest decision-pack boundaries.
- Record the decision-pack phase closeout and recommended next package.

Validation performed:

- Focused import review test passed.
- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed on rerun, 38 test files and 203 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- Import review remains review-only and does not block save, replace rows, change parser output, change storage or affect tariff calculations.
- First-release readiness review is the recommended next package before any production behaviour changes.

Suggested commit message:

- `Complete Friday import and walkthrough closeout`

## Package: First Release Readiness Review

Files changed:

- `docs/FIRST_RELEASE_READINESS_REVIEW.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- The project needed a single current release-readiness view after PRs #73 to #77.
- The review separates controlled internal/selected stakeholder readiness from unrestricted external production release.
- It identifies the remaining blockers and the recommended next package: manual/browser walkthrough evidence or release decision record.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 38 test files and 203 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This package is docs-only and does not approve external production release.
- User still needs to decide the release target: internal controlled use, selected stakeholder review, or external production release.

Suggested commit message:

- `Add first release readiness review`

## Package: Manual/Browser Walkthrough Evidence Record

Files changed:

- `docs/FIRST_RELEASE_WALKTHROUGH_EVIDENCE.md`
- `docs/FIRST_RELEASE_READINESS_REVIEW.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- The first-release readiness review recommended a manual/browser walkthrough before any release decision.
- This package adds the evidence record and links it from the readiness and control docs.
- The actual walkthrough result remains pending and must be recorded after the app is run locally.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 38 test files and 203 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This package is docs-only and does not claim the walkthrough has been completed.
- User still needs to run the app and complete the walkthrough evidence before a release decision can be recorded.

Suggested commit message:

- `Add first release walkthrough evidence record`

## Package: UtilityHub Data Ownership And Tariff Year Model Decision

Files changed:

- `docs/UTILITYHUB_DATA_OWNERSHIP_AND_TARIFF_YEAR_MODEL.md`
- `docs/FIRST_RELEASE_READINESS_REVIEW.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- User review identified that Tariff Builder should not own meter, consumption, boundary meter, supply contract or reusable reference data.
- The decision pack records UtilityHub as the system of record and Tariff Builder as the tariff-year methodology and calculation workspace.
- It also records the longer-term product shape: tariff models containing annual tariff years, rather than treating each tariff build as a standalone project.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 38 test files and 203 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This package is docs-only and does not change storage, imports, shared DTOs, UI, reference data, report totals or calculation behaviour.
- Future implementation needs separate contracts for tariff model/year structure, UtilityHub data selection surfaces, CPI sourcing, losses/reference data, boundary meter selection and customer-class table UX.

Suggested commit message:

- `Record UtilityHub data ownership and tariff year model`

## Package: Tariff Year Input Architecture

Files changed:

- `docs/TARIFF_YEAR_INPUT_ARCHITECTURE.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- User asked to focus less on calculations and more on ensuring the correct data inputs exist first.
- The package defines the input architecture Tariff Builder should move toward before further tariff calculation expansion.
- It separates UtilityHub-owned source data from Tariff Builder-owned tariff-year selections, assumptions, direct costs, allocation choices and calculation runs.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 38 test files and 203 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This package is docs-only and does not change production behaviour.
- Future implementation still needs approved contracts for tariff model/year structure, UtilityHub data selection, customer/site hierarchy, meter and consumption selection, boundary meter selection, CPI/TLM/reference data selection and customer-class UX.

Suggested commit message:

- `Add tariff year input architecture`

## Package: Tariff Model And Tariff Year Contract Proposal

Files changed:

- `docs/TARIFF_MODEL_YEAR_CONTRACT_PROPOSAL.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- The input architecture package identified the tariff model/year contract as the next safe prerequisite.
- The proposal defines long-lived tariff model and annual tariff year concepts before any storage, route, shared DTO or calculation changes.
- It keeps UtilityHub-owned customer/site/meter/reading records separate from Tariff Builder-owned tariff model, tariff year, input selection and calculation run records.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 38 test files and 203 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This package is docs-only and does not change production behaviour.
- Future implementation still needs owner approval for storage compatibility, UI terminology, project-to-model migration, UtilityHub ID usage and input selection contracts.

Suggested commit message:

- `Add tariff model year contract proposal`

## Package: Input Selection Data Model Proposal

Files changed:

- `docs/INPUT_SELECTION_DATA_MODEL_PROPOSAL.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- The tariff model/year contract identified input selection as the next safe prerequisite.
- The proposal defines how tariff years should reference UtilityHub-owned source records and Tariff Builder-owned tariff inputs.
- It makes the evidence-only, candidate, tariff-driving and blocked states explicit before implementation.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 38 test files and 203 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This package is docs-only and does not change production behaviour.
- Future implementation still needs approved TypeScript types, storage compatibility, UI flows and UtilityHub source contracts.

Suggested commit message:

- `Add input selection data model proposal`

## Package: Input Foundation Implementation Batch 01

Files changed:

- `types/project.ts`
- `components/NewProjectForm.tsx`
- `components/ProjectSettingsForm.tsx`
- `components/CustomerClassTableEditor.tsx`
- `components/ProjectDashboardOverview.tsx`
- `lib/customer-classes.ts`
- `lib/input-foundation-readiness.ts`
- `lib/sample-data.ts`
- `tests/customer-classes.test.ts`
- `tests/input-foundation-readiness.test.ts`
- `docs/MVP_TASK_BOARD.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- Start implementing the input-first pathway after PR #83.
- Add optional tariff model/year metadata without replacing existing project storage or routes.
- Replace comma-separated customer class editing with an add/edit/remove table workflow.
- Add input foundation readiness checks for tariff model/year setup and UtilityHub references.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- Focused tests for customer classes, input foundation readiness and demo defaults passed.
- `npm.cmd test`: passed, 40 test files and 210 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- New tariff model/year fields are optional and local-compatible. Supabase project rows do not yet persist these optional fields because no database migration has been approved.
- UtilityHub customer/site fields are reference placeholders only. No UtilityHub API integration or local master data was introduced.
- Calculations, imports, exports, report totals and shared DTOs were not changed.

Suggested commit message:

- `Add input foundation setup workflow`

## Package: Input Selection Scaffolding Long Run

Files changed:

- `types/project.ts`
- `lib/input-selection-readiness.ts`
- `components/ProjectDashboardOverview.tsx`
- `lib/sample-data.ts`
- `tests/input-selection-readiness.test.ts`
- `docs/MVP_TASK_BOARD.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- Continue the input-first pathway after PR #84 toward stages 7-10.
- Add evidence-only selection scaffolding for customer/site, meter and consumption, boundary meters, and reference data.
- Surface selected, evidence-only and tariff-driving counts on the project dashboard without changing calculations.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- Focused input selection readiness tests passed.
- `npm.cmd test`: passed, 41 test files and 214 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This package does not implement UtilityHub API calls, storage migration, real selectors, report total changes, exports, imports or calculation changes.
- The default scaffold is evidence-only and exists to show the required pathway. It should be replaced by UtilityHub-backed selectors when shared contracts are available.

Suggested commit message:

- `Add input selection readiness scaffolding`

## Package: UtilityHub Selector Contract Dependencies

Files changed:

- `docs/UTILITYHUB_SELECTOR_CONTRACT_DEPENDENCIES.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- Continue the input-first pathway after PR #85.
- Define the external UtilityHub/shared-service contracts required before live selectors replace evidence-only scaffolding.
- Keep Tariff Builder aligned with UtilityHub ownership of customer/site hierarchy, meters, readings, boundary meters, reference data, permissions and source provenance.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 41 test files and 214 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This package is docs-only and does not change production behaviour.
- Future selector implementation remains blocked until UtilityHub contracts provide stable shared IDs, permission-safe fields, validation status, source versioning and monthly summary data.
- UtilityHub-sourced data should remain evidence-only by default until a separate approved package makes selected records tariff-driving.

Suggested commit message:

- `Add UtilityHub selector contract dependencies`

## Package: UtilityHub Shared Selector Contract Request

Files changed:

- `docs/UTILITYHUB_SHARED_SELECTOR_CONTRACT_REQUEST.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- Convert Tariff Builder's live selector dependency into a practical request for UtilityHub / Programme Control.
- Define the required shared contracts for customer/site context, meters, monthly consumption summaries, boundary meters, reference data, source metadata and audit metadata.
- Keep Tariff Builder implementation blocked until UtilityHub confirms ownership, fields, permissions, source versioning and sample payloads.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 41 test files and 214 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- This package is docs-only and does not change production behaviour.
- UtilityHub still needs to confirm endpoint/service shape, snapshot strategy, permission representation, monthly summary ownership, meter responsibility ownership and boundary meter designation model.
- Tariff Builder live selector implementation should proceed one selector at a time after shared contract examples exist.

Suggested commit message:

- `Add UtilityHub shared selector contract request`

## Package: UtilityHub Selector Contract Closeout

Files changed:

- `docs/UTILITYHUB_SELECTOR_CONTRACT_CLOSEOUT.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/LONG_RUN_PROGRESS_LOG.md`

Reason:

- Record that UtilityHub has merged the Tariff Builder selector contract package in UtilityHub PR #2.
- Update Tariff Builder control docs to show that the first contract blocker is cleared.
- Keep live API integration, storage migration and tariff-impacting selected data out of scope.

Validation performed:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 41 test files and 214 tests.
- `npm.cmd run build`: passed.

Risks or follow-up decisions:

- UtilityHub has contract files but no live API routes yet.
- The next Tariff Builder package should plan customer/site selector implementation against the contract before any API or storage changes.
- Meter, consumption, boundary meter and reference-data selectors should remain behind customer/site selector stability.

Suggested commit message:

- `Record UtilityHub selector contract closeout`
