# Live UtilityHub Selector Integration

Date: 2026-06-26

Branch: `codex/live-utilityhub-selector-integration`

## Purpose

Connect Tariff Builder's selector boundary to UtilityHub's local selector API for user testing.

UtilityHub remains the owner of customer, site, meter, reading and reference data. Tariff Builder consumes selector envelopes as evidence and does not make selected data tariff-driving in this package.

## UtilityHub Endpoint

Expected local UtilityHub base URL:

`http://127.0.0.1:5173/api/shared-selectors/tariff`

Expected selector resources:

- `customer-site-context`
- `meters`
- `monthly-consumption`
- `boundary-meters`
- `reference-data`

## Tariff Builder Configuration

Set these values in `.env.local`:

```text
NEXT_PUBLIC_UTILITYHUB_SELECTOR_MODE=live
NEXT_PUBLIC_UTILITYHUB_SELECTOR_BASE_URL=http://127.0.0.1:5173/api/shared-selectors/tariff
```

Restart the Tariff Builder dev server after changing `.env.local`.

## New Project Flow

The new tariff year form now includes a UtilityHub customer/site selector section.

For the current UtilityHub demo data:

- UtilityHub customer ref: `customer-manchester-airport`
- UtilityHub user ref: `user-admin`

Use **Load sites** to fetch customer/site options from UtilityHub. Selecting a site fills the existing customer and site reference fields.

## Evidence-Only Boundary

This package does not:

- persist selected UtilityHub records as tariff-year input selections;
- generate aggregate customer-class rows from UtilityHub consumption;
- make meter, consumption, boundary meter or reference data tariff-driving;
- change tariff calculations;
- change imports, exports, storage, shared DTOs or report totals.

## Validation

Automated tests cover:

- live mode configuration;
- endpoint suffix construction;
- live envelope retrieval;
- available envelope pass-through;
- unavailable transport failures;
- route scope parsing for `userId`, `periodStart`, `periodEnd` and `referenceTypes`.

Direct UtilityHub smoke check from this Codex context failed because `http://127.0.0.1:5173` was not reachable here. Nathan should run the final user test with UtilityHub running locally.
