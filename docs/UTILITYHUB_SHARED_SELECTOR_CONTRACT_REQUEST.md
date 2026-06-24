# UtilityHub Shared Selector Contract Request

Date: 2026-06-24

Status: request pack for UtilityHub / Programme Control

## Purpose

Tariff Builder needs live selectors for customer/site context, meters, consumption, boundary meters and reference data. Those selectors should consume UtilityHub-owned shared records instead of creating local masters.

This document is Tariff Builder's request to UtilityHub for the shared read contracts required before live selector implementation starts.

## Recommendation

UtilityHub should expose read-only selector contracts and summary read models before Tariff Builder implements live selectors.

The first production route should be:

1. UtilityHub owns shared master records and permission checks.
2. UtilityHub exposes selector/search and summary responses.
3. Tariff Builder stores selected shared IDs, tariff-year context, review state and tariff-use state.
4. Tariff Builder keeps selected UtilityHub data evidence-only until a separate reviewed package makes it tariff-driving.

## Required Contract 1: Customer And Site Context

Tariff Builder needs to select the tariff model customer/site context.

Required response fields:

- `customerId`
- `customerName`
- `siteId`
- `siteName`
- `areaId` and `areaName`, where applicable
- `buildingId` and `buildingName`, where applicable
- `floorId` and `floorName`, where applicable
- `status`
- `effectiveFrom`
- `effectiveTo`
- `permissionStatus`
- `sourceVersion`
- `lastUpdatedAt`

Minimum capabilities:

- List/search customers available to the current user.
- List/search sites for a selected customer.
- Return hierarchy labels suitable for display.
- Return empty and access-denied states without exposing restricted records.

## Required Contract 2: Meter Selector

Tariff Builder needs to select meters as evidence for tariff-year input review.

Required response fields:

- `meterId`
- `meterReference`
- `meterDisplayName`
- `utilityType`
- `supplyPointId`
- `customerId`
- `siteId`
- `areaId`, where applicable
- `buildingId`, where applicable
- `floorId`, where applicable
- `locationLabel`
- `meterRole`
- `responsibilityCategory`
- `meterStatus`
- `effectiveFrom`
- `effectiveTo`
- `parentMeterId`, where applicable
- `boundaryMeterCandidate`
- `sourceVersion`
- `lastUpdatedAt`
- `validationStatus`
- `validationIssueCount`

Minimum capabilities:

- List/search meters by customer, site and reference period.
- Filter by utility type.
- Filter or flag boundary meter candidates.
- Return meter responsibility classification where UtilityHub owns it.
- Return validation issue counts without forcing Tariff Builder to ingest raw readings.

## Required Contract 3: Monthly Consumption Summary

Tariff Builder needs monthly consumption summaries for selected meters and boundary meters.

Required response fields:

- `meterId`
- `periodStart`
- `periodEnd`
- `monthLabel`
- `importKwh`
- `exportKwh`, where applicable
- `netKwh`, where applicable
- `readingCoverageStatus`
- `readingSource`
- `sourceDocumentId`, where applicable
- `sourceVersion`
- `calculatedAt`
- `validationStatus`
- `validationIssues`

Minimum capabilities:

- Return monthly summaries for a selected customer/site/reference period.
- Return summaries by meter ID.
- Return missing month indicators.
- Return duplicate, overlap, invalid period and negative consumption issue indicators.
- Keep raw meter readings owned by UtilityHub.

## Required Contract 4: Boundary Meter Summary

Tariff Builder needs to select which boundary meters are included in a tariff-year calculation evidence set.

Required response fields:

- `boundaryMeterId`
- `meterId`
- `meterDisplayName`
- `supplyPointId`
- `customerId`
- `siteId`
- `periodStart`
- `periodEnd`
- `monthlyImportKwh`
- `monthlyExportKwh`, where applicable
- `coverageStatus`
- `validationStatus`
- `validationIssueCount`
- `sourceVersion`
- `lastUpdatedAt`

Minimum capabilities:

- List candidate boundary meters for a selected customer/site/reference period.
- Return monthly import/export summary.
- Return validation and coverage status.
- Allow Tariff Builder to store include/exclude decisions against shared IDs.

## Required Contract 5: Reference Data Selector

Tariff Builder needs reusable reference data without owning the shared reference masters.

Required reference datasets:

- Transmission Loss Multipliers.
- CPI index values.
- Transmission charge references.
- Distribution charge references.
- Supply contract charge references.

Common response fields:

- `referenceDatasetId`
- `referenceType`
- `periodStart`
- `periodEnd`
- `source`
- `sourceVersion`
- `retrievedAt`
- `status`
- `coverageStatus`
- `validationStatus`

Dataset-specific fields should include:

- TLM: settlement date, settlement period, GSP group and multiplier.
- CPI: month, year, index value and publication date.
- Transmission/distribution: network area, charge category, rate, unit and effective date.
- Supply contract: supplier, contract ID, charge line, charge basis, loss basis and effective period.

Minimum capabilities:

- List available datasets by reference period and type.
- Return coverage status for the tariff-year reference period.
- Return source/version metadata for reproducibility.
- Return validation issues where reference data is incomplete or stale.

## Required Contract 6: Source And Audit Metadata

Every selector response should include enough provenance for tariff defensibility.

Required fields:

- `sourceSystem`
- `sourceRecordId`
- `sourceDocumentId`, where applicable
- `sourceVersion` or `snapshotId`
- `retrievedAt`
- `lastUpdatedAt`
- `createdBy`, where permission-safe
- `updatedBy`, where permission-safe
- `auditEventId`, where applicable

## Tariff Builder Storage Use

Tariff Builder should store:

- Shared IDs selected for a tariff year.
- Selector group and source type.
- Evidence-only, candidate, tariff-driving or blocked tariff-use state.
- Review status.
- Reviewer notes.
- Selection timestamp.
- Source version or snapshot ID.

Tariff Builder should not store:

- Permanent customer/site/building/floor masters.
- Permanent meter masters.
- Raw meter readings.
- UtilityHub document upload records.
- Shared audit events.
- Shared permissions.

## Open UtilityHub Decisions

UtilityHub / Programme Control should confirm:

1. Endpoint names and ownership.
2. Whether selector contracts are REST, shared service functions or both.
3. Whether monthly consumption summaries are precomputed or generated on request.
4. How reference-period snapshots are created and retained.
5. How permissions are represented in selector responses.
6. Whether meter responsibility category is mastered in UtilityHub, Meter Map or another shared service.
7. Whether boundary meter designation is a meter attribute, supply point attribute or relationship.
8. How reference data refreshes are scheduled and versioned.

## Tariff Builder Implementation Sequence After Contract Approval

1. Customer/site selector.
2. Meter selector with evidence-only state.
3. Monthly consumption summary display.
4. Boundary meter selector and include/exclude review.
5. Reference data selector.
6. Readiness validation across selected inputs.
7. Reviewed aggregate generation for tariff-driving inputs, only after separate approval.

## Acceptance Criteria

Before Tariff Builder implements live selectors:

- UtilityHub confirms the shared contract fields.
- UtilityHub confirms ownership and permissions.
- Example JSON payloads exist for each selector.
- Empty, unavailable and access-denied examples exist.
- Tariff Builder can map responses into existing input selection state without calculation changes.
- The first implementation package is explicitly scoped to one selector at a time.
