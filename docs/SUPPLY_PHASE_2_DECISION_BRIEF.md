# Supply Phase 2 Decision Brief

Date: 2026-06-22

Status: Option A approved by user on 2026-06-22; annual amount implementation merged.

Purpose: record the approved Option A decision that unlocked the completed Phase 2 annual amount implementation.

## Recommendation

Phase 2 proceeded using the approved minimum decision set below and has been implemented as disconnected annual amount calculation.

Do not treat the completed annual amount work as approval for tariff integration, report totals, export fields, import changes, or storage changes. Those remain separate packages after the open integration decisions are answered.

## Minimum Decisions To Unlock Phase 2

### 1. Annualisation

Recommended decision:

- Fixed charges use the charge unit exactly as stated in the source row.
- `per day` uses 365 days unless the tariff year is explicitly configured later.
- `per Month` uses 12 months.
- Annual charges use the entered annual value directly.
- Billing-period or leap-year variants remain out of scope for Phase 2.

Why this is acceptable for Phase 2:

- It is transparent and easy to audit.
- It avoids hidden assumptions about billing calendars.
- It can be replaced later by a tariff-year configuration if needed.

### 2. Capacity Conversion

Recommended decision:

- Do not convert kVA to kW in Phase 2 unless the source charge explicitly requires kW.
- Capacity charges using kVA should calculate against entered kVA.
- Any kW-based charge should remain `Needs business rule` until a power factor is approved.

Why this is acceptable for Phase 2:

- The source input currently captures supply capacity in kVA.
- A default power factor would be a business assumption and should not be invented.

### 3. Input Validity

Recommended decision:

- Blank charge names should block annual amount calculation for that charge line.
- Negative rates should block annual amount calculation for that charge line.
- Invalid MPAN length should remain a validation issue but should not prevent other valid MPAN rows from calculating.
- Charge/time-of-use combinations not explicitly supported should remain `Needs business rule`.

Why this is acceptable for Phase 2:

- It prevents silent calculation of ambiguous charges.
- It keeps row-level calculation independent, so one invalid MPAN does not block the whole supply schedule.

### 4. Supported Phase 2 Charge Lines

Recommended decision:

- Supported: fixed annual, fixed monthly, fixed daily, and capacity charges where the charge unit and denominator are clear.
- Not supported yet: loss-adjusted consumption, DUoS time-band consumption, TNUoS triad calculation, custom time windows, and pass-through recovery treatment.

Why this is acceptable for Phase 2:

- It creates a useful calculation layer without implying full supply tariff readiness.
- It leaves the highest-risk market-specific rules explicit and blocked.

## Decisions To Keep Blocked

Keep these blocked until a later package:

- Losses basis definitions for `CM`, `GSP`, and `NBP`.
- Consumption volume source and loss-adjustment direction.
- DUoS red/amber/green/super red mapping.
- Bank holiday and cross-midnight custom time windows.
- Supply charge allocation into customer classes.
- Pass-through treatment in tariff recovery.
- Report totals and export DTO fields.

## Historical Approval Options

Option A: approved the recommended minimum decision set.

- Outcome: Tariff Engine prepared and completed a narrow Phase 2 implementation for annual amount calculation only.
- Decision: approved by user on 2026-06-22.

Option B: approve with changes.

- Outcome: PM records the amended decisions before Tariff Engine prepares implementation.

Option C: do not approve Phase 2 yet.

- Outcome: supply calculation remains at Phase 1 normalisation only.

## Completed Package And Next Gate

Owner: Tariff Engine, with PM and QA review.

Status: completed for disconnected annual amount calculation. Tariff integration remains separate and is tracked in `docs/SUPPLY_INTEGRATION_OPEN_DECISIONS.md`.

Expected files:

- `lib/supply-calculation-engine.ts`
- `tests/supply-calculation-engine.test.ts`
- `docs/APP_CONTRACTS.md`
- Manager docs only if status changes

Required guardrails:

- No tariff integration.
- No report total changes.
- No export DTO changes.
- No import parser changes.
- No storage or shared project DTO changes unless explicitly approved before coding.
