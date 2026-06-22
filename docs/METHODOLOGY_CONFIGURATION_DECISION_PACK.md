# Methodology Configuration Decision Pack

Date: 2026-06-22

Status: proposed decisions for owner review.

## Purpose

This pack defines the decisions needed before the app supports broader methodology variation seen in the Bristol Airport, Manchester Airports Group, and Port of Tilbury tariff models.

This is not an implementation proposal. It does not approve changes to tariff calculations, imports, storage, exports, report totals, shared DTOs, or UI behaviour.

## Source Evidence

Primary evidence is recorded in `docs/MODEL_FLEXIBILITY_REVIEW.md`.

The reviewed models show that a single hardcoded methodology will not be enough. The product needs a controlled configuration approach for customer structures, charge families, allocation rules, losses, supply evidence, local charging, generation/export data, and reporting.

## Decision Areas

| Area | Decision Needed | Recommended Direction | Risk If Deferred |
| --- | --- | --- | --- |
| Methodology profile | Whether projects select a methodology profile instead of relying on one global calculation path. | Approve a future explicit profile concept, starting with a generic private-network profile and later site-specific variants only when justified. | High: future code may hardcode airport or port behaviour into the base engine. |
| Customer model | Whether tariff recipients are simple classes, tenants, onward supplies, named customers, or mixed structures. | Treat customer structure as configurable project methodology data, not as labels inferred from imports. | High: tariff outputs may not reconcile to real customer billing structures. |
| Charge families | Which charge families are first-class concepts. | Start with fixed, consumption, capacity/demand, pass-through, excluded, evidence-only, and local network charge families. | Medium: local AUoS/PUoS and pass-through treatment may be mixed into generic cost pools. |
| Allocation rules | Whether allocation is global or cost-line/category specific. | Require cost-line or cost-category allocation with explicit basis and optional direct assignment. | High: workbook models allocate different cost categories differently. |
| Loss treatment | Whether losses are simple percentages or structured model inputs. | Keep losses outside current MVP tariff impact until a separate loss configuration proposal is approved. | High: TLM, DNO loss factors, local losses, and generation/export logic are easy to misapply. |
| Supply treatment | Whether supply costs feed tariffs or remain evidence-only. | Keep current evidence-only rule until supply tariff integration has a separate approved implementation proposal. | High: supply charges could change tariff recovery without sign-off. |
| Workbook mapping | Whether workbook tabs/headers become direct contracts. | Create a future mapping layer that identifies workbook source, sheet, header, row key, and confidence. | Medium: direct import assumptions could become brittle across customer models. |
| Reporting/export | Whether stakeholder report and machine export share one contract. | Keep rendered report and formal export DTO separate until export requirements are approved. | Medium: visual report needs may contaminate machine-readable outputs. |

## Recommended Owner Decisions

1. Approve methodology configuration as a future design direction.
2. Do not implement site-specific logic directly inside `calculateTariffs`.
3. Do not infer customer applicability, pass-through treatment, or allocation basis from workbook labels alone.
4. Keep loss modelling, generation/export treatment, and supply tariff integration as separate decision/implementation packages.
5. Require representative workbook-derived scenarios before broadening production calculation behaviour.
6. Require shared contract review before changing `types/project.ts`, calculation input/output types, import record shapes, report DTOs, or export DTOs.

## Proposed Initial Configuration Concepts

Future implementation should consider these concepts, subject to contract review:

- Methodology profile: names the broad calculation approach for a project.
- Customer structure: defines whether outputs are by class, tenant, meter, onward supply, or named customer.
- Charge family: classifies each recoverable or evidence-only cost line.
- Allocation basis: states the denominator and target population for each cost line or category.
- Recovery treatment: states whether a line is recovered, pass-through, excluded, evidence-only, or unresolved.
- Loss treatment: records whether losses are ignored, evidence-only, simple factor, DNO/TLM based, or local-network based.
- Workbook source mapping: traces imported values back to source workbook, sheet, header, row, and mapping confidence.

## Explicit Non-Decisions

This pack does not decide:

- The final shape of a methodology configuration DTO.
- The UI for selecting or editing methodology profiles.
- A workbook import mapping implementation.
- Tariff-impacting supply integration.
- Loss calculation rules.
- Generation/export recovery treatment.
- Formal report/export DTOs.

## Implementation Guardrails

Before implementation starts:

1. Tariff Engine should propose calculation contract changes.
2. Data Import should propose workbook mapping contracts.
3. QA should propose representative workbook-derived regression scenarios.
4. UI should wait for stable contracts before adding methodology configuration screens.
5. PM should review all shared contracts before any production package is opened.

## Suggested Package Sequence

1. `MODEL-002` methodology configuration contract proposal.
2. `MODEL-003` workbook source mapping proposal.
3. `MODEL-004` representative workbook-derived scenario fixtures.
4. `MODEL-005` calculation contract extension proposal.
5. UI/report changes only after contracts and scenarios are reviewed.

## Owner Approval Options

| Option | Meaning | Recommended? |
| --- | --- | --- |
| A | Approve the future methodology configuration direction and keep all production implementation gated. | Yes |
| B | Reject methodology configuration and keep one fixed calculation method. | No |
| C | Approve immediate implementation. | No |

Recommended decision: Option A.
