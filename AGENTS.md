Semarts Tariff Methodology Builder
Purpose

A commercial application for developing and maintaining Ofgem-compliant electricity tariff methodologies for private electricity network operators.

The application must:

Calculate tariffs transparently and accurately.
Provide a full audit trail from inputs to outputs.
Support future expansion to multiple tariff methodologies.
Generate outputs suitable for stakeholder review and export.
Technology Stack
Next.js 16
React 19
TypeScript (strict mode)
Tailwind CSS
Development Principles
Accuracy takes precedence over UI polish.
All calculations must be traceable and reproducible.
Business logic must be separated from React components.
Avoid hardcoded assumptions.
Prefer configuration-driven solutions.
Folder Structure

app/

Routing and page layouts only.

components/

Reusable UI components.
No tariff calculations.

services/

Calculation engines.
Tariff methodology logic.
Data transformation functions.

types/

Interfaces and domain models.

lib/

Shared utility functions.
Coding Standards
Use TypeScript strict typing.
Do not use any.
Keep functions small and single purpose.
Reuse existing components where possible.
Minimise changes to unrelated files.
Do not introduce duplicate implementations.
Calculation Standards
Calculations should be pure functions.
Inputs and outputs should be clearly defined.
Every calculated value should be explainable and auditable.
Use interfaces for all calculation inputs and outputs.
Include validation and error handling.

Shared UtilityHub Programme Integration

Semarts Tariff Builder is part of the wider Semarts UtilityHub platform.

Tariff Builder owns tariff methodology setup, recoverable cost base, cost allocation, supply cost calculation, network charges, submeter consumption inputs, boundary meter reconciliation, tariff outputs and methodology reports.

Related projects:

- Semarts UtilityHub owns the parent platform, authentication, customer hierarchy, navigation, shared layout, module registry, user roles, permissions, audit logging and shared database/API structure.
- Semarts Invoice Validator owns invoice validation for electricity, gas, water, wastewater, surface water and trade effluent invoices, including OCR/field candidates, charge line extraction, invoice validation and recovery tracking.
- UtilityMap / Meter Map is a UtilityHub module for spatial mapping, mapped areas, meter-to-area allocations, allocation confidence, area usage metrics and map-specific data quality issues.

Before making architecture, data model, API, authentication, customer hierarchy, meter structure, mapped area, allocation evidence, usage data, UI navigation or permissions decisions, check the shared programme documents in:

`C:\Projects\Semarts Utilityhub Programme`

Start each integration-sensitive task by reading:

- `PROGRAMME_STATUS.md`
- `INTEGRATION_CONTRACT.md`
- `SHARED_DATA_MODEL.md`
- `MODULE_BOUNDARIES.md`
- `DECISION_LOG.md`
- `OPEN_INTEGRATION_RISKS.md`

Then confirm:

- What Tariff Builder owns.
- What Tariff Builder must not duplicate.
- Any dependencies on UtilityHub, Invoice Validator or UtilityMap / Meter Map.
- Any integration risks before coding.

Do not proceed with changes that create conflicting customer, site, building, floor, supply point, meter, meter reading, document upload, user, role, permission or audit models.

At the end of integration-sensitive work, update shared programme documents where relevant:

- `PROGRAMME_STATUS.md` with what changed.
- `DECISION_LOG.md` for architecture or data decisions.
- `OPEN_INTEGRATION_RISKS.md` if anything may affect another module.

Include what changed, files changed, new or changed assumptions, API/data model/UI implications, decisions needed from Nathan, UtilityHub integration risks, and any instructions that should be passed to UtilityHub, Invoice Validator or UtilityMap / Meter Map.

Shared Ownership Rules

UtilityHub owns authentication, users, roles, customer hierarchy, buildings, floors, supply points, shared meter register, shared meter readings, document upload metadata, permissions, navigation, branding and audit logging.

Tariff Builder must not create permanent local versions of customers, areas, sites, buildings, floors, supply points, users, roles, permissions, audit events, document uploads, master meters or meter readings.

Tariff Builder may own tariff methodology records, cost allocation models, tariff calculation runs, tariff outputs and methodology reports. These records should reference UtilityHub shared entity IDs where relevant.

Tariff Builder may consume UtilityMap / Meter Map outputs when shared contracts exist, including mapped areas, meter-to-area allocations, allocation confidence, area usage metrics and map-specific data quality issues. These must remain referenced evidence or reviewed tariff-specific mappings unless a separate approved tariff-impacting package changes that behaviour.

UtilityMap / Meter Map production implementation should happen inside UtilityHub once shared contracts exist. Tariff Builder should not implement competing spatial map masters or meter-reading masters.

If it is shared by more than one module, UtilityHub owns it.

Before Implementing Changes
Explain the proposed approach.
Identify files that need changing.
Estimate the number of files affected.
Avoid repository-wide refactoring unless explicitly requested.
Before Completing Work
Run lint checks.
Run type checks.
Identify assumptions made.
Identify edge cases.
Summarise all changes.
Highlight any remaining risks.

Git and Codex Workflow

Never work directly on main.
Start every task by reporting the current branch and Git status.
Stop if the working tree has unrelated changes.
Use codex/* feature branches for Codex work.
Keep workflow and documentation setup commits separate from product changes.
Run lint, type-check where available, tests, and build where practical before commits.
Commit only passing checkpoints.
Stage only intended files.
Push only after approval.
Create PRs for review.
Never merge into main.
Never force push.
Stop if Git state, tariff methodology, business logic, or scope is unclear.
Do not change tariff calculation, import, storage, export, shared DTO, report, or methodology behaviour as part of workflow setup.
Manager approval is required before changing calculation contracts, imported data shapes, validation result shapes, export DTOs, or methodology configuration contracts.
If Codex cannot run Git safely, provide exact user commands instead of improvising.
