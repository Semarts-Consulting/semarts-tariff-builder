# Supply Calculation Design Note

## Purpose

This note defines how the new MPAN-level supply inputs should be transformed into calculation-ready data before they are used in tariff outputs.

It started as a design note. Phase 1 normalisation is now implemented as a disconnected service in `lib/supply-calculation-engine.ts` and covered by `tests/supply-calculation-engine.test.ts`.

The implemented Phase 1 scope normalises supply input rows and reports unresolved statuses only. It does not calculate annual amounts and must not feed tariff outputs, report totals, storage, imports, or export DTOs until the remaining business rules are signed off.

The decision pack in `docs/SUPPLY_CALCULATION_DECISION_PACK.md` is the current gate for moving this design into production work. If the design note and decision pack differ, treat the decision pack as the active delivery control.

## Current App Inputs

Supply inputs now sit under Cost Inputs in two sections:

- Transmission & Distribution
- Supply Contract

The shared source data is `ProjectMethodologyInputs.supplyDetails`.

Each supply detail row represents one MPAN and currently captures:

- MPAN
- Supply capacity in kVA
- Voltage: `EHV`, `HV`, `LV`
- Transmission basis: `Fixed` or `Pass Through`
- Distribution basis: `Fixed` or `Pass Through`
- TNUoS fixed charge inputs when transmission is fixed
- DUoS fixed/unit charge inputs when distribution is fixed
- Supply contract charge rows for that MPAN

Each supply contract charge row captures:

- Charge name
- Losses basis: `CM`, `GSP`, `NBP`
- Charge type: `Consumption`, `Fixed`, `Capacity`
- Unit of measurement
- Time of Use: `All times`, `Red`, `Amber`, `Green`, `Super Red`, `Day`, `Night`, `Custom`
- Custom Time of Use configuration:
  - Days of week
  - Bank holiday flag
  - Months
  - Start time
  - End time
- Rate unit: `GBP` or `p`
- Rate

## Calculation Objective

The calculation engine should convert user-entered MPAN supply inputs into normalised charge lines that can later be consumed by tariff calculations, reports, and audit trails.

The first calculation phase should not try to calculate final tariffs. It should only prove that supply inputs can be:

- Validated
- Normalised
- Converted into consistent units
- Split between fixed recovery and pass-through treatment
- Traced back to source MPAN and charge row

## Proposed Calculation Flow

### 1. Validate MPAN Supply Rows

For each supply detail row:

- MPAN should be 13 digits if entered.
- Supply capacity must be non-negative.
- Voltage must be one of `EHV`, `HV`, `LV`.
- Transmission and distribution basis must each be `Fixed` or `Pass Through`.
- Fixed transmission charges must be non-negative.
- Fixed distribution charges must be non-negative.
- Supply contract charge rates must be non-negative.
- Supply contract unit must match charge type.

Existing UI validation already covers most of this, but calculation services should not trust UI state. Validation should also exist in pure functions.

### 2. Normalise Rate Units

Rates should be converted into a standard numeric representation.

Proposed internal convention:

- Monetary values stored as pounds.
- Energy consumption quantity stored as kWh.
- Capacity quantity stored as kVA.
- Day/month/year units remain explicit in the normalised charge line.

Rate unit conversion:

- `GBP` remains unchanged.
- `p` converts to pounds by dividing by 100.

Example:

- `15 p per kWh` becomes `0.15 GBP per kWh`.
- `120 GBP per year` remains `120 GBP per year`.

### 3. Normalise Supply Contract Charge Types

Supply contract charges should map to three calculation categories:

- `Consumption`: rate multiplied by consumption volume.
- `Fixed`: rate multiplied by time period or customer/MPAN count, depending on confirmed business rule.
- `Capacity`: rate multiplied by supply capacity, and possibly by number of days/months, depending on unit.

Allowed units:

- Consumption:
  - `per kWh`
  - `per MWh`
- Fixed:
  - `per day`
  - `per Month`
  - `per year`
- Capacity:
  - `per kVA per day`
  - `per kVA per Month`

Consumption conversion:

- `per kWh` should use kWh directly.
- `per MWh` should divide the applicable kWh quantity by 1,000 before multiplying by the rate.

### 4. Apply Losses Basis

Losses basis is currently captured as:

- `CM`
- `GSP`
- `NBP`

The calculation service should not infer the business meaning until confirmed.

Proposed placeholder treatment:

- Preserve the losses basis on every normalised charge line.
- Do not mathematically adjust volume until the agreed loss factors and direction are confirmed.

Likely future options:

- `CM`: customer meter volume.
- `GSP`: grid supply point adjusted volume.
- `NBP`: network boundary point adjusted volume.

Open question: confirm exact meaning and conversion path for `CM`, `GSP`, and `NBP`.

### 5. Handle Transmission Charges

For each MPAN:

- If Transmission is `Pass Through`, no fixed TNUoS charge lines should be created.
- If Transmission is `Fixed`, create charge lines for:
  - TNUoS non-locational charge per day
  - TNUoS triad charge per kW

Current input gap:

- MPAN supply capacity is captured in kVA, but TNUoS triad is per kW.

Open question: confirm how kVA converts to kW for triad calculations. This likely needs a power factor assumption or another workbook-derived input.

### 6. Handle Distribution Charges

For each MPAN:

- If Distribution is `Pass Through`, no fixed DUoS charge lines should be created.
- If Distribution is `Fixed`, create charge lines for:
  - DUoS fixed charge per day
  - DUoS import capacity pence per kVA per day

Voltage-specific DUoS unit charges:

- If voltage is `LV` or `HV`:
  - DUoS red unit pence per kWh
  - DUoS amber unit pence per kWh
  - DUoS green unit pence per kWh
- If voltage is `EHV`:
  - DUoS super red unit pence per kWh

Open question: confirm how half-hourly HH data maps into red, amber, green, and super red periods.

### 7. Produce Calculation-Ready Charge Lines

The output of the first supply calculation service should be a list of normalised charge lines.

Each line should include:

- Source MPAN
- Source section: Transmission, Distribution, or Supply Contract
- Source charge id where applicable
- Charge name
- Charge category
- Recovery treatment: Fixed Recovery or Pass Through
- Voltage
- Losses basis where applicable
- Unit of measurement
- Time of Use where applicable
- Custom Time of Use configuration where applicable
- Rate unit after normalisation
- Normalised rate in pounds
- Quantity basis
- Calculated annual amount where enough data exists
- Calculation status
- Warnings

Where there is not enough data to calculate an annual amount, the line should still be produced with a clear status such as `Needs volume data` or `Needs business rule`.

## Proposed TypeScript Interfaces

```ts
export type SupplyChargeSource =
  | "Transmission"
  | "Distribution"
  | "Supply Contract";

export type SupplyRecoveryTreatment = "Fixed Recovery" | "Pass Through";

export type SupplyNormalisedChargeType =
  | "Consumption"
  | "Fixed"
  | "Capacity"
  | "Demand";

export type SupplyCalculationStatus =
  | "Calculated"
  | "Excluded"
  | "Needs volume data"
  | "Needs business rule"
  | "Invalid";

export type NormalisedSupplyChargeLine = {
  id: string;
  projectId: string;
  mpan: string;
  supplyDetailId: string;
  source: SupplyChargeSource;
  sourceChargeId: string | null;
  chargeName: string;
  recoveryTreatment: SupplyRecoveryTreatment;
  chargeType: SupplyNormalisedChargeType;
  voltage: "EHV" | "HV" | "LV";
  losses: "CM" | "GSP" | "NBP" | null;
  unitOfMeasurement: string;
  timeOfUse: string;
  customTimeOfUse: {
    daysOfWeek: string[];
    appliesOnBankHolidays: boolean;
    months: string[];
    startTime: string;
    endTime: string;
  } | null;
  ratePounds: number;
  quantity: number | null;
  annualAmount: number | null;
  status: SupplyCalculationStatus;
  warnings: string[];
};

export type SupplyCalculationInput = {
  projectId: string;
  supplyDetails: SupplyDetailsInput[];
  halfHourlyRows: HalfHourlyImportRow[];
};

export type SupplyCalculationResult = {
  projectId: string;
  chargeLines: NormalisedSupplyChargeLine[];
  warnings: string[];
};
```

## Suggested Service Structure

Preferred file:

```text
lib/supply-calculation-engine.ts
```

Initial pure functions:

```ts
normaliseRate(rate: number, rateUnit: SupplyContractRateUnit): number
getSupplyContractUnitOptions(chargeType: SupplyContractChargeType): SupplyContractUnitOfMeasurement[]
validateSupplyCalculationInputs(input: SupplyCalculationInput): string[]
buildTransmissionChargeLines(input: SupplyCalculationInput): NormalisedSupplyChargeLine[]
buildDistributionChargeLines(input: SupplyCalculationInput): NormalisedSupplyChargeLine[]
buildSupplyContractChargeLines(input: SupplyCalculationInput): NormalisedSupplyChargeLine[]
calculateSupplyCharges(input: SupplyCalculationInput): SupplyCalculationResult
```

The service should be pure: no React state, no local storage, no Supabase calls.

## Test Cases Needed

### Validation

- MPAN with 12 digits is invalid.
- Negative supply capacity is invalid.
- Negative TNUoS, DUoS, or supply contract rates are invalid.
- Consumption charge cannot use fixed or capacity units.
- Fixed charge cannot use consumption or capacity units.
- Capacity charge cannot use consumption or fixed units.

### Rate Conversion

- `p` converts to pounds by dividing by 100.
- `GBP` remains unchanged.
- Zero rate remains zero.

### Transmission

- Pass-through transmission creates no fixed transmission charge lines.
- Fixed transmission creates non-locational and triad charge lines.
- TNUoS triad line is flagged `Needs business rule` until kVA-to-kW conversion is confirmed.

### Distribution

- Pass-through distribution creates no fixed distribution charge lines.
- Fixed LV distribution creates red, amber, green, fixed, and capacity charge lines.
- Fixed HV distribution creates red, amber, green, fixed, and capacity charge lines.
- Fixed EHV distribution creates super red, fixed, and capacity charge lines.
- Unit rate lines are flagged `Needs volume data` until HH red/amber/green mapping is confirmed.

### Supply Contract

- Consumption charge with `per kWh` creates a consumption charge line.
- Consumption charge with `per MWh` converts quantity from kWh to MWh.
- Fixed charge with `per year` can calculate annual amount directly.
- Fixed charge with `per day` needs tariff-year day count.
- Fixed charge with `per Month` needs billing/tariff period rule.
- Capacity charge with `per kVA per day` needs day count and supply capacity.
- Capacity charge with `per kVA per Month` needs month count and supply capacity.
- Losses basis is preserved on the output line.
- Time of Use is preserved on the output line.
- Custom Time of Use selections are preserved on the output line.

## Open Business Questions

These should be resolved before implementing annual amount calculations:

1. What exactly do `CM`, `GSP`, and `NBP` mean in the workbook methodology?
2. Which volume should each losses basis use?
3. Are loss adjustments additive, multiplicative, or already embedded in the source HH data?
4. How should MPAN supply capacity in kVA convert to kW for TNUoS triad charges?
5. What power factor should be used, if any?
6. How are DUoS red, amber, green, and super red periods derived from HH data?
7. Are DUoS time bands fixed nationally, DNO-specific, tariff-year-specific, or workbook-configured?
8. For fixed charges, should `per day` use 365, 366, exact tariff period days, or billing period days?
9. For fixed charges, should `per Month` use 12, actual billing months, or project billing frequency?
10. Should Supply Contract charges be allocated to customer classes directly by MPAN, by tenant, or by network level?
11. Should pass-through charges appear in reports as excluded, or be listed separately as pass-through only?
12. Should blank charge names be allowed in calculations, or should they block calculation?
13. Which Time of Use options are valid for each Supply Contract charge type?
14. Should Day/Night be treated separately from Red/Amber/Green/Super Red, or mapped into the same HH period model?
15. For custom Time of Use, should bank holidays mean include only bank holidays, also include bank holidays, or override the selected weekday rule?
16. Should custom time windows be allowed to cross midnight?

## Recommended Phase 1 Implementation

Implement only the normalisation layer:

- Add `lib/supply-calculation-engine.ts`.
- Add interfaces for normalised supply charge lines.
- Convert MPAN inputs into charge lines.
- Preserve source references for audit trail.
- Add tests for validation, rate unit conversion, pass-through exclusion, and voltage-specific DUoS line creation.
- Do not calculate final tariff outputs yet.

This phase is safe because it does not change tariff results. It creates a tested intermediate layer that can be reviewed against the Excel model.

Phase 1 has been implemented and merged through PR #30. It remains a disconnected normalisation layer only; it must not add tariff integration, stakeholder report totals, or formal export DTO fields.

## Recommended Phase 2 Implementation

Add annual amount calculations where business rules are clear:

- Supply Contract fixed `per year`.
- Supply Contract capacity rates once day/month handling is confirmed.
- DUoS fixed and import capacity charges once tariff period days are confirmed.

Keep unclear charge lines marked as `Needs business rule`.

## Recommended Phase 3 Implementation

Integrate calculated supply amounts into tariff outputs:

- Add supply totals to dashboard and reports.
- Split fixed recovery and pass-through reporting.
- Feed fixed recovery amounts into tariff calculation classes.
- Add audit report tables showing source MPAN, source charge, unit conversion, quantity, and annual amount.

## Risks

- Copying Excel logic too early could encode hidden assumptions without review.
- Losses treatment is likely material and should not be guessed.
- DUoS time band mapping depends on rules not yet represented in the app.
- TNUoS triad calculation needs kW or a confirmed kVA-to-kW conversion.
- Existing `lib/calculation-engine.ts` is class/cost-pool based and should not be overloaded with MPAN methodology logic. A separate supply calculation service is cleaner.
