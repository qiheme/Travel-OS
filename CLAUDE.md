# Travel OS — Claude Code Guide

## Project layout

```
apps/web/src/
  app/         — AppLayout, AppContext, router
  components/  — PipelineDashboard, InboxDashboard, TripCard, …
  lib/         — data fixtures, types, utility helpers
```

Root-level `vite.config.ts` configures both the build and the Vitest test runner.

## Commands

```bash
npm test          # vitest run --coverage (must stay at 100% branch coverage)
npm run dev       # vite dev server
npm run build     # tsc + vite build
npm run lint      # eslint apps/web/src
```

## TDD — red → green → refactor

**Every feature or bug fix must follow this cycle, no exceptions.**

1. **Red** — write a failing test that describes the new behaviour. Run `npm test` and confirm it fails for the right reason before writing any implementation code.
2. **Green** — write the minimal code that makes the test pass. Do not add anything beyond what the test requires.
3. **Refactor** — clean up duplication, naming, and structure while keeping all tests green.

Never ship implementation code that isn't covered by a test written in the red phase first.

## Coverage

The project enforces **100% branch coverage** via Vitest v8. A push that drops any metric below 100% will fail CI. If a branch is genuinely untestable (defensive guard, environment-specific path), annotate it with `/* v8 ignore next */` and add a comment explaining why.

## Issues and PRs

Every piece of work must be tracked:

1. **Open an issue first** — if no issue exists for the task, create one before writing any code. The issue is the canonical description of the work.
2. **Reference the issue in every commit** — use `type(#N): description` format (e.g. `feat(#7): add AddTripModal wizard`).
3. **Close the issue on merge** — add `Closes #N` to the PR description body so GitHub automatically closes the issue when the PR merges. Never leave an implemented issue open.

## Conventions

- TypeScript strict mode — no `any`, no non-null assertions without a comment
- React functional components only; all state via `useApp()` from `AppContext`
- CSS via `styles.css` using the existing CSS-variable design tokens (`--accent`, `--ink`, `--surface`, …)
- No new dependencies without discussion
- Commit messages: `type(#issue): short description` (e.g. `feat(#7): add AddTripModal wizard`)
