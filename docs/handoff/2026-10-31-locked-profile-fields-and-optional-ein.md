# Profile: locked fields hold on the server; Business EIN is optional (BUG-054, round 2)

**Date:** 2026-10-31
**Branch:** bugfix/round-2
**Author:** awlad (with Claude Code)

## Problem
QA round 2 defect log **BUG-054** (R2-CP-PROF-01, High/P1): Profile › Business Details locks Business Address (and EIN, phone, website, email, D-U-N-S, start date, and the financial revenues and bank accounts) once saved. Removing the field's read-only attribute in the browser and saving changed the address at once — no Change Request. The lock was only `readOnly` from `src/config/profileLockFields.ts`.

Also requested: Business EIN should not be required (no `*`), but once saved it is locked.

## Solution
- The API now refuses a change to a saved, locked field with a 422 and "This field is locked once saved. Submit a change request to update it." (`fch-api/docs/handoff/2026-10-31-locked-profile-fields-enforced.md`). The form already shows a field's API error under it, so no form change was needed for that.
- Business EIN: the required `*` is removed from its label; the API no longer requires it. It stays in `LOCKED_BUSINESS_FIELDS`, so once saved it is read-only with its Change Request button, as before.

## Files changed
- `src/pages/profile/components/BusinessDetails.tsx` — no required mark on Business EIN.
- `tests/pages/profile/components/BusinessDetails.test.tsx` — new case: no `*`, and the form saves with no EIN.
- `e2e/sidebar/profile/business-details-locked-bypass.spec.ts` — new: QA's steps (remove read-only, change the saved address, save) against the real API → 422 with the locked message under the field, and the address unchanged after a reload. Writes nothing.

## Testing
- The new Vitest case failed first (the label had the `*`), then passed; `tests/pages/profile` 150/150. `npm run typecheck` clean.
- Full Vitest suite — see the session report.
- Playwright (chromium, local API): `business-details-locked-bypass.spec.ts` and `profile-save.spec.ts` passed.
- `business-details-format-errors.spec.ts` failed on its precondition, not on this change: it needs the E2E borrower (`craig-borrower@fourcornerholdings.com`) to have no D-U-N-S, and the local DB now has `345345345` (saved 2026-10-31 17:49, before this work). Clear that borrower's `duns_number` locally to run it again.

## Open / follow-up
- A saved bank account can still be removed from Financial Details; see the API handoff.
