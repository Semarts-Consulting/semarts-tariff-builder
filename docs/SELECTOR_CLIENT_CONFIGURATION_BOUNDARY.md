# Selector Client Configuration Boundary

Date: 2026-06-26

Branch: `codex/selector-client-configuration-boundary`

## Purpose

This package adds a safe configuration boundary before Tariff Builder starts making live UtilityHub selector calls.

It allows the app to distinguish between:

- Local contract-envelope mode.
- Live mode requested but missing an endpoint.
- Live endpoint configured but network retrieval not yet implemented.

## Current Behaviour

By default, selector services remain in local contract-envelope mode.

If live mode is requested without an endpoint, selector services return explicit unavailable states.

If a live endpoint is configured, selector services still return explicit unavailable states. This is intentional: live network retrieval remains a separate package.

## Scope

In scope:

- Shared selector client configuration helper.
- Explicit unavailable selector envelope helper.
- Service-boundary support for safe live-mode failure states.
- Regression tests for default local mode, missing endpoint, and configured-but-not-implemented endpoint states.

Out of scope:

- Fetching from UtilityHub.
- Adding API routes.
- Persisting selected UtilityHub records.
- Changing tariff calculations.
- Changing imports, exports, storage, shared DTOs or report totals.
- Making selected UtilityHub data tariff-driving.

## Configuration

The boundary recognises:

- `NEXT_PUBLIC_UTILITYHUB_SELECTOR_MODE=live`
- `NEXT_PUBLIC_UTILITYHUB_SELECTOR_BASE_URL=<UtilityHub selector endpoint>`

These values do not trigger network calls in this package. They only change the explicit selector service state.

## Follow-Up Package

The next live-integration package can replace the configured-but-not-implemented path with a real UtilityHub client call after:

- UtilityHub confirms endpoint shape and authentication path.
- Browser/server execution boundary is agreed.
- Permission and access-denied handling is accepted.
- Selected-record persistence remains explicitly out of scope or has a separate approved package.
