# Next Long Run Brief

Date: 2026-06-24

Status: refreshed execution brief for the next extended run after long-run evidence batches 01-04.

## Current Baseline

The current `main` baseline includes:

- Workbook-derived scenario regressions for WB-001 through WB-006.
- Site submeter register, consumption, Transmission Loss Multiplier, reconciliation and loss evidence foundations.
- Utilityhub-style hierarchy mapping evidence.
- Supply energy p/kWh evidence and application UI using the approved NBP/GSP/CM and private-network loss treatment.
- Asset readiness evidence.
- Methodology cost evidence readiness for direct costs, employee costs and indirect overheads.
- Report download regressions that preserve evidence-only wording.

These items improve review evidence and commercial defensibility. They do not make submeter, asset, supply, methodology-cost, generation/export, or weak workbook-mapping evidence tariff-impacting unless a separate approved package explicitly changes that behaviour.

## Primary Objective

Use the next long run to convert the strongest evidence foundations into controlled implementation packages, without changing tariff methodology by assumption.

Target outcome:

- More of the app can be walked through end to end using realistic private-network inputs.
- Any tariff-impacting change is preceded by a decision/proposal package.
- Evidence-only areas remain clearly separated from tariff-driving inputs.
- Full validation remains green.

## Operating Mode

Default mode:

- Work from a clean `codex/*` feature branch.
- Prefer small packages that can be validated independently.
- Use existing helpers and patterns before introducing new abstractions.
- Keep production behaviour unchanged unless the package has explicit approval.
- Keep `docs/codex-checkpoints/` out of commits.
- Run focused tests after each package and full validation before handoff.

Manager-led packages are acceptable for docs, tests, evidence summaries and small UI hardening.

Delegate or pause for approval before:

- Calculation semantics.
- Import parser output shapes.
- Storage contracts.
- Shared DTOs.
- Report totals or export DTOs.
- Methodology configuration contracts.
- Utilityhub shared hierarchy contracts.

## Recommended Package Queue

### Package A: Current Evidence Closeout

Type: docs-only.

Purpose:

- Record the evidence foundation now available after PRs #60-#67.
- Identify which evidence areas are ready for walkthrough and which remain gated.

Likely files:

- `docs/LONG_RUN_PROGRESS_LOG.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`
- `docs/OVERNIGHT_REVIEW_AND_NEXT_PHASE_PLAN.md`

Acceptance criteria:

- The next package queue is clear.
- Evidence-only and tariff-impacting boundaries are explicit.
- No production files changed.

### Package B: Submeter To Aggregate Input Decision Pack

Type: decision/proposal.

Purpose:

- Decide how and when submeter consumption can become tariff-driving aggregate customer-class input.
- Define reconciliation requirements before submeter totals can replace or update aggregate annual kWh and demand inputs.

Likely files:

- future `docs/SUBMETER_TO_TARIFF_INPUT_DECISION_PACK.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`

Decision points:

- Whether submeter totals should create aggregate customer-class inputs or only produce review evidence.
- Whether unknown, duplicate, overlapping, or missing periods block tariff-driving use.
- Whether monthly/quarterly/annual data needs profiling before tariff use.
- How Utilityhub hierarchy and tenant/customer-class mapping are approved.

Stop condition:

- Stop if tariff-driving treatment is unclear.

### Package C: Utilityhub Hierarchy Contract Proposal

Type: contract proposal.

Purpose:

- Mirror the Utilityhub hierarchy model closely enough that Tariff Builder can later link submeters to site, building, area, customer, responsibility and billing context without inventing a parallel hierarchy.

Likely files:

- future `docs/UTILITYHUB_HIERARCHY_CONTRACT_PROPOSAL.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`

Out of scope:

- Production storage migration.
- Shared DTO implementation.
- Automatic sync from Utilityhub.

Stop condition:

- Stop if the Utilityhub source contract is unavailable or inconsistent.

### Package D: Supply Energy Tariff Impact Proposal

Type: decision/proposal.

Purpose:

- Define the precise conditions under which the calculated supply energy p/kWh can update tariff output rows.
- Keep NBP/GSP/CM source loss treatment and customer-level private-network loss treatment explicit.

Likely files:

- future `docs/SUPPLY_ENERGY_TARIFF_IMPACT_PROPOSAL.md`
- supply decision docs if cross-references need updating.
- manager control docs.

Decision points:

- Which customer class receives the applied supply p/kWh.
- Whether applied supply p/kWh is shown as a separate line, included in energy charge, or both.
- How pass-through and non-pass-through supply lines are labelled.
- How supply evidence reconciles to report totals without double counting.

Stop condition:

- Stop before implementation unless the user approves the impact model.

### Package E: Methodology Cost To Cost Pool Mapping Proposal

Type: decision/proposal.

Purpose:

- Decide how direct costs, employee costs and overhead rows can become approved cost pools or support cost pool evidence.

Likely files:

- future `docs/METHODOLOGY_COST_POOL_MAPPING_PROPOSAL.md`
- `docs/MVP_TASK_BOARD.md`
- `docs/PM_CONTROL.md`

Decision points:

- Whether workbook methodology cost rows create draft cost pools.
- Whether rows stay evidence-only until manually mapped.
- How recoverability percentage and allocation method are assigned.
- How duplicate cost recovery is prevented.

Stop condition:

- Stop before production implementation if mapping or recoverability rules are not approved.

### Package F: Asset Valuation Methodology Decision Pack

Type: decision/proposal.

Purpose:

- Decide whether and how asset values become tariff recoverable cost.

Likely files:

- future `docs/ASSET_VALUATION_METHOD_DECISION_PACK.md`
- `docs/WB_005_ASSET_DECISION_PACK.md`
- manager control docs.

Decision points:

- Annuity, depreciation, WACC, replacement value, prior-year value or other valuation basis.
- Voltage/network-level allocation.
- Chargeable vs non-chargeable assets.
- Treatment of shared, landlord, tenant and network operator assets.

Stop condition:

- Stop before production calculation if valuation rules are not approved.

### Package G: Import Review Workflow Hardening

Type: implementation, low-to-medium risk if scoped to UI/review evidence.

Purpose:

- Make imported workbook/submeter/supply rows easier to review before they affect decisions.

Allowed direction:

- Better review summaries.
- Issue-only filters.
- Clearer duplicate/missing/overlap messages.
- No parser output shape changes unless separately approved.

Likely files:

- existing import review helpers.
- existing form components.
- focused tests.

Stop condition:

- Stop if parser contracts or saved record shapes need to change.

### Package H: Stakeholder Walkthrough Readiness

Type: test/docs/manual check support.

Purpose:

- Prepare a current walkthrough path that covers the richer evidence now available.

Likely files:

- `docs/MVP_DEMO_PATH_CHECK.md`
- `docs/MVP_DEMO_REHEARSAL_NOTES.md`
- report regression tests if wording is strengthened.

Acceptance criteria:

- A reviewer can tell what drives the tariff and what is supporting evidence.
- Known limitations are visible and not hidden by polish.

## Validation Cadence

After each docs-only package:

- Run no checks unless markdown structure or links are material.
- Record package outcome in `docs/LONG_RUN_PROGRESS_LOG.md`.

After each test or UI package:

- Run focused tests.
- Run type-check if TypeScript changed.

After two to three packages, and before handoff:

- `npm.cmd run lint`
- `npx.cmd tsc --noEmit --incremental false`
- `npm.cmd test`
- `npm.cmd run build`

## Stop Conditions

Stop and report if:

- A package would make evidence tariff-impacting without explicit approval.
- A data contract or saved record shape needs to change.
- Utilityhub hierarchy mirroring requires source details not available in this repo.
- Supply, asset, submeter or methodology-cost treatment needs a business decision.
- Validation fails and cannot be fixed with one narrow change.

## Recommended Next Branch

Use:

- `codex/next-implementation-planning`

Suggested first package:

- Package A: Current Evidence Closeout.

Suggested follow-up:

- Package B or C depending on whether the user wants submeter tariff impact or Utilityhub hierarchy alignment first.
