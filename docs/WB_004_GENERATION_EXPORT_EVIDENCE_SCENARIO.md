# WB-004 Generation And Export Evidence Scenario

Date: 2026-06-22

Status: proposal for review only.

## Purpose

This scenario defines how future workbook-derived regression coverage should represent generation, export, wind, or local production evidence from port-style and mixed-site tariff models.

The objective is to prove that generation/export evidence can be preserved for audit without silently reducing tariff recovery, offsetting demand, changing customer consumption, or altering revenue requirements.

This document does not approve generation/export methodology, netting logic, export credit logic, storage changes, shared DTOs, import parsing, report total changes, export fields, UI changes, or tariff calculation behaviour.

## Source Pattern

Port and mixed-site models can include:

- local generation volumes,
- exported kWh,
- wind or renewable generation evidence,
- import/export meter references,
- netting assumptions,
- export credit schedules,
- local recovery forecast adjustments,
- site-specific treatment that may vary by customer or network.

Until generation/export methodology is approved, these values should be treated as evidence only.

## Scenario Boundary

Allowed future implementation, if separately approved:

- test-only generation/export evidence metadata,
- regression coverage proving generation/export evidence remains outside tariff calculation inputs,
- documentation updates.

Explicitly out of scope:

- production generation/export import parsing,
- automatic netting against customer `annualKwh`,
- offsetting recoverable cost pools,
- export credit calculations,
- storage changes,
- shared DTO changes,
- report total changes,
- formal export fields,
- UI review workflows.

## Proposed Test-Only Fixture Shape

The future fixture should use local test metadata rather than shared production types.

Suggested fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable test fixture identifier. |
| `sourceWorkbook` | Human-readable source pattern. |
| `worksheetName` | Source worksheet or tab label. |
| `siteArea` | Local site area or generation source. |
| `meterReference` | Import/export or generation meter reference. |
| `generationKwh` | Generation evidence volume. |
| `exportKwh` | Export evidence volume. |
| `creditAmount` | Workbook credit or offset evidence, if present. |
| `mappingConfidence` | `High`, `Medium`, `Low`, or `Unresolved`. |
| `treatment` | `Evidence-only`, `Excluded pending review`, or `Manual review required`. |
| `validationIssue` | Expected review issue, if any. |

## Representative Fixture Rows

| Row | Treatment | Expected outcome |
| --- | --- | --- |
| Reviewed wind generation evidence | Evidence-only | Visible in fixture metadata but does not reduce customer `annualKwh`. |
| Export meter evidence | Evidence-only | Does not become a tariff credit or reduction to recoverable cost. |
| Workbook export credit row | Manual review required | Produces review issue because credit treatment is not approved. |
| Unresolved generation row | Excluded pending review | Excluded from tariff inputs and recovery totals. |

## Acceptance Criteria

A future WB-004 regression test should prove:

1. Generation/export evidence can be represented in local fixture metadata.
2. Generation/export volumes do not alter customer `annualKwh` passed to `calculateTariffs`.
3. Export credit evidence does not reduce recoverable cost or revenue requirement.
4. Manual-review and unresolved rows produce local review issues.
5. The test does not require production generation/export import parsing, storage, shared DTO, report total, export, UI, or calculation changes.

## Commercial Review Questions

Before production implementation, the owner should confirm:

1. Whether generation/export should affect tariff recovery at all.
2. Whether export values are customer-specific, site-wide, or evidence only.
3. Whether export credits are allowed in tariff methodology or should remain outside the electricity network tariff.
4. Whether generation should affect losses, capacity, or consumption allocation.
5. How generation/export should be explained in stakeholder reports.

## Recommended Next Step

Keep WB-004 as proposal-only until generation/export treatment is explicitly approved. If a test-only fixture is later approved, it should prove exclusion from tariff inputs rather than implement netting or credit logic.
