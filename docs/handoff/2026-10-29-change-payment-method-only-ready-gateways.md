# Change Default Payment Method offers only gateways that can take payments (BUG-130)

**Date:** 2026-10-29
**Branch:** bugfix/all-bugfix
**Author:** Awlad Hossain

## Problem
QA defect log **BUG-130** (CP-BILL-02), a regression of BUG-032. Wanda's free-plan client (QA-TEST ONB WFree) opened Billing Details › Default Payment Method › Change and saw Stripe and Cash Payment, with Stripe ticked. The card form stayed a grey loading skeleton forever.

- Wanda's Stripe is **Active with no keys**. The dialog filtered gateways on `status` alone and never read the API's `can_take_payments`, so a gateway that is on but not set up was offered and, being first, pre-selected.
- With no publishable key, `getStripe()` returns null, so the card form never mounted and the skeleton never went away.
- On 25-Oct (BUG-032), Wanda's Stripe was presumably off, so only Cash showed. The sheet said "Fixed", but no code had changed.

## Solution
- **Gateway list:** the dialog lists only gateways with `status !== false` **and** `can_take_payments !== false`. `can_take_payments` already comes from fch-api (`PartnerPaymentProviderListResource`, from `PaymentSetup::isReady`), so no API change was needed. A reply without the field still lists the gateway, as before. For Wanda's client, only Cash Payment is offered and picked.
- **Stripe with no key:** as a fallback, if Stripe is chosen and its card form can't load, the dialog says "Card payments are not available right now…" instead of showing the skeleton forever. The text is `STRIPE_UNAVAILABLE_MESSAGE`.

## Files changed
- `src/pages/billing-details/BillingDetails.tsx`: the `can_take_payments` filter. New `stripeUnavailable` state shows the message instead of the loader.
- `src/modules/billings/services.ts`: `PaymentProviderItem.can_take_payments`.
- `src/config/paymentConfig.ts`: `STRIPE_UNAVAILABLE_MESSAGE`.

## Tests
- Updated: `tests/pages/billing-details/ChangePaymentMethodModal.test.tsx`, +3 tests.
  - An active gateway that can't take payments is not offered, and Cash is picked. Red first.
  - A reply without `can_take_payments` still lists the gateway.
  - Stripe with no key shows the message, not the skeleton. Red first: it timed out on the skeleton.
- E2E: `e2e/sidebar/billing-details/billing-details.spec.ts`, +1 test. It stubs the gateway list with Stripe that can't take payments plus Cash, and expects only Cash and no skeleton. The rest of the page runs against the local API.
- Run:
  - `tests/pages/billing-details` + `tests/modules/billings`: 15 passed.
  - `npm run typecheck`: clean.
  - `billing-details.spec.ts`: 4 passed.

## Open / follow-up
- **The red "Server Error" banner** on the same page (`GET /borrower/billing-details` → 500) is BUG-111, not part of this fix.
- **Partner setup:** Wanda's Stripe is Active with no keys. The admin panel's payment settings show the setup issue. Turning it off, or adding keys, is a data/setup step for the partner.
