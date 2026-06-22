# Supply Tariff Integration Decision Pack

Date: 2026-06-22

Status: prepared for business review.

Purpose: define the decisions required before supply annual amounts can feed tariff outputs, reports, or exports.

## Delivery Position

Supply Phase 2 annual amount calculation is merged inside the disconnected supply calculation service.

The service can calculate annual amounts for approved fixed and kVA capacity charge lines, but those values do not currently affect tariff revenue requirement, allocation, customer class outputs, report totals, or export data.

Tariff integration must not start until the decisions below are accepted.

## Decisions Required

| Decision | Required answer | Why it matters | Current status |
| --- | --- | --- | --- |
| Allocation destination | Decide whether supply charges allocate by MPAN, tenant, network level, customer class, or existing allocation methods | Determines how supply costs become customer class tariff outputs | Open |
| Cost recovery treatment | Decide whether supply annual amounts join recoverable network cost pools, remain separate supply tariff lines, or are reported as pass-through only | Avoids double recovery or mixing supply and network methodology | Open |
| Pass-through treatment | Decide whether pass-through supply lines are excluded from recovery, shown separately, or included in indicative tariff outputs | Controls stakeholder reporting and revenue reconciliation | Open |
| Customer class mapping | Decide how MPAN-level supply costs map to customer classes when multiple classes share a site | Prevents arbitrary allocation assumptions | Open |
| Revenue reconciliation | Decide whether supply annual amounts reconcile inside the existing cost-base recovery check or a separate supply reconciliation | Protects auditability and commercial review | Open |
| Report presentation | Decide whether supply annual amounts appear in the MVP report as separate evidence or as tariff-impacting values | Avoids changing stakeholder report meaning by accident | Open |
| Export contract | Decide whether supply integration requires a machine-readable DTO before external release | Prevents premature export schema changes | Open |

## Recommended Integration Approach

Recommended starting point:

- Keep supply annual amounts separate from existing network cost pools.
- Add a supply-specific reconciliation view or evidence table before tariff-impacting integration.
- Do not include pass-through lines in recoverable tariff revenue.
- Do not feed supply values into `calculateTariffs` until customer class mapping is explicit.
- Treat report display as evidence first, not as a formal export contract.

This approach preserves the current tariff methodology while allowing commercial review of supply charges.

## Explicitly Out Of Scope Until Approved

- Adding supply annual amounts to `CostPoolRow`.
- Changing `calculateTariffs` revenue requirement.
- Changing tariff class output rates.
- Changing revenue recovery status.
- Changing report totals.
- Adding export DTO fields.
- Changing import parsers or storage schema.

## Minimum Approval To Start Implementation Proposal

Before Tariff Engine can propose implementation, the user must answer:

1. Should supply annual amounts affect customer tariffs now, or remain evidence-only?
2. If tariff-impacting, what is the allocation destination?
3. Should pass-through supply lines be excluded from recovery?
4. Should supply reconciliation be separate from network cost recovery?
5. Should reports show supply values as evidence only or as tariff-impacting totals?

## Next Package If Approved

Owner: Tariff Engine for calculation semantics, UI Flow for display only after contract approval, QA for regression evidence, PM for merge sequencing.

Expected proposal files:

- `docs/APP_CONTRACTS.md`
- `types/project.ts` only if shared result contracts are approved
- `lib/calculation-engine.ts` only if tariff outputs are approved to change
- `components/ReportsSummary.tsx` only if report presentation is approved
- focused tests for any approved calculation/report behavior

No implementation branch should start until this decision pack is accepted or amended.
