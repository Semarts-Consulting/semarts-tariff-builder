# MVP Candidate Sign-Off Pack

Date: 2026-06-22

Status: accepted with limitations for internal MVP candidate.

Sign-off owner: user.

## Internal MVP Candidate Decision

Decision: accepted with limitations.

Decision date: 2026-06-22.

Decision basis:

- The representative scenario reconciles tariff outputs to the recoverable cost base.
- The calculation workflow shows tariff outputs, allocation method, key assumptions, validation status, revenue recovery, and audit trace.
- The manual demo path from inputs to allocation, calculation, audit trace, output, and report view has been accepted by the user.
- Local lint, type-check, test, and production build evidence has been recorded in the PM control log.

Accepted limitations:

- The decision is for an internal MVP candidate, not an external release commitment.
- Formal machine-readable export DTOs remain outside MVP scope.
- Formal report/export audit trace remains post-MVP or MVP+.
- Supply calculation remains deferred until business assumptions are resolved.
- The representative test scenario covers one site and does not replace broader regression or stakeholder-specific scenario testing.
- Browser print/PDF and rendered HTML download remain stakeholder report outputs, not stable export data contracts.

Next action: prepare stakeholder-demo materials and a concise limitation summary, or split any review feedback into narrow fix packages.

Limitations closeout is tracked in `docs/MVP_LIMITATIONS_CLOSEOUT.md`.

## Purpose

This pack supports review of whether the MVP tariff methodology workflow is commercially defensible for an internal candidate release.

The sign-off question is not only whether tests pass. The question is whether a commercial reviewer can understand:

- The source inputs.
- The cost base.
- The allocation method by cost category.
- The tariff build-up by customer group.
- The reconciliation from recoverable cost to tariff outputs.
- Any assumptions, warnings, limitations, or known calculation risks.

## Representative Scenario

Scenario name: MVP candidate private network tariff review.

Scope:

- One private electricity network site.
- Three customer groups: Residential, Small business, Common area.
- Recoverable electricity network cost base.
- Fixed standing charge, consumption charge, capacity charge, and direct pass-through charge.
- Clear allocation basis by cost category.
- Full recovery of the recoverable cost base.

## Input Summary

| Customer group | Customers | Annual kWh | Peak demand kW |
| --- | ---: | ---: | ---: |
| Residential | 80 | 160,000 | 320 |
| Small business | 15 | 120,000 | 240 |
| Common area | 5 | 20,000 | 40 |
| Total | 100 | 300,000 | 600 |

## Recoverable Cost Base

| Cost category | Annual amount | Recoverable % | Recoverable cost | Tariff component | Allocation basis |
| --- | ---: | ---: | ---: | --- | --- |
| Standing network operations | GBP 12,000 | 100% | GBP 12,000 | Fixed | Customer count |
| Consumption-related network costs | GBP 18,000 | 100% | GBP 18,000 | Energy | Annual kWh |
| Capacity-related network costs | GBP 9,000 | 100% | GBP 9,000 | Demand | Peak demand |
| Direct electricity pass-through | GBP 6,000 | 100% | GBP 6,000 | Pass-through | Annual kWh |
| Total | GBP 45,000 |  | GBP 45,000 |  |  |

## Expected Tariff Outputs

| Customer group | Allocated cost | Fixed charge / customer | Energy charge / kWh | Demand charge / kW |
| --- | ---: | ---: | ---: | ---: |
| Residential | GBP 27,200 | GBP 120.00 | GBP 0.0800 | GBP 15.00 |
| Small business | GBP 15,000 | GBP 120.00 | GBP 0.0800 | GBP 15.00 |
| Common area | GBP 2,800 | GBP 120.00 | GBP 0.0800 | GBP 15.00 |
| Total | GBP 45,000 |  |  |  |

## Reconciliation

| Measure | Expected |
| --- | ---: |
| Revenue requirement | GBP 45,000 |
| Allocated cost | GBP 45,000 |
| Unallocated cost | GBP 0 |
| Revenue recovered | Yes |
| Validation issues | None |
| Unbalanced allocations | 0 |

The automated MVP candidate scenario test verifies these values using `calculateTariffs`.

## Audit Trace Expectations

The calculation workflow must show enough audit trace for commercial review:

- Revenue requirement trace for each cost pool.
- Cost allocation trace showing cost pool, allocation method, customer group, percentage, component, and allocated GBP.
- Rate derivation trace for fixed, energy including pass-through, and demand rates.
- Revenue recovery trace showing recoverable cost less allocated cost.

Formal report/export audit trace remains post-MVP or MVP+ unless delivered without delaying the core calculation workflow.

## Review Checklist

The user should confirm:

- Methodology logic is commercially defensible for the representative scenario.
- Allocation basis by cost category is understandable and acceptable.
- Tariff build-up explains fixed, energy, demand, and pass-through components.
- Revenue recovery reconciles to the recoverable cost base.
- Missing or invalid data is surfaced as validation issues rather than silently corrected.
- Default-created allocation methods are flagged for review before approval.
- Audit trace is visible in the calculation workflow and linked to tariff outputs.
- Supply calculation remains deferred and is not implied to be production-ready.

## Known Limitations

- This scenario validates one representative site only.
- Formal machine-readable export DTOs are out of MVP scope.
- Formal report/export audit trace is not required for first MVP unless added with low risk.
- Supply calculation is deferred pending business decisions in `SUPPLY_CALCULATION_DESIGN.md`.
- Browser print/PDF and rendered HTML download are stakeholder report outputs, not a stable export data contract.
- Local/cloud storage reconciliation failure cases still need broader coverage.
- Broader UI/browser regression evidence is still required before treating the workflow as externally release-ready.

## Required Evidence Before Internal MVP Candidate

- Lint passes.
- Type-check passes.
- Full tests pass.
- Production build passes.
- Representative scenario reconciliation test passes.
- Demo path has been walked through from inputs to calculation, audit trace, and report view.
- Limitations above are accepted for internal MVP.
