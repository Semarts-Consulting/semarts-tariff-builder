# Tariff Year Input Architecture

Date: 2026-06-24

Status: planning baseline; production implementation remains gated.

## Purpose

Define the input architecture Tariff Builder should move toward before further tariff calculation expansion.

The priority is now to make sure the correct data is selected, evidenced and reviewed for a tariff year. Calculation changes should follow only after the input ownership and selection model is stable.

## Product Structure

Tariff Builder should use this structure:

| Level | Purpose | Owner |
| --- | --- | --- |
| Tariff model | Long-lived model for a customer, site or private network, such as `POTLL Tariffs`. | Tariff Builder, referencing UtilityHub customer/site IDs. |
| Tariff year | Annual population of selected inputs, assumptions, methodology choices and outputs. | Tariff Builder. |
| Input selection | Reviewed UtilityHub-owned data and tariff-specific inputs used for the tariff year. | Tariff Builder selection records, UtilityHub source records. |
| Calculation run | Reproducible calculation snapshot for draft, review or final tariff outputs. | Tariff Builder. |

This replaces the current "project as a one-off build" mental model with a year-on-year tariff record.

## UtilityHub-Sourced Inputs

The following data should be sourced from UtilityHub, reference data services or shared programme contracts. Tariff Builder should select and evidence these records, not maintain competing masters.

| Input area | Source of truth | Tariff Builder role |
| --- | --- | --- |
| Customer, site and hierarchy | UtilityHub | Select the customer/site context for the tariff model and tariff year. |
| Buildings, floors, locations and mapped areas | UtilityHub / UtilityMap | Display hierarchy context and reference shared IDs where needed. |
| Meter and submeter register | UtilityHub | Select meters included as evidence or tariff inputs after review. |
| Boundary meters | UtilityHub | Select boundary meters included in the tariff-year reconciliation. |
| Meter readings and consumption | UtilityHub | Display monthly/reference-period consumption and select reviewed consumption. |
| Supply contracts | UtilityHub | Display selected contract terms and evidence. |
| Transmission and distribution reference data | UtilityHub/reference data | Display selected values and source/version evidence. |
| Transmission Loss Multipliers | Shared reference data | Select applicable settlement periods and show source/version evidence. |
| CPI | Structured ONS/reference data source | Select month/year, index value, source and retrieval evidence. |
| Documents and source records | UtilityHub | Reference uploaded evidence without duplicating document masters. |

## Tariff Builder-Owned Inputs

Tariff Builder should own only tariff-specific records:

- tariff model metadata;
- tariff year metadata and reference period;
- selected UtilityHub source records for the tariff year;
- inclusion and exclusion decisions;
- tariff-specific direct costs;
- methodology-specific adjustments;
- allocation method choices;
- loss application assumptions for the tariff year;
- CPI month/year selection and applied index evidence;
- review notes, limitations and sign-off evidence;
- calculation runs, audit traces, tariff outputs and methodology reports.

## Input State Model

Future input screens should make the state of each input clear.

| State | Meaning |
| --- | --- |
| Available from UtilityHub | Source record exists but has not been selected for this tariff year. |
| Selected for tariff year | Record is included in the tariff-year input set. |
| Needs review | Record has warnings, uncertainty or incomplete mapping. |
| Excluded | Record is deliberately excluded with a reason. |
| Missing | Required source data is not available. |
| Blocked | Record cannot be used until a decision, correction or UtilityHub contract exists. |

## Recommended Input Surfaces

### 1. Tariff Model And Tariff Year Setup

Purpose:

- create or select the tariff model;
- select customer/site context from UtilityHub;
- create annual tariff years;
- set reference period, status and owner review state.

Do not implement local customer, site, building, floor, meter or reading masters.

### 2. Customer And Site Context

Purpose:

- display the UtilityHub customer/site hierarchy;
- show buildings, locations, floors or mapped areas where contracts exist;
- show unresolved hierarchy dependencies before tariff-year inputs are selected.

### 3. Meter And Consumption Selection

Purpose:

- display UtilityHub-owned meters and submeters in a table;
- show tenant or non-tenant indicator, responsibility category and loss applicability;
- show reference-year monthly consumption;
- allow inclusion or exclusion for the tariff year;
- surface missing, duplicate, overlapping or invalid consumption records.

Consumption selection should not automatically change tariff-driving aggregate customer-class inputs until the submeter-to-tariff decision gates are satisfied.

### 4. Boundary Meter Selection

Purpose:

- show UtilityHub-owned boundary meters;
- allow the user to select included boundary meters;
- show monthly boundary consumption for the reference period;
- validate boundary consumption completeness;
- show reconciliation against selected submeter consumption.

### 5. Reference Data Selection

Purpose:

- select TLM dataset/version;
- select CPI month/year and source;
- display transmission and distribution references;
- display supply contract terms;
- record whether each source is approved, provisional or overridden.

### 6. Tariff-Specific Cost Inputs

Purpose:

- capture direct tariff-building costs that are not UtilityHub shared masters;
- map evidence to reviewed cost-pool candidates only after methodology cost mapping rules are approved;
- record assumptions and exclusions.

### 7. Allocation And Assumptions

Purpose:

- choose allocation methods for the tariff year;
- record loss application assumptions;
- document whether customer classes are manual, UtilityHub-derived or reviewed aggregate outputs.

### 8. Input Readiness Dashboard

Purpose:

- show whether the tariff year has enough reviewed inputs to calculate;
- separate missing data, warnings, blocked items and accepted limitations;
- avoid implying that evidence-only data is tariff-driving.

## Customer Classes

Customer classes should move to an add/edit table workflow:

1. Add customer class.
2. Enter name and optional description.
3. Show the class in a table.
4. Allow edit, deactivate or delete where safe.
5. Later link customer classes to UtilityHub customers, tenants, meters or mapped groups when shared contracts exist.

This should be a narrow UI package and should not change calculation semantics on its own.

## Implementation Sequence

Recommended order:

1. Tariff model and tariff year contract proposal.
2. Input selection data model proposal that references UtilityHub IDs.
3. Tariff model/year setup UI.
4. Customer/site selection view.
5. Meter and consumption selection view.
6. Boundary meter selection view.
7. Reference data selection view for TLM, CPI, transmission, distribution and supply contract evidence.
8. Customer class table UX.
9. Input readiness dashboard.
10. Tariff-impacting aggregation only after owner sign-off.

## Do Not Implement Yet

Do not implement these without separate approval:

- shared UtilityHub API contracts;
- storage migration;
- import parser contract changes;
- raw submeter rows directly driving `calculateTariffs`;
- automatic consumption profiling;
- automatic CPI scraping or API refresh;
- report total changes;
- export DTO changes;
- customer/site/meter/reading masters inside Tariff Builder;
- tariff-impacting supply integration beyond approved explicit application.

## Acceptance Criteria For Future Implementation

Each future input package should prove:

- UtilityHub-owned records are referenced rather than duplicated;
- selected inputs are clearly tied to a tariff year;
- evidence-only data is clearly separated from tariff-driving data;
- inclusion/exclusion decisions are auditable;
- validation issues are visible before calculation;
- tariff-specific inputs remain owned by Tariff Builder;
- calculations do not change unless the package explicitly approves calculation impact.

## Recommended Next Package

Prepare the tariff model and tariff year contract proposal. It should define the minimum record shape and UI behaviour for long-lived tariff models and annual tariff years before replacing project-style terminology or changing storage.
