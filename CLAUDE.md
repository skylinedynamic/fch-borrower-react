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
- The codebase is a `.jsx` → `.tsx` migration in progress (`tsconfig.json` has `strict: true`). Write new/changed files in TypeScript (`.ts`/`.tsx`); don't add new `.jsx` — note this rule is not being consistently followed today (new `.jsx` files have landed as recently as August 2026), so don't assume a file's extension reflects intent.

## Coding standards
- No ESLint/Prettier is configured yet — set one up (ESLint + `typescript-eslint` + Prettier) before relying on style review alone.
- Follow the fixed module shape (`services.ts` → `queries.ts` → `types.ts` → `index.ts`) for any new feature; don't inline axios calls in a component.
- Don't let page components grow unbounded — several existing pages (e.g. `pages/payments/PaymentDetails.jsx`) mix data-fetching, formatting, and markup in one large file; split new/changed work into `components/` subfiles instead of extending that pattern.
- Status/role/permission strings and dropdown options belong in `src/config/` or the module's `types.ts`, not repeated as inline literals.

## TDD (strict)
No test runner is configured yet — that is the first task before any TDD-covered work starts here. Once set up (Vitest + React Testing Library, Playwright/Cypress for E2E):
1. Write a failing test for the behavior first.
2. Write the minimum code to pass it.
3. Refactor with the test green.
No production code without a preceding failing test. Never weaken/skip a test to make it pass.

Cover the level the change actually needs, not just one:
- **Unit** — hooks/utils/store logic in isolation, dependencies mocked.
- **Integration** — a component rendered with its real children/store/query client (no mocking the thing under test).
- **Functional** — an actual user flow end-to-end (form submit → API call → UI result) via Playwright/Cypress.

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
