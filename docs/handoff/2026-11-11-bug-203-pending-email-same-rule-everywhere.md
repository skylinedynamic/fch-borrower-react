# BUG-203: typing the current email back withdraws a pending change

**Date:** 2026-11-11
**Branch:** round-1-run-2-fix
**Author:** Awlad Hossain

## Problem
Profile → Personal Info: after a borrower asked for a new email, typing the current email back in and saving left the change pending. The notice stayed and the link still worked. The field always showed the current email, so the API could not tell "change it back" apart from "saved other fields".

## Solution
This follows the fch-api change of the same date: one rule for every form.
- **While a change waits:**
  - the email field shows the **pending** email
  - the notice now also names the current one ("Keep signing in with your current email (x) …")
- **Saving other fields** sends the pending email back and the change stays.
- **Typing the current email back in** withdraws it. The API answers "The pending email change has been cancelled." and the notice goes away.
- **Cancel change on the notice** still works. The field returns to the current email.
- **Email-change request modal:** gets the real current email, not the field value.

## Files changed
- `src/pages/profile/components/PersonalInfo.tsx`: the field starts from `pending_email || email`; passes `currentEmail` to the notice; the request modal uses `apiData.email`.
- `src/pages/profile/components/PendingEmailNotice.tsx`: optional `currentEmail`, shown in the text.

## Tests
- **Updated:** `tests/pages/profile/components/PersonalInfo.test.tsx`:
  - the field shows the pending email and the notice the current one
  - after a save, the field shows the new pending email
  - after Cancel, the field goes back to the current email
- **Added (same file):**
  - saving other fields sends the pending email back
  - typing the current email back in withdraws the change
- **E2E:** `e2e/sidebar/profile/profile-email-change-save.spec.ts` updated, plus a new case "typing the current email back in withdraws a waiting change". 3/3 passed against the local API.
  - The local borrower 1 had DOB `2026-06-01`, which the API rejects. It was set to a valid date for the run and then restored.
- **Run:** `tests/pages/profile` + `tests/modules/account`: 170 passed. `npm run typecheck`: clean.

## Open / follow-up
- **Deploy together with fch-api and react-fch.** See `fch-api/docs/handoff/2026-11-11-bug-203-pending-email-same-rule-everywhere.md`.
- The local E2E borrower's DOB (`2026-06-01`) breaks every profile save spec. It should be reseeded.
- Not committed.
