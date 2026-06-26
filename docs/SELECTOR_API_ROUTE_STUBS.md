# Selector API Route Stubs

Date: 2026-06-26

Branch: `codex/selector-api-route-stubs`

## Purpose

This package adds an internal Tariff Builder API boundary for UtilityHub selector resources.

The route stubs return controlled selector-envelope responses through the existing server-client boundary. They do not fetch live UtilityHub data yet.

## Internal Route

Route pattern:

`/api/utilityhub/selectors/[resource]`

Supported resources:

- `customer-site-context`
- `meters`
- `monthly-consumption`
- `boundary-meters`
- `reference-data`

Supported query scope:

- `customerId`
- `siteId`
- `tariffYear`
- `referencePeriodStart`
- `referencePeriodEnd`

## Current Behaviour

The route returns:

- `404` for unknown selector resources.
- `200` with a controlled unavailable selector envelope for supported resources while live retrieval remains unimplemented.

If a UtilityHub selector endpoint is configured, the route can show the resolved endpoint for diagnostics, but it still does not call UtilityHub in this package.

## Internal Client Helper

`lib/utilityhub-selector-api-client.ts` builds stable internal app paths for future UI calls.

The current UI remains on existing local service-boundary state. Runtime UI fetching from the API route remains a separate package.

## Out Of Scope

- Live UtilityHub fetch calls.
- Authentication or session propagation.
- Selected-record persistence.
- Tariff-driving conversion.
- Storage, import, export, shared DTO, report total or calculation changes.

## Next Safe Step

After this package is merged, the next non-tariff-impacting package can wire UI panels to the internal API route while keeping responses read-only and unavailable/evidence-only.

Live UtilityHub calls remain blocked until endpoint shape and authentication are confirmed.
