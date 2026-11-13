# Credit account card image spills out of its box

Date: 2026-11-13

## Problem

On Credit Builder › Credit Accounts (`/credit-builder/credit-accounts`), a tall card image rendered at its natural size. The WEX FlexCard image was the example. It spilled out of the 130px image box and covered the issuer, card name and tiles. The wider the card, the worse it got: at a three-card width it overlapped badly, and at 1440px it was off by about 3px.

Cause: `.ca-card-visual` is a grid with a fixed `height: 130px`, but its single row was `auto`, so the row grew with its content. The image's `max-height: 100%` then had no definite height to measure against. Only `max-width: 100%` applied, and the height followed the image's aspect ratio.

## Solution

`.ca-card-visual` now has `grid-template: minmax(0, 1fr) / minmax(0, 1fr)`, which makes its one cell exactly the box's content size. The image keeps `max-width`/`max-height: 100%` with `object-fit: contain`, so:
- a large image shrinks to fit
- a small logo stays at its natural size and isn't stretched

The card's `overflow: visible` is unchanged, so the Mark-status menu still opens outside the card.

## Files changed

- `src/pages/credit-builder/creditvendorapplication/CreditAccounts.css`: definite grid cell on `.ca-card-visual`.
- `e2e/sidebar/credit-builder/credit-accounts/credit-accounts.spec.ts`: new test, "keeps every card image inside its image box".

## Testing

- **New E2E test.** It checks at 1200px and 1440px that no loaded card image extends more than 1px past its image box.
  - Before the fix it failed on the WEX image, 3px over at 1440px.
  - After the fix it passes.
- Whole credit-accounts spec: 6 passed (5 tests plus login setup).
- `tests/pages/credit-builder/creditvendorapplication`: 11 passed.
- `npm run typecheck`: clean.

## Open items

- Hovering scales the image to 1.03, so on hover it can still go about 1.5% past the box edge. This is intended and not covered by the test.
- Run the E2E spec against a build (the config default). Against the Vite dev server (`E2E_BASE_URL=http://localhost:5173`), the shared runtime-error fixture fails on a dev-only `waves.min.js` page error.
