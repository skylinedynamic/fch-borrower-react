# Credit Accounts redesign; any status from any other is by design (BUG-028)

**Date:** 2026-11-01
**Branch:** bugfix/round-2
**Author:** awlad

## Problem
- **BUG-028** (R2-CP-CBA-01, Client › Credit Builder › Credit Accounts). QA expected the card's Mark As menu to enforce Requested → Processing → Approved. Instead, a card with no status (N/A) could be marked Approved directly, and `POST /borrower/credit-builder/credit-accounts/{id}/apply` answered 200.
  - **Decision (product owner):** this is **by design, not a defect**. The vendor approves the account outside the portal. The status is only the borrower's own note of where that stands, so any status may follow any other.
  - The decision had to be written into the code and the tests, so nobody "fixes" it later.
- The page was asked to be redesigned ("top notch") to match the newer pages (Credit Builder Overview, My Applications, Documents).
  - It was one 488-line file with inline styles, a Bootstrap-JS dropdown and a direct service call for the status.
  - Every card's logo was blank: the accounts have no image, and the fallback `/assets/images/fch-logo-ver.png` does not exist in the app.

## Solution
**BUG-028 kept as is, documented and pinned:**
- A "BY DESIGN (BUG-028)" note sits on `creditAccountStatusOptions.ts`, on `StatusMenu`, on `useApplyForCreditAccount`, and on fch-api `CreditAccountService::apply()`.
- **Tests:**
  - Vitest: N/A → Approved posts `{ status: 'Approved' }`, and all three options are offered.
  - fch-api feature test: N/A → Approved and Approved → Requested are both 200.
  - E2E: the menu lists all three.

**Redesign** in the Overview's visual language: the brand hero, 4px corners, soft shadows. Styles are under `ca-` in `CreditAccounts.css`, and the page is split into components.
- **Hero:**
  - Eyebrow, title and subtitle.
  - Three "how it works" steps: pick an account, apply on the vendor's site, mark where it stands.
  - A glass card with *Accounts available* (`meta.total`), *Your tier*, and a link to the Step-By-Step Guide.
- **Toolbar:**
  - The search is a real `searchbox`, and Enter applies the filters.
  - Category and Issuer dropdowns, then Apply and Clear.
- **Cards:**
  - A category-coloured top edge and the approval-level tag.
  - The logo, or the issuer's initials as a monogram when there is no logo or it fails to load.
  - Issuer, category pill and title, then a status chip: *Not applied* / Requested / Processing / Approved, each in its own tone.
  - Min FICO and In business tiles, then the requirements as a `dl` (PG required, Credit profile, Final approval) and *Apply now*.
  - Each card is an `article` named by its title.
- **Mark As menu:**
  - A React menu (`role="menu"`, `menuitemradio`) with the current status ticked. It closes on picking, on Escape, or on an outside click.
  - The toggle spins while that card saves.
  - It goes through the new `useApplyForCreditAccount` mutation, which invalidates the list.
- **States:** "Credit accounts are locked" (below Tier 2, same copy as before), "No matching accounts" with *Clear filters*, and skeleton cards in the new shape.
- **Pagination:** its own component, `aria-current` on the current page.
- **Phone:** the hero stacks, the filters and buttons take the full width, and the cards are one column.
- **Reduced motion** is respected.
- Status values and the filter "all" options are now constants in `src/config/creditAccountStatusOptions.ts`.

## Files changed
- `src/config/creditAccountStatusOptions.ts`:
  - `CREDIT_ACCOUNT_STATUS` and its type;
  - the BY DESIGN note;
  - the no-status label, the "All" filter values, and the minimum tier.
- `src/modules/credit-accounts/`:
  - `types.ts`: status typed from config; apply payload and response types.
  - `services.ts`: apply typed.
  - `queries.ts`: `creditAccountKeys` and `useApplyForCreditAccount`.
- `src/utils/creditAccounts.ts`: `requirementLabel`, `creditAccountLogo` (null when there is no logo), `issuerInitials`.
- `src/pages/credit-builder/creditvendorapplication/CreditAccounts.tsx`: rewritten as the page shell.
- `src/pages/credit-builder/creditvendorapplication/CreditAccounts.css`: new.
- `src/pages/credit-builder/creditvendorapplication/components/`, all new:
  - `CreditAccountsHero.tsx`
  - `CreditAccountsToolbar.tsx`
  - `CreditAccountCard.tsx`
  - `StatusMenu.tsx`
  - `CreditAccountsStates.tsx`
  - `CreditAccountsPagination.tsx`
- fch-api (same date), `app/Services/Borrower/CreditBuilder/CreditAccountService.php`: the BY DESIGN note, and the model's status constants instead of string literals.

## Tests
- **Added:** `tests/pages/credit-builder/creditvendorapplication/CreditAccounts.test.tsx`, 9 tests. All failed first.
  - The hero count.
  - The card's facts, status and Apply link.
  - *Not applied*.
  - Monogram vs logo.
  - **N/A → Approved (BUG-028, by design)**.
  - The current status is ticked.
  - Enter searches and Clear resets.
  - The empty state.
  - The tier lock, with no list request.
- **Updated:** `tests/utils/creditAccounts.test.ts`, +3 tests (`requirementLabel`, `creditAccountLogo`, `issuerInitials`).
- **E2E:** `e2e/sidebar/credit-builder/credit-accounts/credit-accounts.spec.ts`, +2 tests:
  - the hero, then cards, the lock or the empty state; Apply opens a new tab; the menu offers all three statuses;
  - no sideways scroll at 390px.
- **fch-api:** `tests/Feature/CreditBuilder/BorrowerCreditBuilderApiTest.php`, +1 (`a_borrower_may_mark_any_status_from_any_other_by_design`).
- **Run:**
  - Full Vitest: 208 files, 1,544 passed.
  - `npm run typecheck`: clean.
  - E2E `e2e/sidebar/credit-builder` against the local API: 10 passed.
  - fch-api `BorrowerCreditBuilderApiTest`: 28 passed.
- **Looked at** in Chromium at 1440px and 390px with the E2E borrower (Tier 5, 6 accounts, none with a logo).

## Follow-up the same day: footer, strip under the top bar, 4 to a row
**Problem:** after the redesign the footer floated over the cards, and a white strip showed under the top bar.
- Cause: the pagination buttons and the page wrapper shared the class `.ca-page`.
- So `.page-content` got the button's `display: grid; height: 36px`, and was held to 132px with its content spilling out.
- The footer, positioned at the bottom of that box, landed mid-screen, and the white page background showed as the strip.

**Fix:**
- The pagination buttons are now `.ca-pg-btn`.
- The grid is a fixed **4 per row**: 3 below 1200px, 2 below 992px, 1 below 768px. Before, it was `auto-fill`, which gave 5 on wide screens.
- Monogram initials skip small words: "Bank of America" is BA, not BO.

**Tests:**
- E2E: "grows with its cards, so the footer sits below the last one; four cards to a row". It would have failed before: the footer was at 940px, the cards ran to 1,250px.
- `issuerInitials` gained two cases, which failed first.
- Run: E2E `e2e/sidebar/credit-builder`, 11 passed. Vitest (page + utils) 25 passed. `npm run typecheck` clean.

## Second design pass, tier name, card spacing (same day)
**Feedback:** the hero's facts box, the coloured top border on cards and the card layout did not look good. "Your tier" showed 5 while the highest tier is 4. The gap between card rows was too large.

**Hero:**
- The facts box is now two separate frosted tiles: "Accounts available" and "Your tier", each with an icon box. This matches the My Applications hero.
- The Step-By-Step Guide button sits under the subtitle on the left.
- The "how it works" chips are removed.

**Cards:**
- No coloured top border; on hover the border takes a light brand tint.
- **Head:** a 48px logo or monogram (brand-tinted, no longer category colours), the issuer and the name beside it, and the Mark As menu on the right.
- **Tags:** category, then approval level (green/amber/red).
- **Figures:** Min FICO | In business, as one strip split by a divider.
- **Requirements:** listed under the figures.
- **Footer row:** the status on the left, Apply now on the right.

**Tier:**
- `user.current_tier` is the tier's **id**, a foreign key to `tiers`, not its number. That's why id 5 showed for Tier 4.
- The hero now shows the tier's name from `useCreditProgress()`, the same source the Overview uses.

**Spacing:**
- A global `article` rule added `margin-bottom: 24px` to every card, so rows were 44px apart instead of 20px.
- `.ca-card` now sets `margin: 0`.

**Tests:**
- +1 Vitest test (the tier name, not the id). It failed first.
- The E2E row-spacing test now also checks the gap between rows is at most 21px.

**Run:**
- Full Vitest: 208 files, 1,546 passed. `npm run typecheck` clean.
- E2E `e2e/sidebar/credit-builder`: 11 passed.

## Third pass: the original card layout, shadow-only hover, footer gap (same day)
**Feedback:** the user preferred the card's original layout, wanted only a shadow on hover, and asked for a gap between the cards and the footer.

**Card, back to the original layout** (still the `CreditAccountCard` component and `ca-` styles):
- The card image on top in a 130px band, with the approval level top-left and the Mark-as menu top-right. Initials show when there is no image.
- The issuer, the name, then the category as an outlined uppercase tag, with the status chip beside it.
- Min FICO and TIB as two tinted tiles, blue and green, with the figures left-aligned.
- PG Required, Credit Profile and Final Approval in a dashed box.
- A full-width Apply Now button.

**Hover:** only the shadow grows. No border tint, no lift.

**Footer gap:**
- The theme's `.page-content` keeps 60px of bottom padding for the absolutely positioned footer, and `.ca-page` had cut it to 8px.
- It is now 84px: the footer plus a 24px gap.
- The E2E test asserts the footer is at least 20px below the last card.

**Task activity (Overview):** compact one-line rows; see `2026-11-01-overview-task-activity-by-tier.md`.

**Run:**
- Full Vitest: 208 files, 1,546 passed. `npm run typecheck` clean.
- **Not run this pass:** the Credit Builder E2E suite and a final screenshot after the figure-alignment and footer-gap fixes. The local API slowed to about 20s per request (one request at a time), and pages timed out before loading. Re-run `npx playwright test e2e/sidebar/credit-builder` once the local API is responsive.

## Fourth pass: the footer gap really applied; TIB "0 mo+" (same day)
**Feedback:** there was still no gap above the footer, and a card with no time-in-business minimum read "0 mo+".

**Footer gap:**
- The third pass's `padding-bottom: 84px` on `.ca-page` never took effect.
- `custom.min.css` sets `.page-content { padding: … 60px … !important }` globally, and an `!important` rule beats any normal rule whatever its specificity. The browser computed 60px, and the footer sat right on the last card (gap 0).
- That global rule is left alone, since every page depends on it. Instead, `.ca-page > .container-fluid` gets `padding-bottom: 24px`, which sits above the 60px the footer occupies.
- The E2E check from the third pass (footer ≥ 20px below the last card) failed with 0 before this fix and passes after it.

**TIB:**
- The card printed `{months ?? 0} mo+`, so 0 or blank showed "0 mo+".
- The new `timeInBusinessLabel` in `src/utils/creditAccounts.ts` shows "12 mo+", or "No min" for 0 or blank. That matches how Min FICO already reads when blank.

**Tests:**
- +1 unit test (`timeInBusinessLabel`) and +1 page test ("No min", not "0 mo+"). Both failed first.

**Run:**
- Vitest (Credit Accounts page + utils): 28 passed. `npm run typecheck` clean.
- E2E `e2e/sidebar/credit-builder`: 11 passed (the footer-gap test failed before the fix).

## Open / follow-up
- **QA sheet:** set BUG-028 to *Not a bug / By design*, with a comment saying the status is the borrower's own tracking and the vendor approves outside the portal.
- `components/Loader/VendorCardLoader` is no longer used by this page; it was left in place. The old `vendor-card-colorful`/`status-ribbon` styles in the global stylesheet are now unused here too.
- No account in the local data has a logo, so the monogram is what borrowers see until logos are uploaded in the admin panel.
