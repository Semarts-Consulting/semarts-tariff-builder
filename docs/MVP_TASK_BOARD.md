# MVP Task Board

## Backlog

| Task | Owner | Files | Dependencies | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| DATA-002 Document import template contracts | Data Import | `lib/*-import.ts`, `components/WorkbookMethodologyForms.tsx`, `types/project.ts` | Current parser package | Medium | Define header names, dedupe keys, row fingerprint rules, and import error shape. |
| ENG-002 Add tariff audit trace | Tariff Engine | `lib/calculation-engine.ts`, `types/project.ts`, tests | Current calculation validation contract | High | Needed for auditability. Do not add until output contract is reviewed. |
| UI-002 Calculation/report warning UI | UI Flow | `components/TariffCalculationsSummary.tsx`, `components/ReportsSummary.tsx` | ENG-004 contract review | Medium | Next review item. Must render approved validation semantics only. |
| DATA-003 Form validation/save-blocking package | Data Import plus UI review | `components/DataInputsForm.tsx`, `components/CostPoolsForm.tsx`, `components/AllocationMethodsForm.tsx` | Validation policy decision | Medium | Held because save-blocking changes business workflow. |
| ENG-003 Supply calculation design closure | PM plus Tariff Engine | `SUPPLY_CALCULATION_DESIGN.md`, future service/types | Business answers required | High | No production DTO or engine until assumptions are resolved. |
| OUT-001 Export DTO design | PM plus UI/Engine | future export code, report contracts | Report contract decision | Medium | Keep separate from visual report pages. |

## In Progress

| Task | Owner | Files | Dependencies | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| PM-002 Git/staging plan | PM | full working tree | Completed package reviews | Medium | Prepare package-level staging order and identify first git action. |

## Review

| Task | Owner | Files | Dependencies | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| DATA-001 Import parser extraction and workbook wiring | Data Import | `lib/import-utils.ts`, `lib/direct-cost-import.ts`, `lib/employee-cost-import.ts`, `lib/indirect-overhead-import.ts`, `lib/asset-import.ts`, `lib/boundary-meter-import.ts`, `components/WorkbookMethodologyForms.tsx`, import tests | Shared imported input types | Medium | Review large workbook form diff carefully. |
| ENG-001 Tariff calculation validation package | Tariff Engine | `types/project.ts`, `lib/calculation-engine.ts`, `tests/calculation-engine.test.ts` | Tariff result contract | High | Pure function retained. Validation issues and revenue recovery are shared contract additions. |
| UI-001 Layout-only UI package | UI Flow | `app/layout.tsx`, `app/page.tsx`, `app/projects/page.tsx`, `app/auth/page.tsx`, `app/reference-data/supply/page.tsx`, approved layout components | No business-logic changes | Medium | Mixed form files must be staged only for layout/card/sticky-save changes. |
| DATA-004 Allocation reconciliation storage package | Data/storage plus Tariff Engine review | `lib/project-storage.ts`, `tests/allocation-reconciliation.test.ts` | Allocation method behavior decision | Medium | Do not merge as UI work. Confirm desired auto-reconciliation behavior. |
| UI-003 Held calculation/report warning changes | UI Flow plus Tariff Engine review | `components/TariffCalculationsSummary.tsx`, `components/ReportsSummary.tsx` | ENG-001 approval | Medium | Review after tariff result contract is accepted. |

## Blocked

| Task | Owner | Files | Blocker | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| SUP-001 Production supply calculation engine | Tariff Engine | future service/types | Open questions in `SUPPLY_CALCULATION_DESIGN.md` | High | Do not implement until losses, TOU, annualisation, pass-through, and kVA/kW rules are resolved. |
| VAL-001 Cross-form save-blocking validation policy | PM plus workstream leads | forms, validation utilities, calculation engine | Need policy on when validation blocks save vs report readiness | High | Avoid partial save blocking until data-contract responsibilities are settled. |

## Done

| Task | Owner | Files | Evidence | Risk | Notes |
| --- | --- | --- | --- | --- | --- |
| DATA-005 Import package contract review | Data Import | import modules, `components/WorkbookMethodologyForms.tsx`, import tests | Data Import review note and `APP_CONTRACTS.md` update | Medium | Parser headers, merge keys, row fingerprints, and assumptions are now recorded. |
| ENG-004 Tariff validation contract review | Tariff Engine | `types/project.ts`, `lib/calculation-engine.ts`, `tests/calculation-engine.test.ts` | Tariff Engine review note and `APP_CONTRACTS.md` update | High | Validation issues accepted for MVP; audit trace remains a separate future contract. |
| UI-004 Report warning UI review | UI Flow | `components/TariffCalculationsSummary.tsx`, `components/ReportsSummary.tsx` | UI review note | Medium | Mostly aligned; wording isolation required before staging. |
| UI-005 Report warning wording isolation | UI Flow | `components/TariffCalculationsSummary.tsx`, `components/ReportsSummary.tsx` | UI checks passed | Low | Wording now avoids implying calculations are blocked; lint, type-check, and tests passed. |
| DATA-006 Allocation reconciliation storage review | Data/storage | `lib/project-storage.ts`, `tests/allocation-reconciliation.test.ts` | Data/storage review note and `APP_CONTRACTS.md` update | Medium | Accepted for MVP as storage behavior; calculation impact review still required. |
| ENG-005 Allocation reconciliation calculation impact review | Tariff Engine | `lib/project-storage.ts`, `tests/allocation-reconciliation.test.ts`, calculation inputs | Tariff Engine review note | Medium | Accepted for MVP. Future follow-up: surface default-created allocation methods as needing review. |
| QA-001 Post-control green baseline | PM manager thread | full tree | Lint, type-check, tests, and build passed after docs | Low | Use as current baseline before package-specific staging review. |
| QA-002 Package split-readiness review | QA | full working tree | QA reported workstream grouping, staging warnings, and missing coverage | Low | Confirmed checks passed and identified files requiring hunk-level/package review. |

## Next Git Decision

Git is now required for integration if the user wants to preserve reviewed packages. The first recommended git action is to create/switch to a working branch, then stage package-by-package rather than staging the whole tree.
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
