# Supply Energy Tariff Impact Proposal

## Purpose

Define the approved boundary for supply energy p/kWh values affecting tariff outputs.

Current position:

- Supply evidence records and annual amount calculations remain evidence-only by default.
- The tariff engine can accept explicit optional supply energy p/kWh rows.
- The calculation workflow may apply an explicit reviewed supply p/kWh row to a selected customer class.
- Automatic conversion of supply evidence records into tariff-impacting rows is not approved.

Recommended default: keep supply tariff impact explicit, opt-in and customer-class specific. Do not infer tariff-impacting supply values from evidence-only supply records.

## Supply Impact Modes

| Mode | Status | Tariff impact | Description |
| --- | --- | --- | --- |
| Supply evidence-only | Approved current mode | No | Supply records support review, reconciliation and report evidence but do not change tariffs. |
| Explicit applied supply energy row | Approved controlled mode | Yes, when applied | A reviewed p/kWh value is applied to a named customer class and included in Energy / kWh. |
| Automatic supply evidence derivation | Not approved | No | Supply evidence records are not automatically converted into tariff-impacting rows. |
| Supply annual amount allocation | Not approved | No | Fixed/kVA annual supply amounts remain separate from recoverable network cost pools and tariff outputs. |

## Approved Calculation Boundary

An explicit applied supply energy row may affect tariff outputs only when:

- it references an existing customer class;
- the p/kWh value is non-negative;
- the p/kWh value is produced or entered through a reviewed supply methodology;
- the source notes and source row IDs are preserved for audit trace;
- the user intentionally applies the row in the tariff calculation workflow.

When applied, the tariff engine:

- converts p/kWh to GBP/kWh;
- multiplies by the customer-class annual kWh;
- adds the value to that customer class Energy cost;
- adds the value to revenue requirement;
- includes the source in audit trace and revenue recovery.

No explicit supply energy row means no supply energy tariff impact.

## Loss Treatment Boundary

Supply p/kWh build-up must follow the approved loss treatment:

- `NBP`: applies TLM, DNO losses and private network losses.
- `GSP`: applies DNO losses and private network losses.
- `CM` or Site Meter: applies private network losses only.

The built-up site-meter rate is then multiplied by customer-specific private network losses:

- EHV customer rate = site-meter rate * EHV losses.
- HV customer rate = site-meter rate * EHV losses * HV losses.
- LV customer rate = site-meter rate * EHV losses * HV losses * LV losses.

Each source charge must retain its own loss position. Do not apply all losses to all supply charges.

## Report And Reconciliation Treatment

Explicit applied supply energy rows are tariff-impacting calculation inputs and should be visible in tariff calculation audit trace.

Supply evidence records that have not been explicitly applied remain evidence-only in reports.

The stakeholder report must distinguish:

- supply evidence-only rows;
- explicit tariff-impacting supply energy rows;
- pass-through supply evidence;
- fixed or capacity annual supply evidence that remains outside network recovery.

Supply annual amount reconciliation remains separate from network cost recovery unless a later decision approves a combined treatment.

## Pass-Through And Double Recovery Controls

Pass-through supply lines must not silently become recoverable tariff revenue.

Before any supply value is tariff-impacting, reviewers must confirm:

- whether the value is already included in supplier all-in rates;
- whether levies such as RO, FiT, CfD, BSUoS or CCL are already included elsewhere;
- whether the value is pass-through, recoverable, evidence-only or excluded;
- which customer class or classes the value applies to;
- which denominator is used when blending day, night, time-band or combined rates.

## Explicitly Blocked Without Further Approval

The following remain blocked:

- automatically inferring tariff-impacting rows from supply evidence records;
- adding supply annual amounts to `CostPoolRow`;
- allocating supply annual amounts through network allocation methods;
- changing report totals or export DTOs for supply evidence;
- changing import parser output shapes;
- changing storage contracts;
- creating customer applicability rules without review;
- blending time-of-use rates without an approved denominator.

## Recommended Decision

Approve the current controlled boundary:

- Supply evidence remains evidence-only unless explicitly applied.
- Explicit applied supply energy p/kWh rows may affect Energy / kWh for a selected customer class.
- Automatic supply evidence-to-tariff conversion remains blocked.
- Fixed and capacity annual supply amounts remain disconnected evidence until a separate proposal is approved.
- Report and export changes beyond current evidence wording require a separate package.

## Acceptance Criteria For Future Implementation

A future implementation proposal must define:

- customer applicability rules;
- reporting category for each supply charge;
- pass-through and exclusion treatment;
- raw evidence-to-applied-row review workflow;
- denominator and blending rules for time-of-use or day/night charges;
- audit trace requirements;
- report presentation for applied vs evidence-only supply values;
- tests proving no double recovery and no silent tariff impact from evidence-only rows.
