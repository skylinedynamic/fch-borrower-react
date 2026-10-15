# Change Request button breaks when a locked profile field shows an error

2026-10-15

## Problem
Profile → Business Details → Phone Number (and every other locked profile field with a "Change Request" button): when the API returned a field error — e.g. the new server-side phone rule, "Enter a valid 10-digit US phone number, e.g. (555) 234-5678." — the button stretched down over the error message and Bootstrap's red `is-invalid` icon was drawn on top of it.

Cause: the button is absolutely positioned inside the field's `position-relative` wrapper, and that wrapper also contains the `invalid-feedback` message. Two rules sized the button against the wrapper rather than the input: `custom.css` centred it (`top: 50%; transform: translateY(-50%)`) and `custom.min.css` set `height: calc(100% - 8px) !important`. With the message inside, "100%" became input + message. The `is-invalid` background icon sits at the input's right edge, under the button.

## Solution
CSS only, in `assets/css/custom.css` (loaded after `custom.min.css`):
- `.position-relative .change-request-btn` is placed and sized against the field instead: `top: 4px`, `height: calc(37.5px - 8px)`, no transform (fields are 37.5px). Same 4px inset as before, so the normal state looks unchanged.
- `.locked-field-padding.is-invalid` drops the invalid icon; the red border and the message carry the error.

One place rather than 40 markup edits: all 40 buttons (`BusinessDetails`, `PersonalInfo`, `FinancialSupport`) sit beside single-line inputs or the same-height dropdown.

## Files changed
- `assets/css/custom.css` — the two rules above.

## Testing
- Rendered the field markup with the app's stylesheets (bootstrap, app, custom.min, custom, responsive, brand-tokens) in Playwright, with and without an error, before and after. Before: button 59px tall over the message, icon on top (reproduces the report). After: button 29.5px at 4px in both states, no icon.
- No Vitest/E2E change: jsdom does not apply stylesheet layout, and no spec asserts this styling.

## Open items
- The fixed 37.5px assumes the theme's input height; a locked field that is not a single-line input would need its own size.
- `custom.min.css` still carries the old `height: calc(100% - 8px)` rule (overridden, not removed).
