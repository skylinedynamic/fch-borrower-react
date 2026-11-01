# QA BUG-141: White-label logo fallback name unreadable

Branch `bugfix/qa-bug-138-141-148`, cut from `stage` on 2026-10-29. Backend finding: F167 in fch-backend-api `docs/test-findings.md`.

## Problem
On a white-label client portal, a logo that fails to load is replaced by the tenant's name (`BrandLogo.tsx`). In the sidebar that name was `rgb(73,80,87)` (`#495057`, the light sidebar's menu colour) on the navy sidebar `rgb(0,31,63)`, so it was nearly invisible. The host portal showed it in white.

The cause: `.brand-logo-text` took `--vz-vertical-menu-item-active-color`. White-label branding (`utils/brandingTheme.ts`) does not set that variable. It sets `--brand-on-sidebar` instead.

## Solution
`assets/css/custom.css` `.brand-logo-text` now uses this colour:
`var(--brand-on-sidebar, var(--vz-vertical-menu-item-active-color, #fff))`

That is the text colour the branding works out for the sidebar background, the same one the menu items use. The top bar and sign-in page rule (`--vz-heading-color`) is unchanged.

## Tests
`tests/components/Layout/BrandLogoFallbackColor.test.ts`:
- the rule uses `--brand-on-sidebar`
- the top bar and sign-in rule is kept
- `buildBrandVars` gives a contrast of at least 4.5:1 on the navy sidebar QA saw, and on a light sidebar

jsdom has no cascade, so the rule itself is pinned.
