# MVP Task Board

## Backlog

| Task | Owner | Files | Dependencies | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| DATA-003 Form validation/save-blocking package | Data Import plus UI review | `components/DataInputsForm.tsx`, `components/CostPoolsForm.tsx`, `components/AllocationMethodsForm.tsx` | Validation policy decision | Medium | Held because save-blocking changes business workflow. |
| MODEL-003 Workbook source mapping proposal | Data Import plus PM/QA review | future mapping docs and parser contract proposals | Methodology configuration decision | Medium | Define workbook source, sheet, header, row key, and mapping confidence before broad import support. |
| ENG-010 Supply tariff integration proposal | Tariff Engine plus PM review | future tariff integration docs, future shared type proposals if approved | Supply integration decision pack | High | Start only after allocation, recovery, pass-through, reconciliation, and report treatment are signed off. |
| SUP-003 Billing-period daily annualisation | Tariff Engine plus QA review | future `lib/supply-calculation-engine.ts` and focused tests if approved | User decision to replace 365-day annualisation with actual billing-period days | Medium | Keep separate from tariff integration; requires a clear billing-period input before production calculation changes. |
| OUT-002 Formal export DTO design | PM plus UI/Engine | future export code, report contracts | Report contract decision | Medium | Keep separate from visual report pages; MVP HTML/print report output is documented separately. |

## In Progress

| Task | Owner | Files | Dependencies | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| MODEL-002 Methodology configuration contract proposal | PM plus future Tariff Engine/Data Import/QA review | `docs/METHODOLOGY_CONFIGURATION_CONTRACT_PROPOSAL.md`, `docs/MVP_TASK_BOARD.md`, `docs/PM_CONTROL.md` | Methodology configuration decision pack | Medium | Propose non-binding contract concepts before any project type, calculation input, import, report, export, storage, or UI change. |

## Review

| Task | Owner | Files | Dependencies | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| _None_ |  |  |  |  |  |

## Blocked

| Task | Owner | Files | Blocker | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| SUP-001 Supply tariff integration | Tariff Engine plus PM | future shared type proposals, `lib/calculation-engine.ts`, report/export follow-ups if approved | Allocation destination and pass-through treatment decisions | High | Annual amounts are available inside the disconnected supply service; do not feed them into tariffs until integration rules are signed off. |
| VAL-001 Cross-form save-blocking validation policy | PM plus workstream leads | forms, validation utilities, calculation engine | Need policy on when validation blocks save vs report readiness | High | Avoid partial save blocking until data-contract responsibilities are settled. |

## Done

| Task | Owner | Files | Evidence | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| PR-001 MVP package integration | PM plus all delivery chats | merged PR #1 | Branch `codex-mvp-package-integration` merged to `main` | Medium | Import, tariff validation, storage reconciliation, UI layout, and warning UI integrated. |
| PR-002 Audit trace contract documentation | PM | `docs/APP_CONTRACTS.md`, manager docs | Merged PR #2 | Medium | Approved audit trace shared contract before implementation. |
| PR-003 Audit trace implementation | Tariff Engine plus PM | `types/project.ts`, `lib/calculation-engine.ts`, `tests/calculation-engine.test.ts` | Merged PR #3 | High | Calculation audit trace implemented and tested. |
| PR-004 Audit trace UI display | UI Flow plus PM | tariff calculations UI | Merged PR #4 | Medium | Tariff audit trace display merged to `main`. |
| PR-005 Default allocation review indicator | Data/storage, Tariff Engine, UI, PM | allocation row contract, reconciliation, engine warning, allocation UI | Merged PR #5 | Medium | Default-created allocation methods are flagged, surfaced, and cleared on user review. |
| PR-006 Report/export readiness contract | PM plus UI/Engine/QA review | `docs/APP_CONTRACTS.md`, `docs/MVP_TASK_BOARD.md`, `docs/PM_CONTROL.md` | Merged PR #6 | Medium | Defines MVP rendered report output and keeps formal export DTO as future work. |
| PR-007 MVP candidate validation scenario | PM plus Tariff Engine/QA review | `tests/mvp-candidate-scenario.test.ts`, `tests/fixtures/mvp-candidate-scenario.ts`, `docs/MVP_CANDIDATE_SIGNOFF.md`, `docs/MVP_TIMELINE_TRACKER.md`, manager docs | Merged PR #7 | High | Representative scenario, cost-base reconciliation, audit-trace evidence, sign-off pack, and timeline tracking. |
| PR-008 Manual MVP demo path check | PM plus user sign-off owner | `docs/MVP_DEMO_PATH_CHECK.md`, `docs/MVP_TIMELINE_TRACKER.md`, manager docs | Merged PR #8 and user acceptance | High | Demo path from inputs to allocation, calculation, audit trace, outputs, and reconciliation accepted. |
| PR-009 MVP demo acceptance evidence | PM plus user sign-off owner | `docs/MVP_DEMO_PATH_CHECK.md`, `docs/MVP_TIMELINE_TRACKER.md`, manager docs | Merged PR #9 | High | User accepted all six manual demo path steps. |
| PR-010 Internal MVP candidate decision | User sign-off owner plus PM support | `docs/MVP_CANDIDATE_SIGNOFF.md`, manager docs | Merged PR #10 | High | Internal MVP candidate accepted with limitations. |
| PR-011 Stakeholder demo preparation | PM plus user sign-off owner | `docs/MVP_STAKEHOLDER_DEMO_PREP.md`, manager docs | Merged PR #11 | Medium | Stakeholder demo preparation documented. |
| PR-012 Demo rehearsal notes | PM plus user sign-off owner | `docs/MVP_DEMO_REHEARSAL_NOTES.md`, manager docs | Merged PR #12 | Medium | Presenter script, expected questions, and demo guardrails documented. |
| PR-013 MVP limitations closeout | PM plus workstream owners | `docs/MVP_LIMITATIONS_CLOSEOUT.md`, manager docs | Merged PR #13 | Medium | Accepted limitations converted into controlled follow-up backlog. |
| PR-014 Final MVP baseline | PM plus QA evidence | `docs/MVP_FINAL_BASELINE.md`, manager docs | Merged PR #14 | Medium | Final green verification baseline recorded before live demo seed issue was found. |
| PR-015 Live demo tariff seed | PM plus Tariff Engine/QA review | `lib/sample-data.ts`, `lib/project-storage.ts`, `tests/demo-project-defaults.test.ts`, manager docs | Merged PR #15 | High | Live demo project now includes aggregate customer, cost, and allocation data so tariff outputs calculate. |
| PR-016 Demo approval record | User sign-off owner plus PM support | `docs/MVP_DEMO_APPROVAL.md`, manager docs | Merged PR #16 | High | Corrected MVP demo approved to carry forward. |
| PR-017 Post-demo feedback log | PM plus user sign-off owner | `docs/POST_DEMO_FEEDBACK_LOG.md`, manager docs | Merged PR #17 | Medium | Feedback log and triage rules added. |
| PR-019 SCN-001 small two-class scenario | Tariff Engine plus QA | `tests/fixtures/additional-scenarios.ts`, `tests/additional-scenarios.test.ts`, manager docs | Merged PR #19 | High | Additional scenario coverage for simple residential/commercial site. |
| PR-020 SCN-005 non-recoverable cost scenario | Tariff Engine plus QA | `tests/fixtures/additional-scenarios.ts`, `tests/additional-scenarios.test.ts`, manager docs | Merged PR #20 | Medium | Additional scenario coverage for partial and zero recoverability. |
| PR-022 SCN-002 high fixed-cost scenario | Tariff Engine plus QA | `tests/fixtures/additional-scenarios.ts`, `tests/additional-scenarios.test.ts`, manager docs | Merged PR #22 | High | Additional scenario coverage for fixed charge sensitivity. |
| PR-023 SCN-003 high consumption-cost scenario | Tariff Engine plus QA | `tests/fixtures/additional-scenarios.ts`, `tests/additional-scenarios.test.ts`, manager docs | Merged PR #23 | High | Additional scenario coverage for energy charge sensitivity. |
| PR-024 SCN-004 capacity-heavy scenario | Tariff Engine plus QA | `tests/fixtures/additional-scenarios.ts`, `tests/additional-scenarios.test.ts`, manager docs | Merged PR #24 | Medium | Additional scenario coverage for demand charge sensitivity. |
| PR-025 SCN-006 validation issue scenario | QA plus Tariff Engine review | `tests/fixtures/additional-scenarios.ts`, `tests/additional-scenarios.test.ts`, manager docs | Merged PR #25 | Medium | Additional scenario coverage for validation warnings/errors without silent correction. |
| PR-026 Scenario coverage closeout | PM | `docs/SCENARIO_COVERAGE_CLOSEOUT.md`, manager docs | Merged PR #26 | Low | SCN-001 through SCN-006 scenario baseline recorded. |
| PR-027 Report readiness UI alignment | UI Flow plus PM review | `components/ReportsSummary.tsx`, `components/TariffAuditTracePanel.tsx` | Merged PR #27 | Medium | Readiness labels, severity labels, cost totals, and audit evidence added to rendered report. |
| PR-028 Report readiness regression tests | QA plus UI review | `tests/report-readiness.test.tsx`, `tests/fixtures/report-readiness.ts`, `vitest.config.ts`, dependency metadata | Merged PR #28 | Medium | Component coverage for report readiness, audit evidence, print, and HTML download. |
| PR-029 Supply calculation decision pack | PM plus Tariff Engine review | `SUPPLY_CALCULATION_DESIGN.md`, `docs/SUPPLY_CALCULATION_DECISION_PACK.md`, manager docs | Merged PR #29 | High | Business-rule decision gate created before supply calculation production work. |
| PR-030 Supply Phase 1 normalisation | Tariff Engine plus QA | `lib/supply-calculation-engine.ts`, `tests/supply-calculation-engine.test.ts`, `docs/APP_CONTRACTS.md` | Merged PR #30 | High | Pure disconnected normalisation service added; annual amounts and tariff integration remain blocked. |
| PR-031 Supply Phase 1 closeout | PM | supply design and manager docs | Merged PR #31 | Medium | Control docs updated to show Phase 1 normalisation complete and remaining supply work blocked by business decisions. |
| PR-032 Supply Phase 2 sign-off pack | PM plus user sign-off owner | `docs/SUPPLY_PHASE_2_SIGNOFF_PACK.md`, manager docs | Merged PR #32 | High | Minimum sign-off framework added before any annual amount implementation proposal. |
| PR-033 Supply Phase 2 decision brief | PM plus user sign-off owner | `docs/SUPPLY_PHASE_2_DECISION_BRIEF.md`, manager docs | Merged PR #33 | High | Owner decision route added for Phase 2 annual amount calculation. |
| PR-034 Supply Phase 2 approval record | PM plus user sign-off owner | `docs/SUPPLY_PHASE_2_DECISION_BRIEF.md`, `docs/SUPPLY_PHASE_2_SIGNOFF_PACK.md`, manager docs | Merged PR #34 | High | User approved Option A; annual-amount-only implementation proposal unlocked. |
| PR-035 Supply Phase 2 implementation proposal | PM plus Tariff Engine review | `docs/SUPPLY_PHASE_2_IMPLEMENTATION_PROPOSAL.md`, manager docs | Merged PR #35 | High | Annual-amount-only implementation scope, file ownership, tests, and guardrails approved. |
| PR-036 Supply Phase 2 annual amounts | Tariff Engine plus QA | `lib/supply-calculation-engine.ts`, `tests/supply-calculation-engine.test.ts`, `docs/APP_CONTRACTS.md` | Merged PR #36 | High | Fixed and kVA capacity annual amounts implemented without tariff/report/export integration. |
| PR-037 Supply Phase 2 closeout | PM | manager docs | Merged PR #37 | Medium | Annual amount implementation closed out; tariff integration decisioning is the next blocker. |
| PR-038 Supply tariff integration decision pack | PM plus Tariff Engine review | `docs/SUPPLY_TARIFF_INTEGRATION_DECISION_PACK.md`, manager docs | Merged PR #38 | High | Decision gate added before supply annual amounts can affect tariffs, reports, exports, imports, storage, or shared DTOs. |
| PR-039 Supply rule decisions record | PM plus user sign-off owner | `docs/SUPPLY_RULE_DECISIONS.md`, supply decision docs, manager docs | Merged PR #39 | High | User-supplied rules for losses, Triad, DUoS, annualisation, input validity, and time-of-use recorded; tariff integration remains blocked. |
| PR-040 Supply integration open decisions | PM plus user sign-off owner | `docs/SUPPLY_INTEGRATION_OPEN_DECISIONS.md`, supply decision docs, manager docs | Merged PR #40 | High | Remaining supply tariff integration choices, suggested MVP-safe answers, and acceptance criteria recorded. |
| PR-041 Supply integration decision answers | PM plus user sign-off owner | `docs/SUPPLY_INTEGRATION_DECISION_ANSWER.md`, supply decision docs, manager docs | Merged PR #41 | High | User approved evidence-only supply presentation, separate supply reconciliation, no export DTO change, and separate billing-period daily annualisation follow-up. |
| PR-042 Supply evidence implementation proposal | PM plus Tariff Engine/UI/QA review | `docs/SUPPLY_EVIDENCE_IMPLEMENTATION_PROPOSAL.md`, manager docs | Merged PR #42 | High | Narrow implementation proposal for evidence-only supply presentation and separate reconciliation. |
| PR-043 Supply evidence report presentation | Tariff Engine, UI Flow, QA, PM | `lib/supply-calculation-engine.ts`, `components/ReportsSummary.tsx`, supply/report tests | Merged PR #43 | High | Evidence-only supply report section and service-local reconciliation helper implemented without changing tariff outputs, network revenue recovery, report totals, imports, storage, exports, shared DTOs, or billing-period daily annualisation. |
| PR-044 Supply evidence implementation closeout | PM | `docs/MVP_TASK_BOARD.md`, `docs/PM_CONTROL.md` | Merged PR #44 | Low | Recorded supply evidence implementation closeout and kept tariff-impacting supply integration blocked. |
| PR-045 Supply evidence closeout review | PM plus QA review | `docs/SUPPLY_EVIDENCE_REVIEW.md`, manager docs | Merged PR #45 | Low | Confirmed supply evidence presentation remains evidence-only and non-tariff-impacting. |
| PR-046 Model flexibility requirements | PM plus future Tariff Engine/Data Import/QA review | `docs/MODEL_FLEXIBILITY_REVIEW.md`, manager docs | Merged PR #46 | Medium | Captured workbook-derived flexibility requirements without changing production behaviour. |
| PR-047 Methodology configuration decision pack | PM plus future Tariff Engine/Data Import/QA review | `docs/METHODOLOGY_CONFIGURATION_DECISION_PACK.md`, manager docs | Merged PR #47 | Medium | Proposed future methodology configuration direction and kept production implementation gated. |
| PR-048 Codex Git workflow helpers | PM plus workflow governance | `AGENTS.md`, `docs/CODEX_GIT_WORKFLOW.md`, `scripts/codex-*.ps1` | Merged PR #48 | Low | Added project-specific Codex/Git workflow guardrails and helper scripts without product behaviour changes. |
| PR-049 PM control workflow baseline | PM | `docs/MVP_TASK_BOARD.md`, `docs/PM_CONTROL.md` | Merged PR #49 | Low | Aligned manager control docs with the current `main` baseline and Codex/Git workflow. |
| SCN-001 Small two-class scenario | Tariff Engine plus QA | `tests/fixtures/additional-scenarios.ts`, `tests/additional-scenarios.test.ts`, manager docs | Merged PR #19 | High | Fixture and regression test for simpler residential/commercial site. |
| SCN-002 High fixed-cost scenario | Tariff Engine plus QA | `tests/fixtures/additional-scenarios.ts`, `tests/additional-scenarios.test.ts`, manager docs | Merged PR #22 | High | Fixture and regression test for fixed charge sensitivity. |
| SCN-003 High consumption-cost scenario | Tariff Engine plus QA | `tests/fixtures/additional-scenarios.ts`, `tests/additional-scenarios.test.ts`, manager docs | Merged PR #23 | High | Fixture and regression test for energy charge sensitivity. |
| SCN-004 Capacity-heavy scenario | Tariff Engine plus QA | `tests/fixtures/additional-scenarios.ts`, `tests/additional-scenarios.test.ts`, manager docs | Merged PR #24 | Medium | Fixture and regression test for demand charge sensitivity. |
| SCN-005 Non-recoverable cost scenario | Tariff Engine plus QA | `tests/fixtures/additional-scenarios.ts`, `tests/additional-scenarios.test.ts`, manager docs | Merged PR #20 | Medium | Fixture and regression test for partial and zero recoverability. |
| SCN-006 Validation issue scenario | QA plus Tariff Engine review | `tests/fixtures/additional-scenarios.ts`, `tests/additional-scenarios.test.ts`, manager docs | Merged PR #25 | Medium | Fixture and regression test for validation warnings/errors without silent correction. |
| MVP-004 Stakeholder-demo preparation | PM plus user sign-off owner | `docs/MVP_STAKEHOLDER_DEMO_PREP.md`, `docs/MVP_DEMO_REHEARSAL_NOTES.md`, `docs/MVP_LIMITATIONS_CLOSEOUT.md`, `docs/MVP_FINAL_BASELINE.md`, `docs/MVP_TIMELINE_TRACKER.md`, `docs/PM_CONTROL.md` | Accepted-with-limitations MVP decision and green final baseline | Medium | Focused walkthrough, rehearsal notes, limitation closeout, final verification baseline, and live demo approval completed. |
| MVP-005 Demo approval to proceed | User sign-off owner plus PM support | `docs/MVP_DEMO_APPROVAL.md`, `docs/MVP_TIMELINE_TRACKER.md`, `docs/PM_CONTROL.md` | PR #15 live demo tariff seed | High | User approved the demo to carry forward after validating the seeded tariff workflow. |
| MVP-003 Internal MVP candidate review and decision | User sign-off owner plus PM support | `docs/MVP_CANDIDATE_SIGNOFF.md`, `docs/MVP_DEMO_PATH_CHECK.md`, `docs/MVP_TIMELINE_TRACKER.md` | Decision recorded as accepted with limitations | High | Internal MVP candidate accepted with limitations on 2026-06-22. |
| DATA-001 Import parser extraction and workbook wiring | Data Import | import modules, workbook form, import tests | Merged in PR #1 | Medium | Header, dedupe, and fingerprint contracts documented. |
| ENG-001 Tariff calculation validation package | Tariff Engine | `types/project.ts`, `lib/calculation-engine.ts`, `tests/calculation-engine.test.ts` | Merged in PR #1 | High | Validation issues and revenue recovery accepted for MVP. |
| UI-001 Layout-only UI package | UI Flow | layout/page/component files | Merged in PR #1 | Medium | Broad responsive layout package integrated. |
| DATA-004 Allocation reconciliation storage package | Data/storage plus Tariff Engine | `lib/project-storage.ts`, `tests/allocation-reconciliation.test.ts` | Merged in PR #1 | Medium | Accepted as MVP storage behavior. |
| UI-003 Calculation/report warning UI | UI Flow plus Tariff Engine | `components/TariffCalculationsSummary.tsx`, `components/ReportsSummary.tsx` | Merged in PR #1 | Medium | Warning copy avoids implying calculations are blocked. |
| DATA-005 Import package contract review | Data Import | import modules, `components/WorkbookMethodologyForms.tsx`, import tests | Data Import review note and `APP_CONTRACTS.md` update | Medium | Parser headers, merge keys, row fingerprints, and assumptions are now recorded. |
| ENG-004 Tariff validation contract review | Tariff Engine | `types/project.ts`, `lib/calculation-engine.ts`, `tests/calculation-engine.test.ts` | Tariff Engine review note and `APP_CONTRACTS.md` update | High | Validation issues accepted for MVP; audit trace remains a separate future contract. |
| UI-004 Report warning UI review | UI Flow | `components/TariffCalculationsSummary.tsx`, `components/ReportsSummary.tsx` | UI review note | Medium | Mostly aligned; wording isolation required before staging. |
| UI-005 Report warning wording isolation | UI Flow | `components/TariffCalculationsSummary.tsx`, `components/ReportsSummary.tsx` | UI checks passed | Low | Wording now avoids implying calculations are blocked; lint, type-check, and tests passed. |
| DATA-006 Allocation reconciliation storage review | Data/storage | `lib/project-storage.ts`, `tests/allocation-reconciliation.test.ts` | Data/storage review note and `APP_CONTRACTS.md` update | Medium | Accepted for MVP as storage behavior; calculation impact review still required. |
| ENG-005 Allocation reconciliation calculation impact review | Tariff Engine | `lib/project-storage.ts`, `tests/allocation-reconciliation.test.ts`, calculation inputs | Tariff Engine review note | Medium | Accepted for MVP. Future follow-up: surface default-created allocation methods as needing review. |
| QA-001 Post-control green baseline | PM manager thread | full tree | Lint, type-check, tests, and build passed after docs | Low | Use as current baseline before package-specific staging review. |
| QA-002 Package split-readiness review | QA | full working tree | QA reported workstream grouping, staging warnings, and missing coverage | Low | Confirmed checks passed and identified files requiring hunk-level/package review. |
| PM-002 Git/staging plan | PM | full working tree | Package commits merged through PR #1 | Medium | Completed with package-level commits and final verification. |
| PM-001 Create manager control pack | PM | `docs/PM_CONTROL.md`, `docs/MVP_TASK_BOARD.md`, `docs/APP_CONTRACTS.md`, `docs/DEVELOPER_CHAT_PROMPTS.md` | Control docs created | Low | Establishes coordination baseline before more delivery work. |
| PM-000 Delivery pause and split decision | PM | thread coordination | All delivery chats paused for control-doc update | Low | Prevented mixed merge of import, calculation, UI, and storage behavior. |

## File Ownership Boundaries

| Path | Primary Owner | Secondary Review |
| --- | --- | --- |
| `types/project.ts` | PM shared contract | All affected workstreams |
| `lib/calculation-engine.ts` | Tariff Engine | QA, UI for display implications |
| `lib/*-import.ts`, `lib/import-utils.ts` | Data Import | QA, PM for contract changes |
| `components/WorkbookMethodologyForms.tsx` | Data Import | UI for layout only |
| `lib/project-storage.ts` | Data/storage | Tariff Engine, QA |
| `components/TariffCalculationsSummary.tsx` | UI Flow | Tariff Engine for semantics |
| `components/ReportsSummary.tsx` | UI Flow | Tariff Engine and PM for stakeholder-facing wording |
| `components/DataInputsForm.tsx` | UI Flow for layout | Data Import for validation/save policy |
| `components/CostPoolsForm.tsx` | UI Flow for layout | Data/storage for reconciliation and validation/save policy |
| `components/AllocationMethodsForm.tsx` | UI Flow for layout | Tariff Engine for allocation validation |
| `tests/*` | QA for regression coverage | Producing workstream for expected behavior |

## First Five Coordination Actions

1. Freeze shared contract edits until this control pack is reviewed.
2. Ask QA to produce a final split-review over the current dirty tree.
3. Review and stage the Data Import package first if parser contracts are acceptable.
4. Review and stage the Tariff Engine package next, because report UI depends on it.
5. Decide whether allocation reconciliation is in MVP before staging `lib/project-storage.ts`.
