# Profile Financial tab: optional income and deposits, required revenue

**Date:** 2026-10-27
**Branch:** feature/new-walk-through
**Author:** Awlad Hossain

## Problem
On Profile → Financial:
1. "Annual Personal Income *" and "Average Monthly Deposits *" were marked required. The API refused to save the tab without them, and profile completion listed them as missing. That kept the Complete Your Profile popup open and held the walkthrough on its first step.
2. Monthly Revenue and Annual Revenue are required, but the tab sent an empty field as `0` (`parseFloat(...) || 0`). A borrower who left them blank was saved with a revenue of zero and never saw the "required" error. Going the other way, a stored revenue of `0` returned as a number loaded as a blank field.

## Solution
- The asterisks are removed from Annual Personal Income and Average Monthly Deposits. A blank Annual Personal Income is left out of the save, like the other optional figures. fch-api accepts both as `nullable` and no longer counts them in profile completion.
- Monthly and Annual Revenue: empty is sent as `null`, so the API's `required` rule refuses it and the tab shows "Monthly revenue is required" / "Annual revenue is required". `0` is sent as `0` and saved. A stored zero (`0` or `"0.00"`) shows as 0, not blank. Two small exported helpers do this: `amountOrNull()` and `shownAmount()`.
- No API code change was needed for revenue: `required|numeric|min:0` already refuses null and accepts 0. fch-api now has tests that pin this.

## Files changed
- `src/pages/profile/components/FinancialSupport.tsx`: no asterisk on the two optional labels; empty annual personal income omitted; revenue sent as `null` when empty; `amountOrNull` / `shownAmount` helpers; stored revenue zero shown
- `src/modules/profile/types.ts`: `SaveFinancialInfoRequest`: `annual_personal_income` optional, revenue `number | null`

## Tests
- `tests/pages/profile/components/FinancialSupport.test.tsx`:
  - unit tests for `amountOrNull` and `shownAmount`
  - the optional labels carry no asterisk (revenue still does)
  - saving with income and deposits empty sends neither
  - empty revenue is sent as null and the API's refusal is shown
  - typed 0 is sent as 0
  - a stored 0 (number or "0.00") is shown
  - Watched the new ones fail first: the zero-as-number and empty-as-null cases failed before the fix.
- E2E `e2e/sidebar/profile/profile.spec.ts`: Financial labels check. New "Financial will not save with the revenue figures empty": the real API answers 422 and the errors show. It writes nothing; the save is only let through when it carries no revenue.
- Run: Financial tab file 19/19; profile Vitest 132/132; `npm run typecheck` clean; Playwright Profile spec 6/6. Full Vitest suite: see the session report.

## Open / follow-up
- Annual Personal Income is in `LOCKED_FINANCIAL_FIELDS`, so once it has a value it can only be changed through a change request. That is unchanged. fch-api's change-request rule for it is still `required`.
- The other optional figures (deposits, bank balance, debt) still load a stored numeric `0` as blank. That is harmless because a blank optional field is left out of the save, but it is inconsistent.
- Saving a revenue of 0 is covered by fch-api's HTTP test, not by E2E, because it would overwrite the local borrower's revenue.
