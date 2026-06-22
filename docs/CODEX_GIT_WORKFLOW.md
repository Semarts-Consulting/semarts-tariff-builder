# Codex Git Workflow

This guide defines the safe Git workflow for Codex work in the Semarts Tariff Methodology Builder repository.

## Recommended Mode

Use Codex Worktree mode after the Git ownership and credential setup is working.

The main checkout should stay clean and track `origin/main`. Codex work should happen on `codex/*` feature branches or isolated worktrees so small documentation packages, calculation proposals, UI changes, and import work do not overlap accidentally.

Local mode is acceptable for short manager-led documentation packages when the working tree is clean. Permanent worktrees are useful only for long-running streams such as tariff engine, data import, UI flow, or QA.

## Core Rules

- Do not work directly on `main`.
- Use `codex/*` branch names for Codex work.
- Start every task by checking branch and dirty state.
- Stop if unrelated changes are present.
- Stage only explicit intended files.
- Keep workflow or documentation setup separate from product changes.
- Do not force push.
- Do not merge into `main` from Codex.
- Push only after approval.
- Open PRs for review.
- If Git, business scope, tariff methodology, or calculation behaviour is unclear, stop and ask.

## Product Boundary

Workflow setup must not change:

- Tariff calculation behaviour.
- Import parsing.
- Storage behaviour.
- Export behaviour.
- Shared DTOs.
- Report output behaviour.
- Methodology configuration contracts.

Manager approval is required before changing calculation contracts, imported data shapes, validation result shapes, export DTOs, or methodology configuration contracts.

## Start Of Task

From the repository root:

```powershell
cd "C:\Projects\Semarts Tariff Builder"
git status --short --branch
git log --oneline -5
```

If on `main`, create a branch before editing:

```powershell
git switch main
git pull
git switch -c codex/example-task-name
```

## Checkpoint

Run relevant checks before committing. For this repository:

```powershell
npm.cmd run lint
npx.cmd tsc --noEmit --incremental false
npm.cmd test
npm.cmd run build
```

For docs-only changes, the full gate is still preferred because the project uses the checks as release evidence.

## Pull Requests

Use GitHub CLI when available:

```powershell
gh pr create --base main --head codex/example-task-name --title "Title" --body "Summary and checks."
```

If `gh` is unavailable, push the branch and open the URL printed by GitHub, or use:

```text
https://github.com/Semarts-Consulting/semarts-tariff-builder/pull/new/codex/example-task-name
```

## If Codex Cannot Run Git

Codex should provide exact commands for the user to run, including:

- `cd "C:\Projects\Semarts Tariff Builder"`
- Current branch check.
- Explicit `git add` file list.
- Commit message.
- Push command.
- PR title and body.
- Post-push checks.

Codex should not improvise around Git errors by broad staging, force pushing, merging, or changing unrelated files.
