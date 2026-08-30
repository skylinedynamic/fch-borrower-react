# client-fch

Client-facing portal. React 18 + Vite + TypeScript config, PrimeReact/Reactstrap/Bootstrap UI, Zustand state, TanStack Query, Stripe payments.

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run preview` — preview build

## Architecture
- **Routing**: all routes are centralized in `src/App.jsx` (react-router-dom v6, nested `<Route>`s under a `Layout`). Route access is gated by guards in `src/lib/auth/` (`ProtectedRoute`, `GuestRoute`, `HostRoute`, `CapitalAccessGuard`, `CapitalAccessStrategyGuard`, `PermissionGuard`) — wrap new protected routes in the matching guard rather than checking auth state inside the page.
- **Feature modules** (`src/modules/<feature>/`): the data layer per feature — `services.ts` (axios calls via the shared client), `queries.ts` (TanStack Query hooks wrapping the services), `types.ts`, `index.ts` barrel export. Pages/components call a module's query hooks; they never call `apiClient` or fetch directly.
- **Pages vs. components**: `src/pages/<feature>/` holds route-level screens (often with local `components/`/`hooks/` subfolders for page-only pieces); `src/components/` holds UI shared across pages (`Layout`, `Table`, `Loader`, `Modals`, `Pagination`, `FileManager`).
- **State**: Zustand stores in `src/store/`. `store/auth/authStore.ts` persists token/user/subscription to `localStorage` and additionally exposes plain non-hook getters/setters (`getAuthState`, `setAuthState`, `clearAuthState`) for use outside React (axios interceptors, route guards) — follow that pattern for any store read outside a component.
- **HTTP**: one shared axios instance, `src/lib/http/apiClient.ts`. It attaches the Bearer token and `X-Timezone` header, and its response interceptor globally handles 401 (clear auth + redirect to `/login`) and 403 (toast) and network errors. Never create a second `axios.create()` — always import `apiClient`.
- **Query client**: shared `QueryClient` + a `queryKeys` registry live in `src/lib/query/`.
- **Config/constants**: static option lists and status enums live in `src/config/*.ts` (typed) — this is the canonical place for a value used in more than one file, not a repeated inline string.
- The codebase is a `.jsx` → `.tsx` migration in progress (`tsconfig.json` has `strict: true`). Write new/changed files in TypeScript (`.ts`/`.tsx`); don't add new `.jsx`.

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
This app touches applicant PII, credit, and payment (Stripe) data — see the `code-reviewer` agent's compliance/data-security categories (PCI-DSS, FCRA, GLBA, TCPA, state privacy law). Never log or persist raw card numbers, SSNs, or bank account numbers client-side; only handle Stripe tokens/Elements.

## Branching
- `stage` — test branch. All feature work lands here first for QA.
- `release` — production branch. Only what's been verified on `stage` is merged here.
- Feature branches (`feature/*`) branch from `stage` and merge back via PR.
- Hotfixes branch from `release`, then merge to both `release` and `stage`.

## Code review
Use the `code-reviewer` agent (`~/.claude/agents/code-reviewer.md`) before merging into `stage` or `release`: architecture, security, duplication, vulnerable dependencies, magic strings, code smells, performance.
