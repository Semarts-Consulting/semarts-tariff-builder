# MVP Demo Rehearsal Notes

Date: 2026-06-22

Status: prepared.

Purpose: provide a short rehearsal script for presenting the accepted-with-limitations internal MVP candidate.

## Opening Position

Use this opening:

> This is an internal MVP candidate for the tariff methodology workflow. It has been accepted with limitations for internal review. The purpose of this demo is to show that the input, allocation, tariff calculation, audit trace, output, and reconciliation are understandable for commercial review.

Do not describe the workflow as externally release-ready.

## Rehearsal Script

1. Start with the project context.
   - Confirm this is a private electricity network tariff methodology example.
   - Confirm the demo project is a representative internal scenario.

2. Show the input base.
   - Customer groups.
   - Customer counts.
   - Annual consumption.
   - Peak demand.

3. Show the recoverable cost base.
   - Cost pools.
   - Recoverable percentages.
   - Total recoverable cost.

4. Show allocation methods.
   - Allocation basis by cost category.
   - Customer group shares.
   - Any review indicators.

5. Show tariff outputs.
   - Fixed standing charge.
   - Energy charge.
   - Demand charge where supported.
   - Direct pass-through charge where supported.

6. Show audit trace.
   - Revenue requirement trace.
   - Cost allocation trace.
   - Rate derivation trace.
   - Revenue recovery trace.

7. Show reconciliation.
   - Recoverable cost base.
   - Allocated output.
   - Variance and recovery status.

8. Show report view.
   - Explain this is a stakeholder-reviewable report view.
   - Show that submeter, loss, Utilityhub hierarchy, asset, supply and methodology-cost evidence are labelled as evidence-only where they do not yet drive tariff totals.
   - Confirm the tariff-driving path remains aggregate customer inputs, approved recoverable cost pools, allocation methods, and tariff calculation outputs.
   - State that formal machine-readable export DTOs remain outside MVP scope.

9. Close with limitations and asks.
   - Confirm accepted limitations.
   - Ask for feedback on methodology defensibility, review clarity, and next-priority fixes.

## Expected Audience Questions

| Question | Response |
| --- | --- |
| Is this production-ready? | No. It is an internal MVP candidate accepted with limitations. |
| Does this certify Ofgem compliance? | No. It supports transparent methodology review; formal compliance sign-off remains a business/legal process. |
| Are exports complete? | No. The current report view is stakeholder-reviewable, but formal export DTOs are outside MVP scope. |
| Is supply calculation complete? | No. Supply evidence and p/kWh application are visible, but tariff-impacting supply integration remains controlled by approved business rules. |
| Do submeter and loss records drive tariff rates? | Not automatically. They are visible as reconciliation and readiness evidence until tariff-impacting use is approved. |
| Do asset and methodology cost rows create tariff cost pools? | No. They support commercial review and future mapping decisions; current tariff totals still come from approved cost pools and allocations. |
| Are all tariff scenarios covered? | No. The current evidence covers one representative internal scenario. |
| Can the calculation be traced? | Yes. The calculation workflow includes audit trace entries linked to tariff outputs. |

## Rehearsal Acceptance Criteria

The rehearsal is acceptable if the presenter can clearly explain:

- What data went in.
- Which costs are recoverable.
- How each cost category is allocated.
- How each tariff output is built up.
- Whether revenue recovery reconciles.
- Where audit trace can be inspected.
- Which evidence sections are tariff-impacting and which are evidence-only.
- Which limitations remain.

## Decisions Or Support To Request

- Confirm whether the next priority is stakeholder-demo delivery or narrow fixes.
- Confirm which additional tariff scenarios should be added after the internal MVP candidate.
- Confirm the business policy for supply calculation before any production implementation starts.
- Confirm whether formal export DTOs are needed for the next commercial milestone.
