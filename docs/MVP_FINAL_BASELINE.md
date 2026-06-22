# MVP Final Verification Baseline

Date: 2026-06-22

Status: green on `main` after PR #25.

Purpose: record the internal MVP candidate verification baseline after adding live demo tariff seed data and the planned additional scenario checks.

## Repository Baseline

- Branch: `main`
- Remote status: `main...origin/main`
- Latest merged PR on `main`: PR #25, validation issue scenario
- Scenario coverage: approved live demo scenario and SCN-001 through SCN-006

## Verification Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Lint | Passed | `npm.cmd run lint` completed without errors |
| Type-check | Passed | `npx.cmd tsc --noEmit --incremental false` completed without errors |
| Focused demo seed test | Passed | `npm.cmd test -- tests/demo-project-defaults.test.ts`: 1 test passed |
| Additional scenario tests | Passed | `tests/additional-scenarios.test.ts`: SCN-001 through SCN-006 covered |
| Tests | Passed | `npm.cmd test`: 14 test files, 71 tests passed |
| Production build | Passed | `npm.cmd run build` completed successfully |

## Candidate Position

The internal MVP candidate remains accepted with limitations. The live demo project now contains the aggregate customer inputs, recoverable cost pools, and allocation methods needed to calculate tariff outputs in the application. Additional calculation coverage now includes fixed, energy, demand, recoverability, and validation-readiness scenarios.

The green baseline supports stakeholder-demo use of the current workflow, provided the demo remains clear that:

- This is an internal MVP candidate.
- It is accepted with limitations.
- It is not an external release commitment.
- It is not formal compliance certification.
- Formal export DTOs, supply calculation, report/export regression evidence, and broader release-readiness checks remain follow-up work.

## Next Action

Use this baseline for stakeholder demo preparation and feedback capture. Any new defects or requested changes should be split into narrow follow-up packages.
