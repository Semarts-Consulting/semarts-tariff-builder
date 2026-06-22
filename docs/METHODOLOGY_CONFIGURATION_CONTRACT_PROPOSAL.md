# Methodology Configuration Contract Proposal

Date: 2026-06-22

Status: proposal for review only.

## Purpose

This proposal defines the first shared contract concepts needed before the app can support broader methodology variation across airports, ports, tenant networks, onward supply structures, local losses, and workbook-specific tariff models.

This proposal does not approve implementation and does not change `types/project.ts`, calculation inputs, calculation outputs, imports, storage, exports, report output, shared DTOs, or UI behaviour.

## Source Documents

- `docs/MODEL_FLEXIBILITY_REVIEW.md`
- `docs/METHODOLOGY_CONFIGURATION_DECISION_PACK.md`
- `docs/CODEX_GIT_WORKFLOW.md`

## Contract Principles

1. Methodology configuration must be explicit, not inferred from workbook labels or customer names.
2. Production calculation behaviour must remain unchanged until contract approval and implementation proposal approval.
3. The tariff engine owns calculation semantics.
4. Data Import owns workbook mapping proposals.
5. UI Flow waits for stable contracts before adding methodology configuration screens.
6. QA owns representative scenario coverage before production behaviour changes.
7. PM reviews any shared contract before implementation.

## Proposed Contract Concepts

These concepts are intentionally descriptive at this stage. They are not final TypeScript interfaces.

| Concept | Purpose | Initial Values Or Shape | Owner |
| --- | --- | --- | --- |
| Methodology profile | Names the broad methodology approach for a project. | Generic private network, airport private network, port private network, custom/manual. | PM shared contract with Tariff Engine review. |
| Customer structure | Describes who receives tariff outputs. | Customer class, tenant, onward supply, meter, named customer, mixed. | Data Import plus Tariff Engine review. |
| Charge family | Classifies each cost or evidence line. | Fixed, consumption, capacity/demand, pass-through, excluded, evidence-only, local network charge. | Tariff Engine. |
| Allocation basis | Defines how a charge line is allocated. | Consumption, capacity, meter count, fixed share, direct assignment, custom weighting, unresolved. | Tariff Engine with PM review. |
| Recovery treatment | Defines whether a line affects tariff recovery. | Recoverable, pass-through, excluded, evidence-only, unresolved. | Tariff Engine. |
| Loss treatment | Defines how losses are handled. | None, evidence-only, simple factor, DNO table, TLM, local network, generation/export specific. | Tariff Engine plus QA review. |
| Workbook mapping source | Traces imported data back to workbook context. | Workbook, sheet, header, row key, value reference, mapping confidence. | Data Import. |
| Assumption record | Records manual methodology decisions. | Decision, rationale, owner, date, affected line/class, audit visibility. | PM shared contract. |

## Proposed Contract Boundaries

### Methodology Profile

The profile should select permitted configuration patterns, not hardcode calculation outcomes.

Examples:

- Generic private network: class-based tariff outputs and standard allocation families.
- Airport private network: supports customer classes, onward supply data, local losses, and airport network evidence.
- Port private network: supports tenant/customer references, import/export or generation evidence, PUoS/local charging, and recovery forecast evidence.
- Custom/manual: requires explicit owner sign-off before production use.

### Customer Structure

The customer structure should answer:

- Who receives tariff outputs?
- What denominator data is available?
- Are outputs grouped by class, tenant, meter, named customer, or mixed grouping?
- Which records are evidence-only?
- Which records are direct-billed or pass-through?

No future implementation should infer this solely from row labels, sheet names, or customer names.

### Charge Family And Recovery Treatment

Charge family and recovery treatment should be separate.

Example: a capacity charge can be recoverable, pass-through, excluded, or evidence-only. Treating charge type and recovery treatment as one field would make workbook-derived models brittle.

### Allocation Basis

Allocation basis should be set at cost-line or cost-category level. A single project-wide allocation method is not enough for the reviewed workbook models.

The proposed minimum allocation attributes are:

- Basis.
- Target customer population.
- Denominator source.
- Direct assignment flag.
- Manual override flag.
- Audit note.

### Loss Treatment

Loss treatment should stay outside tariff-impacting implementation until a separate loss configuration proposal is approved.

The reviewed workbooks show materially different loss structures, including DNO tables, super-red/time-period logic, local network losses, TLM evidence, generation/export evidence, and site-specific loss factors.

### Workbook Mapping Source

Workbook mapping should not be treated as direct project data without traceability.

The proposed minimum mapping attributes are:

- Workbook source.
- Worksheet.
- Header or label.
- Row key.
- Column key.
- Raw value.
- Normalised value.
- Mapping confidence.
- Validation issue, if any.

## Explicitly Out Of Scope

This proposal does not include:

- TypeScript interface changes.
- Calculation engine changes.
- Import parser changes.
- Storage changes.
- Export DTO changes.
- Report output changes.
- Methodology profile UI.
- Automatic workbook replication.
- Tariff-impacting supply integration.
- Loss calculation implementation.

## Required Reviews Before Implementation

| Review | Owner | Required Before |
| --- | --- | --- |
| Shared contract review | PM | Any `types/project.ts` or DTO change. |
| Calculation semantics review | Tariff Engine | Any tariff-impacting behaviour. |
| Workbook mapping review | Data Import | Any broad workbook import support. |
| Regression scenario review | QA | Any production calculation or import implementation. |
| Report wording review | UI Flow plus PM | Any stakeholder-facing presentation. |

## Recommended Next Packages

1. `MODEL-003` workbook source mapping proposal.
2. `MODEL-004` representative workbook-derived scenario plan.
3. `MODEL-005` methodology configuration type proposal, only after owner approval.
4. `MODEL-006` calculation contract extension proposal, only after scenario and type proposals are reviewed.

## Open Owner Decisions

1. Confirm whether Option A from `docs/METHODOLOGY_CONFIGURATION_DECISION_PACK.md` is approved.
2. Confirm whether methodology profiles should be visible to users in the product or remain internal configuration initially.
3. Confirm whether workbook mapping should support multiple source workbooks per project.
4. Confirm whether first production implementation should target generic private-network configuration before airport/port variants.

## Recommendation

Approve this proposal as a non-binding contract direction only. Do not implement until the next mapping/scenario/type packages are reviewed and signed off.
