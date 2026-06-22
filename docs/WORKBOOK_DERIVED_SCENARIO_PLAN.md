# Workbook-Derived Scenario Plan

Date: 2026-06-22

Status: scenario planning only.

## Purpose

This plan identifies representative workbook-derived scenarios that should be reviewed before the app broadens methodology configuration, workbook import mapping, or calculation behaviour.

This package does not add fixtures or tests. It does not change tariff calculations, imports, storage, exports, shared DTOs, report output, or UI behaviour.

## Source Documents

- `docs/MODEL_FLEXIBILITY_REVIEW.md`
- `docs/METHODOLOGY_CONFIGURATION_DECISION_PACK.md`
- `docs/METHODOLOGY_CONFIGURATION_CONTRACT_PROPOSAL.md`
- `docs/WORKBOOK_SOURCE_MAPPING_PROPOSAL.md`

## Scenario Principles

Future scenarios should:

- Be small enough to review manually.
- Preserve source workbook traceability.
- Include expected tariff or evidence outcomes.
- Separate recoverable tariff values from pass-through, excluded, unresolved, or evidence-only values.
- Include validation expectations where source data is incomplete or ambiguous.
- Avoid copying full customer workbooks into tests.
- Avoid hardcoding one customer model as the product model.

## Proposed Scenario Backlog

| ID | Scenario | Source Model Pattern | Purpose | Initial Owner | Risk |
| --- | --- | --- | --- | --- | --- |
| WB-001 | Airport customer-class tariff with onward supply data | BRS / STN-style airport model | Prove customer classes, meter counts, capacity, consumption, and AUoS evidence can be represented without hardcoding airport labels. | QA plus Tariff Engine/Data Import review | Medium |
| WB-002 | Airport high-volume TLM and local losses evidence | EMA / MAN / STN v4-style model | Prove TLM/local-loss evidence can be captured separately from tariff-impacting calculations until loss treatment is approved. | QA plus Tariff Engine review | High |
| WB-003 | Port tenant recovery forecast | POTL model | Prove tenant/customer references, tariff model references, recovery forecast evidence, and local charging can be traced and reviewed. | QA plus Data Import/Tariff Engine review | High |
| WB-004 | Generation/export evidence case | POTL wind/export data pattern | Prove generation/export evidence remains separate unless recovery treatment is explicitly approved. | QA plus Tariff Engine review | High |
| WB-005 | Asset-cost allocation by voltage/local class | Airport and port asset sheets | Prove assets can carry chargeability, voltage, local class, replacement value, and allocation evidence. | QA plus Data Import/Tariff Engine review | Medium |
| WB-006 | Weak workbook mapping confidence | Cross-workbook pattern | Prove low-confidence or unresolved mappings are visible and cannot silently feed tariff-impacting calculations. | QA plus Data Import review | Medium |

## Recommended First Scenario

Start with `WB-001 Airport customer-class tariff with onward supply data`.

Reason:

- It is closest to the existing MVP/customer-class model.
- It exercises workbook-derived customer and volume structure without requiring immediate loss, generation/export, or supply tariff integration changes.
- It can remain docs/test-fixture focused before production imports or calculation contracts change.

## Minimum Scenario Record

Each future workbook-derived scenario should record:

- Scenario ID.
- Source workbook pattern.
- Methodology profile assumption.
- Customer structure.
- Charge families present.
- Allocation bases present.
- Recovery treatments present.
- Workbook source mapping expectations.
- Expected calculation or evidence result.
- Expected validation issues.
- Explicit out-of-scope behaviour.

## Acceptance Criteria

A workbook-derived scenario is ready for implementation only when:

1. The source workbook pattern is described without relying on full workbook replication.
2. Expected inputs and outputs are reviewable by a commercial reviewer.
3. Any tariff-impacting behaviour is already approved by the relevant decision pack.
4. Mapping confidence and unresolved mappings are represented.
5. Pass-through, excluded, evidence-only, and recoverable values are separated.
6. QA has agreed what regression evidence is required.
7. PM has confirmed no shared contract change is being introduced without review.

## Explicitly Out Of Scope

This plan does not approve:

- New test fixtures.
- New import parsers.
- Project type changes.
- Calculation engine changes.
- Storage changes.
- Report or export changes.
- Methodology profile UI.
- Tariff-impacting supply integration.
- Loss calculation implementation.

## Recommended Next Package

Prepare `WB-001` as a narrow representative scenario fixture proposal before writing tests or changing production code.
