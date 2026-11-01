# QA BUG-148: Card logo broken on a Credit Card Stacking step

Branch `bugfix/qa-bug-138-141-148`, cut from `stage` on 2026-10-29. Backend finding: F168 (and O73) in fch-backend-api `docs/test-findings.md`.

## Problem
To reproduce: Credit Card Stacking > Choose Your Strategy > Foundation 100 Play > Start This Play > View Roadmap > Step 1 (Lowe's Commercial Account) > Manage Status.

The card logo did not load (naturalWidth 0). The browser drew its alt text ("Lowe's Commercial...") in a small box at the top-left of the step card. This happened on both the host and the white-label portal.

`StepDetail.tsx` showed the placeholder only when `full_image_url` was empty. It had nothing for a URL that fails to load.

On the API side, `full_image_url` put `storage/` in front of a logo stored as a full URL, so such a logo never loaded. That is fixed in fch-backend-api; see its handoff `2026-10-29-qa-bug-138-141-148.md`.

## Solution
New `src/pages/capital-access/components/CardLogo.tsx`, used by `StepDetail.tsx`:
- it shows the card logo
- when there is no logo, or the logo fails to load (`onError`), it shows the same neutral card placeholder the page already used (`ri-bank-card-line` avatar), never the alt text
- a new URL is tried again

## Tests
`tests/pages/capital-access/CardLogo.test.tsx` has 4 tests:
- the logo loads
- a failed logo is swapped for the placeholder, with no alt text shown
- no logo shows the placeholder
- a new URL is retried
