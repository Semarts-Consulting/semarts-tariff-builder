# MVP Final Verification Baseline

Date: 2026-06-22

Status: green on `codex/demo-project-tariff-seed`; ready for PR review.

Purpose: record the internal MVP candidate verification baseline after adding live demo project tariff seed data.

## Repository Baseline

- Branch: `codex/demo-project-tariff-seed`
- Base branch: `main`
- Latest merged PR on `main`: PR #14, final MVP verification baseline
- Package scope: seed the live demo project with representative customer, cost, and allocation data

## Verification Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Lint | Passed | `npm.cmd run lint` completed without errors |
| Type-check | Passed | `npx.cmd tsc --noEmit --incremental false` completed without errors |
| Focused demo seed test | Passed | `npm.cmd test -- tests/demo-project-defaults.test.ts`: 1 test passed |
| Tests | Passed | `npm.cmd test`: 13 test files, 65 tests passed |
| Production build | Passed | `npm.cmd run build` completed successfully |

## Candidate Position

The internal MVP candidate remains accepted with limitations. The live demo project now contains the aggregate customer inputs, recoverable cost pools, and allocation methods needed to calculate tariff outputs in the application.

The green baseline supports stakeholder-demo use of the current workflow, provided the demo remains clear that:

- This is an internal MVP candidate.
- It is accepted with limitations.
- It is not an external release commitment.
- It is not formal compliance certification.
- Formal export DTOs, supply calculation, broader scenarios, and broader release regression evidence remain follow-up work.

## Next Action

Use this baseline for stakeholder demo preparation and feedback capture. Any new defects or requested changes should be split into narrow follow-up packages.
