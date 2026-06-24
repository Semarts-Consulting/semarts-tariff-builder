# UtilityHub Data Ownership And Tariff Year Model Decision Pack

Date: 2026-06-24

Status: approved direction for planning; production implementation still gated.

## Purpose

Record the revised product direction for Tariff Builder after user review of the tariff model workflow.

Core principle: Tariff Builder should not become a second system of record for customers, sites, meters, consumption, supply contracts or reusable reference data. UtilityHub should own shared customer and utility data. Tariff Builder should select, review and use that data for tariff methodology building.

## Recommended Product Model

Think of Tariff Builder less as standalone projects and more as tariff models with annual tariff years.

Example:

| Level | Example | Purpose |
| --- | --- | --- |
| Tariff model | POTLL Tariffs | Long-lived tariff model for a customer/site/network. |
| Tariff year | 2025, 2026, 2027 | Annual tariff population, methodology choices, selected inputs and outputs. |
| Calculation run | Draft, review, final | Reproducible calculation snapshot for that tariff year. |

This allows year-on-year tracking without duplicating customer, meter or consumption masters.

## UtilityHub-Owned Data

UtilityHub should own and maintain:

- customers;
- sites;
- buildings, floors and mapped areas where relevant;
- supply points;
- meters and submeter register;
- boundary meters;
- meter readings and meter consumption;
- tenant/customer relationships;
- supply contracts;
- transmission and distribution reference data;
- reusable TLM/reference datasets;
- document uploads and source files;
- shared audit, users, roles and permissions.

Tariff Builder should consume these through shared IDs, APIs or import/sync contracts once approved.

## Tariff Builder-Owned Data

Tariff Builder should own tariff-specific records:

- tariff model and tariff year setup;
- selected UtilityHub inputs for a tariff year;
- tariff-building direct costs and methodology-specific adjustments;
- allocation methodology;
- loss application assumptions for the tariff year;
- CPI month/year selection and applied index evidence;
- calculation runs and audit trace;
- tariff outputs;
- stakeholder methodology reports;
- tariff-specific review notes and limitations.

## Existing Local Inputs That Should Become UtilityHub-Sourced

| Current local area | Target ownership | Tariff Builder role |
| --- | --- | --- |
| Site submeter register | UtilityHub | Display and select meters for tariff evidence/calculation. |
| Consumption by meter | UtilityHub | Display reference-year consumption summaries and select reviewed consumption. |
| Boundary meter data | UtilityHub | Select included boundary meters and review validation/monthly summary. |
| TLM rows | Reference data / UtilityHub | Select relevant records and show source/version evidence. |
| Transmission and distribution data | UtilityHub/reference data | Display selected values and source evidence. |
| Supply contract | UtilityHub | Display selected contract terms and source evidence. |
| Customer/site hierarchy | UtilityHub | Reference shared IDs and display hierarchy context. |

The current local Tariff Builder inputs remain useful as interim MVP/prototype evidence, but they should not become the long-term system of record.

## Meter And Consumption UX Direction

Future Tariff Builder screens should show UtilityHub-owned meter data in tabular form.

Recommended display:

- meter reference;
- meter type/category;
- tenant or non-tenant indicator;
- tenant/customer where applicable;
- responsibility category;
- available loss level or applicable loss fields;
- voltage where known;
- monthly consumption by reference year;
- validation status;
- inclusion/exclusion status for the tariff year.

Users should select which meters and consumption records are included in a tariff year, rather than creating master meter records in Tariff Builder.

## Boundary Meter UX Direction

Boundary meters should be pulled from UtilityHub.

Tariff Builder should allow the user to:

1. select boundary meters included in the calculation;
2. select the reference period;
3. validate available consumption;
4. show monthly boundary consumption;
5. show reconciliation against selected submeter consumption;
6. record inclusion/exclusion rationale.

Tariff Builder should not create boundary meter masters.

## Reference Data Direction

### TLMs

Transmission Loss Multipliers should sit as reference data because they may apply across customers and sites.

Tariff Builder should select and evidence the relevant TLM data for a tariff year rather than maintain site-specific TLM masters.

### CPI

CPI should be selected by month/year and sourced from a structured ONS source where possible.

Recommended implementation approach:

- use a documented ONS API or structured dataset before considering scraping;
- store selected CPI month/year, index value, source, retrieval timestamp and version;
- calculate tariff-year CPI assumptions from the selected source evidence;
- keep manual override separate and auditable.

### Losses

Losses should not be hardcoded to a site-specific label.

Use generic loss references:

- EHV losses;
- HV losses;
- LV losses;
- other approved loss fields if a site hierarchy requires them.

Required loss fields should depend on the site hierarchy, supply route and customers being billed. Tariff Builder should not force irrelevant EHV/HV/LV fields where they do not apply.

### Transmission, Distribution And Supply Contracts

Transmission and distribution data, plus supply contract terms, should be owned in UtilityHub/reference data and displayed in Tariff Builder when selected for a tariff year.

## Settings Direction: Customer Classes

The current customer-class input should move away from a single free-text style.

Recommended UI direction:

1. User clicks Add customer class.
2. User enters the class name and optional description.
3. The class appears in a table.
4. The table supports edit, delete or deactivate where safe.
5. Future implementation may link customer classes to UtilityHub customers, tenants, meters or mapped groups.

This is a UI improvement only until an approved implementation package changes the component.

## Out Of Scope For This Pack

This decision pack does not implement:

- UtilityHub APIs;
- production sync;
- storage migration;
- shared DTO changes;
- import parser contract changes;
- report total changes;
- tariff calculation changes;
- CPI API integration;
- customer class UI changes;
- meter or consumption table rewrites;
- supply contract integration.

## Implementation Sequencing

Recommended sequence:

1. Confirm UtilityHub shared contracts for customer, site, meter, reading, supply contract and reference data ownership.
2. Create a Tariff Builder tariff model / tariff year contract proposal.
3. Replace local master-style inputs with UtilityHub selection surfaces, one area at a time.
4. Move TLM/CPI/transmission/distribution/supply contract data to reference/UtilityHub-sourced displays.
5. Add customer-class table UX as a narrow UI package.
6. Only after those contracts are stable, implement tariff-impacting selection and aggregation workflows.

## Recommended Decision

Approve this direction:

- UtilityHub is the source of truth for customer/site/meter/consumption/supply/reference data.
- Tariff Builder selects and reviews UtilityHub-owned data for a tariff year.
- Tariff Builder owns tariff-specific methodology, assumptions, selected inputs, calculations and reports.
- Projects should evolve toward tariff models containing annual tariff years.
- Local submeter, TLM, boundary, supply and reference inputs should be treated as interim evidence until UtilityHub integration replaces them.
