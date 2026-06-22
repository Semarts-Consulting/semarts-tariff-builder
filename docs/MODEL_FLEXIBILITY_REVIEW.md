# Model Flexibility Review

Date: 2026-06-22

Status: requirements review only.

## Purpose

This note records what the current app must eventually support if it is to replace or reproduce the range of tariff workbook models reviewed for Bristol Airport, Manchester Airports Group airports, and Port of Tilbury.

This is not an implementation proposal. It does not approve changes to tariff calculations, imports, storage, exports, shared DTOs, or report totals.

## Reference Models Reviewed

| Ref | Model | Observed workbook structure |
| --- | --- | --- |
| BRS | Bristol Airport October 2025 refresh | Tariff sheet, selections and inputs, HH import data, asset data, onward supply data, AUoS, forecast energy costs, losses, DNO losses and super-red periods. |
| EMA | East Midlands Airport November 2025 v4 | Tariff sheet, substation list, HH import data, asset data, selections, AUoS, forecast energy costs, TLM, onward supply data, DNO losses, airport network losses. |
| MAN | Manchester December 2025 like-for-like and optimised | Tariff sheet, substation list, HH import data, asset data, selections, AUoS, forecast energy costs, TLM, onward supply data, DNO losses, MAN network losses. |
| STN | Stansted November 2025 variants | Tariff sheet, HH import data, asset data, RAGLAN assets in v4, CPI, AUoS, forecast energy costs, TLM, onward supply data, DNO losses, STAL network losses. |
| POTL | Port of Tilbury October 2025 refresh | Tariffs, selections and inputs, HH import data, wind turbine HH data, HH export data, POTLL supplies, tenant data, recovery forecast, assets, DNO calculations, TLM, network losses, supply costs, PUoS. |

## Common Model Capabilities

The reviewed models repeatedly use:

- Separate tariff output sheets with customer or tariff-class rows and charge element columns.
- Selection/input areas for WACC, CPI, annual revenue, recovery amounts, and model assumptions.
- Asset cost inputs with chargeability flags, voltage classifications, replacement values, annuity logic, and allocation to tariff classes.
- Customer, tenant, or onward supply data with meter counts, voltage, capacity, consumption, and monthly volumes.
- Network cost allocation sheets using pass-through/shared decisions and allocation bases such as consumption, capacity, and fixed recovery.
- Loss logic using DNO loss tables, local network losses, TLM data, and site-specific loss factors.
- Forecast energy or supply-cost tabs that are separate from core network tariff recovery.
- Reportable reconciliation from input cost base through allocation and tariff output.

## Flexibility Requirements

Future production design should allow:

1. Multiple customer structures:
   - Simple customer classes.
   - Tenant/customer rows.
   - Metered onward supply rows.
   - Site-specific tariff groups such as HV, LV, EHV, local classes, and named customers.

2. Multiple charge families:
   - Fixed standing charges.
   - Capacity or demand charges.
   - Consumption charges.
   - Pass-through charges.
   - Site-specific local charges such as PUoS/AUoS.
   - Explicit excluded or evidence-only charges.

3. Configurable allocation logic:
   - Allocation by consumption, capacity, fixed/meter count, direct customer assignment, or custom class weighting.
   - Cost category level allocation, not a single global allocation method.
   - Clear pass-through/shared treatment per cost line.
   - Ability to preserve manual business decisions instead of inferring them from labels.

4. Loss and volume treatment:
   - DNO loss factors and super-red/time-period logic.
   - Local network losses.
   - TLM or settlement-period inputs.
   - Import, export, and generation HH data where relevant.
   - Clear separation between volume evidence and tariff recovery decisions.

5. Reconciliation and auditability:
   - Cost base to tariff output reconciliation.
   - Separate evidence totals for supply/pass-through items that are not tariff-impacting.
   - Visible unresolved, invalid, excluded, and manually overridden rows.
   - Audit trace from each tariff output back to inputs, assumptions, allocation basis, and recovery treatment.

6. Customer-specific methodology variation:
   - Airports, ports, and private networks can require different data shapes.
   - The app should support methodology configuration rather than hardcoded airport or port logic.
   - Any future implementation should introduce explicit contracts before changing calculation behaviour.

## Gaps Against Current MVP

The current MVP is suitable for a controlled internal methodology review, but the workbook review highlights gaps before broader commercial replacement of spreadsheet models:

- Customer data is still simplified compared with tenant/onward supply/customer-reference structures.
- The tariff engine does not yet support full supply tariff integration.
- Supply evidence is visible but remains non-tariff-impacting by design.
- Loss modelling is not yet flexible enough for DNO loss tables, TLM, local network losses, import/export, and generation scenarios.
- Site-specific AUoS/PUoS style local charging is not yet a configurable charge family.
- Formal export/report DTO design remains deferred.
- The app does not yet have a workbook-mapping contract for these varied model layouts.

## Recommended Sequencing

1. Keep the current MVP/supply Phase 2 scope controlled.
2. Prepare a separate `MODEL-001` methodology configuration decision pack before production implementation.
3. Delegate any production calculation changes to Tariff Engine with QA review.
4. Delegate workbook import mapping changes to Data Import with PM review of shared contracts.
5. Keep UI/report changes separate until calculation and data contracts are stable.
6. Use representative workbook-derived scenarios before adding broad imports or automated model replication.

## Immediate Decision

The model review should inform future scope and architecture decisions, but it should not change current tariff, report, storage, import, export, or shared DTO behaviour in this package.
