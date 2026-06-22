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
