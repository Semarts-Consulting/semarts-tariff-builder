# Friday Decision Phase Closeout

Date: 2026-06-24

Status: prepared for review.

## Purpose

Record the closeout of the planned Friday packages:

- import review hardening;
- stakeholder walkthrough refresh;
- decision-pack phase closeout.

## Completed Packages

| Package | Status | Evidence |
| --- | --- | --- |
| Import review hardening | Complete in this branch | Submeter import review now catches duplicates inside the imported file as well as duplicates against existing records. |
| Stakeholder walkthrough refresh | Complete in this branch | Demo and submeter walkthrough notes now reflect supply energy, Meter Map, methodology cost and asset valuation decision boundaries. |
| Decision-pack phase closeout | Complete in this branch | Task board, PM control and progress log are updated to show the decision-pack phase is closed pending review and merge. |

## Import Review Hardening Summary

The import review helper now covers:

- duplicate submeter register meters against existing records;
- duplicate submeter register meters inside the imported file;
- duplicate consumption records against existing records;
- duplicate consumption records inside the imported file;
- duplicate Transmission Loss Multiplier records against existing records;
- duplicate Transmission Loss Multiplier records inside the imported file;
- whitespace and casing differences in duplicate detection for meter references and GSP groups.

This remains review-only. It does not change parser contracts, storage, tariff calculations, report totals or exports.

## Stakeholder Walkthrough Refresh Summary

The stakeholder walkthrough now presents these boundaries:

- aggregate customer-class inputs remain tariff-driving;
- submeter and TLM records are evidence-only until approved aggregate generation;
- supply energy p/kWh can affect tariffs only through explicit reviewed application rows;
- UtilityHub / Meter Map owns shared hierarchy and meter references;
- methodology cost evidence does not create tariff cost pools automatically;
- asset evidence does not calculate asset recovery automatically.

## Release Readiness Position

The first-release candidate is stronger after this phase because the main evidence areas now have explicit decision boundaries.

Still not approved without further packages:

- automatic supply evidence derivation;
- submeter-derived tariff denominators;
- UtilityHub / Meter Map production integration;
- methodology-derived cost-pool generation;
- formula-based asset valuation;
- formal machine-readable export DTOs.

## Recommended Next Package

Prepare a first-release readiness review that checks:

1. current demo path;
2. import review messages;
3. report evidence sections;
4. decision-pack limitations;
5. remaining release blockers.

That package should be docs/test focused unless the walkthrough finds a narrow defect.
