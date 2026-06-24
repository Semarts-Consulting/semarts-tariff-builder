# Site Submeter and Transmission Loss Multiplier Inputs

## Purpose

The site submeter input foundation records all submeters on a private network, not only tenant meters. It is intended to support future tariff calculations, reconciliation and audit review where consumption may relate to tenants, network operator supplies, landlord areas, shared assets, EV assets, plant rooms, infrastructure or other internal site uses.

This package creates the input foundation only. It does not make submeter consumption tariff-impacting and does not change report totals, exports, imports from existing workbook areas, shared DTOs or tariff calculation behaviour.

## Site Submeter Register

Each submeter record includes:

- Meter: the primary identifier and intended unique key.
- Location: free-text location for this phase, to be linked to the Utilityhub-aligned Customer > Site > Building > Location > Meter hierarchy later.
- Responsibility: controlled category covering Tenant, Network Operator, Landlord, Shared Asset, EV Asset, Plant Room, Infrastructure and Other Internal Use.
- Tenant Name: required only when responsibility is Tenant.
- Notes and import metadata: source file, uploaded timestamp, import batch and row fingerprint.

The model deliberately allows submeters with no tenant attached.

Future fields that are expected but not required in this package are MPAN, site reference, meter serial number, utility type, energisation status, meter status and billing responsibility.

## Consumption By Meter

Consumption records are stored against a meter and support these formats:

- Half-hourly.
- Monthly.
- Quarterly.
- Annual.

Each record includes:

- Meter.
- Period start date.
- Period end date.
- Consumption value.
- Unit, currently kWh.
- Source or input type.
- Upload/import reference where applicable.
- Validation status.
- Optional 48 settlement-period kWh values for half-hourly records.

Monthly, quarterly and annual records are stored in their original form. They are not profiled into half-hourly data in this package. Any future conversion should be implemented as a transparent calculation with an explicit profiling basis and audit trace.

## Import Templates

The Site Submeters screen provides downloadable Excel templates and Excel import flows for:

- Site submeter register.
- Submeter consumption.
- Transmission Loss Multipliers.

The templates use the exact headers expected by the import parsers. Each template contains clearly marked example rows using `EXAMPLE-DELETE-ME` or `Example row - delete or replace before import` placeholders. These rows are safe synthetic examples only and should be deleted or replaced before importing real project data.

Imports append by default. They do not silently replace existing rows. If an imported register meter, consumption period, or TLM settlement period appears to duplicate an existing row, the row is still imported and the screen displays a review message so the user can decide whether to correct, remove, or retain the duplicate.

The import review message includes a summary count before the detailed duplicate messages. This is a usability signal only; it does not delete, merge, overwrite or reject imported rows.

CSV support is not included in the current package because the existing app import pattern is Excel workbook based. CSV can be added later using the same parser contracts if users prefer CSV templates.

## Transmission Loss Multipliers

Transmission Loss Multiplier records include:

- Settlement date.
- Settlement period.
- Transmission loss multiplier.
- GSP group where available.
- Effective from date.
- Source.
- Retrieved at timestamp.
- Version or run reference where available.

The current implementation supports structured Excel imports and a JSON refresh service that can be called from the application with an endpoint URL. It is intentionally isolated in `lib/transmission-loss-multipliers.ts` so a confirmed Elexon feed can be wired later without changing tariff calculation logic.

Elexon's developer portal documents public production-grade APIs and structured CSV/XML/JSON dataset endpoints, but the currently inspected public dataset list did not expose an obvious Transmission Loss Multiplier endpoint. The preferred next step is to confirm the authoritative Elexon dataset or feed before scheduling automatic refreshes. Screen scraping should be avoided unless no structured feed is available.

## Validation

Implemented validation covers:

- Missing meter references.
- Missing locations.
- Tenant responsibility without tenant name.
- Duplicate submeter register meters.
- Unknown meters in consumption records.
- Missing or invalid consumption values.
- Negative consumption values.
- Duplicate consumption records.
- Overlapping consumption periods.
- Invalid date ranges.
- Incorrect half-hourly settlement period counts.
- Missing Transmission Loss Multipliers for required half-hourly settlement periods.

Validation is visible in the Site Submeters Data Inputs screen and covered by tests.

The Site Submeters screen and report evidence also show monthly consumption coverage review metrics where monthly records are present:

- Expected monthly periods per registered meter.
- Missing meter-periods.
- Duplicate meter-periods.
- Unknown meter records.

The Site Submeters screen also shows evidence-only Utilityhub hierarchy mapping readiness. Current rows are checked against Utilityhub-style Customer, Site, Building, Location and Meter references where those references are available. The current package does not persist Utilityhub IDs to methodology records.

Consumption aggregation evidence is available in the Site Submeters screen and report. It groups consumption by:

- Meter.
- Location.
- Responsibility.
- Tenant.

These checks are evidence and readiness signals only. They do not block save, delete data, or alter tariff calculations.

## Calculation Readiness

The data shape is designed to support later calculations such as:

- Total consumption by site.
- Total consumption by tenant.
- Total consumption by location.
- Total consumption by meter.
- Network operator consumption.
- Landlord or common area consumption.
- Loss-adjusted consumption.
- Allocation of costs across users.
- Reconciliation between submeter consumption and total network import.

These calculations remain out of scope until the methodology rules, source hierarchy and reconciliation approach are approved.

## Known Limitations

- Location is currently free text rather than a formal Utilityhub hierarchy link. The intended future hierarchy mirrors Semarts Utilityhub: Customer > Site > Building > Location > Meter.
- Utilityhub currently stores Building under the existing `areaId` key and Location under the existing meter `siteId` key during its MVP compatibility phase. Tariff Builder should use an explicit mapping layer rather than duplicating or renaming those records prematurely.
- Tenant linkage is a tenant-name field, not a formal customer record relationship.
- Excel import is supported; CSV can be added using the same parser contracts if required.
- TLM automatic refresh depends on confirmation of the authoritative Elexon source.
- Submeter data is stored in local methodology inputs following the current app pattern.

## Suggested Next Steps

1. Review Utilityhub hierarchy mapping results before adding persistent hierarchy IDs to Tariff Builder methodology records.
2. Confirm the authoritative Elexon TLM feed and expected GSP group handling.
3. Decide when submeter consumption should feed tariff calculations.
4. Add reconciliation between submeter consumption and boundary meter import once business rules are agreed.
5. Add CSV import if users prefer CSV templates over Excel templates.
