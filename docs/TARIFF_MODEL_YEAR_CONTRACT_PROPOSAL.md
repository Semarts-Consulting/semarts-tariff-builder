# Tariff Model And Tariff Year Contract Proposal

Date: 2026-06-24

Status: proposal; production implementation remains gated.

## Purpose

Define the proposed contract for long-lived tariff models and annual tariff years before any storage, UI terminology or calculation changes are made.

This package supports the shift from one-off "projects" to tariff models with year-on-year tariff populations. It is intentionally docs-only.

## Product Concepts

| Concept | Meaning | Source of truth |
| --- | --- | --- |
| Tariff model | Long-lived container for a customer/site/private network tariff methodology, such as `POTLL Tariffs`. | Tariff Builder, referencing UtilityHub customer/site IDs. |
| Tariff year | Annual tariff population for a model, including selected inputs, assumptions, methodology choices and outputs. | Tariff Builder. |
| Input selection | Tariff-year-specific selection of UtilityHub-owned source records and Tariff Builder-owned tariff inputs. | Tariff Builder selection records, UtilityHub source records. |
| Calculation run | Reproducible calculation snapshot for draft, review, final or superseded outputs. | Tariff Builder. |

## Proposed Tariff Model Fields

Minimum proposed fields:

| Field | Purpose | Notes |
| --- | --- | --- |
| `tariffModelId` | Stable Tariff Builder identifier. | New Tariff Builder-owned ID. |
| `name` | User-facing model name. | Example: `POTLL Tariffs`. |
| `utilityHubCustomerId` | Link to UtilityHub customer. | Required once UtilityHub contract exists. |
| `utilityHubSiteId` | Link to UtilityHub site/private network. | Required for site-specific tariffs. |
| `status` | Model lifecycle state. | Suggested values: `active`, `inactive`, `archived`. |
| `methodologyFamily` | Broad methodology category. | Examples: private network cost recovery, airport, port. Values should remain configurable later. |
| `ownerUserId` | Responsible owner. | UtilityHub-owned user reference once shared auth exists. |
| `createdAt` | Created timestamp. | Audit support. |
| `updatedAt` | Updated timestamp. | Audit support. |

Tariff model records must not duplicate customer, site, building, floor, meter, supply point or meter reading masters.

## Proposed Tariff Year Fields

Minimum proposed fields:

| Field | Purpose | Notes |
| --- | --- | --- |
| `tariffYearId` | Stable Tariff Builder identifier. | New Tariff Builder-owned ID. |
| `tariffModelId` | Parent tariff model reference. | Required. |
| `yearLabel` | User-facing tariff year. | Example: `2026`. |
| `referencePeriodStart` | Start of consumption/source evidence period. | Required before input readiness can be marked complete. |
| `referencePeriodEnd` | End of consumption/source evidence period. | Required before input readiness can be marked complete. |
| `effectiveFrom` | Date tariffs are intended to apply from. | May differ from reference period. |
| `effectiveTo` | Date tariffs are intended to apply to. | Optional for draft years. |
| `status` | Tariff year lifecycle state. | Suggested values below. |
| `inputReadinessStatus` | Input completeness and review state. | Separate from calculation output readiness. |
| `calculationReadinessStatus` | Whether the year is ready to calculate. | Should depend on reviewed inputs and accepted warnings. |
| `reviewDecision` | Owner decision for the tariff year. | Draft, accepted with limitations, approved, rejected or superseded. |
| `createdAt` | Created timestamp. | Audit support. |
| `updatedAt` | Updated timestamp. | Audit support. |

## Suggested Status Values

### Tariff Year Status

| Status | Meaning |
| --- | --- |
| `draft` | Year is being assembled and inputs are incomplete or under review. |
| `input-review` | Inputs have been selected and are being checked. |
| `calculation-review` | Calculation outputs exist and are being reviewed. |
| `approved` | Year has been approved for its intended use. |
| `superseded` | Year has been replaced by a later approved run or correction. |
| `archived` | Year is retained for history but no longer active. |

### Input Readiness Status

| Status | Meaning |
| --- | --- |
| `not-started` | No meaningful tariff-year input selection has started. |
| `in-progress` | Inputs are being selected or entered. |
| `needs-review` | Inputs exist but have warnings, gaps or assumptions requiring review. |
| `blocked` | Required source data or decisions are missing. |
| `ready-for-calculation` | Inputs are reviewed enough for calculation to proceed. |

## Proposed Input Selection Groups

Each tariff year should eventually contain or reference these groups:

| Group | Source | Tariff Builder responsibility |
| --- | --- | --- |
| Customer/site context | UtilityHub | Reference selected customer/site and show hierarchy context. |
| Meter and consumption selection | UtilityHub | Select reviewed meters/consumption for evidence or future aggregate generation. |
| Boundary meter selection | UtilityHub | Select included boundary meters and record reconciliation review. |
| Reference data selection | UtilityHub/reference data | Select TLM, CPI, transmission, distribution and supply contract source evidence. |
| Tariff-specific costs | Tariff Builder | Capture direct tariff-building costs and methodology adjustments. |
| Allocation choices | Tariff Builder | Record allocation methods and assumptions. |
| Customer classes | Tariff Builder, later linked to UtilityHub | Maintain reviewed classes used by tariff calculations. |
| Limitations and sign-off | Tariff Builder | Record accepted limitations, exclusions and owner decisions. |

## Proposed UI Behaviour

The first implementation should avoid broad terminology changes. Recommended UI sequence:

1. Keep existing project screens stable.
2. Add a clear "Tariff model / tariff year" concept in labels or supporting copy where low risk.
3. Add a narrow setup surface for model name, tariff year, reference period and status.
4. Avoid changing storage until a separate implementation package is approved.
5. Avoid replacing existing project routes until migration and backward compatibility are explicitly planned.

## Migration Principles

If this contract is later implemented:

- existing projects should be treated as initial tariff models or tariff years through a compatibility layer;
- no existing local project data should be lost;
- sample/demo data should continue to open;
- calculation behaviour should remain unchanged unless a separate calculation package approves a change;
- UtilityHub IDs should be additive at first, not mandatory for historical local records;
- migration should be reversible or clearly documented.

## Out Of Scope

This proposal does not implement:

- production storage changes;
- route or navigation changes;
- shared DTO changes;
- UtilityHub API integration;
- data migration;
- project-to-model renaming in code;
- calculation changes;
- report total changes;
- import parser changes;
- export changes.

## Acceptance Criteria For A Future Implementation

A future implementation package should prove:

- existing local projects still load;
- tariff model/year data is clearly separated from UtilityHub-owned customer/site/meter/reading masters;
- tariff year reference period and effective period are visible;
- input readiness is separate from calculation readiness;
- calculation output values are unchanged unless explicitly approved;
- tests cover existing project compatibility and new model/year setup behaviour.

## Recommended Next Package

Prepare an input selection data model proposal. It should define how a tariff year references UtilityHub source records and tariff-specific inputs without changing current storage or calculation behaviour.
