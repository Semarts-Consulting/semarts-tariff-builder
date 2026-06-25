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
