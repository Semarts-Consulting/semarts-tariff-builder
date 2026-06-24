# UtilityHub Hierarchy Contract Proposal

## Purpose

Define how Tariff Builder should align with the UtilityHub customer, site, building, location and meter hierarchy before adding persistent hierarchy references or using hierarchy-mapped submeter data in tariff calculations.

Recommended default: Tariff Builder should reference UtilityHub-owned hierarchy records through a compatibility mapping layer. It should not create a separate permanent customer, site, location or master meter hierarchy.

## Ownership Boundary

UtilityHub owns shared hierarchy and platform records:

- Customer.
- Site.
- Building.
- Location.
- Master meter and supply point references.
- Users, roles, permissions and audit events.

Tariff Builder owns tariff-specific records:

- Tariff methodologies.
- Recoverable cost bases.
- Allocation methods.
- Tariff calculation runs.
- Tariff outputs.
- Methodology reports.
- Tariff-specific submeter reconciliation evidence and calculation evidence.

If a record is shared by more than one module, UtilityHub owns it.

## Proposed Hierarchy Shape

Tariff Builder should align to this UtilityHub hierarchy:

1. Customer.
2. Site.
3. Building.
4. Location.
5. Meter.

Tenant, occupier, billing responsibility, asset group and customer-class grouping should be treated as reviewable attributes or mappings, not inferred from free text.

## Current UtilityHub Compatibility Notes

Current UtilityHub MVP compatibility uses some existing storage names:

- `customerId` identifies the customer.
- `siteId` should identify the operating site in the future hierarchy.
- `areaId` currently acts as the Building key in UtilityHub.
- `siteId` on current UtilityHub meter records currently acts as the Location key until a controlled migration separates Site, Building and Location tables.
- `meterReference` is the operational meter reference.
- `meterNumber` is the physical or supplier meter number.
- `meterCategory` distinguishes Boundary, Sub meter, Check meter and Virtual meter.
- `parentMeterId` is required for Sub, Check and Virtual meters.
- `placementLevel` identifies whether a meter sits at Site, Building or Location level.
- `isTenantMeter` and `responsibilityCategory` carry tenant and responsibility evidence without forcing all meters to be tenant meters.

Tariff Builder should use an explicit compatibility mapping layer while UtilityHub completes any hierarchy migration.

## Tariff Builder Mapping Rules

Tariff Builder should initially map site submeter records to UtilityHub hierarchy references by:

1. Meter reference where available.
2. Meter number where available and unambiguous.
3. Location name only as review evidence, not as automatic identity.
4. Manual review where multiple matches or no matches exist.

The mapping layer must not:

- infer customer from free-text location;
- infer tenant from responsibility alone;
- infer customer class from tenant name;
- create permanent local master hierarchy records;
- make mapped records tariff-impacting without owner sign-off.

## Required Review States

Any future hierarchy mapping implementation should expose these states:

| State | Meaning | Tariff-impacting use |
| --- | --- | --- |
| Mapped | Unique UtilityHub hierarchy match found or manually confirmed | Eligible only after tariff input decision gates pass |
| Needs review | Multiple possible matches, missing hierarchy level or incomplete responsibility mapping | Blocked |
| Unmapped | No UtilityHub match found | Blocked |
| Evidence-only | Record is useful for reporting/reconciliation but should not drive tariff denominators | Blocked |

## Persistence Recommendation

Do not replace current `location` or `tenantName` fields immediately.

Recommended future storage approach:

- Keep existing source/display fields.
- Add nullable UtilityHub reference fields only after the shared hierarchy contract is approved.
- Store mapping confidence, review status and manual override metadata.
- Keep source row references for audit trace.
- Treat migration as additive before any field replacement.

## Tariff Calculation Boundary

Mapped hierarchy records should not directly change tariff calculations.

Future tariff-impacting use should flow through the submeter-to-tariff input decision model:

1. Map submeters to UtilityHub hierarchy.
2. Review responsibility and customer-class mapping.
3. Validate and reconcile consumption.
4. Generate reviewed aggregate customer-class input rows.
5. Feed `calculateTariffs` through the existing aggregate input path.

This avoids making the tariff engine depend on raw UtilityHub hierarchy records.

## Reporting And Audit Expectations

Reports should be able to show:

- source meter and location text;
- mapped UtilityHub customer, site, building, location and meter references;
- mapping status and confidence;
- manual override status;
- responsibility category;
- included and excluded consumption;
- reason a record is tariff-driving or evidence-only.

Audit trace should preserve both source values and reviewed hierarchy mappings used to derive aggregate inputs.

## Out Of Scope For This Proposal

This proposal does not approve:

- production storage migration;
- shared DTO changes;
- automatic UtilityHub sync;
- new authentication, role or permission logic;
- report total changes;
- tariff calculation changes;
- import parser output changes;
- permanent local hierarchy records in Tariff Builder.

## Recommended Decision

Approve the hierarchy direction:

- UtilityHub remains the owner of shared hierarchy records.
- Tariff Builder may hold tariff-specific mapping evidence and reviewed references.
- Persistent hierarchy IDs should be added only through an approved additive contract.
- Tariff-impacting use must proceed through reviewed aggregate customer-class inputs, not raw hierarchy records.

## Acceptance Criteria For Future Implementation

A future implementation proposal must define:

- exact UtilityHub entity IDs to reference;
- compatibility handling for current `areaId` and meter `siteId` usage;
- review status and confidence values;
- manual override rules;
- treatment of tenant, non-tenant and internal-use meters;
- audit trace requirements;
- data migration approach;
- tests proving unmapped or ambiguous records cannot silently become tariff-driving.
