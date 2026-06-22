# Supply Rule Decisions

Date: 2026-06-22

Status: user decisions recorded.

Purpose: record business-rule decisions supplied by the user for supply calculation, losses, TNUoS Triad, DUoS time bands, annualisation, input validity, and time-of-use handling.

## Losses Basis

Approved definitions:

- `CM`: Customer Meter. Charges use metered customer consumption with no distribution or transmission losses applied.
- `GSP`: Grid Supply Point. Charges use customer consumption uplifted for distribution losses only.
- `NBP`: workbook shorthand for national purchase or settlement volume. Charges use customer consumption uplifted for transmission losses first, then distribution losses.

Display rule:

- The app should not display `NBP` without a full description because it could be confused with other industry terms.

Volume basis:

- CM volume = metered kWh.
- GSP volume = metered kWh x distribution loss factor.
- NBP volume = metered kWh x transmission loss factor x distribution loss factor.

Loss adjustments:

- Loss adjustments are multiplicative, not additive.
- Assume losses are not already embedded unless the user explicitly selects a volume basis where the input value is already at that level.
- If source volume is entered as CM, apply the selected loss uplift.
- If source volume is already entered as GSP, do not reapply distribution losses.
- If source volume is already entered as NBP, do not reapply transmission or distribution losses.
- The app must avoid double-counting losses.

## TNUoS Triad

Approved rules:

- The current methodology does not use kVA to calculate TNUoS Triad.
- No automatic kVA to kW conversion should be applied.
- No power factor is used in the current methodology.
- Power factor is not applicable unless a future methodology version explicitly introduces it.
- If only kVA data is available, the app should not calculate Triad unless a future methodology introduces a defined power factor and conversion rule.

Triad calculation:

- Triads are the three half-hour settlement periods of highest GB transmission system demand in the Triad season.
- The Triad season is November to February inclusive.
- The three Triad periods must be separated by at least ten clear days.
- Customer Triad kW = average customer kW across the three Triad settlement periods.
- TNUoS Triad charge = Customer Triad kW x applicable TNUoS tariff.
- For tariff modelling, use previous known Triad timings against customer half-hourly kW data unless a different user-selected methodology is introduced later.
- If the charge is recovered through customer tariffs, allocation should be based on the customer's contribution to Triad demand where data exists.
- If customer-specific Triad data does not exist, the app must require a defined proxy allocation method before calculating.

## DUoS Time Bands

Approved rules:

- DUoS time bands should come from the relevant DNO LC14 charging statement.
- The app should not derive DUoS time bands nationally.
- DUoS time bands are DNO-specific and tariff-year-specific.
- The app should store DUoS time bands by DNO and tariff year.

Bank holidays:

- Bank holiday treatment should follow the relevant DNO LC14 statement.
- The app should allow bank holiday treatment to be configured by DNO, tariff year, and time-band rule.

## Annualisation

Approved rules:

- `per day` should use actual billing-period days.
- Daily charge = rate per day x number of days in the billing period.
- `per month` should use 12 months for annualisation.
- Annual charge = monthly charge x 12.
- For billing-period calculation, use whole months where the billing period is monthly or require a specific proration rule if partial months are supported.

Implementation note:

- Existing Phase 2 annual amount calculation uses 365 days for `per day`. A future package is needed if actual billing-period days are required in production annualisation.

## Supply Mapping And Reporting

The user clarified that more detail is needed before mapping supply charges to customer classes or pass-through reporting can be finalised.

Recommended default for future design:

- Each charge should have a customer applicability rule.
- Each charge should have a reporting category.
- Each charge should have a pass-through flag.

Open clarification:

- Whether each charge applies to all customers or only specific customer classes.
- Whether each charge should be shown separately as a pass-through line item in reporting.
- Whether supply charges should be grouped into customer-facing categories such as energy, network, policy, metering, supplier management, admin, risk, or balancing.

## Input Validity

Approved rules:

- Blank charge names block calculation.
- Blank charge names are not defensible because the app cannot produce a reliable audit trail or customer-facing explanation without a charge name.

## Charge Types And Time-Of-Use

Approved charge categories:

- Fixed daily charge.
- Fixed monthly charge.
- Fixed annual charge.
- Unit rate, flat kWh.
- Unit rate, red kWh.
- Unit rate, amber kWh.
- Unit rate, green kWh.
- Unit rate, super red kWh.
- Unit rate, day kWh.
- Unit rate, night kWh.
- Capacity charge, kVA.
- Excess capacity charge, kVA.
- Reactive power charge, kVArh.
- TNUoS Triad charge, kW.
- BSUoS charge, kWh.
- CfD charge, kWh.
- RO charge, kWh.
- FiT charge, kWh.
- Capacity Market charge, kWh.
- AAHEDC charge, kWh.
- Metering charge.
- Data collection charge.
- Supplier management charge.
- Admin charge.
- Manual adjustment.
- Rebate or credit.

Valid time-of-use rules:

- Flat kWh: no time band.
- Red, amber, green, and super red kWh: use DUoS time bands from the relevant DNO LC14 statement.
- Day or night kWh: use day or night rules only.
- Day/Night does not map to red, amber, green, or super red.
- Fixed daily, monthly, or annual: no time band.
- Capacity, excess capacity, reactive power, metering, data collection, supplier management, and admin: no time band unless the workbook explicitly states otherwise.
- TNUoS Triad: use Triad periods only.
- Manual adjustment, rebate, or credit: no time band by default.

## Custom Time Windows

Approved rules:

- Custom time windows cannot cross midnight.
- If a rule crosses midnight, it should be entered as two separate windows.
- Example: `22:00 to 00:00` and `00:00 to 07:00`.
- The app should reject a single custom time window where the end time is earlier than the start time.

## Remaining Blockers

These decisions do not yet approve supply tariff integration.

Still open:

- Final customer applicability model.
- Reporting category model.
- Pass-through flag semantics.
- Allocation destination for tariff-impacting supply values.
- Whether supply reconciliation is separate from network cost recovery.
- Whether supply report display is evidence-only or tariff-impacting.
