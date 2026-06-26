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
- Selector API stubs can be called by the UI and return controlled unavailable states; they do not make live UtilityHub calls.

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

## Follow-Up

Before public release, record whether the release target requires:

- cloud persistence;
- UtilityHub selector integration;
- authentication and permissions;
- formal export DTOs;
- selected-record persistence by tariff year.
