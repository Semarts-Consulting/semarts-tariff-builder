# Supply Integration Open Decisions

Date: 2026-06-22

Status: answered by user; see `docs/SUPPLY_INTEGRATION_DECISION_ANSWER.md`.

Purpose: convert the remaining supply tariff integration blockers into clear business choices before any supply annual amounts affect tariff outputs, report totals, exports, imports, storage, or shared DTOs.

## Current Position

Supply Phase 2 annual amounts are implemented only inside the disconnected supply calculation service.

The service can calculate annual amounts for approved fixed and kVA capacity lines, but those values do not currently feed:

- recoverable network cost pools;
- customer class tariff outputs;
- revenue recovery checks;
- report totals;
- export data;
- imports or storage.

This separation remains correct until an approved implementation proposal is prepared and merged. The decision answers are recorded in `docs/SUPPLY_INTEGRATION_DECISION_ANSWER.md`.

## Decision Set

| Decision | Recommended MVP answer | Alternative answers | Risk if unclear |
| --- | --- | --- | --- |
| Supply impact on tariffs | Keep supply annual amounts evidence-only for now | Add tariff-impacting supply lines now | Prematurely changes tariff revenue requirement and stakeholder meaning |
| Allocation destination | Do not allocate supply to customer classes until a customer applicability model is agreed | Allocate by MPAN, tenant, customer class, network level, or existing allocation methods | Arbitrary allocation could overcharge or undercharge customer groups |
| Customer applicability | Add an explicit applicability rule per supply charge before integration | Treat all charges as applying to all customers | Incorrect charging where supply costs belong to a subset |
| Cost recovery treatment | Keep supply separate from recoverable network cost pools | Join recoverable cost base or blend into existing tariffs | Double recovery or mixing supply and network methodology |
| Pass-through treatment | Add a pass-through flag and show pass-through evidence separately | Include pass-through values in indicative tariff outputs | Pass-through costs may be mistaken for recoverable network tariffs |
| Reporting category | Require a reporting category per supply charge | Infer categories from charge names | Weak audit trail and inconsistent stakeholder presentation |
| Revenue reconciliation | Reconcile supply separately from network cost recovery | Include supply in the existing revenue recovery status | Existing network reconciliation could become misleading |
| Report presentation | Show supply as evidence-only until tariff impact is approved | Show as tariff-impacting totals | Report may imply approved methodology changes |
| Export contract | Keep export DTO unchanged for MVP | Add supply fields now | External contract changes before methodology is settled |
| Daily annualisation | Decide whether to replace the Phase 2 365-day rule with actual billing-period days | Keep 365-day annualisation for all annual amount modelling | Current implementation and recorded business preference diverge |

## Minimum User Answers Needed

Before a production integration proposal can start, the user should answer:

1. Should supply annual amounts remain evidence-only, or should they affect customer tariffs?
2. If tariff-impacting, which customer or class receives each supply charge?
3. Should each charge carry an explicit customer applicability rule?
4. Should pass-through supply charges be excluded from recoverable tariff revenue?
5. Should supply reconciliation remain separate from network cost-base recovery?
6. Should reports show supply as evidence-only or tariff-impacting totals?
7. Should the current Phase 2 `per day` calculation be changed from 365 days to actual billing-period days?

## Suggested Decision Response

The recommended MVP-safe response is:

| Decision | Suggested answer |
| --- | --- |
| Supply impact on tariffs | Evidence-only for now. |
| Allocation destination | Do not allocate into customer class tariffs until customer applicability is explicit. |
| Customer applicability | Required for every supply charge before tariff-impacting integration. |
| Cost recovery treatment | Keep separate from recoverable network cost pools. |
| Pass-through treatment | Exclude from recoverable tariff revenue and show separately. |
| Reporting category | Required for every supply charge before report integration. |
| Revenue reconciliation | Separate supply reconciliation from network cost recovery. |
| Report presentation | Evidence-only until tariff impact is separately approved. |
| Export contract | No export DTO change for MVP. |
| Daily annualisation | Replace the Phase 2 365-day rule with actual billing-period days only in a separate approved implementation package. |

Accepted by user on 2026-06-22. The next production proposal should be limited to evidence-only supply presentation and separate supply reconciliation. It should not alter tariff rates, network revenue recovery, report totals, imports, storage, or exports.

## Recommended Next Safe Package

Recommended package: supply integration decision answer record.

Owner: PM plus user sign-off owner.

Scope:

- record accepted answers to the questions above;
- update `docs/SUPPLY_TARIFF_INTEGRATION_DECISION_PACK.md`;
- update manager control docs;
- do not change production code.

Only after that package is merged should Tariff Engine prepare a production implementation proposal.

## Acceptance Criteria For The Decision Answer Record

The decision answer record is ready only when it:

- states whether supply annual amounts remain evidence-only or become tariff-impacting;
- states how customer applicability will be captured for each supply charge;
- states whether pass-through charges are excluded from recoverable tariff revenue;
- states whether supply reconciliation is separate from network cost recovery;
- states whether reports show supply as evidence-only or tariff-impacting;
- states whether export DTOs remain unchanged for MVP;
- states whether actual billing-period daily annualisation is approved as a separate implementation package;
- confirms no production code, imports, storage, exports, report totals, or shared DTOs are changed in the decision package.

The answer set is complete. Production implementation remains blocked until a separate implementation proposal is prepared and approved.

## Explicitly Not Approved

This document does not approve:

- adding supply annual amounts to `CostPoolRow`;
- changing `calculateTariffs`;
- changing customer class tariff outputs;
- changing revenue recovery status;
- changing report totals;
- changing import parsers;
- changing storage schema;
- adding export DTO fields.
