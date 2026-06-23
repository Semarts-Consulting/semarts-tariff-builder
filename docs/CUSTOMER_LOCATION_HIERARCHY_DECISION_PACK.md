# Customer And Location Hierarchy Decision Pack

## Purpose

Submeter records currently use free-text `location`, controlled `responsibility`, and optional `tenantName`. That is sufficient for initial input capture but is not strong enough for defensible tariff allocation, reporting and audit trace once submeter-derived consumption becomes tariff-impacting.

## Current Linkage Approach

Current fields:

- Meter: unique meter identifier where possible.
- Location: free text.
- Responsibility: controlled category.
- Tenant Name: free text, required when responsibility is Tenant.

Existing aggregate tariff calculations still use customer-class rows in the core data inputs. Submeter data does not currently replace or update those rows.

## Free-Text Risks

- Different spellings of the same location can split consumption incorrectly.
- Tenant names can drift from customer records.
- Customer class cannot be inferred safely from a tenant name.
- Asset groups and site areas cannot be reliably reported.
- Reconciliation evidence becomes weaker when meters cannot be grouped consistently.

## Recommended Structured Fields

Add structured fields alongside the current free-text fields before replacing anything:

- `siteId`
- `areaId`
- `locationId`
- `customerId`
- `tenantId`
- `customerClass`
- `assetGroupId`
- `responsibility`
- `billingResponsibility`
- `networkOperatorUse`

The existing `location` and `tenantName` fields should remain as display/source fields until migration is approved.

## Target Hierarchy

Recommended direction:

1. Customer.
2. Site.
3. Area.
4. Location.
5. Meter.
6. Tenant.
7. Customer class.
8. Asset group.
9. Responsibility category.

The hierarchy must also support Network Operator, Landlord/common area, Shared Asset, EV Asset, Plant Room, Infrastructure and Other Internal Use records without forcing a tenant relationship.

## Migration Risk

Risk is high if the current fields are replaced directly. The safer route is:

1. Add nullable structured fields.
2. Keep existing text fields.
3. Add validation warnings for unmapped fields.
4. Provide mapping/review UI.
5. Only use structured fields in tariff calculations after sign-off.

## Impact On Tariff Calculations

Structured hierarchy enables:

- Consumption totals by customer class.
- Tenant-level denominators.
- Landlord/common-area allocation.
- Internal-use exclusions.
- Meter-level audit trace.

No tariff calculation should change until the selected input source is explicit and reviewed.

## Impact On Imports

Future imports should accept both:

- Source fields from workbooks or templates.
- Optional structured references once available.

Rows with unmapped free-text values should import but be flagged for review.

## Impact On Reporting

Reports should be able to show:

- Meter by customer/tenant/location.
- Included and excluded consumption.
- Responsibility category.
- Mapping confidence or review status.

## Impact On Audit Trail

Audit trace should preserve:

- Raw imported location and tenant text.
- Normalised structured IDs.
- Manual overrides.
- User review status.
- Source rows used for each calculation denominator.

## Recommended Decision

Approve structured fields alongside the current free-text fields, but do not remove or replace existing fields until mapping, migration and calculation-source selection are implemented and reviewed.
