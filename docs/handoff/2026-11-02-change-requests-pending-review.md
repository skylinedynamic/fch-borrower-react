# Profile change requests: "Pending review" on a waiting field, and the API's refusals in the modal (BUG-039, round 2)

2026-11-02

## Problem
QA round 2 **BUG-039** (R2-CP-PROF-02/03, Profile › Business Details › Phone Number):
- A Change Request with the value already on file was accepted.
- So were two more for the same field before the first was reviewed. The host had three pending requests for one field.

The profile gave no sign that a field was already waiting for review, so the borrower could keep filing.

## Solution
The API now refuses both cases (422 on `new_value`: "This is already the value on your profile." / "You already have a change request for this field waiting for review."). It also lists the pending fields (`GET /borrower/profile/change-requests/pending`); see `fch-api/docs/handoff/2026-11-02-change-requests-same-value-and-pending.md`.

In the portal:
- **New `ChangeRequestButton`:** the locked-field button. While the field waits for review it reads **Pending review** (clock icon, `btn-soft-warning`, disabled, with a title explaining why). Otherwise it reads **Change Request**, as before.
  - All 40 buttons on Business Details (15), Personal Info (13) and Financial (12) use it.
  - Bank account fields are pending per account.
- **`modules/profile`:**
  - `fetchPendingChangeRequests()`;
  - `usePendingChangeRequests()` with `isPending(field, rowId?)`;
  - `queryKeys.profile.pendingChangeRequests`;
  - `useSubmitChangeRequest` refreshes the pending list when the request settles (sent, or refused as already pending), so the field switches to "Pending review" at once.
- **The refusals** show in the modal under the new value, as the modal already did for `new_value` errors. No toast.

## Files changed
- `src/pages/profile/components/ChangeRequestButton.tsx`: new.
- `src/pages/profile/components/{BusinessDetails,PersonalInfo,FinancialSupport}.tsx`: use it with `isChangePending`.
- `src/modules/profile/{types,services,queries}.ts`: the pending list.
- `src/lib/query/queryKeys.ts`: `profile.pendingChangeRequests`.
- `tests/mocks/handlers.ts`: default empty pending list (MSW is strict, and every profile tab asks).
- `tests/modules/profile/services.test.ts`: +2 (the list; a missing list is none).
- `tests/pages/profile/components/BusinessDetails.test.tsx`: +3 (a pending field shows "Pending review" and is disabled while another still offers Change Request; after sending, the field switches; the same-value refusal in the modal, no toast).
- `tests/pages/profile/components/FinancialSupport.test.tsx`: +1 (pending on one bank account only).
- `e2e/sidebar/profile/business-details-change-request-submit.spec.ts`: new, real API. Business Address:
  - the value on file is refused in the modal;
  - a new value is sent;
  - the field shows "Pending review" (also after a reload), and the address is unchanged.

  `E2EClearBorrowerChangeRequestsSeeder` removes the request before and after each test.

## Testing
- **Red first:** the service, "Pending review" and "switches after sending" tests failed before the code (4 red). The same-value-in-modal test passed already (the modal showed `new_value` errors) and stays as a guard. The bank account test, written after, failed against the old code (run with the change stashed).
- **Vitest:** `tests/modules/profile` + `tests/pages/profile`, 159 passed. Full suite (before cancel): 208 files, 1,561 passed. `npm run typecheck`: clean.
- **E2E** (local `fch-api`, `E2E_BACKEND_PATH=C:\laragon\www\fch-api`, `--workers=1`): the new spec and `business-details-locked-*`/`profile.spec.ts` (9 passed). The new spec ran twice more in a row, with no pending request left after either.
  - The first version cleaned up in `beforeAll`/`afterAll`, and one run left a request behind; the cause was not pinned down. It now cleans up in `beforeEach`/`afterEach`, like the other `*-submit` specs.

## Follow-up, same day: cancel a pending request
**Problem:** the borrower had no way to take back a request sent by mistake. Product owner: add Cancel, which deletes it (force delete in the API).

**Solution:**
- **Pressing "Pending review"** (the button now shows a close icon and a title saying so) opens the app's **delete modal** (`GlobalModal/DeleteConfirmModal`): "Are you sure? This change request is still waiting for review. It will be deleted, and you can send a new one for this field." with Close / Yes, Delete It.
  - The first version used a custom reactstrap dialog; the reviewer asked for the delete modal instead.
- **The modal** comes from `useCancelChangeRequestDialog()` (`CancelChangeRequestDialog.tsx`): one per tab, mounted only while asking.
- **The request:** `DELETE /borrower/profile/change-requests/{id}` (`cancelChangeRequest`, `useCancelChangeRequest`, which refreshes the pending list). The field goes back to Change Request.
- **A refusal** (e.g. already reviewed) shows in the modal through a new optional `error` prop on `DeleteConfirmModal` (additive; other uses are unchanged). No toast. Success shows the API's message as a toast.
- **`ChangeRequestButton`** now takes `pendingId` and `onCancel`. `usePendingChangeRequests().pendingId(field, rowId)` gives the waiting request's id.

**Tests:**
- `services.test.ts`: the list carries ids; +1 `cancelChangeRequest` sends DELETE.
- `BusinessDetails.test.tsx`: +3 (asks first, then deletes that id and the field offers Change Request again; Close cancels nothing; a refusal in the modal, no toast). Two failed first; the Close test passed from the start.
- The E2E submit spec now cancels its own request from the page (the seeder stays as the safety net, and now force deletes). It ran 5 times in a row, with nothing left behind (counted with trashed rows).
  - One earlier run timed out waiting for the field to switch back after the delete; with network logging, the list is fetched again right after the DELETE every time. That expectation now waits up to 15s for the local API.
- Profile, GlobalModal and appointment tests: 182 passed. `npm run typecheck`: clean.

## Follow-up, same day: the cancel modal had no overlay; the modal note is a warning
**Problem (reviewer):**
- In the browser, the cancel modal showed over an undimmed page.
- The Change Request modal's "This field is verified and locked…" note should be a warning, not an info box.

**Cause (overlay):**
- `useCancelChangeRequestDialog` mounted `DeleteConfirmModal` only while asking, already shown. In development React StrictMode mounts twice, and the second Bootstrap instance showed the modal **without a backdrop**.
- Reproduced against the dev server (:5173): no `.modal-backdrop`. The built app (E2E) was not affected.

**Solution:**
- **The delete modal** stays mounted and only `show` changes, as on every other screen.
  - On the dev server there is now one backdrop, and a white field behind it measures `127/127/127`: a 50% dark overlay, sampled from the screenshot's pixels.
- **New `ChangeRequestNotice`** (`alert-warning`, left accent, `ri-error-warning-line`) replaces the duplicated `alert-info` block in all three tabs.

**Tests:**
- `tests/pages/profile/components/CancelChangeRequestDialog.test.tsx`: new; the backdrop is there under StrictMode, and still there after the stray-backdrop sweeps.
  - **jsdom does not reproduce the race** (the old mounting passes too), so it is a guard. The race was checked in the browser as above.
  - It waits 400ms after mount before asking, like a user would. Asking at once landed inside the sweep StrictMode's fake unmount schedules.
- The E2E submit spec now asserts `.modal-backdrop.show` while the cancel modal is open.
- `BusinessDetails.test.tsx`:
  - the Close test checks `.modal.show` is gone (the modal stays in the page, hidden);
  - +1: the note is a warning section (failed first).
- Profile, GlobalModal and appointment tests: 184 passed. `npm run typecheck`: clean. E2E profile specs: 4 passed.
- Looked at in Chromium: the warning note in the Change Request modal.

## Follow-up, same day: a focused phone field hid its Change Request button
**Problem (reported by the reviewer):** clicking a locked Phone Number field hid its button. The phone fields sit in a Bootstrap `.input-group`, which lifts a focused control to `z-index: 5`, over the button's `z-4`.

**Solution:** `custom.css` (`.position-relative .change-request-btn`) adds `z-index: 6 !important`, which applies to every locked field.

**Tests:** new `e2e/sidebar/profile/profile-change-request-button-focus.spec.ts` (real API, nothing written). It focuses Business Details › Phone Number and checks the button is what a click at its centre hits. It failed before the CSS change and passes after.

## Open items
- QA sheet BUG-039 → Fixed in build, pending stage retest.
