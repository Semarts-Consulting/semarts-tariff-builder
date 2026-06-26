# First Release Readiness Review

Date: 2026-06-24

Status: prepared for review.

## Purpose

Assess whether the current Tariff Builder baseline is ready to move from internal MVP candidate toward a first release, and identify the remaining blockers before external release or wider stakeholder use.

## Current Position

The application is stronger than the original internal MVP candidate. It now has:

- tariff calculation workflow with audit trace;
- aggregate customer-class tariff input path;
- recoverable cost-pool and allocation workflow;
- stakeholder-reviewable report view;
- submeter, TLM, loss, UtilityHub hierarchy, methodology cost, asset and supply evidence sections;
- explicit decision boundaries for tariff-impacting use of those evidence sections;
- import review hardening for duplicate submeter, consumption and TLM records;
- scenario and regression coverage around representative tariff calculations and workbook-derived evidence.

Recommended status: first-release candidate for controlled internal and selected stakeholder walkthroughs, not unrestricted external production release.

## Release Readiness Summary

| Area | Status | Evidence | Release implication |
| --- | --- | --- | --- |
| Core tariff calculation | Ready for controlled release review | Audit trace, scenario coverage and recovery reconciliation are present. | Suitable for controlled walkthroughs. |
| Aggregate tariff inputs | Ready for controlled release review | Customer-class inputs, cost pools and allocations remain the approved tariff-driving path. | Keep as first-release calculation path. |
| Report view | Ready for stakeholder review | Report evidence sections and HTML/print workflow exist. | Formal machine-readable export remains out of scope. |
| Import review | Improved, but not fully automated | Duplicate review now covers existing and same-file duplicates. | Suitable with manual review guardrails. |
| Submeter and TLM data | Evidence-only | Decision pack blocks tariff-driving use until reviewed aggregate generation is approved. | Do not present as tariff-driving. |
| Supply energy | Controlled tariff impact only | Explicit reviewed p/kWh rows can affect Energy / kWh; automatic derivation remains blocked. | Demo carefully; do not imply full supply integration. |
| UtilityHub / Meter Map | Contract-aligned, not integrated | Tariff Builder must consume shared IDs and not create local masters. | Production integration depends on UtilityHub contracts. |
| Selector API boundary | Stubbed only | Internal route stubs, client boundaries and UI stub-status cards exist, but live UtilityHub fetch/auth are not implemented. | Suitable for controlled local walkthrough; not live integration proof. |
| Methodology cost evidence | Evidence-only | Mapping proposal recommends reviewed cost-pool candidates before tariff impact. | Do not auto-create cost pools. |
| Asset evidence | Evidence-only | Valuation pack recommends approved annual amounts before formula-based valuation. | Do not imply annuity/depreciation calculation. |
| Export DTOs | Not ready | Report view is stakeholder-readable but not a stable export contract. | Needs separate package if required for release. |

## Go / No-Go View

### Green For First-Release Candidate

- Controlled internal or selected stakeholder walkthrough.
- Demonstrating transparent tariff calculation from aggregate inputs.
- Showing audit trace, revenue recovery and report evidence.
- Demonstrating evidence-only review areas with clear limitations.
- Capturing feedback and defects into scoped follow-up packages.

### Amber For First Release

- Use where users understand that evidence sections do not automatically drive tariffs.
- Use where manual review of imports, mappings, cost pools, allocations and report readiness is acceptable.
- Use where formal export DTOs are not required.

### Red For External Production Release

Do not position the current app as externally production-ready if the release requires:

- automatic submeter-derived tariff denominators;
- automatic supply evidence derivation;
- UtilityHub / Meter Map shared hierarchy integration;
 - live UtilityHub selector retrieval and authentication;
- methodology-derived cost-pool generation;
- formula-based asset valuation;
- formal machine-readable exports;
- save-blocking validation across all forms;
- large-scale half-hourly dataset storage;
- final Ofgem/legal compliance sign-off.

## Current Release Blockers

| Blocker | Owner | Required decision or package |
| --- | --- | --- |
| Formal external release definition | User plus PM | Decide whether first release is internal controlled use, selected stakeholder demo, or external production release. |
| Export DTO requirement | PM plus UI/Engine | Decide if machine-readable export is required before first commercial release. |
| UtilityHub shared contracts | UtilityHub/Meter Map plus PM | Confirm shared IDs and contracts before persistent hierarchy or meter integration. |
| Submeter-derived tariff inputs | Tariff Engine/Data/UI plus PM | Approve aggregate generation workflow and validation gates. |
| Automatic supply derivation | Tariff Engine plus PM | Approve customer applicability, pass-through, denominator and audit treatment. |
| Methodology cost mapping | Tariff Engine/Data plus PM | Approve candidate persistence, review status and allocation readiness. |
| Asset valuation | Tariff Engine plus PM | Approve annual amount or formula-based valuation method. |
| Browser walkthrough evidence | UI plus QA | Complete. User test accepted on 2026-06-26 after PR #98. |
| UtilityHub data ownership and tariff-year model | User plus PM | Align future product shape so UtilityHub owns meters, consumption, boundary meters, supply contracts and reusable reference data while Tariff Builder owns tariff-year methodology and calculation records. |

## Recommended Next Step

Record the controlled release decision against the accepted walkthrough result.

Use `docs/FIRST_RELEASE_WALKTHROUGH_EVIDENCE.md` as the walkthrough evidence record.

Minimum walkthrough path:

1. Open the demo project.
2. Confirm aggregate customer-class inputs.
3. Confirm cost pools and allocations.
4. Confirm tariff outputs and audit trace.
5. Confirm report evidence sections.
6. Confirm import review messages for submeter/TLM duplicates.
7. Confirm evidence-only boundaries are understandable.
8. Record release decision.

## Recommended Release Decision

Recommended current decision:

- Accept as first-release candidate for controlled internal and selected stakeholder review.
- Do not approve unrestricted external production release yet.
- Manual/browser walkthrough is accepted.
- Next choose whether the next package is controlled release decision, UtilityHub live selector integration, selected-input persistence, formal export design, or targeted release hardening.

## Checks Required Before Final Release Tag

Before any release tag or external deployment decision:

- lint;
- type-check;
- full tests;
- production build;
- manual walkthrough evidence;
- current limitations reviewed;
- known release blockers accepted or resolved;
- Git status clean on `main`;
- release owner decision recorded.
