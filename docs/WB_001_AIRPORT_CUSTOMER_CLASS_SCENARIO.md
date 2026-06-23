# WB-001 Airport Customer-Class Scenario Fixture Proposal

Date: 2026-06-22

Status: scenario fixture proposal approved for test-only implementation.

## Purpose

This proposal defines the first narrow workbook-derived scenario for future fixture and regression coverage.

The scenario is based on BRS/STN-style airport tariff model patterns and is intended to prove that airport customer classes, onward supply evidence, meter counts, capacity, consumption, and local charging evidence can be represented without hardcoding airport-specific methodology into the application.

This package does not approve fixtures, tests, imports, calculation changes, storage changes, shared DTO changes, report changes, export changes, or UI changes.

## Source Model Pattern

Representative airport workbooks include sheets or sections similar to:

- Tariff summary or tariff build-up.
- Selections and model assumptions.
- Half-hourly import data.
- Onward supply data.
- Customer or meter lists.
- Asset data.
- Forecast energy and supply costs.
- AUoS, local use-of-system, or network charge evidence.
- Losses, TLM, DNO losses, or super-red evidence.

The future fixture should use synthetic values only. It should not copy real customer data or rely on a full workbook replica.

## Scenario Objective

The scenario should let a commercial reviewer trace:

1. Source workbook pattern.
2. Synthetic customer-class inputs.
3. Recoverable cost base.
4. Allocation basis by cost category.
5. Tariff output expectation.
6. Reconciliation between recoverable cost and expected recovery.
7. Evidence-only values that must not affect tariffs.
8. Low-confidence or unresolved source mappings that must not silently feed tariff-impacting calculations.

## Proposed Customer Structure

The fixture should represent one airport private electricity network with three customer classes.

| Customer class | Meter count | Capacity kVA | Annual kWh | Source mapping confidence | Notes |
| --- | ---: | ---: | ---: | --- | --- |
| Terminal retail | 12 | 1,500 | 2,400,000 | High | Represents concession or retail-style onward supply customers. |
| Airside operations | 4 | 3,000 | 8,000,000 | Medium | Represents high-volume operational users where workbook rows may require aggregation. |
| EV charging | 2 | 1,000 | 1,200,000 | Medium | Represents a distinct customer class with clear consumption and capacity evidence. |

These labels are illustrative. The future app design should support configurable customer classes rather than airport-specific labels.

## Proposed Charge Families

| Charge family | Example source pattern | Proposed treatment for WB-001 |
| --- | --- | --- |
| Fixed network cost | Meter/customer count, standing charge, customer administration | Recoverable tariff input. |
| Consumption network cost | Annual kWh, forecast consumption, usage allocation | Recoverable tariff input. |
| Capacity network cost | Agreed capacity, kVA, maximum import capacity | Recoverable tariff input if already supported by the calculation engine. |
| AUoS or local network evidence | Airport local network charge evidence or use-of-system evidence | Evidence-only unless a later approved package makes it tariff-impacting. |
| Supply costs | Forecast energy, supplier pass-through, supply calculation evidence | Evidence-only for this scenario unless separately approved. |
| Losses or TLM evidence | Loss factors, TLM evidence, DNO losses | Evidence-only for this scenario. Loss implementation is out of scope. |
| Unresolved workbook mapping | Ambiguous rows, weak headers, unmapped workbook values | Must be visible and excluded from tariff-impacting values. |

## Proposed Cost Base

The fixture should keep values small enough for manual review.

| Cost line | Annual value | Recovery treatment | Allocation basis | Expected handling |
| --- | ---: | --- | --- | --- |
| Network asset annuity | 180,000 | Recoverable | Capacity kVA | Included in tariff recovery target. |
| Network maintenance | 90,000 | Recoverable | Annual kWh | Included in tariff recovery target. |
| Customer administration | 36,000 | Recoverable | Meter count | Included in tariff recovery target. |
| AUoS/local network evidence | 42,000 | Evidence-only | Annual kWh | Shown as evidence, not included in tariff recovery target. |
| Supplier pass-through evidence | 75,000 | Evidence-only or pass-through | Direct evidence | Shown separately, not included in network tariff recovery target. |
| Unresolved workbook row | 8,500 | Excluded pending review | None | Visible validation issue; must not feed tariff-impacting outputs. |

The proposed recoverable network cost base is 306,000.

## Expected Future Fixture Result

If approved for fixture implementation, the scenario should prove:

- Recoverable tariff revenue target equals 306,000.
- Evidence-only and excluded rows do not change tariff outputs or network revenue recovery.
- Allocation bases are visible by cost line.
- Customer-class denominators are derived from synthetic meter count, capacity, and consumption inputs.
- Any low-confidence or unresolved workbook source mapping produces a reviewable issue.
- Audit evidence links tariff outputs back to cost line, allocation basis, and customer class.

This proposal intentionally does not set final tariff rates. A later fixture implementation package should calculate and document exact expected outputs after Tariff Engine and QA review.

## Validation Expectations

Future tests or implementation should check that:

- Low-confidence or unresolved mappings cannot silently feed tariff-impacting calculations.
- Missing denominator data is surfaced as a validation issue.
- Evidence-only values remain outside tariff revenue recovery.
- Pass-through or evidence-only treatment is explicit and reviewable.
- Customer classes are configurable and not hardcoded to airport labels.

## Required Reviews Before Implementation

Before creating fixtures or tests from this proposal:

- PM must confirm the package remains within approved scope.
- Tariff Engine must confirm whether capacity charging is supported by the current calculation contract.
- Data Import must confirm whether the source mapping expectations are compatible with the workbook source mapping proposal.
- QA must confirm expected regression evidence and tolerance for manual reconciliation.
- User sign-off owner must confirm the scenario is commercially representative enough for review.

## Explicitly Out Of Scope

This proposal does not approve:

- New test fixtures.
- New workbook import parsing.
- New methodology profile types.
- Calculation engine changes.
- Storage changes.
- Report totals changes.
- Export DTO changes.
- Shared project DTO changes.
- UI changes.
- Supply tariff integration.
- Loss, TLM, or generation/export calculation implementation.

## Recommended Next Package

The narrow `WB-001` fixture/test implementation proposal is recorded in `docs/WB_001_FIXTURE_IMPLEMENTATION_PROPOSAL.md`.

The next package should add the test-only fixture and regression test without changing production calculation, import, storage, report, export, shared DTO, or UI behaviour.
