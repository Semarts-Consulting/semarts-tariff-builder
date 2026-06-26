# First Release Walkthrough Evidence

Date: 2026-06-26

Status: accepted for controlled walkthrough.

## Purpose

Provide a controlled evidence record for the first-release walkthrough recommended in `docs/FIRST_RELEASE_READINESS_REVIEW.md`.

This document is deliberately separate from the readiness review. The readiness review states the release position; this document records the actual walkthrough evidence, defects, limitations and release decision once the app is checked in a browser.

## Scope

The walkthrough should confirm that the current app can support controlled internal or selected stakeholder review.

It should not be used to approve unrestricted external production release.

## Walkthrough Environment

| Item | Evidence |
| --- | --- |
| Repository branch | `main` after PR #98 selector stub UI release batch. |
| App route | Local development server. |
| Local run mode | Supported through browser local storage and built-in fallback/reference data; see `docs/LOCAL_ONLY_RUN_MODE.md`. |
| Browser | User local browser. |
| Tester | Nathan. |
| Date/time | 2026-06-26, after PR #98 merge. |

## Minimum Walkthrough Path

| Step | Expected result | Result |
| --- | --- | --- |
| Open the app and project list | App loads without runtime error. | Accepted |
| Open the demo/private network project | Project context is visible. | Accepted |
| Review aggregate customer-class inputs | Customer classes, annual kWh, customer count and peak demand are understandable. | Accepted |
| Review cost pools | Recoverable cost pools and recoverable percentages are visible. | Accepted |
| Review allocation methods | Allocation basis and customer-class shares are visible. | Accepted |
| Open tariff calculations | Tariff outputs calculate from aggregate inputs. | Accepted |
| Review audit trace | Revenue requirement, allocation, rate and recovery trace entries are visible. | Accepted |
| Review supply energy p/kWh application | Explicit reviewed supply p/kWh impact is understandable and not presented as automatic derivation. | Accepted |
| Open Data Inputs > Site Submeters | Submeter register, consumption, TLM and validation sections are visible. | Accepted |
| Review import duplicate handling | Duplicate review messages are understandable where duplicate rows are present. | Accepted |
| Open Reports | Stakeholder report view loads. | Accepted |
| Review report evidence sections | Submeter, loss, UtilityHub/Meter Map, methodology cost, asset and supply evidence sections are labelled appropriately. | Accepted |
| Confirm evidence-only boundaries | Evidence-only sections do not appear to change tariff totals automatically. | Accepted |
| Confirm selector API stubs | UtilityHub selector API cards show controlled unavailable/evidence-only states until live services are approved. | Accepted |
| Confirm limitations are clear | Remaining blockers are understandable for stakeholder review. | Accepted |

## Required Evidence Notes

Record these during the walkthrough:

- browser and viewport used;
- project or demo data used;
- any runtime errors;
- any confusing labels or wording;
- any missing evidence sections;
- whether tariff totals reconcile to approved aggregate inputs;
- whether evidence-only boundaries are clear;
- whether any defect blocks controlled stakeholder walkthrough.

## Current Guardrails

The walkthrough must preserve these boundaries:

- aggregate customer-class inputs remain the tariff-driving path;
- submeter and TLM evidence remain evidence-only unless reviewed aggregate generation is approved;
- supply p/kWh affects tariffs only through explicit reviewed application rows;
- UtilityHub / Meter Map owns shared hierarchy and meter masters;
- UtilityHub selector route stubs must not be presented as live UtilityHub data integration;
- methodology cost evidence does not automatically create cost pools;
- asset evidence does not calculate annuity, depreciation or tariff recovery automatically;
- formal machine-readable export DTOs remain out of scope.

## Result Categories

Use one of these after the walkthrough:

| Result | Meaning | Next action |
| --- | --- | --- |
| Accepted for controlled walkthrough | No blocker found for internal or selected stakeholder review. | Record release decision. |
| Accepted with minor defects | No blocker, but minor defects or wording issues need follow-up. | Create narrow fix package. |
| Fixes required before walkthrough | A defect blocks controlled stakeholder review. | Prioritise fixes before release decision. |
| Scope decision required | Walkthrough raises a business or methodology decision. | Record decision question and stop implementation. |

## Result

Accepted for controlled walkthrough.

No defect was reported from the user test.

## Current Status

The browser walkthrough result is recorded as accepted.

Recommended next action: record the controlled release decision, then decide whether the next workstream is live UtilityHub selector integration, selected-input persistence, or release hardening.
