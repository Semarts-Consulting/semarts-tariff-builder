# Private Network End-to-End Scenario

This scenario is a synthetic regression check for the current private network input foundation. It proves that the app can hold and validate submeter evidence, reconcile submeters to a boundary import, apply half-hourly Transmission Loss Multipliers, classify meter responsibility, and still calculate tariffs through the approved aggregate customer-class input path.

## Scope

- Site submeter register with tenant, plant room, landlord, and network operator meters.
- Half-hourly submeter consumption for 48 settlement periods on one settlement date.
- Boundary meter import for the same settlement date.
- Transmission Loss Multiplier rows for all 48 settlement periods.
- Responsibility rule evidence showing tenant meters as recoverable candidates and network operator meters as excluded from customer charging by default.
- Existing tariff calculation using aggregate data inputs, cost pools, and allocation methods.

## Evidence Proved

- Submeter register validation passes for the representative meters.
- Valid submeter consumption validates with no issues.
- An intentionally unknown meter is flagged and excluded from boundary reconciliation.
- Boundary import total reconciles to valid submeter consumption with a green status.
- TLM coverage exists for all half-hourly settlement periods.
- Loss-adjusted consumption is calculated as evidence only.
- Tariff revenue still recovers to the aggregate approved cost base.
- Tariff audit trace remains linked to aggregate data inputs, cost pools, and allocation methods rather than unapproved submeter-derived denominators.

## Known Limitations

- The scenario does not make submeter consumption tariff-impacting.
- The scenario does not profile monthly, quarterly, or annual consumption into half-hourly periods.
- The scenario does not change storage, imports, exports, report totals, shared DTOs, or production tariff calculation behaviour.
- Real workbook extraction and source mapping remain separate controlled work packages.

## Next Step

Use this scenario as a confidence gate before any future package proposes submeter-derived tariff denominators, loss-adjusted tariff inputs, or reconciliation-driven allocation changes.
