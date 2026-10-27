# My Applications redesign; ad placeholder removed (BUG-086)

Date: 2026-10-27

## Problem
- **BUG-086:** Client portal › My Applications showed an "Advertisements" card with the literal text "Ad space". No ad feature exists: no API, no admin screen. The card was a placeholder from the page's first commit, in two copies (desktop and mobile).
- The user asked for a top-notch, responsive redesign of the list page, the Prequalification details dialog and the Funding Application details page, with no Action buttons in the lists.

## Solution
Same visual language as the Credit Builder Overview: the brand-coloured hero, 4px corners, soft shadows. All styles live in `src/pages/myapplication/MyApplications.css` under `ma-` classes.

**List page**
- The ad card is removed (both copies).
- A hero with "Apply New Prequalification" and the two totals (from each list's `meta.total`).
- The advisor card: beside the lists from 1400px, and a one-row strip above them below that.
- No Action column. A whole row opens its item, and the row's title is the link or button for the keyboard. An On Hold funding application still goes to Continue (BUG-027).
- Below 768px each row stacks into a card, its cells labelled from `data-label`. Wider tables scroll inside their card.
- Empty states with a next step. One shared `SectionPagination` replaces the two copies of the pagination markup.

**Funding Application details**
- A hero with the breadcrumb, status, Edit Application (same rule as before), Back, and key facts.
- A six-step progress tracker:
  - The stages are Started, Submitted, Underwriting, Approved, With lender and Funded.
  - The nineteen statuses map onto them in `modules/my-application/stage.ts`.
  - Denied and "action needed" each get a note.
- Sections in a two-column label/value grid, and documents as file cards.

**Prequalification details dialog**
- A hero with the business, status, requested amount and urgency.
- The underwriting outcome (summary, strengths, needs attention, notices, disclosure) comes before what was entered.

### Follow-ups the same day
- **Hero status:** a chip (dot + status, tone from the status's badge class via `toneFromBadgeClass`) replaces the faint pill on both detail heroes.
- **Key facts and totals:** one tile everywhere (list totals, detail hero, dialog). The icon and full label sit on one line (14px) and the figure is under them; the hero columns are widened so the labels fit on one line.
- **Dates:** the Date column stays on one line (`ma-nowrap`).
- **Activity:**
  - Redesigned as `components/detail/ApplicationActivity.tsx`: a timeline grouped by day, status changes as from → to, "by <name>", details on demand.
  - It reads through a new `useBorrowerActivityLogs` hook; `modules/activity-log` gained `types.ts`, `queries.ts` and `index.ts`.
  - The old `components/Common/BorrowerActivitySidebar.tsx`, used only here, is deleted.
  - It now sticks just under the top bar. The shared `top: 130px` allowed for a sub-header this page no longer has.
- **Breadcrumb:** the active "Details" item is readable on the hero; the theme coloured it navy with `!important`.
- **Skeleton loaders:** in the new shape. `FundingApplicationDetailLoader` draws the hero, tracker, sections and activity; the new `detail/PrequalDetailLoader` draws the dialog's hero and sections. The shared `components/Loader/PreQualificationDetailsLoader` is left in place for its other tests.

## Files changed
- `src/pages/myapplication/MyApplication.tsx`: new layout.
- `src/pages/myapplication/MyApplications.css`: new.
- `src/pages/myapplication/FundingApplicationDetailPage.tsx`: redesigned.
- `src/pages/myapplication/components/MyApplicationsHero.tsx`: new.
- `src/pages/myapplication/components/SectionPagination.tsx`: new.
- `src/pages/myapplication/components/PreQualificationRequests.tsx`, `FundingApplications.tsx`: redesigned; row navigation, no Action column.
- `src/pages/myapplication/components/RightSideSection.tsx`: advisor only; the ad card is gone.
- `src/pages/myapplication/components/PreQualificationDetailsModal.tsx`: redesigned. The Dashboard opens the same dialog.
- `src/pages/myapplication/components/detail/{DetailSection,KeyFact,StageTracker,ApplicationDocuments}.tsx`: new.
- `src/modules/my-application/stage.ts` (+ `index.ts` export): stage mapping.
- `src/pages/myapplication/components/detail/{StatusChip,ApplicationActivity,Skeleton,PrequalDetailLoader}.tsx`: new; `components/FundingApplicationDetailLoader.tsx`: rewritten.
- `src/modules/activity-log/{types,queries,index}.ts`: new.
- `src/components/Common/BorrowerActivitySidebar.tsx`: deleted (unstaged).
- Tests:
  - `tests/pages/myapplication/MyApplication.test.tsx`: new.
  - `tests/pages/myapplication/components/PreQualificationDetailsModal.test.tsx`: new.
  - `tests/modules/my-application/stage.test.ts`: new.
  - `tests/pages/myapplication/FundingApplicationDetailPage.test.tsx`: 5 overview cases added; its activity mock now points at `ApplicationActivity`.
  - `tests/pages/myapplication/components/{StatusChip,ApplicationActivity,DetailLoaders}.test.tsx`: new.
  - `tests/pages/myapplication/components/FundingApplications.test.tsx`: the BUG-027 case now checks the row's title link instead of the removed Continue/View buttons.
- `e2e/sidebar/my-applications/my-applications.spec.ts`:
  - New checks: no ad, totals present, and no sideways scroll at 390px.
  - `exact: true` on the Prequalification Requests heading, since the hero text now also contains the words.

## Testing
- New tests failed first, then passed. Full Vitest: 165 files, 1260 passed.
- `npm run typecheck`: clean.
- E2E against the local API, `e2e/sidebar/my-applications` + `e2e/sidebar/dashboard`: 30 passed.
- Looked at in a browser at 1440, 1280 and 390px: list, dialog and detail page.

## Open items
- `FundingApplicationDetailsModal.tsx` (and its test) is no longer opened from My Applications, which uses the detail page. It was left in place.
- Navigating from the list to a detail page keeps the scroll position, as elsewhere in the app; there is no scroll-to-top on route change.
