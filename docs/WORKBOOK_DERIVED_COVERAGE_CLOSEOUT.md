# Workbook-Derived Coverage Closeout

Date: 2026-06-22

Status: no-Git working-tree closeout.

## Summary

Workbook-derived coverage has been expanded through documentation and test-only packages.

No production tariff calculation, import parser, storage, export, shared DTO, report total, or UI behaviour has been changed.

## Completed Test-Only Coverage

| Scenario | Coverage Added | Production Impact |
| --- | --- | --- |
| WB-001 airport customer classes | Proves a representative airport customer-class scenario reconciles through the existing tariff engine. | None. Uses existing customer class, cost pool, allocation, and demand paths. |
| WB-002 TLM/local losses evidence | Proves loss-adjusted evidence does not uplift `annualKwh` passed to tariff calculations. | None. Loss evidence remains local fixture metadata. |
| WB-003 port tenant recovery forecast | Proves tenant forecasts and recovery evidence do not automatically become tariff customer classes, cost pools, or revenue requirements. | None. Tenant recovery evidence remains local fixture metadata. |
| WB-004 generation/export evidence | Proves generation/export volumes and credit evidence do not net consumption, reduce recoverable cost, or change revenue requirement. | None. Generation/export evidence remains local fixture metadata. |
| WB-005 asset-cost allocation | Proves only approved chargeable electrical distribution asset annual amounts feed tariff cost pools. | None. Asset evidence remains local fixture metadata and no asset valuation logic is introduced. |
| WB-006 weak mapping confidence | Proves low-confidence, unresolved, evidence-only, and manual-review workbook rows do not feed tariff inputs. | None. Mapping evidence remains local fixture metadata. |

## Completed Proposal-Only Coverage

| Scenario | Status | Reason Implementation Is Gated |
| --- | --- | --- |
| _None_ |  |  |

## Validation Evidence

Latest no-Git working-tree validation:

- `npm.cmd run lint`: passed.
- `npx.cmd tsc --noEmit --incremental false`: passed.
- `npm.cmd test`: passed, 19 test files and 126 tests.
- `npm.cmd run build`: passed.

## Remaining Business Decisions

Before production implementation, the owner should decide:

1. Whether TLM/local losses should ever affect tariff billing volumes.
2. Whether generation/export values should net consumption or create export credits.
3. How tenant references map to tariff classes and recovery schedules.
4. Which production asset categories are chargeable through electricity tariffs.
5. Whether medium-confidence workbook mappings may feed calculations after review.
6. How unresolved workbook evidence should affect report readiness.

## Recommended Commit Grouping

When Git is available, split the working-tree changes into reviewable groups:

1. WB-001 fixture implementation proposal and regression.
2. WB-002 TLM/local losses evidence proposal and regression.
3. WB-004 generation/export evidence proposal and regression.
4. WB-006 weak mapping confidence proposal and regression.
5. WB-003 and WB-005 proposal-only documents.
6. Report readiness non-ready HTML regression.
7. Manager control and long-run closeout docs.

## Recommended Next Delivery Phase

Do not move straight into production implementation.

Recommended next phase:

1. Review this closeout and the individual scenario documents.
2. Prepare a decision pack for production workbook source mapping now that workbook-derived test-only coverage is complete.
