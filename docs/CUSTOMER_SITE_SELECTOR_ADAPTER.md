# Customer/Site Selector Adapter

Date: 2026-06-25

Status: adapter foundation

## Purpose

Tariff Builder can now map UtilityHub customer/site selector envelopes into a local selector state without calling live UtilityHub APIs from the browser.

This is the first live-integration foundation after UtilityHub merged the tariff selector service foundation.

## Scope

This package adds:

- UtilityHub customer/site selector envelope types local to Tariff Builder.
- A pure adapter for customer/site selector responses.
- Tests for available, empty, unavailable and access-denied states.
- Extended customer/site selector state summary for option counts and source versions.

## Boundaries

This package does not:

- Call UtilityHub APIs.
- Import UtilityHub source code directly.
- Change storage.
- Change tariff calculations.
- Change imports, exports, report totals or shared DTOs.
- Make selected UtilityHub data tariff-driving.

## Next Step

The next safe package is a customer/site selector UI package that uses this adapter with contract-shaped examples and unavailable/access-denied states before live service calls are introduced.

## UI Wiring

The settings page now uses a local contract-shaped envelope derived only from existing manual UtilityHub customer/site references. This keeps the UI aligned to the UtilityHub selector contract without inventing external records or making live API calls.

When no manual references exist, the selector surface shows an empty state. When references exist, it shows a read-only selected evidence state with a local source version. This remains an interim bridge until live UtilityHub service calls are approved.
