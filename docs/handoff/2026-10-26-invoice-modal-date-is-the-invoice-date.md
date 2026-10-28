# Invoices — the invoice popup shows the invoice's own date (BUG-122)

**Date:** 2026-10-26
**Branch:** bugfix/all-bugfix
**Author:** awlad

## Problem
QA defect log **BUG-122** (raised on the admin invoice modal). The client portal's `InvoicePreviewModal.jsx` has the same date code: it parsed the API's `Y-m-d` invoice date with `new Date()`, which is UTC midnight, so a borrower behind UTC saw the day before. The API now sends the invoice's stored date (`toDateOnly`) in the borrower list as well (fch-api `docs/handoff/2026-10-26-invoice-date-is-the-stored-date.md`).

## Solution
The popup reads the date with `parseApiDate()` (`src/utils/dates.ts`), which pins a calendar date to local midnight.

## Files changed
- `src/pages/invoices/components/InvoicePreviewModal.jsx`: the date via `parseApiDate`.
- `tests/pages/invoices/components/InvoicePreviewModal.test.tsx`: +1 test.

## Testing
- **New:** `2026-10-20` shows as "20 Oct 2026" and is read through `parseApiDate`. That failed first. The test workers share one process time zone, so the test holds the popup to the day-safe helper.
- `tests/pages/invoices`: 30 passed. `npm run typecheck` clean.

## Open items
- None.
