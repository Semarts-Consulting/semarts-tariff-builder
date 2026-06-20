# Semarts Tariff Methodology Builder - Project Handover

## Overall Purpose

Semarts Tariff Methodology Builder is a web application for building, managing, calculating, and reporting private electricity network tariff methodologies.

The application is intended to replace spreadsheet-based tariff methodology models with a structured workflow covering:

- Project setup
- Source data inputs
- Recoverable cost pools
- Allocation methods
- Tariff calculations
- Methodology and tariff reports
- Local backup and cloud persistence

## Current Functionality Implemented

### Project Management

- Create a tariff project.
- Store project metadata:
  - Project name
  - Network name
  - Tariff year
  - Effective date
  - Billing period
  - Customer classes
  - Status
- List projects.
- Open project dashboard.
- Dashboard overview with readiness indicators and calculated summary metrics.
- Project settings page is currently present in the working tree:
  - Edit project details
  - Change project status
  - Archive / restore project
  - Delete project with typed confirmation

### Data Inputs

- Add/edit customer-class rows.
- Capture:
  - Customer class
  - Customer count
  - Annual kWh
  - Peak demand kW
  - Notes
  - Assumptions
- Calculate totals for customer count, annual kWh, and peak demand.

### Cost Pools

- Add/edit recoverable cost pools.
- Capture:
  - Cost pool name
  - Category
  - Annual amount
  - Recoverable percentage
  - Notes
  - Cost recovery assumptions
- Calculate gross annual costs, recoverable costs, and recoverable amount per row.

### Allocation Methods

- One allocation rule per cost pool.
- Allocation bases:
  - Customer count
  - Annual kWh
  - Peak demand
  - Equal share
  - Manual
- Tariff components:
  - Fixed
  - Energy
  - Demand
  - Pass-through
- Customer-class allocation percentages.
- Validation indicator for allocations that do not total 100%.

### Tariff Calculations

- Calculation engine in `lib/calculation-engine.ts`.
- Calculates:
  - Revenue requirement
  - Allocated cost
  - Unallocated variance
  - Rows needing allocation review
  - Allocated cost by customer class
  - Fixed charge per customer
  - Energy charge per kWh
  - Demand charge per kW

### Reports

- Report summary page.
- Includes:
  - Project summary
  - Revenue requirement
  - Gross costs
  - Customer and kWh totals
  - Tariff schedule
  - Recoverable cost pool table
  - Allocation methodology table
  - Data/cost/allocation assumptions
  - Report checks
- Print/save PDF button.
- Download HTML fallback for browser environments where `window.print()` is blocked or hidden.

### Local Backup

- Export all local browser data as JSON.
- Import a JSON backup.
- Backup includes:
  - Projects
  - Data inputs
  - Cost pools
  - Allocation methods

### Supabase

- Supabase environment configuration through `.env.local`.
- Typed Supabase client.
- Authentication shell:
  - Sign in
  - Create account
  - Sign out
  - Header auth status
- Cloud sync:
  - Push local data to Supabase
  - Restore cloud data to local browser cache
  - Automatic restore after sign-in
  - Automatic cloud save for project, data input, cost pool, and allocation save actions

## Folder Structure and Architecture

```text
app/
  auth/
    page.tsx
  projects/
    page.tsx
    new/
      page.tsx
    [projectId]/
      layout.tsx
      page.tsx
      settings/
        page.tsx
      data-inputs/
        page.tsx
      cost-pools/
        page.tsx
      allocation-methods/
        page.tsx
      tariff-calculations/
        page.tsx
      reports/
        page.tsx
  globals.css
  layout.tsx
  page.tsx

components/
  AuthForm.tsx
  AuthStatus.tsx
  CloudRestoreOnProjects.tsx
  CloudSyncPanel.tsx
  DataInputsForm.tsx
  CostPoolsForm.tsx
  AllocationMethodsForm.tsx
  TariffCalculationsSummary.tsx
  ReportsSummary.tsx
  ProjectBackupPanel.tsx
  ProjectDashboardOverview.tsx
  ProjectNav.tsx
  ProjectSettingsForm.tsx
  ProjectShell.tsx
  ProjectsList.tsx
  SectionHeader.tsx
  PlaceholderPanel.tsx

lib/
  calculation-engine.ts
  cloud-bootstrap.ts
  project-storage.ts
  sample-data.ts
  supabase.ts
  supabase-sync.ts

types/
  database.ts
  project.ts

supabase/
  schema.sql
  002_auth_policies.sql
  README.md
```

### Architectural Pattern

- Next.js App Router handles routing and page composition.
- Most workflow pages are server route shells that render client components.
- Client components own interactive form state.
- `lib/project-storage.ts` is the local browser-storage data layer.
- `lib/supabase-sync.ts` is the Supabase persistence/sync layer.
- `lib/calculation-engine.ts` contains deterministic tariff calculation logic.
- Local storage remains the working cache.
- Supabase is used for authenticated cloud persistence and restore.

## Technology Stack and Dependencies

### Runtime

- Next.js `^16.2.9`
- React `^19.2.7`
- React DOM `^19.2.7`
- TypeScript `^5.9.3`

### Styling

- Tailwind CSS `^3.4.13`
- PostCSS `8.5.15`
- Autoprefixer `^10.4.20`

### Backend / Persistence

- Supabase JavaScript client `^2.45.4`

### Tooling

- ESLint `^9.39.2`
- `eslint-config-next` `^16.2.9`

### Important Notes

- `postcss` is pinned to `8.5.15` with an npm override to avoid a known audit issue in nested dependency resolution.
- PowerShell should use `npm.cmd` because local execution policy may block `npm.ps1`:

```powershell
& "C:\Program Files\nodejs\npm.cmd" run dev
```

## Database Schema

Schema files:

- `supabase/schema.sql`
- `supabase/002_auth_policies.sql`

### Tables

#### `public.projects`

Stores project metadata.

Key fields:

- `id uuid`
- `user_id uuid`
- `local_id text`
- `name text`
- `network_name text`
- `tariff_year integer`
- `effective_date date`
- `billing_period text`
- `customer_classes text[]`
- `status text`
- `last_updated text`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `public.project_data_inputs`

Stores data input rows as JSON.

Key fields:

- `project_local_id text`
- `user_id uuid`
- `rows jsonb`
- `assumptions text`
- `last_updated text`
- `updated_at timestamptz`

#### `public.project_cost_pools`

Stores cost pool rows as JSON.

Key fields:

- `project_local_id text`
- `user_id uuid`
- `rows jsonb`
- `assumptions text`
- `last_updated text`
- `updated_at timestamptz`

#### `public.project_allocation_methods`

Stores allocation rules as JSON.

Key fields:

- `project_local_id text`
- `user_id uuid`
- `rows jsonb`
- `assumptions text`
- `last_updated text`
- `updated_at timestamptz`

### Security

- Row Level Security is enabled.
- Authenticated users can read/write/delete only rows where `user_id = auth.uid()`.
- Policies are in `supabase/002_auth_policies.sql`.

## Authentication Approach

Authentication uses Supabase Auth through the browser client.

Implemented:

- Email/password sign-in.
- Email/password account creation.
- Session detection in header.
- Sign out.
- Automatic cloud restore after sign-in.

Files:

- `components/AuthForm.tsx`
- `components/AuthStatus.tsx`
- `lib/supabase.ts`
- `lib/cloud-bootstrap.ts`

The app does not yet enforce server-side route protection. Authentication currently controls sync behavior and user visibility, not hard page access.

## Outstanding Bugs

Known or likely issues:

1. Project lifecycle controls are currently uncommitted in the working tree.
2. The final audit was not rerun after lifecycle controls were added, although `npm run build` passed.
3. Delete currently deletes local data and attempts cloud delete. If cloud delete fails, the UI does not show the cloud failure.
4. Supabase sync is coarse-grained and uses local IDs as conflict keys.
5. If two browsers edit the same project independently, there is no conflict detection or merge strategy.
6. `window.print()` may be suppressed by embedded browsers; HTML download fallback exists.
7. Project settings can change customer classes, but existing data input/allocation rows are not automatically reconciled with renamed classes.
8. Project list currently shows archived projects rather than filtering or separating them.

## Known Technical Debt

1. Local storage remains the primary working data source.
2. Supabase persistence is implemented as sync/backup rather than true source-of-truth CRUD.
3. Large structured records are stored as JSONB arrays rather than normalized relational rows.
4. Calculation engine has no dedicated unit tests.
5. No form validation library or schema validation layer is currently used.
6. Error handling is basic and mostly displayed as inline strings.
7. No server-side auth guards or middleware.
8. No loading states for every async cloud operation.
9. No E2E tests.
10. No role model or organization/team membership model.

## Features Currently Being Developed

Current uncommitted working-tree feature:

- Project lifecycle controls:
  - `app/projects/[projectId]/settings/page.tsx`
  - `components/ProjectSettingsForm.tsx`
  - Status extended with `Archived`
  - Project delete helper
  - Supabase project delete helper
  - Settings added to project navigation/dashboard

Current Git status at handover time includes uncommitted files/changes:

```text
M components/ProjectDashboardOverview.tsx
M lib/project-storage.ts
M lib/sample-data.ts
M lib/supabase-sync.ts
M next-env.d.ts
M types/project.ts
?? app/projects/[projectId]/settings/
?? components/ProjectSettingsForm.tsx
```

Recommended commit after validation:

```powershell
git add app components lib types
git commit -m "Add project lifecycle controls"
```

Review `next-env.d.ts` before committing; it may be a generated Next.js change.

## Recommended Next Development Priorities

### 1. Finish and Commit Project Lifecycle Controls

Validate:

- Edit project details.
- Archive/restore project.
- Delete local and cloud project.
- Confirm archived projects display acceptably.

Then commit:

```powershell
git add app components lib types
git commit -m "Add project lifecycle controls"
```

### 2. Add Tests for Calculation Engine

Create focused unit tests for:

- Recoverable cost calculation.
- Allocation by customer count.
- Allocation by annual kWh.
- Allocation by peak demand.
- Manual allocation variance.
- Fixed/energy/demand/pass-through tariff rates.

### 3. Improve Supabase Persistence Model

Move from manual/cache sync to true Supabase-backed CRUD:

- Load project list from Supabase when signed in.
- Save each form directly to Supabase.
- Keep local storage only as offline cache/fallback.
- Add conflict handling using `updated_at`.

### 4. Reconcile Customer Class Changes

When project customer classes change:

- Update data input rows.
- Update allocation method class shares.
- Warn before removing a class with existing values.

### 5. Add Archive Filtering and Deletion UX

On project list:

- Show active projects by default.
- Add archived filter.
- Consider soft delete instead of hard delete.

### 6. Add Report Export Improvements

Potential additions:

- CSV export of tariff schedule.
- JSON export of complete project model.
- Better print page breaks.
- Versioned report snapshots.

### 7. Add Server-Side Route Protection

If the app becomes multi-user production software:

- Add Supabase auth helpers for server-side checks.
- Protect project routes.
- Consider organization-level ownership.

### 8. Add Database Migrations Discipline

Current SQL files are manually applied. Recommended improvement:

- Adopt Supabase CLI migrations.
- Track generated database types.
- Replace hand-written `types/database.ts` when practical.

## Local Development Commands

Install dependencies:

```powershell
& "C:\Program Files\nodejs\npm.cmd" install
```

Run development server:

```powershell
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Build:

```powershell
& "C:\Program Files\nodejs\npm.cmd" run build
```

Audit:

```powershell
& "C:\Program Files\nodejs\npm.cmd" audit
```

Open app:

```text
http://localhost:3000
```

## Environment Variables

Required local file:

```text
.env.local
```

Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

`.env.local` is ignored by Git.

