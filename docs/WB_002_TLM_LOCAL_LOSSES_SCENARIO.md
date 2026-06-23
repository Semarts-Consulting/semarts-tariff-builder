# WB-002 TLM And Local Losses Evidence Scenario

Date: 2026-06-22

Status: proposal for review and test-only evidence coverage.

## Purpose

This scenario defines how future workbook-derived regression coverage should represent high-volume TLM, distribution losses, and local loss evidence from airport-style tariff models.

The objective is to prove that loss evidence can be captured and reviewed without silently changing tariff volumes, recoverable cost, tariff rates, report totals, imports, storage, shared DTOs, exports, or production calculation behaviour.

This document does not approve loss factor methodology, TLM adjustment logic, tariff-impacting loss uplift, import parsing, shared DTO changes, storage changes, report total changes, export changes, or UI implementation.

## Source Pattern

EMA, MAN, STN, and similar airport models can include:

- customer or meter consumption volumes,
- local loss factors or distribution loss evidence,
- TLM or settlement adjustment evidence,
- separate supply evidence,
- workbook-specific loss treatment assumptions,
- reconciliations that may not be tariff-impacting in the same way across customers.

Until the loss methodology is approved, loss values should be visible as evidence only.

## Scenario Boundary

Allowed test-only implementation:

- local fixture metadata for TLM/local loss evidence,
- regression coverage proving evidence-only loss rows are not included in tariff calculation inputs,
- documentation updates.

Explicitly out of scope:

- production loss calculation,
- automatic uplift of customer kWh,
- source workbook parser changes,
- shared source-mapping DTOs,
- storage changes,
- report total changes,
- export DTO changes,
- UI upload or review workflow changes.

## Proposed Test-Only Fixture Shape

The future fixture should use local test metadata rather than shared production types.

Suggested fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable test fixture identifier. |
| `sourceWorkbook` | Human-readable workbook pattern. |
| `worksheetName` | Source worksheet or tab label. |
| `customerClass` | Customer class or group referenced by the evidence row. |
| `meterReference` | Optional meter/customer reference. |
| `baseKwh` | Consumption before evidence adjustment. |
| `lossAdjustedKwh` | Workbook evidence value after local losses or TLM. |
| `lossPercent` | Evidence loss percentage where known. |
| `evidenceType` | `TLM`, `Local losses`, `Distribution losses`, or `Settlement evidence`. |
| `mappingConfidence` | `High`, `Medium`, `Low`, or `Unresolved`. |
| `treatment` | `Evidence-only`, `Excluded pending review`, or `Manual review required`. |
| `validationIssue` | Expected review issue, if any. |

## Representative Fixture Rows

| Row | Evidence type | Treatment | Expected outcome |
| --- | --- | --- | --- |
| Reviewed TLM evidence for airside operations | TLM | Evidence-only | Visible in fixture metadata but does not uplift `annualKwh` passed to `calculateTariffs`. |
| Local loss evidence for terminal retail | Local losses | Evidence-only | Kept outside tariff calculation inputs until methodology is approved. |
| Distribution loss evidence with weak source mapping | Distribution losses | Manual review required | Produces a review issue in local metadata and remains outside calculation inputs. |
| Unresolved settlement adjustment | Settlement evidence | Excluded pending review | Excluded from calculation inputs and revenue recovery. |

## Acceptance Criteria

A WB-002 regression test should prove:

1. Loss evidence rows can be represented in test metadata.
2. Evidence-only, manual-review, and unresolved loss rows do not change `DataInputRow.annualKwh`.
3. Evidence-only loss rows are not converted into cost pools, allocation rows, or tariff recovery amounts.
4. Review issues are present for weak, manual-review, or unresolved loss evidence.
5. Any approved calculation-input rows in the same test remain separate from loss evidence rows.
6. The test does not require production source mapping, loss calculation, import parsing, storage, shared DTO, report total, export, or UI changes.

## Commercial Review Questions

Before production implementation, the owner should confirm:

1. Whether TLM/local losses should ever uplift billable customer kWh in the tariff methodology.
2. Which loss evidence should be shown for audit only versus tariff-impacting calculations.
3. Whether losses are applied by customer class, meter, voltage, supply point, or whole site.
4. Whether unresolved or weak loss evidence blocks report readiness.
5. How loss treatment should be explained in stakeholder reports.

## Recommended Next Step

Keep WB-002 as evidence-only regression coverage until loss treatment is explicitly approved. Do not implement production loss calculations or tariff-impacting volume adjustments as part of this scenario.
