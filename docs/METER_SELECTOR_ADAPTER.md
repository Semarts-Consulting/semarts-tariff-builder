# Meter Selector Adapter

Date: 2026-06-25

Status: adapter foundation

## Purpose

Tariff Builder can now map UtilityHub meter selector envelopes into local evidence options.

This is the first meter-selection foundation after customer/site selector service-boundary work.

## Scope

This package adds:

- UtilityHub meter selector item types local to Tariff Builder.
- A pure adapter for meter selector responses.
- Tests for available, empty, unavailable and access-denied states.
- Preservation of validation status, validation issue count, source version and snapshot ID.

## Boundaries

This package does not:

- Call UtilityHub APIs.
- Add meter selector UI.
- Change storage.
- Change tariff calculations.
- Change imports, exports, report totals or shared DTOs.
- Make selected UtilityHub meters tariff-driving.

## Next Step

The next safe package is a meter selector readiness/service boundary that uses this adapter with local contract-shaped state before live service calls are introduced.
