# Supply Tariff Integration Decision Pack

Date: 2026-06-22

Status: decision answers approved; implementation proposal still required.

Purpose: define the decisions required before supply annual amounts can feed tariff outputs, reports, or exports.

## Delivery Position

Supply Phase 2 annual amount calculation is merged inside the disconnected supply calculation service.

The service can calculate annual amounts for approved fixed and kVA capacity charge lines, but those values do not currently affect tariff revenue requirement, allocation, customer class outputs, report totals, or export data.

Tariff integration must not start until a separate implementation proposal is prepared and approved.

Related calculation-rule decisions are recorded in `docs/SUPPLY_RULE_DECISIONS.md`.

The approved integration answers are recorded in `docs/SUPPLY_INTEGRATION_DECISION_ANSWER.md`.

## Decisions Required

| Decision | Required answer | Why it matters | Current status |
| --- | --- | --- | --- |
| Allocation destination | Decide whether supply charges allocate by MPAN, tenant, network level, customer class, or existing allocation methods | Determines how supply costs become customer class tariff outputs | Approved: no allocation into customer class tariffs until customer applicability is explicit |
| Cost recovery treatment | Decide whether supply annual amounts join recoverable network cost pools, remain separate supply tariff lines, or are reported as pass-through only | Avoids double recovery or mixing supply and network methodology | Approved: keep separate from recoverable network cost pools |
| Pass-through treatment | Decide whether pass-through supply lines are excluded from recovery, shown separately, or included in indicative tariff outputs | Controls stakeholder reporting and revenue reconciliation | Approved: exclude from recoverable tariff revenue and show separately |
| Customer class mapping | Decide how MPAN-level supply costs map to customer classes when multiple classes share a site | Prevents arbitrary allocation assumptions | Approved: explicit customer applicability required before tariff-impacting integration |
| Revenue reconciliation | Decide whether supply annual amounts reconcile inside the existing cost-base recovery check or a separate supply reconciliation | Protects auditability and commercial review | Approved: separate supply reconciliation |
| Report presentation | Decide whether supply annual amounts appear in the MVP report as separate evidence or as tariff-impacting values | Avoids changing stakeholder report meaning by accident | Approved: evidence-only until tariff impact is separately approved |
| Export contract | Decide whether supply integration requires a machine-readable DTO before external release | Prevents premature export schema changes | Approved: no export DTO change for MVP |

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

## Approved Answers Before Implementation Proposal

The user approved the following on 2026-06-22:

1. Supply annual amounts remain evidence-only for now.
2. Supply does not allocate into customer class tariffs until customer applicability is explicit.
3. Pass-through supply lines are excluded from recoverable tariff revenue and shown separately.
4. Supply reconciliation is separate from network cost recovery.
5. Reports show supply values as evidence-only until tariff impact is separately approved.
6. Each supply charge must have an explicit customer applicability rule before tariff-impacting integration.
7. The current Phase 2 `per day` calculation moves to actual billing-period days only in a separate approved implementation package.

## Future Implementation Proposal Files If Later Approved

The immediate next package remains a docs-only decision answer record. The files below become candidates only after the user accepts or amends the open integration decisions.

Owner: Tariff Engine for calculation semantics, UI Flow for display only after contract approval, QA for regression evidence, PM for merge sequencing.

Expected proposal files:

- `docs/APP_CONTRACTS.md`
- `types/project.ts` only if shared result contracts are approved
- `lib/calculation-engine.ts` only if tariff outputs are approved to change
- `components/ReportsSummary.tsx` only if report presentation is approved
- focused tests for any approved calculation/report behavior

No implementation branch should start until this decision pack is accepted or amended.
