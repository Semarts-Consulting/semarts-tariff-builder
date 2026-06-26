# First Release Walkthrough Evidence

Date: 2026-06-24

Status: prepared; manual/browser walkthrough pending.

## Purpose

Provide a controlled evidence record for the first-release walkthrough recommended in `docs/FIRST_RELEASE_READINESS_REVIEW.md`.

This document is deliberately separate from the readiness review. The readiness review states the release position; this document records the actual walkthrough evidence, defects, limitations and release decision once the app is checked in a browser.

## Scope

The walkthrough should confirm that the current app can support controlled internal or selected stakeholder review.

It should not be used to approve unrestricted external production release.

## Walkthrough Environment

| Item | Evidence |
| --- | --- |
| Repository branch | `main` after PR #78, or the latest reviewed release-candidate branch. |
| App route | Local development server. |
| Local run mode | Supported through browser local storage and built-in fallback/reference data; see `docs/LOCAL_ONLY_RUN_MODE.md`. |
| Browser | To be recorded during walkthrough. |
| Tester | To be recorded during walkthrough. |
| Date/time | To be recorded during walkthrough. |

## Minimum Walkthrough Path

| Step | Expected result | Result |
| --- | --- | --- |
| Open the app and project list | App loads without runtime error. | Pending |
| Open the demo/private network project | Project context is visible. | Pending |
| Review aggregate customer-class inputs | Customer classes, annual kWh, customer count and peak demand are understandable. | Pending |
| Review cost pools | Recoverable cost pools and recoverable percentages are visible. | Pending |
| Review allocation methods | Allocation basis and customer-class shares are visible. | Pending |
| Open tariff calculations | Tariff outputs calculate from aggregate inputs. | Pending |
| Review audit trace | Revenue requirement, allocation, rate and recovery trace entries are visible. | Pending |
| Review supply energy p/kWh application | Explicit reviewed supply p/kWh impact is understandable and not presented as automatic derivation. | Pending |
| Open Data Inputs > Site Submeters | Submeter register, consumption, TLM and validation sections are visible. | Pending |
| Review import duplicate handling | Duplicate review messages are understandable where duplicate rows are present. | Pending |
| Open Reports | Stakeholder report view loads. | Pending |
| Review report evidence sections | Submeter, loss, UtilityHub/Meter Map, methodology cost, asset and supply evidence sections are labelled appropriately. | Pending |
| Confirm evidence-only boundaries | Evidence-only sections do not appear to change tariff totals automatically. | Pending |
| Confirm selector API stubs | UtilityHub selector API boundaries return controlled unavailable/evidence-only states until live services are approved. | Pending |
| Confirm limitations are clear | Remaining blockers are understandable for stakeholder review. | Pending |

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

## Current Status

No browser walkthrough result is recorded in this package.

Recommended next action: run the app locally and complete the walkthrough table above, then record a release decision or targeted fix list.
