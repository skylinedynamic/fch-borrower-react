# Dropdown crash on scroll: add a PrimeReactProvider (E2E-019)

**Date:** 2026-10-13 · **Related:** `docs/e2e/ISSUES.md` (E2E-019)

## Problem
A full E2E run failed `e2e/sidebar/appointment/appointment-create.spec.ts` with an uncaught page error:
`Cannot read properties of undefined (reading 'hideOverlaysOnDocumentScrolling')`.

The app renders no `<PrimeReactProvider>`. PrimeReact's `Dropdown` (`dropdown.esm.js:760`) reads `context.hideOverlaysOnDocumentScrolling` with no null check when the page scrolls while its panel is open. In the appointment modal (5 Dropdowns) the scroll comes from the modal itself, so picking a Type / Partner / Time could throw and leave the panel stuck. It affects every PrimeReact Dropdown in the app, not just Appointments. `CalendarWrapper.tsx` had already worked around the same gap, but only for `Calendar`.

## Solution
- New `src/AppProviders.tsx` holds the app's providers (BrowserRouter, QueryClientProvider, and now `PrimeReactProvider` with PrimeReact's default settings). `main.jsx` renders `<AppProviders><App /></AppProviders>`.
- One provider at the root fixes every PrimeReact popup at once, instead of wrapping components one by one.
- `CalendarWrapper` keeps its own fallback. It only adds a provider when none is present, so it now does nothing in the app but still protects calendars rendered on their own (e.g. in tests).

## Files changed
- `src/AppProviders.tsx` (new): app-level providers, including `PrimeReactProvider`
- `src/main.jsx`: renders through `AppProviders`
- `tests/AppProviders.test.tsx` (new): an open Dropdown under `AppProviders` must not throw on scroll/resize
- `docs/e2e/ISSUES.md`: E2E-019 added

## Testing
- `tests/AppProviders.test.tsx`: **failed** with the exact E2E error before the provider was added, then **passed** after.
- `tests/components/Calendar/*`: 16/16 pass, unchanged.
- `npm run typecheck`: clean.
- Full Vitest suite: 103 files, **643/643 pass**.
- E2E, before the fix: 126 passed, 1 failed (`appointment-create.spec.ts`, this bug).
- E2E, after the fix, on a fresh build: `e2e/sidebar/appointment` 5/5 pass; final full run **127/127 pass** (49.7 min, 0 failed, 0 flaky).

## Open items
- `CalendarWrapper`'s local provider fallback could be removed later. It's harmless, so it was left in.
- Nothing is committed yet.
- The E2E suite needs about 2 GB of free RAM. With less, the Playwright workers crash with "JavaScript heap out of memory" before any test runs. Running with `NODE_OPTIONS=--max-old-space-size=4096` was used here.
