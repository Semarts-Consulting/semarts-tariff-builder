# WB-001 Fixture Implementation Proposal

Date: 2026-06-22

Status: approved for test-only implementation.

## Purpose

This proposal converts `docs/WB_001_AIRPORT_CUSTOMER_CLASS_SCENARIO.md` into a concrete test-only fixture package.

The fixture should prove that the existing tariff calculation engine can represent a BRS/STN-style airport customer-class scenario using current calculation inputs only.

This package must not change production calculation logic, import parsing, storage, shared DTOs, report totals, export DTOs, or UI behaviour.

## Implementation Boundary

Allowed implementation files:

- `tests/fixtures/workbook-derived-scenarios.ts`
- `tests/workbook-derived-scenarios.test.ts`
- `docs/LONG_RUN_PROGRESS_LOG.md`
- manager docs only after validation.

Explicitly out of scope:

- `lib/calculation-engine.ts`
- `types/project.ts`
- `lib/*-import.ts`
- `lib/project-storage.ts`
- `components/*`
- report/export code
- supply tariff integration
- source mapping contracts

## Scenario Inputs

Project ID:

- `wb-001-airport-customer-class`

Customer classes:

| Customer class | Customer count | Annual kWh | Peak demand / capacity input |
| --- | ---: | ---: | ---: |
| Terminal retail | 12 | 2,400,000 | 1,500 |
| Airside operations | 4 | 8,000,000 | 3,000 |
| EV charging | 2 | 1,200,000 | 1,000 |

Implementation note:

- The current calculation engine has a `peakDemandKw` field and demand tariff component. For this test-only fixture, the approved capacity values are placed into `peakDemandKw` so the existing demand allocation path can be used without production contract changes.

## Recoverable Cost Pools

| Cost pool | Annual amount | Recoverable % | Tariff component | Allocation basis |
| --- | ---: | ---: | --- | --- |
| Network asset annuity | 180,000 | 100 | Demand | Capacity / demand input |
| Network maintenance | 90,000 | 100 | Energy | Annual kWh |
| Customer administration | 36,000 | 100 | Fixed | Meter/customer count |

Recoverable revenue target:

- 306,000.

## Allocation Shares

Customer administration by customer count:

| Customer class | Basis | Share |
| --- | ---: | ---: |
| Terminal retail | 12 / 18 | 66.6666666667% |
| Airside operations | 4 / 18 | 22.2222222222% |
| EV charging | 2 / 18 | 11.1111111111% |

Network maintenance by annual kWh:

| Customer class | Basis | Share |
| --- | ---: | ---: |
| Terminal retail | 2,400,000 / 11,600,000 | 20.6896551724% |
| Airside operations | 8,000,000 / 11,600,000 | 68.9655172414% |
| EV charging | 1,200,000 / 11,600,000 | 10.3448275862% |

Network asset annuity by capacity / demand input:

| Customer class | Basis | Share |
| --- | ---: | ---: |
| Terminal retail | 1,500 / 5,500 | 27.2727272727% |
| Airside operations | 3,000 / 5,500 | 54.5454545455% |
| EV charging | 1,000 / 5,500 | 18.1818181818% |

## Expected Class Results

| Customer class | Fixed cost | Energy cost | Demand cost | Total allocated cost | Fixed charge/customer | Energy charge/kWh | Demand charge/kW |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Terminal retail | 24,000.00 | 18,620.69 | 49,090.91 | 91,711.60 | 2,000.00 | 0.0077586207 | 32.7272727273 |
| Airside operations | 8,000.00 | 62,068.97 | 98,181.82 | 168,250.78 | 2,000.00 | 0.0077586207 | 32.7272727273 |
| EV charging | 4,000.00 | 9,310.34 | 32,727.27 | 46,037.62 | 2,000.00 | 0.0077586207 | 32.7272727273 |

Expected reconciliation:

- Revenue requirement: 306,000.
- Allocated cost: 306,000.
- Unallocated cost: 0.
- Revenue recovered: yes.
- Unbalanced allocation count: 0.
- Validation issues: none.

## Evidence-Only Fixture Metadata

The fixture may include metadata that is not passed into `calculateTariffs`.

| Evidence item | Value | Treatment | Expected assertion |
| --- | ---: | --- | --- |
| AUoS/local network evidence | 42,000 | Evidence-only | Not included in cost pools passed to `calculateTariffs`. |
| Supplier pass-through evidence | 75,000 | Evidence-only/pass-through | Not included in network tariff recovery target. |
| Unresolved workbook row | 8,500 | Excluded pending review | Not included in cost pools or allocation rows passed to `calculateTariffs`. |

The test should assert that evidence-only and unresolved values are kept outside the tariff calculation inputs.

## Test Acceptance Criteria

The WB-001 regression test should prove:

- The fixture has three airport customer classes.
- The recoverable cost pools total 306,000.
- The allocation rows total 100% for each cost pool.
- `calculateTariffs` returns a revenue requirement of 306,000.
- `allocatedCost` reconciles to `revenueRequirement` within the existing tolerance.
- `unallocatedCost` is zero within tolerance.
- `validationIssues` is empty.
- Class-level fixed, energy, demand, and total allocated costs match expected values.
- Rate derivation values match expected values.
- Audit trace includes:
  - revenue requirement entries,
  - cost allocation entries,
  - class total entries,
  - rate derivation entries,
  - revenue recovery reconciliation.
- Evidence-only and unresolved fixture metadata are not passed as calculation inputs.

## Validation Plan

For Package B:

1. Run focused test:
   - `npx.cmd vitest run tests/workbook-derived-scenarios.test.ts`
2. Record outcome in `docs/LONG_RUN_PROGRESS_LOG.md`.
3. Run full validation after Package B or after Package C, depending on package progress:
   - `npm.cmd run lint`
   - `npx.cmd tsc --noEmit --incremental false`
   - `npm.cmd test`
   - `npm.cmd run build`

## Stop Conditions

Stop rather than changing production code if:

- The fixture cannot reconcile using the current calculation engine.
- Evidence-only metadata requires shared DTO changes.
- The existing demand component cannot safely represent the approved capacity-input test path.
- A calculation behaviour change appears necessary.
