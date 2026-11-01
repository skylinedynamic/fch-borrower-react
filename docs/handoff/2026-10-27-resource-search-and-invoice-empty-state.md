# Resource Hub "no results" message and Invoices empty state (BUG-065, BUG-066)

Date: 2026-10-27

## Problem
- **BUG-065:** Resource Hub's "Search Education & Help..." left an empty white area when nothing matched (e.g. "EIN"). The search covering only Education & Help is by design and stays that way.
- **BUG-066:** an empty Invoices list always said "No invoices found. Contact your partner to pay and unlock." That is free-plan lock wording, and it appeared even for a paid client whose search or filter matched nothing.

## Solution
- **Resource Hub:** when the Education & Help search has text and nothing matches, it shows: No Education & Help resources match "<term>".
- **Invoices:**
  - The page works out `isFiltered` from the applied search, status, payee, cycle, date range and column filters, and passes it to `InvoiceTable`.
  - The table says "No invoices match your search or filters." when filtered, and "No invoices found." otherwise.
  - The "Contact your partner…" line is gone; free trial already locks the Invoices menu.
  - The KPI cards still reflect the filtered set; that is by design.

## Files changed
- `src/pages/resources/ResourceHub.jsx`: no-results message under the Education & Help grid.
- `src/pages/invoices/Invoices.jsx`: `isFiltered` computed and passed to the table.
- `src/pages/invoices/components/InvoiceTable.jsx`: new `isFiltered` prop and the two empty messages.
- `tests/pages/resources/ResourceHub.test.tsx`: 2 new cases (no match shows the message; matches still list).
- `tests/pages/invoices/Invoices.emptyState.test.tsx`: new (2 cases).
- `e2e/sidebar/invoices/invoices.spec.ts`: the no-match search checks the new message.
- `e2e/sidebar/resource-hub/resource-hub.spec.ts`: new case for the Education & Help no-match message.

## Testing
- New Vitest cases failed first, then passed. Full suite: 161 files, 1222 passed.
- `npm run typecheck`: clean.
- E2E against the local API (invoices, resource-hub, dashboard): 32 passed, 2 failed. Both failures are in `resource-hub.spec.ts` (the Training Academy video modal, and a file opening its detail page). They fail without this change too, most likely because the local data has no such resources.

## Open items
- The two pre-existing resource-hub E2E failures above.
