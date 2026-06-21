# MVP Task Board

## Backlog

| Task | Owner | Files | Dependencies | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| DATA-003 Form validation/save-blocking package | Data Import plus UI review | `components/DataInputsForm.tsx`, `components/CostPoolsForm.tsx`, `components/AllocationMethodsForm.tsx` | Validation policy decision | Medium | Held because save-blocking changes business workflow. |
| ENG-003 Supply calculation design closure | PM plus Tariff Engine | `SUPPLY_CALCULATION_DESIGN.md`, future service/types | Business answers required | High | No production DTO or engine until assumptions are resolved. |
| OUT-001 Export DTO design | PM plus UI/Engine | future export code, report contracts | Report contract decision | Medium | Keep separate from visual report pages. |

## In Progress

| Task | Owner | Files | Dependencies | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| _None_ |  |  |  |  |  |

## Review

| Task | Owner | Files | Dependencies | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| ALLOC-001 Default allocation review indicator | Data/storage, Tariff Engine, UI, PM | `types/project.ts`, `lib/project-storage.ts`, `lib/calculation-engine.ts`, `components/AllocationMethodsForm.tsx`, focused tests, `docs/APP_CONTRACTS.md` | Allocation reconciliation storage behavior | Medium | Implemented on `codex/default-allocation-review`; awaiting staging/commit/PR. |

## Blocked

| Task | Owner | Files | Blocker | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| SUP-001 Production supply calculation engine | Tariff Engine | future service/types | Open questions in `SUPPLY_CALCULATION_DESIGN.md` | High | Do not implement until losses, TOU, annualisation, pass-through, and kVA/kW rules are resolved. |
| VAL-001 Cross-form save-blocking validation policy | PM plus workstream leads | forms, validation utilities, calculation engine | Need policy on when validation blocks save vs report readiness | High | Avoid partial save blocking until data-contract responsibilities are settled. |

## Done

| Task | Owner | Files | Evidence | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| PR-001 MVP package integration | PM plus all delivery chats | merged PR #1 | Branch `codex-mvp-package-integration` merged to `main` | Medium | Import, tariff validation, storage reconciliation, UI layout, and warning UI integrated. |
| PR-002 Audit trace contract documentation | PM | `docs/APP_CONTRACTS.md`, manager docs | Merged PR #2 | Medium | Approved audit trace shared contract before implementation. |
| PR-003 Audit trace implementation | Tariff Engine plus PM | `types/project.ts`, `lib/calculation-engine.ts`, `tests/calculation-engine.test.ts` | Merged PR #3 | High | Calculation audit trace implemented and tested. |
| PR-004 Audit trace UI display | UI Flow plus PM | tariff calculations UI | Merged PR #4 | Medium | Tariff audit trace display merged to `main`. |
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
