# UtilityHub Selector Contract Dependencies

Date: 2026-06-24

Status: dependency pack

## Purpose

Tariff Builder now has evidence-only input selection scaffolding for customer/site context, meter and consumption inputs, boundary meters, and reference data. This document defines the UtilityHub contracts needed before those scaffolds can become live selectors.

The default position remains conservative: Tariff Builder must not create competing customer, site, building, floor, supply point, meter, meter reading, document, permission, or audit masters. It should consume UtilityHub-owned records by stable shared IDs and keep tariff-impacting use explicit and reviewed.

## Current State

- Tariff Builder can show input readiness and evidence-only selection groups.
- The scaffold does not call UtilityHub APIs.
- The scaffold does not migrate storage.
- The scaffold does not change tariff calculations, imports, exports, shared DTOs, report totals, or methodology behaviour.
- Existing aggregate customer-class tariff inputs remain the approved tariff-driving route.

## Shared Contract Principles

Every UtilityHub-backed selector should expose:

- Stable shared ID.
- Human-readable display label.
- Owning module or source system.
- Source version, snapshot reference, or last updated timestamp.
- Status and validation/review state.
- Permission-safe fields only.
- Clear distinction between selected evidence and tariff-driving input.

Tariff Builder should store only the selected reference, tariff-year context, review state, tariff-use state, and tariff-specific notes. It should not copy full master records into local permanent ownership.

## Required Selector Contracts

### Customer And Site Hierarchy Selector

UtilityHub should provide customer and site hierarchy records including, where applicable:

- Customer ID and customer name.
- Site ID and site name.
- Area, building and floor IDs and labels where relevant.
- Status and effective date range.
- User permission state for the active module.
- Source version or last updated timestamp.

Tariff Builder usage:

- Select the customer and site context for a tariff model year.
- Reference shared IDs in tariff-year records.
- Keep any tariff-specific grouping or customer-class mapping separate from UtilityHub ownership.

### Meter And Consumption Selector

UtilityHub should provide meter records and consumption summaries including, where applicable:

- Meter ID.
- Supply point ID.
- Customer, site, building, floor and location references.
- Meter reference, display name and optional serial number.
- Utility type.
- Meter role or responsibility category.
- Meter status and effective date range.
- Parent or boundary meter relationship where relevant.
- Monthly consumption summary for the selected reference period.
- Consumption source, validation status, issue count and source version.

Tariff Builder usage:

- Display available meters and monthly consumption evidence.
- Select meters for tariff-year evidence or future reviewed aggregate generation.
- Keep raw readings and meter master data in UtilityHub.

### Boundary Meter Selector

UtilityHub should provide boundary meter candidates including:

- Boundary meter ID and label.
- Supply point ID and site relationship.
- Import/export monthly consumption summary for the reference period.
- Completeness and validation status.
- Duplicate, overlap, missing period or invalid reading issue counts.
- Source version, source system and last updated timestamp.

Tariff Builder usage:

- Allow a tariff model year to include or exclude boundary meters with a review reason.
- Validate selected boundary evidence against submeter and customer-class evidence.
- Keep boundary meter master records and readings in UtilityHub.

### Reference Data Selector

UtilityHub or an approved shared reference-data service should provide:

- Transmission Loss Multiplier coverage by settlement date, settlement period, GSP group, multiplier, source, version and retrieved-at timestamp.
- CPI index values by month and year, source, version and retrieved-at timestamp.
- Transmission and distribution charge reference data by network area, period, charge category, rate, source and version.
- Supply contract records including contract ID, supplier, period, charge lines, loss basis, source documents, status and version.

Tariff Builder usage:

- Select or display the relevant reference dataset for the tariff year.
- Keep source provenance visible.
- Avoid embedding customer-specific or site-specific copies of reusable reference data.

## Required Service Capabilities

Before live selectors are implemented, UtilityHub or shared services should provide:

- Search/list endpoints scoped by customer, site, tariff year and reference period.
- Summary endpoints for monthly consumption and validation status.
- Validation issue counts and issue detail links.
- Source version or snapshot identifiers.
- Permission enforcement before records reach Tariff Builder.
- Empty, unavailable and access-denied states that Tariff Builder can display safely.

## Tariff Builder Mapping

Live selector results should map into the existing input selection concept:

- `selected`: the record is selected for tariff-year evidence or review.
- `evidence-only`: the record supports review but does not drive tariffs.
- `candidate`: the record may become tariff-driving after review.
- `tariff-driving`: the record is explicitly approved to affect tariff inputs.
- `blocked`: the record is not usable until issues are resolved or accepted.

The default for UtilityHub-sourced data should be evidence-only or candidate, never tariff-driving automatically.

## Blockers Before Implementation

- Field-level schemas for customer/site hierarchy, meters, readings, boundary meters, supply contracts and reference datasets.
- Endpoint names, query parameters and pagination approach.
- Snapshot/source version strategy for reproducible tariff years.
- Permission requirements and module access rules.
- Decision on whether monthly consumption summaries are precomputed by UtilityHub or calculated on request.
- Shared owner for CPI and other reusable reference-data refreshes.

## Explicitly Out Of Scope

This dependency pack does not approve:

- UtilityHub API implementation.
- Storage migration.
- Automatic selector population.
- Raw meter reading ingestion into Tariff Builder.
- Calculation changes.
- Import parser contract changes.
- Export DTO changes.
- Report total changes.
- Shared DTO changes.

## Acceptance Criteria For Future Live Selectors

When a live selector package is approved later, it should prove that:

- Existing local/demo projects still work.
- Unavailable UtilityHub data shows a clear empty or unavailable state.
- Selected UtilityHub data remains evidence-only by default.
- Tariff-impacting use requires explicit reviewed state.
- Tests cover missing records, blocked records, permission-safe empty states, and evidence-only behaviour.

## Recommended Next Package

If UtilityHub contracts are not ready, the next safe Tariff Builder package is a UI skeleton that uses the current scaffold and shows unavailable/awaiting-contract states.

If UtilityHub contracts are ready, the first live implementation should be the customer/site selector because it is the dependency for meter, boundary meter and reference-data scoping.
