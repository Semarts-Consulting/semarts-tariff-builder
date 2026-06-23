# WB-005 Asset-Cost Allocation Scenario

Date: 2026-06-22

Status: proposal for review only.

## Purpose

This scenario defines how future workbook-derived regression coverage should represent asset-cost allocation by voltage, local class, and chargeability.

The objective is to avoid hardcoding a single airport or port asset model while still proving that asset evidence can be reviewed, separated, and reconciled before it affects tariffs.

This document does not approve asset valuation logic, annuity calculations, storage changes, shared DTOs, import parsing, report totals, exports, UI changes, or tariff calculation behaviour.

## Source Pattern

Airport and port tariff workbooks can include asset sheets with:

- electrical distribution assets,
- non-electrical or non-chargeable assets,
- voltage or network level,
- replacement or prior-year asset values,
- asset lives,
- local site categories,
- comments explaining whether the asset should be charged through electricity tariffs.

Future implementation must preserve the distinction between asset evidence and tariff-impacting cost pools.

## Scenario Boundary

Allowed future implementation, if separately approved:

- test-only asset evidence metadata,
- a regression test proving non-chargeable or unresolved assets do not feed tariff cost pools,
- a regression test proving approved annual asset-cost amounts can be allocated by an existing tariff basis,
- documentation updates.

Explicitly out of scope:

- production asset import changes,
- asset valuation or annuity calculation changes,
- WACC/CPI methodology changes,
- shared DTO changes,
- project storage changes,
- tariff calculation engine changes,
- report totals,
- export DTOs,
- UI workflows.

## Proposed Test-Only Fixture Shape

The future fixture should use local test metadata rather than shared production types.

Suggested fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable test fixture identifier. |
| `sourceWorkbook` | Human-readable source pattern. |
| `assetDescription` | Asset or asset-group label. |
| `assetCategory` | Local workbook category. |
| `voltage` | Workbook voltage or network level. |
| `localClass` | Site-specific grouping where present. |
| `isElectricalDistributionAsset` | Whether asset is electrical distribution infrastructure. |
| `isChargeableOnElectricityTariff` | Whether asset can feed electricity tariff recovery. |
| `annualChargeAmount` | Pre-approved annual amount for test-only tariff recovery, if known. |
| `mappingConfidence` | `High`, `Medium`, `Low`, or `Unresolved`. |
| `treatment` | `Calculation input`, `Evidence-only`, `Excluded pending review`, or `Manual review required`. |
| `validationIssue` | Expected review issue, if any. |

## Representative Fixture Rows

| Row | Source pattern | Treatment | Expected outcome |
| --- | --- | --- | --- |
| HV distribution asset annuity | Electrical distribution asset, chargeable, high-confidence annual amount | Calculation input | May become a test cost pool if allocation basis is also approved. |
| LV metering asset evidence | Electrical metering asset, chargeable but mapping needs review | Manual review required | Must not feed tariffs until reviewed. |
| Non-electrical building asset | Non-electrical asset in workbook asset sheet | Excluded pending review | Must not feed electricity tariffs. |
| Shared site infrastructure | Mixed-use or unclear asset class | Evidence-only | Must remain outside tariff recovery until treatment is approved. |
| Unresolved asset row | Missing voltage, life, or chargeability | Excluded pending review | Must produce a review issue and remain outside cost pools. |

## Acceptance Criteria

A future WB-005 regression test should prove:

1. Chargeable and non-chargeable asset evidence can be represented separately.
2. Only explicitly approved calculation-input asset rows feed tariff cost pools.
3. Non-electrical, unresolved, evidence-only, and manual-review assets are not passed to `calculateTariffs`.
4. Asset allocation uses an already-approved basis such as customer count, annual kWh, demand/capacity, equal share, or manual share.
5. Asset valuation and annuity methods are not introduced inside the test unless separately approved.
6. The test does not require production asset parser, storage, shared DTO, report total, export, or UI changes.

## Commercial Review Questions

Before production implementation, the owner should confirm:

1. Which asset categories are chargeable through electricity tariffs.
2. Whether voltage level should drive allocation, reporting only, or methodology selection.
3. How to treat shared or mixed-use infrastructure.
4. Whether asset annual amounts are imported directly or calculated from value, life, WACC, CPI, and age.
5. Whether non-chargeable assets should block report readiness or appear only as evidence/limitations.

## Recommended Next Step

Do not implement WB-005 as a fixture until asset chargeability and annual amount treatment are confirmed. The safe next package is either a review of this proposal or a separate decision pack for asset annual amount methodology.
