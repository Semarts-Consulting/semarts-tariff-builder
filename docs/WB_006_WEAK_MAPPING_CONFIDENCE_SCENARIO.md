# WB-006 Weak Mapping Confidence Scenario

Date: 2026-06-22

Status: proposal for review only.

## Purpose

This scenario defines how future workbook-derived imports should handle weak, low-confidence, or unresolved source mappings.

The objective is to prove that uncertain workbook values are visible for review and cannot silently feed tariff-impacting calculations.

This document does not approve import parser changes, storage changes, shared DTO changes, tariff calculation changes, report total changes, export changes, or UI implementation.

## Source Pattern

This scenario is based on cross-workbook patterns where:

- sheet names vary between customer models,
- repeated labels appear in different sections,
- workbook rows contain mixed evidence, recoverable cost, pass-through, and commentary values,
- source units may be unclear,
- manual review is needed before a value becomes tariff-impacting.

Examples include airport tariff workbooks, Port of Tilbury-style tenant and generation evidence, and workbooks with local network, AUoS, PUoS, losses, supply, or asset tabs.

## Scenario Boundary

Allowed future implementation, if separately approved:

- test-only fixture metadata,
- a regression test proving weak mappings remain outside `calculateTariffs`,
- documentation updates.

Explicitly out of scope:

- production workbook parser changes,
- shared source-mapping DTOs,
- calculation-engine changes,
- project storage changes,
- report totals,
- export DTOs,
- UI upload or review workflows.

## Proposed Test-Only Fixture Shape

The future fixture should use local test metadata rather than shared production types.

Suggested fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable test fixture identifier. |
| `sourceWorkbook` | Human-readable workbook pattern. |
| `worksheetName` | Source worksheet or tab label. |
| `sourceSection` | Source section such as tariff sheet, asset data, AUoS, losses, or tenant data. |
| `sourceLabel` | Label found in workbook. |
| `rawValue` | Raw workbook value represented in the fixture. |
| `normalisedValue` | Parsed value where safe to normalise. |
| `normalisedUnit` | Unit after normalisation, if known. |
| `mappingConfidence` | `High`, `Medium`, `Low`, or `Unresolved`. |
| `treatment` | `Calculation input`, `Evidence-only`, `Excluded pending review`, or `Manual review required`. |
| `validationIssue` | Expected review issue, if any. |

## Representative Fixture Rows

| Row | Source pattern | Confidence | Treatment | Expected outcome |
| --- | --- | --- | --- | --- |
| Confirmed recoverable maintenance cost | Stable tariff sheet label and known annual GBP value | High | Calculation input | May feed test calculation inputs if the scenario also defines allocation. |
| Ambiguous AUoS evidence row | Label resembles local network charge but section is evidence-only | Low | Evidence-only | Must not feed cost pools passed to `calculateTariffs`. |
| Supplier pass-through row | Clear supply/supplier context but not network tariff recovery | Medium | Evidence-only | Must remain outside network tariff recovery. |
| Unresolved workbook amount | Value found without reliable row or section context | Unresolved | Excluded pending review | Must be excluded from cost pools, allocation rows, and revenue requirement. |
| Weak unit mapping | Value looks like p/kWh or GBP but unit cannot be confirmed | Low | Manual review required | Must produce a validation/review issue in the test metadata. |

## Acceptance Criteria

A future WB-006 regression test should prove:

1. Low-confidence and unresolved rows are represented in fixture metadata.
2. Only explicitly approved calculation-input rows are passed into tariff calculation inputs.
3. Evidence-only, excluded, and manual-review rows are not passed into `calculateTariffs`.
4. Validation/review issues exist for low-confidence, unresolved, or weak-unit rows.
5. The test does not require production source-mapping DTOs.
6. The test does not change calculation outputs, report totals, storage, import parsing, exports, or UI behaviour.

## Commercial Review Questions

Before production implementation, the owner should confirm:

1. What confidence threshold is required before a workbook-derived value can affect tariffs?
2. Whether medium-confidence values may feed calculations after user confirmation, or must remain evidence-only until manually approved.
3. Whether unresolved values should block report readiness, tariff approval, or only show as limitations.
4. How manual overrides should be recorded for audit and stakeholder review.

## Recommended Next Step

If approved, implement WB-006 as a test-only fixture and regression test using local test metadata. Do not introduce shared DTOs or production parser behaviour until the source mapping contract is separately approved.
