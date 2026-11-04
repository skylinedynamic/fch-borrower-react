# Appointments can end after midnight, and a refused save says why (BUG-024, round 2)

2026-11-02

## Problem
QA round 2 **BUG-024** (R2-OP-APPT-02) was reported against the Owner portal: with the start at **11:30 PM** the end list was empty. Confirm returned 422 "Duration must be at least 1 minute.", and the modal stayed open with no toast or inline error. The borrower portal's `/appointment` modal has the same code:
- The end options were `TIME_SLOTS.filter(slot => slot.value > timeStart)`, a same-day comparison, so nothing came after 23:30.
- A new start set the end 30 minutes later, but past 24:00 it fell back to the start time. `timeAfter()` also capped at 23:59.
- The duration was end minus start on the same date, which came out as 0.
- The 422's `errors.duration_minutes` had no place on the form, and no toast fired because `errors` was present.

The API needs no change: it stores the start plus `duration_minutes`, and its validation and clash check already handle crossing midnight.

## Solution
- `src/utils/appointmentTime.ts` (kept identical to `react-fch`):
  - `timeAfter()` wraps past midnight.
  - New `endSlotsAfter()`: the end list, running into the next day, labelled "(next day)".
  - New `minutesBetween()`: an end at or before the start is the next day.
  - New `endWithinDay()`: "24:00" for comparing with the start day's conflicts.
- `AppointmentModal.tsx`:
  - Uses those for the end list, the end after a new start, `duration_minutes` and the two overlap checks.
  - Shows `formErrors.duration_minutes` under the time slot.
  - Shows a 422 on any field outside `FORM_ERROR_FIELDS` under the time slot too (`timeSlotError`). Nothing is toasted.

## Files changed
- `src/utils/appointmentTime.ts`: `timeAfter` wraps; adds `endSlotsAfter`, `minutesBetween`, `endWithinDay`.
- `src/pages/appointment/AppointmentModal.tsx`: end list, duration, overlap checks, error display.
- `tests/utils/appointmentTime.test.ts`: the "23:30 → 23:59" expectation is replaced; +4 tests.
- `tests/pages/appointment/AppointmentModal.test.tsx`: +3 tests (an 11:30 PM appointment ends 12:00 AM the next day and saves 30 minutes; a `duration_minutes` 422 is shown; a 422 on a field the form has no place for shows under the time slot, with no toast).
- `e2e/sidebar/appointment/appointment-midnight-create.spec.ts`: new, against the real API. QA's steps on a day ~11 days out: start 11:30 PM, the end reads "12:00 AM (next day)", Confirm sends `duration_minutes: 30` and gets 200. It deletes the appointment again.

## Testing
- The unit (4) and integration (3) tests were written first, and all failed before the fix.
- Vitest `appointmentTime` + `AppointmentModal`: 23 passed. Full suite: 208 files, 1,555 passed.
- `npm run typecheck`: clean.
- E2E `e2e/sidebar/appointment/` against the local `fch-api` (`--workers=1`): 7 passed, including the new spec.
- `dompurify` (already in `package.json`/lockfile) was missing from the local `node_modules`, so `npm install` was needed before Vitest could load `sanitizeHtml`.

## Open items
- QA sheet BUG-024 (round 2) → Fixed in build, pending stage retest (both portals).
- The same fix is in `react-fch`, same date and title.

## Follow-up, same day: the reason goes under the time slot, never in a toast
Reviewer's request: no toast for an error message; show the reason under Time Slot. The 422 toast is removed. `timeSlotError` (the `duration_minutes` refusal, else the first one on a field the form has no place for) renders under the time slot. The test expecting a toast now expects the reason right after `.time-slot-container` and no toast; it failed first, then passed. Vitest `AppointmentModal` + `appointmentTime`: 23 passed. `npm run typecheck`: clean. No new live E2E: the real API cannot be made to refuse an unknown field, and the Vitest test covers it with MSW.
