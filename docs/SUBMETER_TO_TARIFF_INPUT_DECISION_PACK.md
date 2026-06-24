# Submeter To Tariff Input Decision Pack

## Purpose

Define when site submeter consumption may become tariff-driving aggregate input.

Current position: submeter records, consumption records, Transmission Loss Multipliers, boundary reconciliation, loss-adjusted consumption, responsibility categories and UtilityHub hierarchy mapping are evidence/readiness surfaces only. They do not currently replace or update aggregate customer-class tariff inputs.

Recommended default: keep submeter data evidence-only until UtilityHub hierarchy mapping, reconciliation quality, validation status and owner sign-off are all satisfied.

## Current Approved Mode

The approved tariff-driving path remains:

1. Aggregate customer-class data inputs.
2. Approved recoverable cost pools.
3. Approved allocation methods.
4. `calculateTariffs` output and audit trace.

Submeter data may support review, challenge and reconciliation, but it does not currently change:

- customer-class annual kWh;
- peak demand;
- customer count;
- cost pools;
- allocation percentages;
- revenue requirement;
- tariff rates;
- report totals;
- export DTOs.

## Input Source Modes

| Mode | Status | Tariff impact | Description |
| --- | --- | --- | --- |
| Aggregate-only | Approved current mode | Yes | Customer-class rows in core data inputs drive tariff denominators. |
| Submeter evidence-only | Approved current evidence mode | No | Submeter, TLM, loss, hierarchy and reconciliation evidence supports review but does not alter tariff inputs. |
| Submeter-derived aggregate | Future mode only | Not approved | Reviewed submeter totals may populate or replace aggregate customer-class annual kWh and demand inputs after required gates pass. |

## Required Gates Before Submeter-Derived Aggregate Use

Submeter-derived aggregate input must remain blocked until all of the following are true.

### UtilityHub Mapping

- Each tariff-impacting meter maps to UtilityHub-owned customer, site, building, location and meter references where applicable.
- Tariff Builder does not create permanent local master customer, site, meter, user, permission or audit records.
- Free-text `location` and `tenantName` are retained as source/display evidence until migration is approved.
- Unmapped meters or locations are resolved or explicitly accepted as non-tariff-impacting evidence.

### Responsibility And Customer-Class Mapping

- Meter responsibility is reviewed.
- Tenant meters map to a reviewed tenant/customer/customer-class relationship.
- Network Operator, Landlord, Shared Asset, EV Asset, Plant Room, Infrastructure and Other Internal Use records have an approved treatment.
- No customer class is inferred from free-text tenant name, location or responsibility alone.

### Consumption Validation

Tariff-impacting use is blocked unless these issues are resolved or explicitly accepted with documented treatment:

- unknown meter references;
- duplicate periods;
- overlapping periods;
- invalid date ranges;
- missing required consumption;
- negative consumption;
- incorrect half-hourly settlement-period counts;
- unsupported units;
- records marked `Needs correction`.

### Boundary Reconciliation

- Boundary-to-submeter reconciliation is within an approved tolerance.
- Any variance outside tolerance has a documented explanation and owner sign-off.
- Reconciliation status is recorded alongside the generated aggregate values.
- Reconciliation evidence remains visible after aggregate values are created.

### Non-Half-Hourly Consumption

- Monthly, quarterly and annual records may be used as aggregate totals only if the approved tariff denominator does not require half-hourly profiling.
- If profiling into half-hourly periods is required, the profiling method must be separately approved and auditable.
- Non-half-hourly records must not receive Transmission Loss Multiplier treatment unless a profiling method has been approved.

### Loss Treatment

- Raw consumption and loss-adjusted consumption must remain separate.
- TLM/loss-adjusted values must not overwrite raw consumption.
- Loss-adjusted values may become tariff-impacting only after the relevant loss methodology is approved.
- The decision must state whether tariff denominators use raw consumption, loss-adjusted consumption, or both as separately reported evidence.

## Recommended First Implementation After Approval

When submeter-derived aggregate input is approved, the first implementation should not make `calculateTariffs` read raw submeter rows directly.

Recommended first implementation:

1. Add a controlled derivation service that reads reviewed submeter evidence.
2. Produce draft aggregate customer-class input rows.
3. Show source meters, periods, exclusions, reconciliation status and assumptions.
4. Require explicit user review before the generated rows become tariff-driving.
5. Feed `calculateTariffs` through the existing aggregate customer-class input path.

This preserves the current calculation contract and keeps auditability clear.

## Out Of Scope For This Decision Pack

This pack does not approve:

- production code changes;
- calculation engine changes;
- import parser output changes;
- storage contract changes;
- shared DTO changes;
- report total changes;
- export DTO changes;
- automatic UtilityHub sync;
- automatic profiling of non-half-hourly records;
- automatic loss-adjusted tariff denominators.

## Recommended Decision

Approve the conservative control model:

- `Aggregate-only` remains the current tariff-driving mode.
- `Submeter evidence-only` remains available for review and reporting.
- `Submeter-derived aggregate` may be implemented later only through a reviewed aggregate-row generation flow, not by changing the tariff engine to consume raw submeter rows directly.

## Acceptance Criteria For A Future Implementation Proposal

A future implementation proposal must define:

- source records included and excluded;
- UtilityHub hierarchy mapping requirements;
- customer-class mapping rules;
- validation blockers and accepted exceptions;
- reconciliation tolerance and variance treatment;
- raw vs loss-adjusted consumption treatment;
- profiling treatment for monthly, quarterly and annual records;
- user review and approval workflow;
- audit trace requirements;
- tests proving generated aggregate inputs reconcile and do not silently change tariff totals.
