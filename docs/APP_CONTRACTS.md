# Application Contracts

This file records the current shared contracts that delivery chats must not change without manager review.

## Contract Change Rule

Manager review is required before changing:

- Imported record shapes.
- Calculation input or output types.
- Validation result types.
- Storage reconciliation behavior.
- Report or export DTOs.
- Units, rounding, tolerances, or business-rule defaults.

## Project Contract

Source: `types/project.ts`

`Project` captures:

- `id`
- `name`
- `networkName`
- `tariffYear`
- `effectiveDate`
- `billingPeriod`
- `customerClasses`
- `status`
- `lastUpdated`

`ProjectStatus` values:

- `Draft`
- `Ready for review`
- `Locked`
- `Archived`

Archived projects are read-only in UI components.

## Core Tariff Input Contract

`DataInputRow`:

- `customerClass`: string label used as the allocation join key after trimming.
- `customerCount`: number of customers.
- `annualKwh`: annual consumption in kWh.
- `peakDemandKw`: peak demand in kW.
- `notes`: free text.

`CostPoolRow`:

- `annualAmount`: annual cost amount in pounds.
- `recoverablePercent`: percentage from 0 to 100.
- `category`: controlled `CostPoolCategory`.
- `notes`: free text.

`AllocationMethodRow`:

- `costPoolId`: joins to `CostPoolRow.id`.
- `basis`: `Customer count`, `Annual kWh`, `Peak demand`, `Equal share`, or `Manual`.
- `tariffComponent`: `Fixed`, `Energy`, `Demand`, or `Pass-through`.
- `classShares`: customer-class percentage rows expected to total 100.

## Tariff Calculation Contract

Source: `lib/calculation-engine.ts`

`calculateTariffs` is a pure function and takes:

- `projectId`
- `dataInputRows`
- `costPoolRows`
- `allocationRows`

It returns `TariffCalculationResult`:

- `projectId`
- `revenueRequirement`
- `allocatedCost`
- `unallocatedCost`
- `unbalancedAllocationCount`
- `isRevenueRecovered`
- `validationIssues`
- `classResults`

Current calculation rules:

- Revenue requirement is the sum of `annualAmount * recoverablePercent / 100`.
- Customer-class matching trims whitespace.
- Duplicate or blank customer classes do not create duplicate class result rows.
- Allocation percentages are applied directly to each recoverable cost pool.
- `Pass-through` costs are tracked separately but currently use the energy denominator for an indicative p/kWh-style rate effect.
- `isRevenueRecovered` uses an absolute GBP currency tolerance of `0.01`.
- Calculations continue even when validation issues exist.

Current validation issue codes:

- `Missing customer class`
- `Duplicate customer class`
- `Negative data input`
- `Negative cost pool`
- `Recoverable percentage outside range`
- `Missing cost pool`
- `Missing allocation shares`
- `Duplicate allocation method`
- `Unbalanced allocation`
- `Missing allocation share customer class`
- `Duplicate allocation share`
- `Negative allocation share`
- `Unknown customer class`
- `Missing fixed denominator`
- `Missing consumption denominator`
- `Missing capacity denominator`

Validation issue severity values:

- `Error`
- `Warning`

Current implementation only emits `Error` issues.

`Warning` is reserved for future non-blocking calculation-readiness issues. MVP report/UI code should treat validation issues as readiness information and should not prevent the calculation function from returning outputs.

Minimum audit trace still required before stakeholder review:

- Recoverable cost by cost pool.
- Allocation applied by cost pool, customer class, and tariff component.
- Customer-class totals.
- Charge-rate denominator and formula.
- Revenue recovery reconciliation.

Do not add the audit trace until its output contract is reviewed, because it affects reports, exports, and auditability expectations.

## Imported Methodology Input Contract

Source: `types/project.ts`, `lib/*-import.ts`, `components/WorkbookMethodologyForms.tsx`

Workbook input records currently include:

- `DirectCostInput`
- `EmployeeCostInput`
- `IndirectOverheadInput`
- `AssetInput`
- `HalfHourlyImportRow`
- Supply contract and tenant-related inputs in `ProjectMethodologyInputs`

Common import metadata fields:

- `sourceFileName`
- `uploadedAt`
- `importBatchId`
- `rowFingerprint`

Current import behavior:

- Parser modules return parsed rows and row-level errors.
- Invalid rows are skipped by the specific parser when required fields fail.
- Boundary meter import reports short-row problems but does not reject rows solely because fewer than 48 settlement periods are present.
- Merge behavior replaces changed rows by domain key and skips identical duplicates.

Parser return shape:

- `parsedRows`: typed project methodology rows.
- `errors`: row-level string messages.

Merge helper return shape:

- `rows`
- `added`
- `replaced`
- `skippedDuplicates`

Current header contract:

| Import | Headers |
| --- | --- |
| Boundary meter | `MPAN`, `Date`, `Total kWh`, `1` through `48` |
| Asset | `Description`, `Asset Category`, `Electrical Distribution Asset?`, `Chargeable on electricity tariff?`, `HV / LV`, `Network Level`, `Life Years`, `Asset Value` |
| Direct cost | `Description`, `Cost by Type`, `Annual Value` |
| Employee cost | `Role`, `Role Type`, `FTE`, `% Time` |
| Indirect overhead | `Description`, `Annual Cost` |

Headers are matched by position after trim/lowercase normalization. Header order is contractual for the current package.

Current dedupe and replacement keys:

| Import | Key |
| --- | --- |
| Boundary meter | `mpan + date` |
| Asset | `description + assetCategory + voltage + networkLevel` |
| Direct cost | `description + costByType` |
| Employee cost | `role + roleType` |
| Indirect overhead | `description` |

Keys are normalized with trim/lowercase except boundary meter, which uses the parsed MPAN and date strings.

Current fingerprint fields:

| Import | Fingerprint fields |
| --- | --- |
| Boundary meter | `mpan`, `date`, `totalKwh`, all settlement periods |
| Asset | all imported asset fields |
| Direct cost | `description`, `costByType`, `annualValue` |
| Employee cost | `role`, `roleType`, `fte`, `timePercent` |
| Indirect overhead | `description`, `annualCost` |

Fingerprint behavior:

- Same key and same fingerprint: skip as duplicate.
- Same key and different fingerprint: replace existing row.
- New key: add row.
- Duplicate keys with different values in a single incoming file currently allow the later row to win and can affect added/replaced counts.

Remaining import assumptions:

- Boundary meter short rows still report an error but are not rejected solely for having fewer than 48 settlement periods.
- `Date` parsing remains permissive through JavaScript `Date`.
- MPAN is required but not structurally validated.
- Import row IDs are generated per import and are not stable business identifiers.
- Import errors are currently string-only, not structured DTOs.

## Storage Contract

Source: `lib/project-storage.ts`

Current storage is local browser storage, with optional Supabase sync elsewhere.

Important behavior:

- Project data, cost pools, allocation methods, and methodology inputs are separate persisted collections.
- Customer-class changes can reconcile dependent data and allocation rows.
- Allocation methods may be reconciled against cost pools through `reconcileAllocationMethodsWithCostPools`.
- Allocation methods are reconciled to current cost pool IDs on read.
- Existing allocation rows with matching `costPoolId` preserve user-entered `id`, `basis`, `tariffComponent`, `classShares`, and `notes`.
- `costPoolName` is refreshed from the current cost pool name.
- New cost pools receive default allocation methods.
- Removed cost pools remove stale allocation method rows from the returned allocation model.

Storage reconciliation changes are business behavior and must not be included in layout-only UI packages.

## Supply Calculation Contract

Production supply calculation is deferred.

`SUPPLY_CALCULATION_DESIGN.md` records unresolved assumptions, including:

- Losses basis.
- kVA to kW conversion.
- DUoS and time-of-use rules.
- Annualisation for per-day, per-month, and seasonal charges.
- Pass-through reporting.
- Blank charge names.
- Custom time-of-use behavior.

Do not add production supply calculation DTOs or services until these questions are resolved.

## Report And Export Contract

Current report screens are presentation components, not stable export DTOs.

Any new stakeholder-facing export model must define:

- Source input references.
- Calculation result references.
- Validation and readiness status.
- Rounding rules.
- Date and tariff-year metadata.
- Audit trail references.

Until then, `ReportsSummary.tsx` can present approved calculation outputs but should not become a hidden export contract.
