# PM Control Log

## Current Baseline

Date: 2026-06-22

Branch: Git not used during long-run working-tree session.

Working tree status: WB-001, WB-002, WB-003, WB-004, and WB-006 test-only workbook-derived scenario coverage, WB-005 proposal, and non-ready report export regression completed in the working tree.

Latest full checks in the current working tree after long-run packages:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 19 test files and 126 tests.
- `npm.cmd run build`: passed.

PRs #1 through #52 have been merged to `main`. Current uncommitted working-tree work is docs/test-only and has not used Git.

MVP timeline tracking is maintained in `docs/MVP_TIMELINE_TRACKER.md` and must be reported in future handoffs. Current active milestone: workbook-derived scenario coverage and post-MVP defensibility hardening.

## Operating Mode

Current package ownership: Manager-led docs/test-only packages.

Reason: the current work adds local fixtures, regression tests, and planning documents only. It does not change production calculation semantics, import behavior, UI/report behavior, storage, exports, or shared DTO contracts.

Future package rule:

- Small docs/test fixture packages may remain Manager-led when faster and low risk.
- Production code, calculation semantics, import behavior, UI/report changes, or wider regression expansion should be delegated to the relevant delivery thread first.
- Manager remains responsible for scope control, file ownership, review, merge sequencing, and Git handoff.
- QA review should be used when changes affect calculation confidence, stakeholder outputs, or release readiness.
- Use Codex Worktree mode for active task work where possible.
- Codex may create/switch task branches, edit files, run checks, and commit locally when permissions allow.
- Codex must not push or create PRs from the Codex context; after a clean commit, provide exact normal-PowerShell push and PR commands.
- Codex must not work directly on `main`, force push, or merge into `main`.

## MVP Definition

The MVP is a tariff methodology workflow that can:

1. Create and manage a project with project metadata, customer classes, status, and local/cloud persistence.
2. Capture source inputs for customer classes, costs, allocations, and workbook-style methodology inputs.
3. Import structured workbook data with row-level validation and repeatable merge behavior.
4. Calculate tariff outputs using pure TypeScript services outside React components.
5. Surface validation issues and revenue recovery status without silently changing business assumptions.
6. Produce stakeholder-reviewable tariff and methodology report views.
7. Provide enough automated coverage to protect import parsing, calculation behavior, and storage reconciliation.

UI polish is secondary. Accuracy, auditability, reproducibility, and contract stability are the release gates.

## Workstream Ownership

| Workstream | Owner Thread | Primary Ownership | Files To Avoid Without PM Approval |
| --- | --- | --- | --- |
| Data import and validation | `019eeba6-6172-77a0-ade4-4a9ee6ebf1d2` | Import parsers, workbook upload wiring, imported record validation, merge rules | `types/project.ts`, calculation contracts, report DTOs, storage reconciliation |
| Tariff methodology engine | `019eeb9f-3d4b-7a90-a029-8279db480324` | `lib/calculation-engine.ts`, tariff validation issues, tariff output contract, calculation tests | Import parsers, React forms, report layout, Supabase schema |
| UI flow and outputs | `019eeba2-2aa0-7122-96f4-1b565edc791b` | Pages, layout, forms, tables, navigation, report presentation | Business logic in `lib/`, shared types, parser logic, save-blocking validation unless approved |
| Tests and regression checks | `019eeba3-abe8-7bf1-a0c6-d7995e22a634` | Focused regression tests, full check runs, package verification | Production behavior changes unless asked to produce a narrow fix |

## Current Workstream Assessment

### Data Import And Validation

Status: merged in PR #1.

Observed work:

- New parser modules for direct costs, employee costs, indirect overheads, assets, boundary meter rows, and shared import utilities.
- `WorkbookMethodologyForms.tsx` now wires workbook upload flows to parser modules.
- Boundary meter import preserves existing short-row behavior while reporting row-level errors.
- Focused import tests and full tests passed after isolation.

Review risks:

- `WorkbookMethodologyForms.tsx` has a very large diff and should be reviewed separately from UI layout work.
- Parser output shapes are shared architecture because they populate `ProjectMethodologyInputs`.
- Header names, dedupe keys, and row fingerprints must be documented before treating imports as stable.

### Tariff Methodology Engine

Status: validation package merged in PR #1, audit trace merged through PR #4, and default allocation review warning merged in PR #5.

Observed work:

- `calculateTariffs` remains a pure function in `lib/calculation-engine.ts`.
- Tariff result now includes validation issues and revenue recovery status.
- Whitespace-normalised customer-class matching is covered.
- Calculation tests cover revenue requirement, allocation, denominator validation, duplicate and missing classes, missing cost pools, unbalanced allocations, and negative values.
- Deferred supply calculation DTO and scaffold work was removed from the active package.
- Tariff Engine accepts `validationIssues`, `Warning` severity, the current issue-code set, and `isRevenueRecovered` tolerance for MVP after documentation alignment.
- Calculation warnings include default-created allocation methods requiring review, without changing tariff outputs or audit trace values.
- Supply Phase 2 annual amount calculation is merged in `lib/supply-calculation-engine.ts` with focused tests. Supply evidence reconciliation is service-local and feeds evidence-only report presentation without changing tariff outputs, storage, imports, exports, or shared project DTOs.

Review risks:

- Validation issue semantics are now a shared contract consumed by calculation and report UI.
- Validation issues currently report calculation readiness but do not block calculation.
- Audit trace structures are implemented and displayed on the tariff calculations page.

### UI Flow And Outputs

Status: layout and warning UI merged in PR #1; audit trace display merged in PR #4; default allocation review indicator merged in PR #5.

Observed work:

- Responsive layout and navigation updates across app shell, auth, project list, dashboard, settings, and core forms.
- Mixed form files were re-isolated to keep layout-only changes and remove validation/save-blocking behavior.
- `ProjectDashboardOverview.tsx` no longer depends on unapproved validation/revenue recovery DTOs.
- UI review found the held calculation/report warning UI mostly aligned with the approved validation semantics.
- Narrow wording edit completed so warning copy says outputs remain available and should be reviewed before approval, rather than implying calculation is blocked.
- Allocation methods show a non-blocking review indicator for storage-created default rows and clear it when the row is edited.

Review risks:

- `TariffCalculationsSummary.tsx` and `ReportsSummary.tsx` still contain broader warning UI and sticky-table dirty changes from earlier work; the latest isolation only changed warning body wording.
- `DataInputsForm.tsx`, `CostPoolsForm.tsx`, and `AllocationMethodsForm.tsx` should be staged as layout-only if included now.

### Tests And Regression Checks

Status: green baseline on current branch.

Observed work:

- Tests cover import parsers, allocation reconciliation, supply reference flows, and tariff calculations.
- Latest full test run reported 16 files and 96 tests.
- MVP candidate scenario test verifies a representative site reconciles tariff outputs to the recoverable cost base.
- Manual demo path from inputs to allocation, calculation, audit trace, outputs, and reconciliation has been accepted by the user.

Review risks:

- Build passed after the default allocation review package.
- Test ownership should remain separate from business-logic ownership except for narrow fixes.

## Likely Dependency Clashes

| Clash | Files | Risk | Decision |
| --- | --- | --- | --- |
| Imported record shapes | `types/project.ts`, `lib/*-import.ts`, `components/WorkbookMethodologyForms.tsx` | Medium | Data Import proposes, PM reviews, downstream users confirm before merge. |
| Tariff calculation result shape | `types/project.ts`, `lib/calculation-engine.ts`, `components/TariffCalculationsSummary.tsx`, `components/ReportsSummary.tsx` | High | Tariff Engine owns semantics; UI can render only after contract approval. |
| Validation result semantics | `types/project.ts`, form components, calculation engine, reports | High | Do not mix form save-blocking validation with calculation validation in one package. |
| Allocation reconciliation | `lib/project-storage.ts`, `components/CostPoolsForm.tsx`, `tests/allocation-reconciliation.test.ts` | Medium | Treat as data/storage behavior, not UI behavior. |
| Supply calculation | `SUPPLY_CALCULATION_DESIGN.md`, `docs/SUPPLY_CALCULATION_DECISION_PACK.md`, `docs/SUPPLY_PHASE_2_SIGNOFF_PACK.md`, `docs/SUPPLY_PHASE_2_DECISION_BRIEF.md`, `lib/supply-calculation-engine.ts`, future shared types/integration files | High | Phase 2 annual amounts only; tariff/report integration remains blocked until allocation and pass-through decisions are accepted. |
| Report/export DTOs | `components/ReportsSummary.tsx`, future export code, tariff result types | Medium | PM approval required before adding stakeholder-facing checks or export fields. |
| Methodology configuration | future configuration docs/types, `types/project.ts`, calculation engine, import mapping, report UI | High | Do not hardcode airport, port, or site-specific workbook behaviour; define contracts before implementation. |

## Merge Order

1. Shared contract documentation and manager control docs.
2. Data Import parser extraction package, excluding unrelated validation/save-blocking.
3. Tariff Engine calculation validation package, including tests and type contract.
4. Storage allocation reconciliation package, if accepted as MVP behavior.
5. UI layout-only package.
6. Calculation/report warning UI package, only after tariff result contract approval.
7. QA final full gate: lint, type-check, tests, and build if feasible.

## Open Decisions

1. Whether calculation validation issues should block final report approval, while still allowing calculations to run.
2. Whether a future machine-readable export DTO is required for first commercial release after MVP rendered report output.
3. Which imported workbook headers are contractual and which remain provisional.
4. Whether `ReportsSummary.tsx` should be considered report UI only or the start of an export DTO contract.
5. Supply tariff integration remains deferred until allocation destination and pass-through treatment are signed off.
6. How to model airport, port, tenant, onward supply, local losses, generation/export, AUoS/PUoS, and site-specific allocation variation without hardcoding workbook-specific logic.
7. Minimum contract for long-lived tariff models and annual tariff years.
8. Minimum UtilityHub shared contracts required before Tariff Builder replaces local meter, consumption, boundary meter, supply contract and reference-data inputs with selection surfaces.
9. How Tariff Builder should present UtilityHub-sourced selected inputs while clearly separating evidence-only data from tariff-driving data.

## Accepted Decisions

- Allocation reconciliation in `project-storage.ts` is accepted as MVP storage behavior after data/storage and tariff-engine review.
- Reconciliation on read is acceptable for calculation because it aligns allocation rows to active cost pool IDs and removes stale allocation rows from calculation inputs.
- New cost pools receive default allocation methods with `requiresReview: true`.
- Default-created allocation methods produce a non-blocking calculation warning and visible allocation-method UI review indicator.
- Browser print/PDF and rendered HTML download are acceptable MVP stakeholder report outputs.
- `ReportsSummary.tsx` is report UI, not a stable machine-readable export DTO.
- Report readiness mapping is: `Needs correction` for validation errors, `Needs review` for warnings only, `Revenue variance` for unrecovered revenue without validation issues, and `Ready for review` when validation is clear and revenue is recovered.
- Internal MVP candidate decision is accepted with limitations as of 2026-06-22.
- Stakeholder-demo preparation should explain the workflow as an internal MVP candidate and must not imply external release readiness.
- Demo rehearsal should focus on methodology defensibility, audit trace, revenue recovery reconciliation, accepted limitations, and support needed.
- Accepted limitations do not block stakeholder-demo preparation, provided the demo language avoids external release and formal compliance claims.
- Final MVP candidate verification baseline is green after live demo tariff seed: lint passed, type-check passed, 13 test files and 65 tests passed, and production build passed.
- The live `demo-private-network` sample project must include aggregate customer information, recoverable cost pools, and allocation methods sufficient to calculate tariffs in the application.
- Demo is approved to carry forward after the PR #15 live tariff seed correction.
- Post-demo feedback must be triaged into narrow defects, decisions, scenarios, enhancements, or out-of-scope items before implementation.
- Additional tariff scenarios should be planned before implementation; start with simple two-class and non-recoverable cost scenarios unless stakeholder feedback changes priority.
- SCN-001 should remain calculation/test focused and must not introduce production workflow or UI scope.
- SCN-005 should prove partial and zero recoverability affect only the recoverable tariff revenue requirement.
- SCN-001 and SCN-005 are implemented and green on `main` after PR #20.
- SCN-002 should prove high fixed costs produce expected fixed charge sensitivity while still reconciling to the recoverable cost base.
- SCN-003 should prove high consumption costs produce expected energy charge sensitivity while still reconciling to the recoverable cost base.
- SCN-004 should prove high capacity costs produce expected demand charge sensitivity while still reconciling to the recoverable cost base.
- SCN-006 should prove existing validation issues are surfaced without silently correcting output values or revenue variance.
- SCN-001 through SCN-006 are now implemented and merged to `main`; further scenario expansion should be driven by QA review, stakeholder feedback, or external release criteria.
- Report readiness UI alignment and regression coverage are merged through PR #28.
- Supply calculation has proceeded through Phase 2 annual amounts as a disconnected service; tariff, report, export, import, storage, and shared DTO integration remains gated.
- Supply Phase 1 normalisation was merged through PR #30 as a disconnected pure service and did not calculate annual amounts.
- Supply Phase 2 annual amount calculation was limited to the disconnected supply service unless the user explicitly approves tariff integration as a separate package.
- Supply Phase 2 decision brief should be approved, amended, or rejected by the user before Tariff Engine prepares implementation.
- User approved Supply Phase 2 Option A on 2026-06-22. Tariff Engine may prepare an annual-amount-only implementation proposal. Tariff integration, report totals, export fields, imports, and storage remain out of scope.
- Supply Phase 2 implementation proposal is documented in `docs/SUPPLY_PHASE_2_IMPLEMENTATION_PROPOSAL.md`; implementation ownership is Tariff Engine with QA and PM review.
- Supply Phase 2 annual amounts are merged through PR #36. Fixed annual, monthly, daily, and clear kVA capacity charge lines can calculate annual amounts inside the disconnected supply service only. Tariff integration, report totals, export fields, imports, storage, and shared DTO changes remain out of scope.
- Supply tariff integration decisioning is documented in `docs/SUPPLY_TARIFF_INTEGRATION_DECISION_PACK.md`; no implementation should start until the user accepts or amends it.
- Supply rule decisions for losses, Triad, DUoS, annualisation, input validity, and time-of-use are recorded in `docs/SUPPLY_RULE_DECISIONS.md`. Tariff integration remains blocked pending allocation destination, customer applicability, reporting category, pass-through flag, and reconciliation decisions.
- Remaining supply integration choices are answered in `docs/SUPPLY_INTEGRATION_DECISION_ANSWER.md`; production integration remains blocked until a separate implementation proposal is prepared and approved.
- Evidence-only supply presentation and separate supply reconciliation are implemented through PR #43. Tariff-impacting supply integration remains blocked; supply evidence does not feed `calculateTariffs`, network revenue recovery, report totals, imports, storage, exports, shared DTOs, or billing-period daily annualisation.
- Supply evidence implementation has been reviewed in `docs/SUPPLY_EVIDENCE_REVIEW.md` as evidence-only and non-tariff-impacting. The next safe follow-up is a manual report-page check, not tariff integration.
- Input architecture should be stabilised before further calculation expansion. The next implementation sequence should prioritise tariff model/year setup, UtilityHub customer/site selection, meter and consumption selection, boundary meter selection, reference data selection, customer class table UX, and input readiness before tariff-impacting aggregation.
- Airport and Port of Tilbury workbooks show that broader commercial use requires configurable methodology support. This is recorded in `docs/MODEL_FLEXIBILITY_REVIEW.md` and does not approve production implementation.
- Methodology configuration direction is proposed for owner approval in `docs/METHODOLOGY_CONFIGURATION_DECISION_PACK.md`. Production implementation remains gated.
- Codex/Git workflow guardrails and helper scripts are recorded in `AGENTS.md`, `docs/CODEX_GIT_WORKFLOW.md`, and `scripts/codex-*.ps1`. Codex should not push, create PRs, force push, or merge from its own context.
- Methodology configuration contract concepts are proposed in `docs/METHODOLOGY_CONFIGURATION_CONTRACT_PROPOSAL.md`. They are non-binding until owner and workstream review.
- Workbook source mapping concepts are proposed in `docs/WORKBOOK_SOURCE_MAPPING_PROPOSAL.md`. They are non-binding until Data Import, QA, and PM review.
- Representative workbook-derived scenarios are planned in `docs/WORKBOOK_DERIVED_SCENARIO_PLAN.md`. No fixtures or tests are approved by that plan alone.
- WB-001 airport customer-class scenario expectations are proposed in `docs/WB_001_AIRPORT_CUSTOMER_CLASS_SCENARIO.md`. No fixtures, tests, imports, calculations, storage, reports, exports, shared DTOs, or UI changes are approved by that proposal alone.
- WB-001 is implemented as test-only workbook-derived scenario coverage in `tests/fixtures/workbook-derived-scenarios.ts` and `tests/workbook-derived-scenarios.test.ts`. It uses existing `peakDemandKw`/Demand calculation behaviour for approved capacity values and does not change production contracts.
- WB-006 is implemented as test-only weak mapping confidence coverage. Low-confidence, unresolved, evidence-only, and manual-review rows remain local fixture metadata and do not feed tariff calculation inputs.
- WB-002 is implemented as test-only TLM/local loss evidence coverage. Loss-adjusted evidence remains local fixture metadata and does not uplift `annualKwh` passed into `calculateTariffs`.
- WB-003 is implemented as test-only port tenant recovery forecast coverage. Tenant names, tariff model references, customer references, SA numbers, forecast kWh, and forecast recovery amounts remain local fixture metadata and do not automatically become tariff customer classes, cost pools, or revenue requirements.
- WB-004 is implemented as test-only generation/export evidence coverage. Generation/export volumes and credit evidence remain local fixture metadata and do not net consumption, reduce recoverable cost, or change revenue requirement.
- WB-005 asset allocation Option A is approved for test-only fixture coverage using pre-set annual asset amounts only. Production asset valuation, annuity calculation, import parsing, storage, shared DTOs, report totals, exports, UI, and calculation behaviour remain blocked.
- Non-ready report HTML export coverage now asserts readiness issues, revenue variance, and validation messages are preserved in downloaded stakeholder report HTML.
- Long-run evidence batches 01-04 have moved submeter, loss, Utilityhub hierarchy, asset, supply and methodology-cost inputs into reviewable evidence/readiness surfaces. These areas remain non-tariff-impacting unless a separate approved package changes that behaviour.
- The next larger run should shift from more evidence accumulation to decision-led implementation planning: submeter-to-tariff input treatment, Utilityhub hierarchy contract alignment, supply energy tariff impact, methodology cost to cost-pool mapping, and asset valuation methodology.
- Current evidence closeout after PR #69 confirms the active baseline is green at 38 test files and 200 tests, with UtilityHub programme integration files merged. The next packages should be decision packs before production behaviour changes.
- `docs/SUBMETER_TO_TARIFF_INPUT_DECISION_PACK.md` now proposes a conservative control model: aggregate customer-class inputs remain the current tariff-driving path, submeter evidence remains non-tariff-impacting, and future submeter-derived aggregate input should generate reviewed aggregate rows rather than making `calculateTariffs` consume raw submeter rows directly.
- `docs/UTILITYHUB_HIERARCHY_CONTRACT_PROPOSAL.md` now proposes that Tariff Builder references UtilityHub-owned customer, site, building, location and meter records through an additive compatibility mapping layer. Tariff Builder should not create a competing permanent hierarchy, and hierarchy mappings should not become tariff-impacting without reviewed aggregate input generation.
- `docs/SUPPLY_ENERGY_TARIFF_IMPACT_PROPOSAL.md` now records the supply energy tariff-impact boundary: explicit reviewed supply p/kWh rows may affect Energy / kWh for a selected customer class, but automatic supply evidence-to-tariff conversion, supply annual amount allocation, report total changes, storage changes and export DTO changes remain blocked.
- UtilityMap / Meter Map is now recognised as a UtilityHub module. Tariff Builder must not duplicate UtilityHub-owned building, floor, supply point, meter, meter reading, document upload, shared audit or shared permission masters. Future mapped areas, meter-to-area allocations, allocation confidence, area usage metrics and map-specific data-quality issues should be consumed from UtilityHub/Meter Map contracts as evidence or reviewed tariff-specific mappings only.
- `docs/METHODOLOGY_COST_POOL_MAPPING_PROPOSAL.md` now proposes that direct cost, employee cost and overhead evidence remains evidence-only by default. Future tariff-impacting use should generate reviewed cost-pool candidates and then explicit `CostPoolRow` records, rather than making `calculateTariffs` read raw workbook methodology cost rows directly.
- `docs/ASSET_VALUATION_METHOD_DECISION_PACK.md` now proposes that asset evidence remains evidence-only by default. The safest first production route is approved annual asset recovery amounts converted into explicit `CostPoolRow` records; formula-based valuation using life, WACC, CPI, depreciation or annuity remains blocked pending methodology approval.
- Friday closeout package hardens submeter import review by detecting duplicates inside imported files as well as duplicates against existing records, and refreshes stakeholder walkthrough material to reflect the supply, Meter Map, methodology cost and asset valuation boundaries.
- `docs/FIRST_RELEASE_READINESS_REVIEW.md` now records the recommended release position: acceptable as a first-release candidate for controlled internal and selected stakeholder review, but not unrestricted external production release until release blockers are accepted or resolved.
- `docs/FIRST_RELEASE_WALKTHROUGH_EVIDENCE.md` now provides the manual/browser walkthrough evidence record. No walkthrough result has been recorded yet; the next user-facing action is to run the app and complete the evidence table.
- `docs/UTILITYHUB_DATA_OWNERSHIP_AND_TARIFF_YEAR_MODEL.md` now records the revised product direction: UtilityHub should own meters, meter readings, consumption, boundary meters, supply contracts, reusable TLM/reference data, transmission/distribution data and shared hierarchy; Tariff Builder should own tariff models, tariff years, selected inputs, methodology assumptions, direct tariff-building costs, calculations and reports.

## QA Staging Warnings

The following files are not safe to stage as-is without hunk-level or package review:

- `types/project.ts`: shared tariff and imported-data contract.
- `components/TariffCalculationsSummary.tsx`: held calculation warning UI.
- `components/ReportsSummary.tsx`: held report warning UI.
- `components/DataInputsForm.tsx`: mixed layout and possible validation/save behavior.
- `components/CostPoolsForm.tsx`: mixed layout and possible validation/storage behavior.
- `components/AllocationMethodsForm.tsx`: mixed layout and possible validation/save behavior.
- `components/WorkbookMethodologyForms.tsx`: large import wiring diff; review as Data Import only.
- `lib/project-storage.ts`: allocation reconciliation is storage/business behavior.

Missing MVP-critical regression coverage:

- End-to-end create project to report flow.
- Browser/mobile screenshots for layout-only UI changes.
- Report readiness/export contract tests.
- Report rendering, warning visibility, audit trace visibility, and HTML/print action tests.
- Local/cloud storage reconciliation failure cases.
- Supply Phase 2 annual amount and evidence-only report tests are present; tariff-impacting supply integration tests remain intentionally deferred until a separate tariff-impact proposal is approved.
- Broader UI/browser regression evidence before external release readiness.
- Additional representative/stakeholder-specific tariff scenarios beyond the internal MVP candidate.

Controlled follow-up backlog is maintained in `docs/MVP_LIMITATIONS_CLOSEOUT.md`.

Final verification baseline is maintained in `docs/MVP_FINAL_BASELINE.md`.

Demo approval is maintained in `docs/MVP_DEMO_APPROVAL.md`.

Post-demo feedback is maintained in `docs/POST_DEMO_FEEDBACK_LOG.md`.

Additional scenario backlog is maintained in `docs/ADDITIONAL_SCENARIO_PLAN.md`.

Scenario coverage closeout is maintained in `docs/SCENARIO_COVERAGE_CLOSEOUT.md`.

Model flexibility requirements are maintained in `docs/MODEL_FLEXIBILITY_REVIEW.md`.

Methodology configuration decisions are maintained in `docs/METHODOLOGY_CONFIGURATION_DECISION_PACK.md`.

Methodology configuration contract proposals are maintained in `docs/METHODOLOGY_CONFIGURATION_CONTRACT_PROPOSAL.md`.

Workbook source mapping proposals are maintained in `docs/WORKBOOK_SOURCE_MAPPING_PROPOSAL.md`.

Workbook-derived scenario planning is maintained in `docs/WORKBOOK_DERIVED_SCENARIO_PLAN.md`.

Codex/Git workflow guidance is maintained in `AGENTS.md`, `docs/CODEX_GIT_WORKFLOW.md`, and `scripts/codex-*.ps1`.

Supply calculation decision gate is maintained in `docs/SUPPLY_CALCULATION_DECISION_PACK.md`, `docs/SUPPLY_RULE_DECISIONS.md`, `docs/SUPPLY_INTEGRATION_OPEN_DECISIONS.md`, `docs/SUPPLY_INTEGRATION_DECISION_ANSWER.md`, `docs/SUPPLY_EVIDENCE_IMPLEMENTATION_PROPOSAL.md`, `docs/SUPPLY_EVIDENCE_REVIEW.md`, `docs/SUPPLY_PHASE_2_SIGNOFF_PACK.md`, `docs/SUPPLY_PHASE_2_DECISION_BRIEF.md`, and `docs/SUPPLY_TARIFF_INTEGRATION_DECISION_PACK.md`.

## Immediate Next Action

Use `docs/UTILITYHUB_DATA_OWNERSHIP_AND_TARIFF_YEAR_MODEL.md`, `docs/FIRST_RELEASE_READINESS_REVIEW.md` and `docs/FIRST_RELEASE_WALKTHROUGH_EVIDENCE.md` as the current release-readiness references. The next package should define the tariff model / tariff year contract or record the actual walkthrough result. Do not start production methodology, import parser contract changes, storage, report total, export, shared DTO, UtilityHub hierarchy, Meter Map consumption, methodology-derived cost-pool generation, asset valuation, UtilityHub data sync, CPI source integration, customer-class UI changes, or calculation behaviour changes until the relevant decision pack and shared UtilityHub contracts are approved.
