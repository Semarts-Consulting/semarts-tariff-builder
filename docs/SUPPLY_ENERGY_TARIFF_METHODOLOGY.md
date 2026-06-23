# Supply Energy Tariff Methodology

## Purpose

Supply energy cost is calculated as a p/kWh rate and can be fed into the final tariff as the Energy / kWh element when an explicit supply energy row is supplied to the tariff engine.

This is separate from network AUoS, fixed charges, demand charges and formal exports.

## Calculation Order

The implemented pure service follows the BRS and POTLL workbook pattern, but loss treatment is component-specific. Each p/kWh component declares the point at which it enters the supply stack:

- `NBP`: apply TLM and DNO losses before the private network loss uplift.
- `GSP`: apply DNO losses before the private network loss uplift.
- `Site Meter` or `CM`: include in the site-meter rate before the private network loss uplift.

This avoids applying upstream TLM or DNO losses to charges that are already specified at a later point in the supply stack. The overall built-up site-meter rate is then multiplied by the customer-specific private network losses.

1. Build base supply cost before losses.
2. Convert demand-based charges into p/kWh before passing them into the service.
3. Apply Transmission Loss Multiplier.
4. Add DUoS super red or time-band-related p/kWh charges.
5. Add supplier unit charge at GSP where the model uses all-in day/night rates.
6. Apply DNO distribution loss factor from GSP to site meter.
7. Add site-meter pass-through p/kWh charges such as CCL, Elexon, settlement admin, RO, FiT, metering or admin costs where applicable.
8. Apply private network loss multipliers from site meter to the customer meter level.
9. Apply profit multiplier.

Formula concept:

`site meter p/kWh = (((NBP components * TLM) + GSP components) * DNO loss factor) + Site Meter components + CM components`

`final customer p/kWh = site meter p/kWh * cumulative private network loss multipliers * profit multiplier`

For customer-specific losses:

- EHV customer rate = site meter rate * EHV losses.
- HV customer rate = site meter rate * EHV losses * HV losses.
- LV customer rate = site meter rate * EHV losses * HV losses * LV losses.

## Workbook Regression Targets

The regression tests use the supplied workbook-derived values:

- BRS LV supply element: approximately 22.3211 p/kWh.
- POTLL combined site meter: approximately 27.4008 p/kWh.
- POTLL combined EHV meter: approximately 27.4556 p/kWh.
- POTLL combined HV meter: approximately 28.5264 p/kWh.
- POTLL combined LV meter: approximately 30.2095 p/kWh.

## Tariff Engine Integration

`calculateTariffs` now accepts optional explicit supply energy rows. Each row contains:

- Customer class.
- Supply p/kWh.
- Source row IDs.
- Notes.

When supplied, the tariff engine:

- Converts p/kWh to GBP/kWh.
- Multiplies by the customer-class annual kWh.
- Adds the result to revenue requirement.
- Adds the result to the customer class Energy cost.
- Includes the supply row in audit trace and revenue recovery.

No supply energy row means no change to existing tariff outputs.

## Controls

- Supply p/kWh rows must reference an existing customer class.
- Negative supply p/kWh is rejected.
- The calculation is explicit and opt-in; it does not infer supply costs from evidence-only supply records.
- Day, night and combined rates should be supplied as separate rows or pre-blended only where the methodology has approved the denominator.
- Each charge must carry the loss position specified in the source input. Do not assume all charges are NBP or all charges are CM.
- Customer-specific private network losses are applied to the built-up site-meter rate, not individually inferred from each source line.
- Do not add RO, FiT, CfD, BSUoS, CCL or similar levies twice if the supplier unit rate is already all-in.

## Out Of Scope

- Automatic workbook extraction.
- Automatic Elexon source refresh.
- Storage schema changes.
- Export DTO changes.
- UI editing for the new optional supply energy rows.
- Customer/location hierarchy changes.
