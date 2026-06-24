# Methodology Cost To Cost-Pool Mapping Proposal

## Purpose

Define when workbook methodology cost evidence may become tariff-driving cost pools.

Recommended default: direct costs, employee costs and indirect overheads remain evidence-only until they have been reviewed, classified, mapped to approved cost-pool categories, and linked to allocation methods. The current approved tariff-driving path remains explicit `CostPoolRow` records plus explicit allocation methods.

## Current Position

Tariff Builder currently has two separate concepts:

- methodology cost evidence from workbook-style inputs;
- approved tariff cost pools used by `calculateTariffs`.

That separation should remain in place until the business rules below are approved and implemented. This avoids double counting costs, importing unsupported workbook assumptions, or making low-confidence evidence tariff-impacting.

## Input Source Modes

| Mode | Meaning | Tariff impact |
| --- | --- | --- |
| Cost-pool only | Current approved mode. User-reviewed cost-pool rows drive tariff revenue requirement. | Approved current path. |
| Methodology cost evidence-only | Direct cost, employee cost and overhead rows support review but do not create cost pools. | Current evidence path. |
| Methodology-derived cost pools | Future mode where reviewed evidence can generate or update approved cost-pool rows. | Blocked until approval and implementation. |

## Evidence Types In Scope

The future mapping model should cover:

- direct non-employee costs;
- employee role costs;
- indirect overheads;
- workbook source context where available;
- review status and mapping confidence;
- explicit inclusion, exclusion or evidence-only treatment.

Asset valuation remains separate and should be handled through the asset valuation methodology decision pack.

Supply energy, DUoS, TNUoS, BSUoS, losses, pass-through rows and submeter-derived consumption remain separate workstreams unless explicitly mapped into cost-pool treatment by a later approved package.

## Proposed Mapping Fields

A future implementation should define reviewed mapping metadata before creating cost pools:

| Field | Purpose |
| --- | --- |
| `sourceType` | Direct cost, employee cost or indirect overhead. |
| `sourceRowId` | Links the reviewed cost-pool candidate back to source evidence. |
| `reviewStatus` | Draft, needs review, approved, rejected, or evidence-only. |
| `mappingConfidence` | High, medium, low, unresolved, or manually approved. |
| `costPoolCategory` | Existing approved cost-pool category such as Operations, Maintenance, Administration, Network services, Asset recovery, Taxes and levies, or Other. |
| `recoveryTreatment` | Recoverable, partially recoverable, excluded, pass-through, evidence-only, or unresolved. |
| `recoverablePercent` | Explicit recoverability percentage for approved rows. |
| `allocationBasis` | Proposed allocation basis, but not a substitute for an approved allocation method. |
| `tariffComponent` | Fixed, Energy, Demand, or Pass-through where relevant. |
| `reviewedAnnualAmount` | The amount eligible to become a cost-pool annual amount. |
| `reviewNotes` | Commercial rationale and assumptions. |

## Approval Gates

Methodology-derived cost pools should remain blocked until all of these are satisfied:

1. Source rows are valid and traceable to workbook evidence.
2. Duplicate or overlapping evidence rows have been resolved or explicitly accepted.
3. Each row has an approved recovery treatment.
4. Each recoverable row has an approved cost-pool category.
5. Each recoverable row has an approved recoverability percentage.
6. Each recoverable row has or creates exactly one approved cost-pool candidate.
7. Each created or updated cost pool has an approved allocation method before tariff approval.
8. Evidence-only, excluded, unresolved and manual-review rows stay outside tariff calculations.
9. Generated cost pools are visibly marked as derived from methodology evidence.
10. The report audit trail shows source evidence, review status, mapping rationale and final cost-pool treatment.

## Recommended Implementation Boundary

The first implementation, when approved later, should create reviewed cost-pool candidate rows rather than changing `calculateTariffs` to read raw methodology cost evidence directly.

Recommended flow:

1. Read methodology evidence.
2. Produce reviewable cost-pool candidates.
3. Require user review and approval.
4. Create or update explicit `CostPoolRow` records.
5. Require allocation methods through the existing allocation workflow.
6. Run `calculateTariffs` through the existing cost-pool and allocation path.

This preserves the current audit trace and keeps business logic outside React components.

## Double-Counting Controls

Future implementation must prevent:

- the same source row creating more than one cost pool unless explicitly split with documented percentages;
- the same cost being entered manually and generated from evidence without review;
- overhead rows being included both as direct costs and overhead allocations;
- employee role costs being included both as direct labour and overhead;
- pass-through or evidence-only costs being recovered through network tariffs;
- excluded or unresolved evidence affecting revenue requirement.

## Reporting Expectations

Reports should be able to show:

- source evidence totals by direct cost, employee cost and overhead;
- total approved methodology-derived cost pools;
- excluded, evidence-only and unresolved totals;
- mapping confidence and review status;
- cost-pool category and recoverability treatment;
- allocation readiness for each derived cost pool;
- variance between evidence totals and approved tariff-driving cost pools.

Report totals should not change until approved derived cost pools are actually created as tariff inputs.

## Validation Expectations

Future implementation should validate:

- missing source row reference;
- missing cost description;
- missing annual amount;
- negative annual amount unless explicitly permitted by a future credit policy;
- invalid recoverability percentage;
- missing cost-pool category for recoverable rows;
- duplicate source row mapping;
- source rows mapped to multiple cost pools without a split rationale;
- recoverable cost-pool candidates without allocation methods;
- evidence-only or excluded rows marked as tariff-driving.

## Out Of Scope

This proposal does not approve:

- production mapping implementation;
- changes to `calculateTariffs`;
- changes to import parser output shapes;
- storage schema changes;
- shared DTO changes;
- export DTO changes;
- report total changes;
- automatic workbook-to-cost-pool conversion;
- asset valuation methodology;
- supply energy or pass-through tariff integration.

## Recommended Decision

Approve this control direction:

- current explicit cost pools remain the tariff-driving path;
- methodology cost rows remain evidence-only by default;
- future implementation may generate reviewed cost-pool candidates;
- only approved candidates should become explicit `CostPoolRow` records;
- allocation methods remain mandatory before tariff approval;
- raw methodology cost rows should not be read directly by `calculateTariffs`.

## Acceptance Criteria For Future Implementation

A future implementation proposal must define:

- exact review status values;
- exact mapping confidence values;
- duplicate and split-treatment rules;
- cost-pool candidate persistence approach;
- manual override and approval workflow;
- allocation readiness handling;
- report audit evidence;
- regression tests proving unresolved, excluded and evidence-only costs cannot affect tariff revenue requirement.
