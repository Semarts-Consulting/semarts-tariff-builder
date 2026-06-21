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
- `requiresReview`: optional flag indicating a storage-created/defaulted allocation method needs user review.

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
- `Allocation method requires review`
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

Current implementation emits `Error` issues for calculation-readiness problems and a `Warning` when an allocation method was automatically created and still requires review.

`Warning` issues are non-blocking readiness items. MVP report/UI code should treat validation issues as readiness information and should not prevent the calculation function from returning outputs.

## Tariff Audit Trace Contract Proposal

Status: proposed for MVP implementation; not yet implemented.

The audit trace should be generated inside `calculateTariffs` and returned as part of `TariffCalculationResult` as `auditTrace: TariffCalculationTraceEntry[]`.

Reason: trace entries explain the calculation result and should not drift from the values returned by the pure calculation function.

Proposed trace stages:

- `Revenue requirement`
- `Cost allocation`
- `Class total`
- `Rate derivation`
- `Revenue recovery`

Proposed trace units:

- `GBP`
- `Percent`
- `Customers`
- `kWh`
- `kW`
- `GBP per customer`
- `GBP per kWh`
- `GBP per kW`

Proposed trace value shape:

- `label`
- `value`
- `unit`

Proposed trace entry shape:

- `id`
- `stage`
- `label`
- `formula`
- `inputs`
- `result`
- `sourceRowIds`
- `costPoolId`
- `allocationMethodId`
- `dataInputRowId`
- `customerClass`
- `tariffComponent`

Minimum MVP trace coverage:

- One revenue requirement trace entry per cost pool using `annualAmount * recoverablePercent / 100`.
- One allocation trace entry per applied allocation share using `recoverableCost * allocationPercent / 100`.
- One rate-derivation trace entry per customer class and charge type:
  - Fixed: `fixedCost / customerCount`.
  - Energy: `(energyCost + passThroughCost) / annualKwh`.
  - Demand: `demandCost / peakDemandKw`.
- Zero denominator cases should still trace the inputs and result `0`; validation issues explain why the value needs review.
- One revenue recovery trace entry using `revenueRequirement - allocatedCost`, including the `0.01` GBP tolerance.

Required audit trace tests:

- Recoverable cost trace includes one entry per cost pool and sums to `revenueRequirement`.
- Allocation trace includes cost pool, allocation method, customer class, percentage, tariff component, and allocated GBP.
- Rate trace explains fixed, energy including pass-through, and demand charges.
- Zero denominator trace returns `0` and pairs with an existing validation issue.
- Revenue recovery trace explains balanced and unbalanced cases.
- Missing or unknown cost pool allocation rows do not create misleading allocation trace entries.

Trace implementation risks:

- Trace volume grows with cost pools multiplied by class shares.
- Rounding policy remains raw values unless manager approval introduces output rounding.
- Default-created allocation methods from storage are distinguishable when `requiresReview` is present on an allocation row.
- Audit trace explains calculations but does not replace validation issues.

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
- Existing allocation rows with matching `costPoolId` preserve `requiresReview`; missing values default to `false`.
- `costPoolName` is refreshed from the current cost pool name.
- New cost pools receive default allocation methods with `requiresReview: true`.
- Initial project default allocation methods are not automatically marked as requiring review unless created by reconciliation for a new cost pool.
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
