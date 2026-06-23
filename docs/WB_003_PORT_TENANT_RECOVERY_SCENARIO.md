# WB-003 Port Tenant Recovery Forecast Scenario

Date: 2026-06-22

Status: proposal for review only.

## Purpose

This scenario defines how future workbook-derived regression coverage should represent Port of Tilbury-style tenant recovery forecasts, tenant references, tariff model references, and local charging evidence.

The objective is to prove that tenant-level recovery evidence can be traced and reviewed without hardcoding a port methodology or changing production tariff calculations.

This document does not approve tenant import parsing, recovery forecast calculations, local charging methodology, storage changes, shared DTOs, report total changes, export changes, UI changes, or tariff calculation behaviour.

## Source Pattern

Port tenant models can include:

- tenant/customer names,
- tariff model references,
- customer references or site references,
- SA numbers or similar account identifiers,
- voltage/tariff class,
- tenant-level consumption forecasts,
- local charging evidence,
- recovery forecast summaries,
- generation/export or supply evidence that may need separate treatment.

Future implementation must preserve tenant evidence without assuming it is always a tariff-impacting calculation input.

## Scenario Boundary

Allowed future implementation, if separately approved:

- test-only tenant recovery metadata,
- regression coverage proving tenant evidence remains separate from tariff inputs unless explicitly approved,
- documentation updates.

Explicitly out of scope:

- production tenant import parsing,
- project storage changes,
- shared tenant/source-mapping DTOs,
- calculation-engine changes,
- report total changes,
- formal export fields,
- UI tenant review workflows,
- local charging methodology implementation.

## Proposed Test-Only Fixture Shape

The future fixture should use local test metadata rather than shared production types.

Suggested fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable test fixture identifier. |
| `sourceWorkbook` | Human-readable source pattern. |
| `tenantName` | Tenant/customer label. |
| `tariffModelRef` | Workbook tariff model reference. |
| `customerReference` | Customer or account reference. |
| `saNumber` | Site/account identifier where present. |
| `voltage` | Workbook voltage/tariff class. |
| `forecastKwh` | Tenant forecast consumption evidence. |
| `forecastRecoveryAmount` | Tenant-level recovery forecast evidence. |
| `mappingConfidence` | `High`, `Medium`, `Low`, or `Unresolved`. |
| `treatment` | `Calculation input`, `Evidence-only`, `Excluded pending review`, or `Manual review required`. |
| `validationIssue` | Expected review issue, if any. |

## Representative Fixture Rows

| Row | Treatment | Expected outcome |
| --- | --- | --- |
| Reviewed tenant forecast consumption | Evidence-only | Visible as tenant forecast evidence but does not replace reviewed customer-class `annualKwh`. |
| Reviewed tenant recovery forecast | Evidence-only | Does not become a tariff cost pool or revenue requirement without approved methodology. |
| Tenant with missing tariff model reference | Manual review required | Produces local fixture validation issue. |
| Unresolved tenant row | Excluded pending review | Excluded from tariff inputs and recovery totals. |
| Approved aggregate customer-class value | Calculation input | May feed current `calculateTariffs` only when already represented as a reviewed aggregate data input. |

## Acceptance Criteria

A future WB-003 regression test should prove:

1. Tenant references and recovery forecast evidence can be represented in local metadata.
2. Tenant evidence does not silently become customer classes, cost pools, allocation rows, or report totals.
3. Only reviewed aggregate values feed existing tariff calculation inputs.
4. Missing tariff model references and unresolved tenants are visible as review issues.
5. The test does not require production tenant import parsing, storage, shared DTO, report total, export, UI, or calculation changes.

## Commercial Review Questions

Before production implementation, the owner should confirm:

1. Whether tenant-level forecasts should drive tariff customer classes or remain evidence for review.
2. How tariff model references map to methodology classes.
3. Whether recovery forecast evidence should reconcile to tariff outputs or remain a separate commercial review schedule.
4. How generation/export and supply evidence should be separated from tenant recovery.
5. Whether missing customer references block report readiness or appear only as limitations.

## Recommended Next Step

Keep WB-003 as proposal-only until tenant reference mapping and local charging methodology are approved. The first safe implementation should be a test-only fixture using local metadata, not production import or storage changes.
