# Supply Integration Decision Answer

Date: 2026-06-22

Status: approved by user.

Purpose: record the approved answers to the supply tariff integration decision gate before any production implementation proposal is prepared.

## Approved Decision Set

| Decision | Approved answer |
| --- | --- |
| Supply impact on tariffs | Supply annual amounts remain evidence-only for now. |
| Allocation destination | Do not allocate supply into customer class tariffs until customer applicability is explicit. |
| Customer applicability | Every supply charge must have an explicit customer applicability rule before tariff-impacting integration. |
| Cost recovery treatment | Supply remains separate from recoverable network cost pools. |
| Pass-through treatment | Pass-through charges are excluded from recoverable tariff revenue and shown separately. |
| Reporting category | Every supply charge must have a reporting category before report integration. |
| Revenue reconciliation | Supply reconciliation is separate from network cost recovery. |
| Report presentation | Reports show supply as evidence-only until tariff impact is separately approved. |
| Export contract | Export DTOs remain unchanged for MVP. |
| Daily annualisation | Actual billing-period daily annualisation is a separate approved implementation package, not part of supply tariff integration. |

## Immediate Implementation Boundary

The next production proposal, if prepared, must be limited to evidence-only supply presentation and separate supply reconciliation.

It must not:

- alter tariff rates;
- alter network revenue recovery;
- add supply annual amounts to recoverable network cost pools;
- change report totals;
- change imports;
- change storage;
- add or change export DTO fields;
- change shared project DTOs unless a separate contract proposal is approved.

## Remaining Required Proposal Before Coding

Before implementation starts, Tariff Engine must provide a proposal that states:

- the exact production files to change;
- the exact tests to add or update;
- how evidence-only supply values will be presented without changing tariff outputs;
- how separate supply reconciliation will be calculated and displayed;
- how customer applicability and reporting category will be represented without changing shared DTOs unless separately approved;
- how pass-through values will be excluded from recoverable tariff revenue.

QA should review the proposal before coding because this affects stakeholder-facing evidence and calculation confidence.

PM should confirm no tariff-impacting integration, report total change, import change, storage change, export DTO change, or unrelated UI change is included.

## Separate Follow-Up

Billing-period daily annualisation is approved as a separate future package. It should not be implemented as part of evidence-only supply integration unless explicitly brought into scope by a later proposal.
