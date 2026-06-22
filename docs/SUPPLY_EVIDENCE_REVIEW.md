# Supply Evidence Review

Date: 2026-06-22

Status: reviewed and accepted as evidence-only.

## Scope Reviewed

This review covers the supply evidence presentation and reconciliation added through PR #43 and the implementation closeout recorded through PR #44.

Reviewed files:

- `components/ReportsSummary.tsx`
- `lib/supply-calculation-engine.ts`
- `tests/report-readiness.test.tsx`
- `tests/fixtures/report-readiness.ts`
- `tests/supply-calculation-engine.test.ts`

Out of scope:

- Tariff-impacting supply integration.
- Billing-period daily annualisation.
- Storage, imports, exports, shared DTOs, or formal report total changes.
- Customer applicability inference from supply charge names.

## Review Findings

- The report presents supply content under a separate `Supply evidence only` section.
- The report explicitly labels the section `Not tariff-impacting`.
- The report states that supply evidence does not change network revenue requirement, recoverable cost, revenue recovery, or tariff rates.
- Supply evidence is derived from existing methodology inputs through the disconnected supply calculation service.
- `reconcileSupplyEvidence` groups annual amounts into fixed recovery, pass-through, unresolved, invalid, and excluded evidence buckets.
- Pass-through supply rows remain visible as evidence and are not included in fixed recovery evidence totals.
- Unresolved and invalid supply rows remain visible rather than being inferred or silently corrected.
- Regression tests cover the service-level reconciliation and the report-level evidence presentation.

## Boundary Confirmation

The reviewed implementation does not change:

- `calculateTariffs` tariff outputs.
- Network revenue recovery or recoverable cost totals.
- Project storage.
- Import parsing.
- Export or download DTOs.
- Shared project DTOs.
- Billing-period daily annualisation.

## Evidence

Latest checks recorded for the supply evidence implementation:

- Lint passed.
- Type-check passed.
- Full test suite passed: 16 test files and 98 tests.
- Production build passed.

## Remaining Risks

- Customer applicability and reporting category are still not represented by a shared contract.
- Billing-period daily annualisation remains a separate follow-up and should not be folded into evidence review.
- Supply evidence is stakeholder-readable but is not a formal export DTO.
- A manual browser check of the report page remains useful before any external stakeholder walkthrough.

## Next Safe Follow-Up

1. Complete a short manual report-page check for the supply evidence section.
2. Keep tariff-impacting supply integration blocked until a separate proposal is approved.
3. Treat billing-period daily annualisation as a separate `SUP-003` package.
