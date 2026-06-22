# Additional Scenario Plan

Date: 2026-06-22

Status: SCN-001 and SCN-005 implemented and green on `main`; remaining scenarios proposed.

Purpose: define the next representative tariff scenarios to strengthen confidence after the approved MVP demo.

## Position

The current live demo validates one private electricity network site with three customer groups and a GBP 45,000 recoverable cost base.

That is enough for the approved internal MVP demo, but not enough for external release readiness. Additional scenarios should be added as narrow packages with expected outputs and reconciliation evidence.

## Scenario Backlog

| ID | Scenario | Purpose | Owner | Priority | Blocks stakeholder demo? | Blocks external release? | Proposed evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCN-001 | Small two-class site | Validate a simpler residential/commercial network with fewer customer groups | PM plus Tariff Engine/QA | High | No | Yes | Implemented in `tests/fixtures/additional-scenarios.ts` and `tests/additional-scenarios.test.ts` |
| SCN-002 | High fixed-cost site | Validate fixed charge sensitivity where customer count drives most recovery | PM plus Tariff Engine/QA | High | No | Yes | Fixture, calculation test, fixed-rate explanation, reconciliation |
| SCN-003 | High consumption-cost site | Validate energy charge sensitivity where annual kWh drives most recovery | PM plus Tariff Engine/QA | High | No | Yes | Fixture, calculation test, energy-rate explanation, reconciliation |
| SCN-004 | Capacity-heavy site | Validate demand charge sensitivity where peak demand drives most recovery | PM plus Tariff Engine/QA | Medium | No | To decide | Fixture, calculation test, demand-rate explanation, reconciliation |
| SCN-005 | Non-recoverable cost element | Validate partial recovery and explain excluded/non-recoverable cost | PM plus Tariff Engine/QA | Medium | No | Yes | Implemented in `tests/fixtures/additional-scenarios.ts` and `tests/additional-scenarios.test.ts` |
| SCN-006 | Validation issue scenario | Validate missing/invalid data warnings without silently correcting assumptions | PM plus Tariff Engine/QA | Medium | No | Yes | Fixture, calculation test, warning evidence, report readiness outcome |

## Sequencing Recommendation

1. Add SCN-002 and SCN-003 next to test rate sensitivity.
2. Add SCN-004 if capacity tariffs are expected in near-term stakeholder review.
3. Add SCN-006 before external release readiness to prove validation behavior.

## Scenario Acceptance Criteria

Each scenario should include:

- Clear input assumptions.
- Customer groups and aggregate customer data.
- Recoverable and non-recoverable cost base where relevant.
- Allocation method by cost category.
- Expected tariff outputs.
- Expected revenue recovery or variance.
- Audit trace expectations.
- A focused regression test.

## Do Not Start Yet

Do not create production UI workflow changes, new export formats, or supply calculation logic as part of scenario expansion. Each scenario package should be calculation/test focused unless a separate UI or contract decision is approved.
