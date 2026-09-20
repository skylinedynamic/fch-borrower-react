# CLAUDE.md Audit Findings — client-fch (fch-borrower-react)

Generated 2026-08-30. Result of scanning `CLAUDE.md` against the actual repo (package.json, `vite.config.js`, `src/`, `.github/workflows/`, git branches) to find stale claims and undocumented conventions. Nothing here has been applied to `CLAUDE.md` yet — treat this as a to-do list for the next doc update.

## Stale / incorrect claims in CLAUDE.md

1. **`.jsx`→`.tsx` migration (CLAUDE.md:18, 24)** — the doc says the migration is "in progress" and instructs "don't add new `.jsx`," but new `.jsx` files are still being added (e.g. `src/components/Layout/GlobalFundingBanner.jsx`, commit `d16fb3e`, 2026-08-04; `src/pages/invoices/components/PaymentProviderSelector.jsx` / `PaymentMethodForms.jsx`, commit `054b48c`, 2026-07-30). Current ratio: `src/pages` 26 `.jsx` / 79 `.tsx`; `src/components` 17 `.jsx` / 44 `.tsx`. **Fix**: keep the "don't add new `.jsx`" rule but state plainly it isn't currently being followed, so reviewers don't assume compliance.

2. **Module shape claim (CLAUDE.md:12, 22)** — "fixed module shape (`services.ts`→`queries.ts`→`types.ts`→`index.ts`)" is not universal: `src/modules/funding/` has only `services.ts`; `src/modules/capital-access/` has no `index.ts` (but has an extra `useDelayCountdown.ts`). Also the module is named `billings`, not `billing` as the doc implies elsewhere.

3. **Branching section (CLAUDE.md:41-45) omits `master`** — `master` is the actual default branch (`origin/HEAD -> origin/master`) and is currently ahead of `release`/`stage` (the latest CLAUDE.md commit, `39a0f60`, 2026-08-30, is on `master`). The remote also has ~50 branches that don't follow the documented `feature/*`/hotfix scheme (e.g. `billing-issues`, `hotfix-multiple-issues`, `SCRUM-103`, `fetaure/SCRUM-94`).

**Confirmed still accurate**: "No ESLint/Prettier configured" — no `eslint.config.*`/`.eslintrc*`/prettier config anywhere, no `lint`/`format` script.

**No longer accurate** (as of the `feature/test-infrastructure-setup` branch): "No test runner configured" — Vitest + React Testing Library + MSW + Playwright are now set up (`vitest.config.ts`, `playwright.config.ts`, `tests/` tree, `npm test`/`npm run test:e2e`/`npm run typecheck` scripts), with a CI gate on PRs and in both deploy workflows. CLAUDE.md's TDD section has been updated accordingly — this line is left here only as a record of what the doc used to (correctly) say.

## Missing from CLAUDE.md

1. **`vite.config.js:7-9`** silently aliases `primereact/datatable` → `src/components/Table/DataTableWrapper.jsx` (itself still `.jsx`). This is load-bearing — every DataTable import in the app is redirected — and has zero mention in the doc.

2. **CI/CD deploy automation** is entirely undocumented: `.github/workflows/deploy-release.yml` (push to `release` → build, SSH-deploy to EC2, restart Nginx, smoke test) and `deploy-stage.yml` (same for `stage`). The Branching section describes the merge flow but not what happens on merge.

3. **Env vars**: `.env`/`.env.example` (`VITE_API_BASE_URL`), plus `deploy-release.yml` inlines a separate production value into `.env.production` at build time. Not mentioned in the Compliance & data-security section despite that section covering PII/secrets handling.

4. **`src/data/`** (`countries.ts`, `credit-builder.ts`, `profile.ts`, `tier.ts`) overlaps with the documented `src/config/*.ts` constants convention (CLAUDE.md:23) but the two are never reconciled in the doc.

5. **`src/hooks/`** (`useAuth.ts`, `useSummernote.tsx`) — a shared hooks directory, absent from the Architecture section.

6. **Undocumented major libraries** in `package.json`: jQuery, Summernote, Select2, SweetAlert2, the FullCalendar suite, Chart.js, react-pdf, flatpickr/react-flatpickr. None are referenced in CLAUDE.md despite jQuery/Summernote/Select2 alongside React 18 being an unusual pattern a new engineer would need context on.

## Suggested next step
Fold the items above into `CLAUDE.md` as targeted edits (not a rewrite): correct the three stale claims, add the six missing items as new bullets under the relevant existing sections (Architecture, Branching, Compliance).
