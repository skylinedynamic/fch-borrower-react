# client-fch

Client-facing portal. React 18 + Vite + TypeScript config, PrimeReact/Reactstrap/Bootstrap UI, Zustand state, TanStack Query, Stripe payments.

## Related projects
Sibling repos under `d:\laragon\www\`, part of the same FCH (Four Corner Funding/Health) system:
- **`fch-backend-api`** (`fch-api`) — **the base project of the platform.** Laravel 12 API backend shared by this app and the admin panel (Passport auth, Spatie roles/permissions, Stripe, AWS S3). Routes are split by consumer under `routes/{admin,borrower,common,filemanager,website}.php`; this app talks to the `v1/borrower` surface. The data model, API contracts, permissions and compliance controls originate there — this repo is a consumer. For any change that spans both, start in `fch-api` and follow its response shapes rather than adapting the API to this app.
- **`Fch-admin-frontend-react`** — Admin/back-office panel. Same stack and module conventions as this repo (`services.ts`/`queries.ts`/`types.ts`/`index.ts`, shared `apiClient`/`queryKeys`/auth-guard patterns) but a separate codebase — treat conventions here as shared guidance, not shared code.
- **`fch-website-react`** — Public marketing site (Next.js 16 + React 19), separate stack from the two portal apps. Consumes only the backend's unauthenticated `v1/website` routes for CMS/blog/lead content; its "Apply"/pre-qualification flows hand off to this app but share no code.

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview build
- `npm run typecheck` — `tsc --noEmit`; not part of `npm run build` (plain `vite build` only transpiles), so run it explicitly — it's also a hard gate in CI and both deploy workflows
- `npm test` — run the Vitest suite once; `npm run test:watch` for watch mode, `npm run test:coverage` for a coverage report
- `npm run test:e2e` — run the Playwright suite (`npm run test:e2e:ui` for the interactive runner)

## Architecture
- **Routing**: all routes are centralized in `src/App.jsx` (react-router-dom v6, nested `<Route>`s under a `Layout`). Route access is gated by guards in `src/lib/auth/` (`ProtectedRoute`, `GuestRoute`, `HostRoute`, `CapitalAccessGuard`, `CapitalAccessStrategyGuard`, `PermissionGuard`) — wrap new protected routes in the matching guard rather than checking auth state inside the page.
- **Feature modules** (`src/modules/<feature>/`): the data layer per feature — `services.ts` (axios calls via the shared client), `queries.ts` (TanStack Query hooks wrapping the services), `types.ts`, `index.ts` barrel export. Pages/components call a module's query hooks; they never call `apiClient` or fetch directly. This shape isn't universal today — e.g. `modules/funding/` has only `services.ts`, `modules/capital-access/` has no `index.ts` — but is the target for new/changed modules.
- **Pages vs. components**: `src/pages/<feature>/` holds route-level screens (often with local `components/`/`hooks/` subfolders for page-only pieces); `src/components/` holds UI shared across pages (`Layout`, `Table`, `Loader`, `Modals`, `Pagination`, `FileManager`). `src/hooks/` (`useAuth.ts`, `useSummernote.tsx`) holds app-wide shared hooks that don't belong to one feature/module.
- **State**: Zustand stores in `src/store/`. `store/auth/authStore.ts` persists token/user/subscription to `localStorage` and additionally exposes plain non-hook getters/setters (`getAuthState`, `setAuthState`, `clearAuthState`) for use outside React (axios interceptors, route guards) — follow that pattern for any store read outside a component.
- **HTTP**: one shared axios instance, `src/lib/http/apiClient.ts`. It attaches the Bearer token and `X-Timezone` header, and its response interceptor globally handles 401 (clear auth + redirect to `/login`) and 403 (toast) and network errors. Never create a second `axios.create()` — always import `apiClient`.
- **Query client**: shared `QueryClient` + a `queryKeys` registry live in `src/lib/query/`.
- **Config/constants**: static option lists and status enums live in `src/config/*.ts` (typed) — this is the canonical place for a value used in more than one file, not a repeated inline string. `src/data/` (`countries.ts`, `credit-builder.ts`, `profile.ts`, `tier.ts`) holds larger static datasets in the same spirit — prefer `src/config/` for enums/option lists and `src/data/` for bigger reference data, don't split a single dataset across both.
- **`primereact/datatable` is aliased** in `vite.config.js` to `src/components/Table/DataTableWrapper.jsx` — every `DataTable` import in the app resolves there, not to the PrimeReact package directly. Check that wrapper before assuming default PrimeReact `DataTable` behavior.
- **Legacy jQuery-era libraries** (jQuery, Summernote, Select2, SweetAlert2, the FullCalendar suite, Chart.js, react-pdf, flatpickr) coexist with the React 18 stack in older pages — don't reach for them in new code, but expect to see them when touching existing screens that use rich text, date pickers, or calendars.
- The codebase is a `.jsx` → `.tsx` migration in progress (`tsconfig.json` has `strict: true`, plus `allowJs: true`/`checkJs: false` so `.tsx` files — mainly tests — can import a `.jsx` file with real inferred types instead of an implicit-`any` error; `.jsx` file *contents* still aren't type-checked). Write new/changed files in TypeScript (`.ts`/`.tsx`); don't add new `.jsx` — note this rule is not being consistently followed today (new `.jsx` files have landed as recently as August 2026), so don't assume a file's extension reflects intent.

## Coding standards
- No ESLint/Prettier is configured yet — set one up (ESLint + `typescript-eslint` + Prettier) before relying on style review alone.
- Follow the fixed module shape (`services.ts` → `queries.ts` → `types.ts` → `index.ts`) for any new feature; don't inline axios calls in a component.
- Don't let page components grow unbounded — several existing pages (e.g. `pages/payments/PaymentDetails.jsx`) mix data-fetching, formatting, and markup in one large file; split new/changed work into `components/` subfiles instead of extending that pattern.
- Status/role/permission strings and dropdown options belong in `src/config/` or the module's `types.ts`, not repeated as inline literals.

## TDD (strict)
Test runner: Vitest + React Testing Library + MSW for unit/integration, Playwright for E2E (`vitest.config.ts`, `playwright.config.ts`). All tests live under a top-level `tests/` tree mirroring `src/` (e.g. `src/utils/formatters.ts` → `tests/utils/formatters.test.ts`) — do not co-locate `*.test.*` files next to source. Shared harness: `tests/setup.ts` (jest-dom matchers, MSW server lifecycle, jsdom shims), `tests/test-utils.tsx` (`renderWithProviders`/`createTestQueryClient` — wraps `QueryClientProvider`/`MemoryRouter`), `tests/mocks/` (MSW handlers/server). Mock HTTP calls via MSW against the real `apiClient`, not by mocking `services.ts` functions, so the request/response mapping is actually exercised.

For **new/changed code**:
1. Write a failing test for the behavior first.
2. Write the minimum code to pass it.
3. Refactor with the test green.
No production code without a preceding failing test. Never weaken/skip a test to make it pass.

For **retroactive coverage of existing code** (backfilling this suite): there's no red step when the code predates the test — write a characterization test against current behavior. If that process surfaces an actual bug, switch back to strict red→green: write the test expecting *correct* behavior, watch it fail, then fix the bug.

Cover the level the change actually needs, not just one:
- **Unit** — hooks/utils/store logic in isolation, dependencies mocked.
- **Integration** — a component rendered with its real children/store/query client (no mocking the thing under test).
- **Functional** — an actual user flow end-to-end (form submit → API call → UI result) via Playwright.

A private/unexported component or helper that needs direct unit testing may be exported for that purpose (additive-only, e.g. `const x` → `export const x`) — don't restructure the file beyond that.

### Every change updates the tests (mandatory)
For **any** change — a new feature, a change to an existing feature, or a bug fix:

1. **Find the existing tests first.** Search `tests/` (Vitest unit and integration/feature tests) and `e2e/` (Playwright specs) for the module, page, component and flow you are touching. Update every test whose expectation the change affects — never leave a test asserting the old behaviour, and never delete, skip or weaken a test to make it pass.
2. **Cover each level the change touches**, not just one:
   - **Unit** — new/changed hook, util, store or `services.ts` mapping logic.
   - **Integration / feature** — new/changed component or page, rendered with its real children, store and query client, HTTP mocked with MSW against the real `apiClient`.
   - **Functional (E2E)** — new/changed user flow (form submit → API call → UI result) in Playwright.
3. **Bug fixes are test-first:** write the test expecting the *correct* behaviour, watch it fail, then fix.
4. **New features:** failing test → minimum code → refactor with the test green.
5. Run the affected suites (and `npm run typecheck`) before finishing, and say so — with the failure output if anything fails.

When the change follows an API change in `fch-api`, update the MSW handlers and fixtures to the API's new response shape in the same change.

## Handoffs
`docs/handoff/` holds one file per finished piece of work — a feature, a change or a bug fix — named `YYYY-MM-DD-short-title.md`. It records **the problem**, **the solution**, the files changed, the tests added/updated and anything left open, so the next person (or session) can pick up without re-reading the history. Template: `docs/handoff/README.md`. Write it when the work is finished, before handing over or opening the PR.

## Compliance & data security
This app touches applicant PII, credit, and payment (Stripe) data — see the `code-reviewer` agent's compliance/data-security categories (PCI-DSS, FCRA, GLBA, TCPA, state privacy law). Never log or persist raw card numbers, SSNs, or bank account numbers client-side; only handle Stripe tokens/Elements. The API base URL is configured via `VITE_API_BASE_URL` (`.env`/`.env.example`); production deploys inject a separate value into `.env.production` at build time (see Branching below) — never commit a real production value into a tracked `.env` file.

## Branching
- `master` is the actual default branch (`origin/HEAD -> origin/master`) and is not always behind `stage`/`release` — check `git log` before assuming `release` is the most current work.
- `stage` — test branch. All feature work lands here first for QA.
- `release` — production branch. Only what's been verified on `stage` is merged here.
- Feature branches (`feature/*`) branch from `stage` and merge back via PR. In practice many ad hoc branch names exist on the remote (ticket IDs, typo'd prefixes) that don't follow this scheme — treat the scheme as the standard for new branches, not a guarantee about what you'll find on the remote.
- Hotfixes branch from `release`, then merge to both `release` and `stage`.
- Pushes to `stage`/`release` auto-deploy via `.github/workflows/deploy-stage.yml`/`deploy-release.yml` (SSH to EC2, build, restart Nginx, smoke test) — a merge to either branch is a live deploy, not just a QA/prod gate.

## Code review
Use the `code-reviewer` agent (`~/.claude/agents/code-reviewer.md`) before merging into `stage` or `release`: architecture, security, duplication, vulnerable dependencies, magic strings, code smells, performance.
