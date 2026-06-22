# PM Control Log

## Current Baseline

Date: 2026-06-22

Branch: `codex/scn-002-high-fixed-cost`

Working tree status: SCN-002 high fixed-cost scenario package in progress.

Latest full checks on `main` after PR #20:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 14 test files and 67 tests.
- `npm.cmd run build`: passed.

PRs #1 through #21 have been merged to `main`. The current branch adds high fixed-cost scenario coverage.

MVP timeline tracking is maintained in `docs/MVP_TIMELINE_TRACKER.md` and must be reported in future handoffs. Current active milestone: SCN-002 additional scenario coverage.

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
- Latest full test run reported 12 files and 64 tests.
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
| Supply calculation | `SUPPLY_CALCULATION_DESIGN.md`, `types/project.ts`, potential engine files | High | Design only until open business assumptions are resolved. |
| Report/export DTOs | `components/ReportsSummary.tsx`, future export code, tariff result types | Medium | PM approval required before adding stakeholder-facing checks or export fields. |

## Merge Order

1. Shared contract documentation and manager control docs.
2. Data Import parser extraction package, excluding unrelated validation/save-blocking.
3. Tariff Engine calculation validation package, including tests and type contract.
4. Storage allocation reconciliation package, if accepted as MVP behavior.
5. UI layout-only package.
6. Calculation/report warning UI package, only after tariff result contract approval.
7. QA final full gate: lint, type-check, tests, and build if feasible.

## Open Decisions

1. Whether allocation reconciliation in `project-storage.ts` is MVP behavior or should be held.
2. Whether calculation validation issues should block final report approval, while still allowing calculations to run.
3. Whether a future machine-readable export DTO is required for first commercial release after MVP rendered report output.
4. Which imported workbook headers are contractual and which remain provisional.
5. Whether `ReportsSummary.tsx` should be considered report UI only or the start of an export DTO contract.
6. Supply calculation remains deferred until the open questions in `SUPPLY_CALCULATION_DESIGN.md` are answered.

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
- Supply calculation tests remain intentionally deferred until business rules are approved.
- Broader UI/browser regression evidence before external release readiness.
- Additional representative/stakeholder-specific tariff scenarios beyond the internal MVP candidate.

Controlled follow-up backlog is maintained in `docs/MVP_LIMITATIONS_CLOSEOUT.md`.

Final verification baseline is maintained in `docs/MVP_FINAL_BASELINE.md`.

Demo approval is maintained in `docs/MVP_DEMO_APPROVAL.md`.

Post-demo feedback is maintained in `docs/POST_DEMO_FEEDBACK_LOG.md`.

Additional scenario backlog is maintained in `docs/ADDITIONAL_SCENARIO_PLAN.md`.

## Immediate Next Action

Review and commit the SCN-002 high fixed-cost scenario package, then open a PR from `codex/scn-002-high-fixed-cost`.
