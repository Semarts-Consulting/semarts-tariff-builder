# Post-Demo Feedback Log

Date: 2026-06-22

Status: ready for feedback capture.

Purpose: capture feedback after the approved MVP demo and convert it into narrow decisions, fixes, or follow-up packages without expanding MVP scope by default.

## Feedback Classification

Use one classification for each item:

- `Defect`: something demonstrably wrong in the approved MVP workflow.
- `Decision`: a business or product choice required before implementation.
- `Scenario`: an additional tariff/customer/cost case to validate.
- `Enhancement`: useful but not required for the accepted internal MVP candidate.
- `Out of scope`: not part of the current MVP or agreed next milestone.

## Feedback Register

| ID | Source | Feedback | Classification | Owner | Priority | Blocks next step? | Proposed action | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FDB-001 | _TBC_ | _Capture after demo_ | _TBC_ | _TBC_ | _TBC_ | _TBC_ | _TBC_ | Open |

## Triage Rules

- Fix true defects in narrow branches with focused tests.
- Convert business ambiguity into decision packs before coding.
- Convert additional customer/cost examples into scenario packages.
- Keep supply calculation and formal export DTO work separate unless explicitly approved.
- Do not reopen MVP scope for polish unless it blocks commercial understanding.

## Recommended First Triage Questions

1. Does this feedback affect calculation defensibility?
2. Does it affect ability to understand input, allocation, output, audit trace, or reconciliation?
3. Does it reveal a missing business rule?
4. Does it require a new representative scenario?
5. Does it block stakeholder confidence, or is it post-MVP improvement?

## Next Package Selection

After feedback is captured, select one next package:

- Narrow defect fix.
- Additional scenario definition.
- Supply calculation decision pack.
- Report/export DTO decision pack.
- Release-readiness regression pack.
