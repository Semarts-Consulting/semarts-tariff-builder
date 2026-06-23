# Consumption Profiling Decision Pack

## Purpose

Monthly, quarterly and annual consumption may need to support allocation or reconciliation before half-hourly data is available. Profiling those records into settlement periods can materially affect tariff allocation, so it must be treated as a methodology decision rather than an automatic convenience.

## Why Profiling May Be Needed

Profiling may be needed to:

- Compare non-half-hourly submeter data with half-hourly boundary imports.
- Apply settlement-period loss factors.
- Allocate time-of-use costs.
- Estimate customer or responsibility-category demand shapes.

## When Profiling Is Acceptable

Profiling may be acceptable only when:

- The profiling basis is documented.
- The source data is approved for the use case.
- The output is clearly marked as profiled, not measured.
- The audit trace shows raw value, profile method and derived settlement periods.
- The commercial reviewer accepts the risk.

## When Profiling Should Be Blocked

Profiling should be blocked when:

- It would materially affect customer charges without sign-off.
- No defensible profile exists.
- The source period is ambiguous.
- The meter has known unusual usage.
- The calculation requires measured half-hourly evidence.

## Options

| Option | Description | Risk |
| --- | --- | --- |
| Block HH-dependent calculations until HH data exists | Safest and most defensible | Low |
| Allow non-HH data for aggregate totals only | Useful for annual allocation and reconciliation | Medium |
| Use standard profile assumptions | Simple but may not reflect private network usage | High |
| Use site-specific profiles | Better if measured site evidence exists | Medium |
| Use similar meter profiles | Useful but needs similarity criteria | High |
| Use customer class profiles | Useful for broad allocation but weak for individual billing | High |
| Allocate evenly across the period | Transparent but often commercially weak | High |

## Recommended MVP Position

Do not automatically profile monthly, quarterly or annual consumption into half-hourly periods unless a documented and approved profile exists.

For MVP:

- Keep non-half-hourly records in their original format.
- Use them for aggregate totals only where appropriate.
- Do not apply TLMs to non-half-hourly records.
- Show clear validation warnings when HH-dependent calculations lack HH source data.

## Audit Trace Requirements

Any future profiling calculation must record:

- Source record ID.
- Raw consumption value.
- Source period.
- Profile method.
- Profile basis or reference data.
- Generated settlement periods.
- Assumptions.
- Reviewer approval status.

## Customer Communication Risk

Profiled data should be described as estimated. Customer-facing material should not imply that profiled periods are measured half-hourly consumption.
