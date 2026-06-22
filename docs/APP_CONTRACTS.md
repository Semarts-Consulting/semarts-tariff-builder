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
- `auditTrace`

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

## Tariff Audit Trace Contract

Status: implemented for MVP.

The audit trace is generated inside `calculateTariffs` and returned as part of `TariffCalculationResult` as `auditTrace: TariffCalculationTraceEntry[]`.

Reason: trace entries explain the calculation result and should not drift from the values returned by the pure calculation function.

Trace stages:

- `Revenue requirement`
- `Cost allocation`
- `Class total`
- `Rate derivation`
- `Revenue recovery`

Trace units:

- `GBP`
- `Percent`
- `Customers`
- `kWh`
- `kW`
- `GBP per customer`
- `GBP per kWh`
- `GBP per kW`

Trace value shape:

- `label`
- `value`
- `unit`

Trace entry shape:

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

MVP trace coverage:

- One revenue requirement trace entry per cost pool using `annualAmount * recoverablePercent / 100`.
- One allocation trace entry per applied allocation share using `recoverableCost * allocationPercent / 100`.
- One rate-derivation trace entry per customer class and charge type:
  - Fixed: `fixedCost / customerCount`.
  - Energy: `(energyCost + passThroughCost) / annualKwh`.
  - Demand: `demandCost / peakDemandKw`.
- Zero denominator cases should still trace the inputs and result `0`; validation issues explain why the value needs review.
- One revenue recovery trace entry using `revenueRequirement - allocatedCost`, including the `0.01` GBP tolerance.

Audit trace tests:

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

Supply annual amount calculation is implemented only for the approved Phase 2 scope. Tariff integration remains deferred.

`SUPPLY_CALCULATION_DESIGN.md` records unresolved assumptions, including:

- Losses basis.
- kVA to kW conversion for kW-based charges.
- DUoS and time-of-use rules.
- Seasonal and billing-period annualisation variants.
- Pass-through reporting.
- Custom time-of-use behavior.

Phase 1 supply calculation is a normalisation service in `lib/supply-calculation-engine.ts`.

Phase 1 may:

- Convert supply input rows into normalised, source-linked charge lines.
- Convert rates from pence to pounds while leaving pound rates unchanged.
- Preserve project id, MPAN, supply detail id, and supply contract charge id where available.
- Preserve losses basis, time-of-use, custom time-of-use, unit, charge type, and voltage.
- Emit explicit line statuses: `Normalised`, `Needs business rule`, `Needs volume data`, `Invalid`, and `Excluded`.
- Represent pass-through transmission and distribution charges as excluded evidence lines.
- Mark unresolved loss, DUoS volume, and kVA-to-kW rules without calculating tariff impacts.

Phase 2 may:

- Calculate annual amounts for fixed annual, fixed monthly, fixed daily, and clear kVA capacity charge lines.
- Use 365 days for `per day` annualisation.
- Use 12 months for `per Month` annualisation.
- Use entered annual values directly for `per year` charges.
- Calculate kVA capacity charges from entered supply capacity without converting to kW.
- Leave kW-based, loss-adjusted, consumption-volume, DUoS time-band, custom time-window, and pass-through recovery cases unresolved.
- Keep invalid charge lines without annual amounts when charge names are blank, rates are negative, or unit/type combinations are unsupported.

Phase 1 and Phase 2 must not:

- Feed values into `calculateTariffs`.
- Change tariff revenue requirement, allocation, class outputs, revenue recovery, or tariff audit trace.
- Change stakeholder report totals or export DTOs.
- Change storage, import parsing, UI, Supabase, or API behavior.

Supply calculation types are service-local until the calculation contract is accepted for wider use. Do not promote supply calculation result DTOs into `types/project.ts` without manager review.

Do not add supply tariff integration until the unresolved tariff allocation and pass-through treatment questions are signed off.

## Report And Export Contract

Current report screens are stakeholder-facing presentation components. `ReportsSummary.tsx` provides MVP rendered report output through browser print/PDF and rendered HTML download.

MVP report output must include:

- Project name, network name, tariff year, effective date, billing period, and project status.
- Data input totals by customer count, annual kWh, and peak demand.
- Cost pool totals including gross and recoverable cost.
- Allocation method summary and readiness issues.
- Tariff calculation outputs by customer class.
- Revenue requirement, allocated cost, unallocated cost, and revenue recovery status.
- Calculation validation issues, including `Error` and `Warning` severities.
- Supply-reference review warnings where source data has not been reviewed.
- Methodology inputs and assumptions currently captured by the workbook-style forms.
- Audit evidence sufficient to explain how tariff outputs were produced.

MVP report output rules:

- Reports may display calculation outputs even when readiness issues exist.
- Reports must clearly label outputs as requiring review before approval when validation issues, supply-reference review issues, or revenue recovery variance exist.
- Warnings are non-blocking readiness items; errors indicate calculation input problems that still need review before stakeholder approval.
- HTML download and browser print/PDF are acceptable MVP rendered report outputs because they export the stakeholder report view, not a separate data model.
- The rendered HTML report is not a stable machine-readable export DTO.

Report readiness mapping:

- Any `Error` validation issue: `Needs correction`.
- Only `Warning` validation issues: `Needs review`.
- No validation issues but `isRevenueRecovered === false`: `Revenue variance`.
- No validation issues and revenue recovered: `Ready for review`.

Known MVP report gaps before final release readiness:

- `ReportsSummary.tsx` must be checked against this contract because it currently presents rendered report content, not a formal DTO.
- Audit trace is stable enough for rendered stakeholder explanation, but raw audit trace IDs and source row IDs are not a machine-readable export contract.
- Report UI must distinguish readiness severity clearly enough for stakeholder review.
- Regression tests must cover report rendering, warning visibility, audit trace visibility where required, and HTML/print actions.

Future formal export DTOs must define:

- Source input references.
- Calculation result references.
- Validation and readiness status.
- Rounding rules.
- Date and tariff-year metadata.
- Audit trail references.

Until a formal DTO is approved, new export code must not infer a hidden data contract from `ReportsSummary.tsx` markup.
