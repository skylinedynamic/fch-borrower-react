# FCH Platform — Audit & Remediation Roadmap

**Date:** 2026-08-30
**Scope:** `fch-api` (Laravel 12), `client-fch` (borrower portal), `Fch-admin-frontend-react` (admin panel)

---

## Context

A full analysis of the three FCH repos found **8 critical security defects, 2 shipped-but-broken builds, zero automated tests, zero CI quality gates, and a runaway session hook**. This is a US lending platform holding SSNs, credit-bureau data, bank account numbers and Stripe payments — several findings are live regulatory exposure (GLBA/FCRA/PCI-DSS), not hypothetical.

Every finding below was verified by reading the code, not inferred. Severity ranking drives the phase order: Phase 0 items are actively dangerous *right now*.

Goal: close the exploitable holes first, then build the verification layer (tests + CI) that would have caught them, then pay down structural debt.

---

## Phase 0 — Emergency (do first)

### 0.1 Kill the runaway session-handoff hook

`client-fch/docs/handoff/` holds **516 zero-byte files**, ~258 per session, one every ~2s, with `claude`/node processes still spawning.

Root cause: `.claude/hooks/session-handoff.sh` calls `claude --resume`, which starts a *new* session; that session's exit fires `SessionEnd`, which re-runs the hook — unbounded recursion. Files are 0 bytes because the script is killed before its `[ -s "$out" ] || rm -f` cleanup.

- Kill live `claude`/node processes from the loop.
- Delete the 516 files; add `docs/handoff/` to `.gitignore`.
- Fix the hook in all three repos: guard against re-entry before doing anything else —
  ```bash
  [ -n "${FCH_HANDOFF_RUNNING:-}" ] && exit 0
  export FCH_HANDOFF_RUNNING=1
  ```
  An env guard alone is not sufficient (the child is a fresh process tree), so **also** write a lockfile keyed to the repo and bail if present, and pass a marker env var the child hook checks. Verify by running the hook manually and confirming exactly one file is produced.
- If a safe guard can't be proven, remove the hook entirely rather than ship a process bomb.

### 0.2 Rotate every committed production secret

`fch-api/.env.example` is **byte-identical to the live `.env`** for `APP_KEY` (verified: both `base64:Q+Qwd7iA/B1SuM59tPJEPPo4hL+ELQc3LNVV8/BjtXs=`).

Anything `Crypt::`-encrypted is decryptable by anyone with repo read access — including TOTP secrets/recovery codes and **Stripe secret keys** (`PartnerPaymentProvider.configuration`, cast `encrypted:array`).

Rotate and purge from git:

| Secret | Location |
|---|---|
| `APP_KEY` | `.env.example:3` — re-encrypt existing encrypted columns first |
| Mailtrap credentials | `.env.example:66-67` |
| `RECAPTCHA_SECRET_KEY` | `.env.example:87` |
| `INTERNAL_RESOLVER_KEY` = `fourcornerfunding2026` | `.env.example:8`, `config/domains.php:12` (hardcoded fallback), `SAAS_DOMAIN_ROUTING.md:247`, `SAAS_DOMAIN_ROUTING_PRODUCTION.md:67,128,186,211,341` |

The `SAAS_DOMAIN_ROUTING_PRODUCTION.md:211` entry includes a copy-pasteable exploit `curl`. Delete the `config/domains.php:12` fallback so a missing env var fails closed instead of accepting the leaked key.

### 0.3 Close the auth-bypass chain in `fch-api`

These compose into full account takeover plus platform-wide PII access.

**`routes/common.php:83`** — ~300 endpoints under `auth:api` with *no* role/permission check. A borrower token from `routes/borrower.php:43` reaches user CRUD, role CRUD, all borrower PII, credit profiles, invoices, payments, tenant config. Compare `admin.php:32` (`['auth:api','admin']`) and `borrower.php:47` (`['auth:api','borrower']`). Spatie middleware is aliased at `bootstrap/app.php:36-38` and used on **zero** routes.

**`UserRoleController::assignPermissions`** (lines 29-36) — validates only that `permission_ids` is an array; no authorization, no tenant scope, no permission allowlist. Any authenticated user grants themselves everything. Note `assignRoles` directly above *does* scope by `partner_id` — apply the same, plus an authz gate.

**`BorrowerService.php:702-709`** — tenant scoping applies only `when(user_type == PARTNER)`; every other token type reads any borrower by ID. `delete()` (`:714-731`) has no scoping at all → any authenticated user mass-deletes borrowers. Make scoping unconditional / deny-by-default.

**`TwoFaController.php:35-55`** — `login/2fa/confirm` sits outside `auth:api` and accepts a bare `user_id`; no proof the password step ever passed. 2FA is the *only* factor. Issue a short-lived signed challenge token from `AuthService::login()` and require it.

**`FileManagerService.php:32-48`** — `entity_type`/`entity_id` taken raw from the request, no ownership check → cross-tenant read/delete of loan files, bank statements, credit reports. Plus `UploadFileRequest.php:17` is `['required','file']` with no `mimes`/`max`, preserving the original extension onto the **public** disk → stored XSS, plausibly RCE.

**`config/cors.php:11-14`** — `allowed_origins_patterns: ['#^https?://.*$#']` with `supports_credentials: true`. Delete the pattern; keep the explicit allowlist or a partner-domain lookup.

Add a Feature test asserting a borrower token gets **403** on every `v1/common/*` route — that is the permanent regression guard for this whole class.

### 0.4 Stop leaking credentials to logs and the public

- `MicroBiltService.php:57-63` logs `client_secret` in plaintext; `config/log-viewer.php:23` sets `require_auth_in_production => false` and the gate at `AppServiceProvider.php:108-114` passes any authenticated user. Delete the log line, fix the gate.
- `AppServiceProvider.php:103-106` — `viewApiDocs` returns `true` unconditionally, publishing the full admin OpenAPI spec. Env-gate it.
- `routes/common.php:80-81` — `common/weekly-summary` is **unauthenticated** and returns gross revenue, net, partner payouts and per-partner commissions. Move inside the auth group.

### 0.5 Fix the two broken builds

- `client-fch/src/pages/funding-requests/FundingRequestDetailPage.tsx:10` imports `../../components/Common/Modal/FileUploadModal` — **no such file** in the working tree or `HEAD`. The route is live at `App.jsx:139`, so `npm run build` fails → both deploy workflows fail. Restore or remove.
- `Fch-admin-frontend-react/src/pages/applications/fundapplication/FundApplication.tsx:472-475` — `isApplicationSubmitted` is never declared anywhere (4 uses, 0 definitions). Throws on every render; with no ErrorBoundary it white-screens the admin SPA.

---

## Phase 1 — Verification layer

The absence of this layer is what allowed every Phase 0 item to ship.

### 1.1 Test infrastructure

**`fch-api`**: `phpunit.xml:8,11` points at `tests/Unit` and `tests/Feature`; `tests/Feature/` exists but is empty and `tests/Unit/` doesn't exist, so `composer test` has nothing to run. `database/factories/` has **only** `UserFactory` — add factories for `Borrower`, `FundingApplication`, `Invoice`, `Payment`, `Subscription` before feature tests are possible. Note `phpunit.xml:22-23` uses sqlite-in-memory but the app uses MySQL-only SQL (`DATE_FORMAT`, `CONCAT_WS`, correlated `DB::raw`) — point tests at a MySQL test DB instead.

**Both frontends**: add Vitest + React Testing Library, and Playwright for the money paths (invoice payment, fund application submit).

Per the `CLAUDE.md` TDD policy, cover unit / integration / functional. Start with the security regressions from 0.3 — highest value per line.

### 1.2 CI quality gates

Six workflows exist across the three repos; **all are deploy-only, all `on: push` to `stage`/`release`, none run tests, lint, typecheck or scanning.** A push to `release` is an unreviewed, unverified production deploy.

Add a `pull_request`-triggered workflow per repo:
- API — `pint --test` + `artisan test` + `composer audit`
- Frontends — `tsc --noEmit` + ESLint + Prettier + `vitest` + `npm audit`

Also fix in the existing workflows:

| Defect | Detail |
|---|---|
| Production smoke tests are no-ops | The `PROD_URL` fallback value equals the skip condition, so the check never runs. Staging is verified; production is not. |
| API release deploy is less verified than stage | No smoke test, no failure-log capture (stage has both), and runs `artisan migrate --force` with no backup or rollback against a DB holding SSNs. |
| Moving action pin | `ssh-deploy@main` on a step handed the production SSH key — pin to a SHA. |
| SSH key left on disk | On smoke-test failure the EC2 private key is written to disk and `rm` only runs in the failure branch; an early `exit 1` leaves it in the workspace. |

### 1.3 Make `strict: true` real

Both `tsconfig.json` set `"strict": true`, but `build` is `vite build` (esbuild, transpile-only) and `tsc` runs nowhere. Actual state: **168 errors in `client-fch`, 247 in the admin**.

Root causes are mechanical: `allowJs` unset while 45/110 `.jsx` files exist (every `.tsx→.jsx` import is implicit `any`); `@types/react` ^19 installed against `react` 18.3.1; missing `@types/jquery`. Fix those, baseline the remainder, fail CI on *new* errors.

---

## Phase 2 — Data security & compliance

### 2.1 Encrypt regulated fields at rest

SSN, DOB, EIN/`tax_id`, and bank `account_number`/`routing_number` are **plaintext** across `funding_applications`, `funding_application_co_borrowers`, `credit_profile_requests` (SSN is NOT NULL there), `payment_method_bank_details`, `borrower_credit_profiles`, `partners`.

The codebase already knows the pattern — `PartnerPaymentProvider.php:27` uses `encrypted:array`. Add `encrypted` casts + a backfill migration. Prefer storing `last_4_ssn` only (as `Borrower` already does) rather than the full SSN.

### 2.2 Delete the raw-card code

`PaymentMethodForms.jsx` in **both** frontends contains `AuthorizeNetForm` / `SquareForm` / `EcryptForm` collecting full PAN **and CVV** and POSTing them to our own backend. Currently dead code (only `StripeForm` is imported) — but one import away from PCI-DSS SAQ D scope, and CVV-to-own-server is never permissible. Delete both copies and the server-side raw-card branch. The live Stripe path is correct and stays.

### 2.3 Stop shipping secrets to the browser

Admin settings forms round-trip **live secret keys** into React state and the DOM: `stripe_secret_*` (`PaymentMethodConfigForm.tsx:110-112`), `microbilt_client_secret_*`, `openai_api_key`, `aws_secret_key`, `recaptcha_secret_key`. Make these write-only: API returns a masked stub, accepts a new value only on change. Also stop persisting `cached_email_config` to `localStorage` (`admin lib/auth/auth.ts:133-141`) — nothing reads it.

### 2.4 XSS and token exposure

- 20 `dangerouslySetInnerHTML` sites, **no sanitizer in either repo**. The dangerous ones render admin/CKEditor-authored HTML *inside the borrower portal*. Add DOMPurify + a single `<SafeHtml>` component.
- Bearer token + full user PII persisted to `localStorage` regardless of the "Remember me" checkbox (`authStore.ts`, with an explicit comment saying so). Honor `rememberMe` (sessionStorage when false) and `partialize` down to the fields actually needed — the `[key: string]: unknown` index signature means nobody can audit what lands on disk. This plus the XSS above is a direct token-theft chain.
- Add a CSP; pin/SRI the unversioned jsdelivr scripts, including a `document.write` of an unpinned script in `assets/js/plugins.js:1`.

### 2.5 Third-party data flow

`OpenAiParserService.php:40` sends **full credit-report text including SSN/DOB** to the OpenAI public API with no redaction, no DPA referenced, no zero-retention flag. Under GLBA/FCRA this needs a documented subprocessor agreement and disclosure — or redaction before the call.

### 2.6 Auth hardening

- Passport tokens **never expire** (no `tokensExpireIn` anywhere; Passport defaults to 1 year).
- No route throttling at all — `RateLimitServiceProvider` defines a `login` limiter attached to nothing.
- reCAPTCHA is `nullable`, so attackers simply omit the field.
- Login reveals whether an email exists (distinct messages for unknown-email vs bad-password).
- 2FA hardening settings silently do nothing: `TwoFaService.php:350-351` uses `config()` for what are `env()` keys, so values are *always* the hardcoded defaults — and the env name doesn't even match (`TWO_FA_LOCK_MINUTES` in code vs `TWO_FA_LOCKOUT_MINUTES` in `.env.example`).

---

## Phase 3 — Structural debt

### 3.1 Extract shared frontend packages

~9,400 LOC is duplicated across the two frontends at identical paths; **51 files are byte-for-byte identical**. The copies have already silently drifted (Stripe key handling differs between them), and every fix must be made twice — which is exactly how the PCI code in 2.2 ended up in both.

Extract in dependency order: `@fch/http`, `@fch/auth`, `@fch/formatters`, `@fch/data`, `@fch/ui`, then the heavy features `@fch/filemanager`, `@fch/billing`, `@fch/fund-application`. Start with `@fch/billing` and `@fch/auth` — where drift is already causing divergent behavior.

Same story server-side: **14 service class names exist twice** under `Services/Borrower/` and `Services/FCH/` as near-copies. A fix in one misses the other.

### 3.2 Performance

No code splitting anywhere — `React.lazy`/`Suspense` appear **0 times**; `App.jsx` eagerly imports ~40 routes. Result: a single **3.8 MB** (borrower) / **4.5 MB** (admin) JS chunk plus ~2 MB CSS, so every borrower downloads FullCalendar + jQuery + Summernote + all of PrimeReact before seeing the login form.

- Add `React.lazy` per route + `manualChunks`.
- Drop ~10 verified-unused deps (`select2`, `sweetalert2`, `react-pdf`, `framer-motion`, `mammoth`, `html2pdf.js`, `react-dnd`, …).
- Optimize a committed 2.0 MB `form-bg.png` and 4 bundled icon-font families.
- Add ErrorBoundaries (**0 in either repo**) — this is what turns a single render throw into a white screen.

Server-side: confirmed N+1s, worst in `WeeklySummaryService.php:336-347` (7 queries per partner in a loop) — reachable on the *unauthenticated* endpoint from 0.4 with an unbounded date range.

### 3.3 API contract drift

TS types are hand-written against 133 PHP Resource classes. **All 3 endpoints sampled were drifted in both directions** — phantom fields TS declares that the API never sends, and real fields TS hides. `dedoc/scramble` already produces a live spec; generate TS types from it. Delete `.scribe/` — orphaned, 10 months stale, 3 endpoints, and it states "This API is not authenticated."

### 3.4 Repo hygiene

- Default branch is `main` in the API and `master` in both frontends, is 4 commits ahead of `stage`, and **deploys nowhere** — outside the documented workflow entirely. Reconcile naming and either wire it in or document it.
- `release` is **36–90 commits behind** `stage` across the repos.
- `develop` is abandoned (377–814 commits behind) but still present and checked out locally by teammates — a trap.
- 52–98 remote branches per repo, 8–27 of them >6 months stale; 58/98 in the API have no prefix; typo namespaces (`fetaure/`) exist. Prune and enforce naming.
- Fix `.env.example` files: Twilio keys are **wrong names** (`TWILIO_TOKEN`/`TWILIO_FROM` vs the real `TWILIO_AUTH_TOKEN`/`TWILIO_FROM_NUMBER`), so anyone copying the example gets silently-broken SMS 2FA. All Stripe/MicroBilt/Graph/`DOMAIN_CHECK` vars are undocumented; the admin documents 2 of 8 required vars. `VITE_STRIPE_PUBLISHABLE_KEY` and `VITE_STORAGE_URL` are **undefined in every environment**, breaking `LeadPaymentModal.jsx:174` in stage and prod.
- READMEs are boilerplate or wrong — the borrower portal's README is UTF-16 and names the *admin* repo. No onboarding doc anywhere.
- Remove committed junk: `.rnd`, `.scribe/`, `scratch/`, `fix-breadcrumbs.cjs`, `revert_imports.py`, `update_imports.cjs`.

---

## Verification

| Phase | How to verify |
|---|---|
| 0 | Hook produces exactly one file per session end (run manually, count); `npm run build` succeeds in both frontends; borrower token returns 403 on `v1/common/*` (Feature test); `curl -H "Origin: https://evil.test"` no longer gets `Access-Control-Allow-Origin`; grep confirms no secrets remain in `.env.example` / `config/domains.php`. |
| 1 | `composer test` and `vitest` pass; a deliberately-broken PR fails CI on lint, typecheck and test. |
| 2 | Query the DB directly and confirm SSN / account-number columns are ciphertext; grep both frontends for `cardNumber`/`cvv` → zero hits; settings API returns masked secrets; DOMPurify covers all 20 sites. |
| 3 | Bundle size measured before/after; `tsc --noEmit` clean against generated API types; duplication re-measured after each package extraction. |

Each phase should land as its own PR into `stage` and be reviewed with the `code-reviewer` agent before merging to `release`.
