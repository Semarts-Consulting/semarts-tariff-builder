# Submeter Reconciliation And Loss Foundations

## Purpose

This package adds service-level foundations for:

- Reconciling submeter consumption against boundary meter imports.
- Applying Transmission Loss Multipliers to half-hourly consumption.
- Classifying meter responsibility categories through typed evidence rules.

These foundations are not yet tariff-impacting.

## Reconciliation Foundation

`lib/submeter-reconciliation.ts` calculates:

- Boundary meter import total consumption.
- Included submeter consumption.
- Excluded records with reasons.
- Under-recorded consumption.
- Over-recorded consumption.
- Unknown internal usage.
- Reconciliation variance in kWh.
- Reconciliation variance as a percentage.
- Warning status.
- Audit trace entries.

Default threshold values are configurable:

- Green: up to 1%.
- Amber: above 1% and up to 3%.
- Red: above 3%.

These are starting defaults only and are not final commercial tolerance rules.

## Loss Adjustment Foundation

`lib/loss-adjusted-consumption.ts` applies TLMs only to half-hourly consumption records with exactly 48 settlement periods.

It returns:

- Raw consumption.
- Applied multiplier.
- Loss-adjusted consumption.
- Missing multiplier warnings.
- Unsupported non-HH format warnings.
- Audit trace entries.

It does not:

- Overwrite raw consumption.
- Approximate missing multipliers.
- Apply TLMs to monthly, quarterly or annual records.
- Feed adjusted values into tariff calculations.

## Responsibility Rule Foundation

`lib/meter-responsibility-rules.ts` defines provisional evidence rules for:

- Tenant.
- Network Operator.
- Landlord.
- Shared Asset.
- EV Asset.
- Plant Room.
- Infrastructure.
- Other Internal Use.

The rules can identify whether a category is recoverable, excluded from customer charging, allocated to all users, linked to a specific customer class, landlord/common-area, or informational only.

These rules are not used for final tariff denominators until approved.

## Required Approvals Before Tariff Impact

Approval is still required before:

- Final reconciliation tolerance thresholds are treated as policy.
- Submeter-derived values replace or supplement aggregate customer-class inputs.
- TLM-adjusted consumption affects tariff denominators.
- Responsibility categories drive customer charges.
- Non-HH consumption is profiled into HH periods.
