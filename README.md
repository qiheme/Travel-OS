# Travel OS

A personal trip-management app — pipeline, inbox, calendar, budget, packing, and documents all in one place.

## Features

- **Pipeline** — Kanban board moving trips through Dreaming → Planning → Booked → Upcoming → Archived
- **Trip detail tabs** — Overview, Itinerary, Bookings, Budget, Packing, Documents, Notes per trip
- **Inbox** — captures forwarded booking confirmation emails and suggests trip assignments
- **Calendar** — month view showing all trip date ranges at a glance
- **Add Trip wizard** — 3-step modal: destination, categories/travelers, dates/budget
- **Theming** — light/dark mode, 5 accent colors (Clay, Olive, Ink, Plum, Sand), 3 density levels

## Tech stack

| Layer | Technology |
|---|---|
| UI | React 18 + TypeScript (strict) |
| Build / dev server | Vite 5 |
| Routing | React Router v6 |
| Backend | Supabase (Postgres + magic-link auth) |
| Unit tests | Vitest + Testing Library (100% branch coverage enforced) |
| E2E / visual tests | Playwright (Chromium, with screenshot regression) |
| Styling | Vanilla CSS with design-token variables |
| Deployment | Vercel |

## Prerequisites

- Node.js ≥ 20
- A [Supabase](https://supabase.com) project with magic-link (OTP) auth enabled

## Setup

```bash
git clone <repo-url>
cd travel-os
npm install
cp .env.example .env   # fill in your Supabase credentials
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with your email via magic link.

On first login the app seeds fixture trips, bookings, and inbox items so you have something to explore immediately.

## Environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key |

Both values are available in your Supabase project under **Settings → API**.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | TypeScript check + Vite build → `dist/` |
| `npm run lint` | ESLint over `apps/web/src` |
| `npm test` | Vitest with v8 coverage (100% required, fails CI if below) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright integration + visual tests (Chromium) |
| `npm run test:e2e:ui` | Playwright in interactive UI mode |

### Playwright quick-start

Install the browser once:

```bash
npx playwright install chromium
```

Run all e2e tests:

```bash
npm run test:e2e
```

Regenerate visual baselines after an intentional UI change:

```bash
npx playwright test --update-snapshots e2e/visual/
```

Commit the updated PNGs in `e2e/__snapshots__/` as part of the same PR.

> **Note:** `VITE_E2E_BYPASS_AUTH=true` is injected automatically by the Playwright `webServer` config so tests can reach app routes without Supabase credentials. This variable is gated by `import.meta.env.DEV` and is dead-code eliminated in production builds — it cannot exist in a deployed bundle.

## Architecture

```
apps/web/src/
  app/         — AppLayout, AppContext (all global state), router, Login
  components/  — PipelineDashboard, InboxDashboard, CalendarDashboard,
                 ArchiveDashboard, TripCard, modals/, …
  lib/         — types.ts, db.ts (Supabase CRUD), data.ts (fixtures), utils.ts
```

All state lives in `AppContext`. Every mutation flows through `AppContext` actions → `lib/db.ts` → Supabase. Components read state via the `useApp()` hook and never manage trip data locally.

## Development workflow

See [CLAUDE.md](CLAUDE.md) for the full TDD red → green → refactor cycle, 100% coverage requirement, issue/PR conventions, and commit message format.
