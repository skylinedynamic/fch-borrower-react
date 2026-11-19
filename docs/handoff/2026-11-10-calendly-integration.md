# Calendly integration (borrower portal)

**Date:** 2026-11-10
**Branch:** `feature/calendly-integration` (from `release`)
**Author:** arafat-invento (with Claude Code)

## Problem
A borrower's meetings in the company Calendly didn't show on their Appointments page, and they couldn't book into Calendly from the portal.

## Solution
This is the borrower side of the backend change. See `fch-backend-api/docs/handoff/2026-11-10-calendly-integration.md`.

- **Book via Calendly** appears under Create New Appointment when the company Calendly is connected and the borrower may book with its host (`can_book`).
- `CalendlyBookingModal`:
  1. The borrower picks the event type, then a day.
  2. They pick one of Calendly's open slots, shown in the browser's zone.
  3. They can optionally add a subject, meeting type and description.
  4. The borrower is the Calendly invitee, so Calendly emails them the invitation and links.
- **Calendly meetings**, including ones the borrower booked straight on Calendly with their portal email, get a "Calendly" badge with **Join** and **Reschedule** links. They can't be dragged on the calendar.

## Files changed
- `src/modules/calendly/{types,services,queries,index}.ts` — status, event types, open times, book.
- `src/lib/query/queryKeys.ts` — `calendly` keys.
- `src/pages/appointment/CalendlyBookingModal.tsx` — new.
- `src/pages/appointment/Appointments.tsx` — the button and modal, the badge and links, no dragging for Calendly meetings.
- `src/modules/appointment/types.ts` — the new appointment fields.

## Tests
- Added:
  - `tests/modules/calendly/services.test.ts`
  - `tests/pages/appointment/CalendlyBookingModal.test.tsx`
- Updated:
  - `tests/pages/appointment/Appointments.test.tsx` — the Book via Calendly button when it's allowed, and the badge and links.
  - `tests/mocks/handlers.ts` — `GET */common/calendly/status` now answers "not connected" by default, because the Appointments page asks for it.

## Open / follow-up
- Backend D19 and O81–O83.
