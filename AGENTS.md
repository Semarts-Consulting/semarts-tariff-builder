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