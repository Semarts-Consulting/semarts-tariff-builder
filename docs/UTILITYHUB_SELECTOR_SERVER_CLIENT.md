# UtilityHub Selector Server Client Boundary

Date: 2026-06-26

Branch: `codex/utilityhub-selector-server-client`

## Purpose

This package defines the server-side boundary Tariff Builder will use before introducing live UtilityHub selector retrieval.

It deliberately does not call UtilityHub yet.

## What It Adds

- Stable endpoint construction for UtilityHub selector resources.
- Tariff-year request scope support:
  - customer ID
  - site ID
  - tariff year
  - reference period start
  - reference period end
- Controlled unavailable selector envelopes for:
  - local mode
  - live mode without endpoint configuration
  - configured endpoint before live retrieval is implemented

## Selector Resources

The boundary currently recognises:

- `customer-site-context`
- `meters`
- `monthly-consumption`
- `boundary-meters`
- `reference-data`

## Out Of Scope

- Fetching from UtilityHub.
- API route implementation.
- Authentication or token handling.
- Browser-side live selector calls.
- Storage of selected UtilityHub records.
- Tariff-driving conversion of UtilityHub selector records.
- Tariff calculation, import, export, report total, shared DTO or storage changes.

## Next Live Package

The next package can replace the configured-but-not-implemented response with a real server-side call once:

- UtilityHub endpoint URLs are confirmed.
- Authentication/session propagation is agreed.
- Response envelope compatibility is confirmed.
- Error, unavailable, empty and access-denied states are accepted.

Selected-record persistence and tariff-driving conversion should remain separate packages.
