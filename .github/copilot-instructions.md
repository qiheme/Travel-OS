# Travel OS — Copilot Instructions

## Stack

React 18 + TypeScript, Vite, React Router v6, Vitest + Testing Library, v8 coverage.

## TDD — red → green → refactor

**Follow this cycle for every change, no exceptions.**

1. **Red** — write a failing test first. Run `npm test` and confirm the failure before touching implementation code.
2. **Green** — write the smallest implementation that makes the test pass.
3. **Refactor** — remove duplication and improve clarity while all tests stay green.

Never suggest implementation code without a corresponding test written beforehand.

## Coverage requirement

100% branch coverage is enforced. `npm test` will fail if any metric drops below 100%. Annotate genuinely untestable branches with `/* v8 ignore next */` and explain why in a comment.

## Project conventions

- All global state via `useApp()` — do not introduce local state for data that belongs in `AppContext`
- Styles via CSS variables in `styles.css` — no inline colours or hardcoded pixel values outside the design token set
- Commit format: `type(#issue): description` (e.g. `fix(#5): correct booking status toggle`)
- No new `npm` packages without discussion
