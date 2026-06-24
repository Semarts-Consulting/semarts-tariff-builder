# Input Selection Data Model Proposal

Date: 2026-06-24

Status: proposal; production implementation remains gated.

## Purpose

Define how a tariff year should reference UtilityHub-owned source records and Tariff Builder-owned tariff inputs.

This proposal keeps data selection separate from calculation. It does not change current storage, imports, shared DTOs, reports, exports, UI behaviour or tariff calculation outputs.

## Core Principle

Tariff Builder should not copy or become the master for shared customer, site, hierarchy, meter, meter reading, supply contract, document, audit or permission data.

Tariff Builder should store tariff-year input selections that reference UtilityHub records and record tariff-specific review decisions.

## Proposed Selection Record

Each selected source input should eventually follow this pattern.

| Field | Purpose | Notes |
| --- | --- | --- |
| `inputSelectionId` | Stable Tariff Builder selection ID. | Tariff Builder-owned. |
| `tariffYearId` | Parent tariff year. | Required. |
| `selectionGroup` | Logical group for the selected input. | Suggested values below. |
| `sourceSystem` | Origin of the source record. | Usually `utilityhub`, `utilitymap`, `reference-data` or `tariff-builder`. |
| `sourceEntityType` | Type of source record. | Example: `meter`, `meter_reading`, `supply_contract`, `cpi_index`. |
| `sourceEntityId` | Source-system ID. | Required where the source exists outside Tariff Builder. |
| `sourceVersionId` | Optional version, dataset, run or snapshot reference. | Important for CPI, TLM and other changing reference data. |
| `displayName` | User-facing label. | For review screens only; not a source of truth. |
| `selectionStatus` | Whether this record is included, excluded, provisional or blocked. | Suggested values below. |
| `reviewStatus` | Whether the selected record has been reviewed. | Suggested values below. |
| `tariffUse` | Whether the record is evidence-only or tariff-driving. | Required to prevent accidental calculation impact. |
| `reviewNotes` | Rationale, caveats or exclusion reason. | Required for exclusions and accepted warnings. |
| `createdAt` | Created timestamp. | Audit support. |
| `updatedAt` | Updated timestamp. | Audit support. |

## Selection Groups

| Group | Source of truth | Examples |
| --- | --- | --- |
| `customer-site-context` | UtilityHub | customer, site, private network, hierarchy root. |
| `meter-consumption` | UtilityHub | meters, monthly consumption, meter readings, reviewed consumption totals. |
| `boundary-meter` | UtilityHub | boundary meter records and consumption summaries. |
| `reference-data` | UtilityHub/reference data | TLM, CPI, DUoS/TNUoS, transmission and distribution references. |
| `supply-contract` | UtilityHub | contract terms, charge lines and source evidence. |
| `tariff-specific-cost` | Tariff Builder | direct costs, methodology adjustments, approved tariff-only inputs. |
| `allocation-method` | Tariff Builder | allocation method choices and assumptions. |
| `customer-class` | Tariff Builder, later linked to UtilityHub | reviewed customer classes used by tariff calculations. |
| `limitation` | Tariff Builder | accepted assumptions, exclusions and known limitations. |

## Selection Status Values

| Status | Meaning |
| --- | --- |
| `available` | Source record is visible but not selected for the tariff year. |
| `selected` | Record is selected for tariff-year review or use. |
| `excluded` | Record is deliberately excluded with a reason. |
| `provisional` | Record is selected but still awaiting confirmation. |
| `blocked` | Record cannot be used until data, mapping or decision issues are resolved. |

## Review Status Values

| Status | Meaning |
| --- | --- |
| `not-reviewed` | No reviewer has accepted the record yet. |
| `needs-review` | Issues or assumptions require review. |
| `accepted` | Record is accepted for its stated tariff use. |
| `accepted-with-limitation` | Record can be used with documented caveats. |
| `rejected` | Record should not be used for this tariff year. |

## Tariff Use Values

| Value | Meaning |
| --- | --- |
| `evidence-only` | Supports review, reports or reconciliation but does not drive tariff calculations. |
| `tariff-driving` | Approved to affect calculation inputs or outputs. |
| `candidate` | May become tariff-driving after review, aggregation or methodology approval. |
| `blocked` | Must not affect calculations. |

Every future implementation should make `tariffUse` explicit when displaying selected data.

## UtilityHub Reference Rules

Tariff Builder may reference:

- UtilityHub customers and sites;
- UtilityHub buildings, floors, locations and mapped areas where contracts exist;
- UtilityHub meters and submeters;
- UtilityHub boundary meters;
- UtilityHub meter readings and consumption summaries;
- UtilityHub supply contracts;
- UtilityHub document uploads and source evidence;
- UtilityMap area mappings, allocation confidence and data-quality issues when shared contracts exist.

Tariff Builder must not create permanent local masters for those records.

## Tariff Builder-Owned Selection Data

Tariff Builder may own:

- which records are selected for a tariff year;
- whether each selected record is included, excluded, provisional or blocked;
- review notes and accepted limitations;
- tariff-specific direct cost inputs;
- allocation method choices;
- customer-class definitions used by the tariff calculation;
- snapshots or source-version references needed for reproducibility;
- calculation runs and audit traces.

## Evidence-To-Tariff Control

Selection does not automatically mean tariff impact.

Recommended control:

1. Source records are selected as evidence.
2. Validation and reconciliation issues are reviewed.
3. The reviewer marks a record, group or derived aggregate as accepted.
4. Only approved tariff-driving aggregate inputs can feed calculation.
5. Raw UtilityHub meter readings should not be read directly by `calculateTariffs`.

This preserves the current aggregate customer-class calculation path until a separate approved implementation changes it.

## Snapshot And Reproducibility

Future implementation should store enough source evidence to reproduce a tariff year:

- source entity ID;
- source version or dataset reference;
- source retrieval timestamp where applicable;
- selected reference period;
- reviewer decision and timestamp;
- accepted limitation or override notes.

Avoid copying full UtilityHub records unless a separate architecture decision approves a snapshot strategy.

## Validation Expectations

Input selection screens should flag:

- missing required source records;
- unresolved UtilityHub hierarchy references;
- unknown or unmapped meters;
- duplicate or overlapping consumption periods;
- missing boundary meter data;
- unresolved reconciliation variance;
- missing CPI/TLM/reference dataset selection;
- selected evidence that is still not reviewed;
- evidence-only data that a user may incorrectly expect to be tariff-driving.

## Out Of Scope

This proposal does not implement:

- TypeScript types;
- database tables;
- storage migration;
- UtilityHub API calls;
- import parser changes;
- UI screens;
- report total changes;
- export DTO changes;
- calculation changes.

## Future Implementation Acceptance Criteria

A future implementation should prove:

- selected records are linked to a tariff year;
- UtilityHub-owned records are referenced, not duplicated;
- tariff use is explicit for every selected group;
- evidence-only data cannot silently affect calculations;
- exclusions and accepted limitations require notes;
- compatibility with existing local projects is preserved;
- tests cover selection state transitions and evidence-to-tariff blocking.

## Recommended Next Package

Prepare the tariff model/year setup UX proposal. It should define the first practical user flow for creating a tariff model, adding a tariff year, setting reference/effective dates, and showing input readiness without changing storage yet.
