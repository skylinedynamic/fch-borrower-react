# Appointments — booked in the browser's time zone, no past times today (BUG-078, 079, 080)

**Date:** 2026-10-24
**Branch:** bugfix/all-bugfix
**Author:** awlad

## Problem
- **BUG-080**: Appointment › Create New Appointment defaulted Time Zone to "UTC (GMT+00:00)", and the calendar and appointment card showed times as stored, with no conversion. "Today" and an edited appointment's day came from `toISOString()` — the UTC day.
- **BUG-078**: today's Time Slot list offered times already passed; such a booking saved and showed as Expired.
- **BUG-079**: the same attendee could be booked twice in one slot — fixed in the API; the form shows its refusal.

## Solution
Same as the partner portal (separate codebase, same shape):
- New `src/utils/appointmentTime.ts` — browser zone and its label, the browser's day, today's start times still ahead, the default start (09:00 / next free / tomorrow), the end half an hour later.
- `src/pages/appointment/AppointmentModal.tsx`: Time Zone is the browser's, read only, and is sent as `timezone`; passed times of today are not offered and a new booking starts at the next free one; changing the date to today moves a passed start; an edited appointment keeps its own time; dates use the browser's day; the details view's zone is the browser's.
- The API stores UTC and returns times in the browser's zone (X-Timezone, already sent by `apiClient`), so the calendar and dashboard card show local times — fch-api `docs/handoff/2026-10-24-appointments-utc-past-times-and-clashes.md`.

## Files changed
- `src/utils/appointmentTime.ts` — new.
- `src/pages/appointment/AppointmentModal.tsx` — zone, start times, local day.
- `tests/utils/appointmentTime.test.ts` — new, 9 tests.
- `tests/pages/appointment/AppointmentModal.test.tsx` — +2 tests (browser zone shown and sent at 09:00; at 13:10 the booking starts 13:30).
- `e2e/sidebar/appointment/appointment-time-rules-create.spec.ts` — new, real API: stored UTC and read back per zone, the same slot refused, a past time refused; cleans up.

## Tests
- The two modal tests failed first (UTC sent; 09:00 offered after it had passed), pass after. `tests/pages/appointment` + util: 17 passed. Full Vitest: 832 of 833 — `FundingRequestStep` › "asks for the note while Other…" failed once under full-suite load and passes on its own (12/12); unrelated to this change. `npm run typecheck` clean.
- E2E (local API): `e2e/sidebar/appointment` 5 passed, plus the new rules spec passed.

## Open items
- `TIMEZONE_OPTIONS` in `src/config/appointmentTypeOptions.ts` is no longer used by the form; left in place.
- Mark BUG-078, 079, 080 in the QA defect log In Progress, then Fixed after the stage retest.
