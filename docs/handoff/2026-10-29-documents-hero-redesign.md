# Documents: the top section redesigned as a brand hero, with Your next step under it

**Date:** 2026-10-29
**Branch:** bugfix/all-bugfix
**Author:** Awlad Hossain

## Problem
The top of the client portal's Documents page was two plain boxes: a white header with three small stats, then a separate bordered "Your next step" bar.
- It didn't match the newer pages (My Applications, Credit Builder).
- The progress was one thin bar, so it didn't show which required category was missing, rejected or still in review.

After the first hero, the user asked for a shorter hero (it was taller than the categories under it) and a better "Your next step" design. The amber card with chips was not liked either.

## Solution
**The hero** uses the language of My Applications (`MyApplications.css` `.ma-hero`): the tenant's brand colour, a faint grid, a glass card and 4px corners. It is kept short, about 175px on a wide screen instead of about 340px.
- **Left:**
  - one title row: an icon, "Documents" and a one-line explanation. The separate "Documents" eyebrow is gone.
  - small chips: files uploaded and the max size per file.
- **Right, the progress card:**
  - "x of N required" (still `.docs-stat-value`) and the percentage on one line.
  - **One segment per required category**, coloured by its state from BUG-135: green accepted, amber in review, red re-upload, faint missing.
  - A legend counts each state.
- **Bottom:** every allowed file type on its own line. The user asked for the full list, not "+28 more".
- **Loading:** a skeleton in the same layout.
- **Below 992px** the two columns stack.

**Your next step** is its own section under the hero (`DocumentsFundingPrompt`). It is a white card in the brand colour; it turns green once everything is in.
- **Top row:**
  - A progress ring with "filled/total" (a tick once all are in). The ring is `role="img"` with the label "x of N required categories uploaded".
  - "Your next step", the count as a brand-tinted pill, and the message. The texts are unchanged.
  - The button: "Upload <category>" or "Continue to Funding".
- **Stepper along the bottom:** one step per required category, joined by a line.
  - Missing shows its number; accepted a green tick; in review an amber clock; re-upload a red refresh.
  - The next one to do is filled with a halo (`aria-current="step"`, bold name).
  - The line into an accepted step is green, and into one in review amber.
- **Phones:** the button takes the full width, and the steps become a list.

`Documents.tsx` passes each required category's state (`requiredCategories`) to both the hero and the next step.

## Files changed
- `src/pages/documents/components/DocumentStats.tsx`:
  - the short hero (title row, fact chips, segments, legend);
  - the allowed files line at the bottom.
- `src/pages/documents/components/DocumentsFundingPrompt.tsx`:
  - the ring and the stepper;
  - a new `categories` prop.
- `src/pages/documents/components/DocumentsFundingPrompt.css`: the card, ring and stepper styles.
- `src/pages/documents/Documents.tsx`:
  - `requiredCategories`, passed to both;
  - the shorter loading skeleton;
  - the prompt rendered under the hero.
- `src/pages/documents/Documents.css`: the hero styles and their breakpoints.

## Tests
- `tests/pages/documents/components/DocumentStats.test.tsx` (5 tests):
  - the count and percentage;
  - the segments with their state classes and labels;
  - a legend without empty states;
  - the facts;
  - and (red first) one title, plus every allowed type on its own last line with no "more".
- `tests/pages/documents/components/DocumentsFundingPrompt.test.tsx`, red first:
  - the ring reads "1/4" under its label.
  - The stepper lists the categories in order with their state classes, the next one picked out with `aria-current`, and numbers only on missing steps.
- `tests/pages/documents/Documents.test.tsx`:
  - "the next step is its own section under the hero";
  - (red first) "marks each required document in Your next step, the rejected one as the next".
- E2E `e2e/sidebar/documents/documents.spec.ts`:
  - The stubbed BUG-135 test also checks the stepper (4 steps, the rejected one current) and the ring reading "2/4".
  - New: "keeps the hero short on a wide screen" (under 180px at 1440px wide).
  - Result: 7 passed.
- Run:
  - Documents and utils suites: 42 passed.
  - `npm run typecheck`: clean.
  - Checked visually at 1440px (missing, rejected and done) and 390px.

## Open / follow-up
- `e2e/sidebar/documents/document-upload.spec.ts` fails, and the failure predates this change. It looks for `.accordion-item` / `.accordion-header`, which the page no longer has since the split view. It is logged in `docs/e2e/ISSUES.md`.
