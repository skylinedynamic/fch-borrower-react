# Financial tab currency default and visible rejection reason (BUG-077, BUG-083)

Date: 2026-10-27

## Problem
- **BUG-077:** Profile › Financial showed an empty, required "Select currency" when no currency was stored, although the partner portal displayed USD for the same client.
- **BUG-083:** a rejected credit builder task showed "Verification rejected - see the note", but the note was only in a hover tooltip on the "Rejected" pill. The note the API sent was also not the reviewer's reason (fixed in `fch-api`, handoff of the same date).

## Solution
- **Currency:** the Financial tab starts at `DEFAULT_BORROWER_CURRENCY` (USD, in `src/config/appConfig.ts`) when the API has none. A stored currency is kept, and the lock rule still reads the API's value.
- **Rejection reason:** the Guide's generic and vendor tasks show "Reason: <note>" under a rejected task, in red. The review line now reads "Verification rejected". The Overview already showed `rejection_reason`; the API now fills it.

## Files changed
- `src/config/appConfig.ts`: `DEFAULT_BORROWER_CURRENCY`.
- `src/pages/profile/components/FinancialSupport.tsx`: currency defaults to USD.
- `src/pages/credit-builder/creditguide/components/TierGenericTask.tsx`: reason line; review text.
- `src/pages/credit-builder/creditguide/components/Tier1Task.tsx`: reason line.
- `src/pages/credit-builder/creditguide/CreditGuide.css`: `.cg-step-reason`.
- `tests/pages/profile/components/FinancialSupport.test.tsx`: 2 currency cases, with seeded countries.
- `tests/pages/credit-builder/creditguide/components/RejectedTaskReason.test.tsx`: new (4 cases).

## Testing
- New cases failed first, then passed. Full Vitest: 162 files, 1228 passed.
- `npm run typecheck`: clean.
- E2E against the local API, `e2e/sidebar/credit-builder` + `e2e/topbar`: 34 passed.

## Open items
- No E2E covers a rejected task's reason end to end. It needs a seeded rejected verification request, and no `E2E*Seeder` provides one yet.
