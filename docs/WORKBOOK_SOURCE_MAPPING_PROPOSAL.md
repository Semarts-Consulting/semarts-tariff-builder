# Workbook Source Mapping Proposal

Date: 2026-06-22

Status: proposal for review only.

## Purpose

This proposal defines how future workbook imports should trace values back to source workbooks before the app broadens support for airport, port, tenant, onward supply, and local charging models.

This is not an implementation proposal. It does not change import parsers, project storage, shared DTOs, tariff calculations, report output, exports, or UI behaviour.

## Source Documents

- `docs/MODEL_FLEXIBILITY_REVIEW.md`
- `docs/METHODOLOGY_CONFIGURATION_DECISION_PACK.md`
- `docs/METHODOLOGY_CONFIGURATION_CONTRACT_PROPOSAL.md`

## Problem To Solve

The reviewed workbooks use different sheets, labels, row layouts, charge categories, customer structures, and local model conventions. Future import support needs a traceable mapping layer so the app can show where each normalised value came from and avoid silently treating workbook-specific assumptions as product rules.

Without a mapping contract, import logic risks becoming brittle, hardcoded to one customer workbook, and difficult to audit.

## Proposed Mapping Record

Future implementation should consider a mapping record with these descriptive fields, subject to shared contract review:

| Field | Purpose |
| --- | --- |
| Workbook source ID | Identifies the uploaded workbook or source file. |
| Workbook display name | Human-readable workbook name for audit/report display. |
| Worksheet name | Source worksheet. |
| Source section | Optional section or table label, such as Tariff Sheet, Asset Data, Tenant Data, AUoS, PUoS, or TLM. |
| Header label | Header or row label used to locate the value. |
| Row key | Stable row identifier where available, such as customer reference, meter ID, asset ID, tariff class, or cost line. |
| Column key | Stable column identifier where available, such as month, charge element, unit, year, or tariff class. |
| Cell reference | Optional cell address when available. |
| Raw value | Value as read from workbook. |
| Normalised value | Value after parser normalisation. |
| Normalised unit | Unit after parser normalisation. |
| Mapping confidence | High, medium, low, or unresolved. |
| Validation issue | Any issue produced by mapping or normalisation. |
| Manual override flag | Whether a user/manual decision changed the mapped value. |

## Mapping Confidence

Mapping confidence should be explicit:

- High: matched by stable sheet, header, and row key.
- Medium: matched by recognisable labels but needs review because layout differs.
- Low: value was found by fallback logic or weak label matching.
- Unresolved: value could not be mapped without manual review.

Low or unresolved mapping should not silently feed tariff-impacting calculations.

## Proposed Mapping Boundaries

### Workbook Source

Projects may eventually need more than one workbook source. Port and airport models can split evidence across tariff model files, HH data extracts, supply files, asset sheets, and forecast files.

The first production design should not assume one workbook per project unless that is explicitly approved.

### Header And Row Keys

Headers alone are not enough. A future mapping contract should preserve row keys and column keys so repeated labels, monthly columns, tariff classes, and customer rows can be audited.

### Raw Versus Normalised Values

Raw values and normalised values should both be retained in audit context. This is important for units, dates, percentages, currency, kVA/kW, p/kWh, monthly consumption, and annualised amounts.

### Manual Decisions

Manual decisions should be recorded separately from parser output. The parser should not infer customer applicability, allocation treatment, recovery treatment, or loss treatment from weak workbook labels.

## Explicitly Out Of Scope

This proposal does not include:

- Import parser implementation.
- New TypeScript DTOs.
- Storage changes.
- Workbook upload UI changes.
- Automatic workbook replication.
- Calculation engine changes.
- Report/export changes.
- Any tariff-impacting use of mapped workbook values.

## Required Reviews Before Implementation

| Review | Owner | Required Before |
| --- | --- | --- |
| Mapping contract review | PM plus Data Import | Any parser or DTO implementation. |
| Calculation impact review | Tariff Engine | Any mapped value feeds calculation. |
| Regression review | QA | Any new workbook-derived fixture or scenario. |
| Report wording review | UI Flow plus PM | Any mapped-source evidence appears in stakeholder reports. |

## Recommended Next Packages

1. `MODEL-004` representative workbook-derived scenario plan.
2. `MODEL-005` methodology configuration type proposal, only after owner approval.
3. `MODEL-006` workbook mapping contract implementation proposal, only after mapping/scenario review.

## Recommendation

Approve this proposal as a traceability direction only. Do not implement broad workbook mapping until representative scenarios and shared contract reviews are complete.
