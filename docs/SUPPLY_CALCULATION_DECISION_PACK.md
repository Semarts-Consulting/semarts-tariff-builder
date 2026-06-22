# Supply Calculation Decision Pack

Date: 2026-06-22

Status: Phase 1 normalisation merged; production annual amounts and tariff integration remain blocked.

Purpose: define the business decisions required before supply calculation can move from design note to production calculation service.

## Delivery Position

Supply calculation is not part of the approved MVP calculation workflow yet. The current tariff workflow can calculate and explain tariff outputs from customer classes, cost pools, allocation methods, and audit trace evidence.

Phase 1 normalisation is implemented in `lib/supply-calculation-engine.ts` as a disconnected pure service. It normalises rows, converts rates, and flags unresolved cases, but it does not calculate annual amounts or feed tariffs.

Supply calculation should stay separate until the questions below are answered. Do not add shared production DTOs, report fields, tariff-engine integration, or annual amount calculation until the relevant decision group is signed off.

## Decision Groups

| Group | Decision required | Owner | Blocks Phase 1 normalisation? | Blocks annual amount calculation? | Blocks tariff integration? |
| --- | --- | --- | --- | --- | --- |
| Losses basis | Define `CM`, `GSP`, and `NBP`; decide source volume and adjustment direction | User plus Tariff Engine | No, if preserved only | Yes | Yes |
| Capacity conversion | Define kVA to kW conversion and power factor for TNUoS triad | User plus Tariff Engine | No, if flagged `Needs business rule` | Yes | Yes |
| Time bands | Define DUoS red/amber/green/super red mapping source and tariff-year/DNO variability | User plus Tariff Engine | No, if preserved only | Yes | Yes |
| Annualisation | Decide day/month/year calculation basis for fixed and capacity charges | User plus Tariff Engine | No, if status is explicit | Yes | Yes |
| Allocation destination | Decide whether supply charges allocate by MPAN, tenant, network level, or customer class | User plus PM/Tariff Engine | No | No | Yes |
| Pass-through treatment | Decide whether pass-through lines are excluded from recovery or reported separately | User plus PM/Tariff Engine | No | No | Yes |
| Input validity | Decide whether blank charge names and incompatible time-of-use options block calculation | User plus Data/Engine | Yes | Yes | Yes |
| Custom time windows | Decide bank holiday semantics and whether windows may cross midnight | User plus Tariff Engine | No, if preserved only | Yes | Yes |

## Safe Phase 1 Scope

Phase 1 has proceeded only as a normalisation layer. Its implemented scope is to:

- Converts supply input rows into normalised charge lines.
- Preserves MPAN, source row, charge, voltage, losses basis, time-of-use, and custom time-of-use references.
- Converts rate units from pence to pounds.
- Validates obvious invalid inputs such as negative rates and invalid MPAN length.
- Marks unresolved calculation cases as `Needs business rule` or `Needs volume data`.
- Does not feed values into `calculateTariffs`.
- Does not change stakeholder report totals.
- Does not imply supply charges are production-ready.

## Blocked Production Scope

Do not implement these until the relevant decisions are signed off:

- Loss-adjusted volumes.
- TNUoS triad annual amounts.
- DUoS time-band annual amounts.
- Per-day and per-month annualisation.
- Supply charge allocation into customer classes.
- Pass-through recovery treatment in tariff outputs.
- Report/export DTO fields for supply calculation results.

## Sign-Off Checklist

Before production implementation starts, record answers for:

1. What `CM`, `GSP`, and `NBP` mean in the workbook methodology.
2. Which input volume each losses basis uses.
3. Whether loss adjustments are additive, multiplicative, or already embedded.
4. How kVA converts to kW for TNUoS triad.
5. What power factor is used, if any.
6. How DUoS time bands are derived.
7. Whether DUoS time bands are national, DNO-specific, tariff-year-specific, or workbook-configured.
8. Whether `per day` uses 365, 366, tariff-period days, or billing-period days.
9. Whether `per Month` uses 12, actual billing months, or project billing frequency.
10. How supply charges map to customer classes or pass-through reporting.
11. Whether blank charge names block calculation.
12. Which time-of-use options are valid by charge type.
13. How Day/Night maps, if at all, to red/amber/green/super red.
14. How bank holidays interact with custom time-of-use rules.
15. Whether custom time windows can cross midnight.

## Recommended Next Step

Ask the user and Tariff Engine to resolve the annual amount and tariff integration decision groups before any Phase 2 implementation branch is opened. The next proposal should list exact business-rule answers, files, types, test cases, and integration boundaries.
