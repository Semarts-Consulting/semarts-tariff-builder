# Local-Only Run Mode

Date: 2026-06-26

## Purpose

Tariff Builder must remain usable when cloud services are paused or unavailable.

The current application can run locally using built-in sample data and browser storage. Supabase and UtilityHub selector services are optional integration paths, not required for local walkthroughs.

## Current Local Behaviour

- Projects and tariff-year edits are saved to browser local storage.
- Built-in demo/sample data is available when no local projects exist.
- Supply reference data falls back to built-in records if cloud loading fails.
- UtilityHub selector surfaces show local contract-envelope or unavailable states.
- Selector API routes can call UtilityHub when `NEXT_PUBLIC_UTILITYHUB_SELECTOR_MODE=live` and `NEXT_PUBLIC_UTILITYHUB_SELECTOR_BASE_URL` is configured. Without those values, selector surfaces remain local/evidence-only.

## Run Commands

If port 3000 is in use, run on another port:

```powershell
cd "C:\Projects\Semarts Tariff Builder"
npm.cmd run dev -- --port 3001
```

Then open:

`http://localhost:3001`

## Guardrails

Local-only mode is suitable for:

- controlled walkthroughs;
- input workflow review;
- report evidence review;
- calculation review using aggregate customer-class inputs.

Local-only mode is not proof of:

- UtilityHub live data integration;
- Supabase persistence;
- production authentication;
- shared permission enforcement;
- live meter/consumption/reference-data retrieval.
- selector authentication or permission enforcement beyond controlled unavailable/access state handling.

## Live UtilityHub Selector Test

When UtilityHub is running locally, set:

```text
NEXT_PUBLIC_UTILITYHUB_SELECTOR_MODE=live
NEXT_PUBLIC_UTILITYHUB_SELECTOR_BASE_URL=http://127.0.0.1:5173/api/shared-selectors/tariff
```

Restart Tariff Builder and use the New Tariff Year page to load customer/site options for:

- `customer-manchester-airport`
- `user-admin`

## Follow-Up

Before public release, record whether the release target requires:

- cloud persistence;
- UtilityHub selector integration;
- authentication and permissions;
- formal export DTOs;
- selected-record persistence by tariff year.
