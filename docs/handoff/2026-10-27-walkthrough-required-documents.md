# Walkthrough: only four documents are required

**Date:** 2026-10-27
**Branch:** feature/new-walk-through
**Author:** Awlad Hossain

## Problem
The Getting Started walkthrough's "Upload your documents" step required a file in every document category except Others and Miscellaneous Documents. That meant nine categories, including Business Plan, A/R Aging Report and tax returns. The popup said "upload a file in every document category", and the Documents page counted all nine ("1 of 9 categories") and marked them "Not uploaded".

Only four categories should be required:
- Driver's License
- Voided Business Check
- EIN / Corporation Docs
- Business Bank Statements

## Solution
fch-api decides when the step is done (`BorrowerDocType::required()`, now an explicit list of these four names; see fch-api's handoff of the same date). The portal now uses the same list:
- `src/config/documents.ts` has `REQUIRED_DOCUMENT_CATEGORIES` and `isRequiredDocumentCategory()`. Matching ignores case and surrounding spaces, and treats straight and curly apostrophes as the same, because the API names it "Driver’s License". `isOptionalDocumentCategory()` is now its inverse.
- Documents page: the progress and the "Your next step" prompt count only the four ("1 of 4 required", "1 of 4 required categories uploaded"). Every other category shows "Optional" when empty.
- Walkthrough popup: "Go to Documents and upload your four required documents. Every other category is optional." The to-do list names the four, built from the same constant.

## Files changed
- `src/config/documents.ts`: optional list replaced by the required list, plus helpers
- `src/config/onboardingSteps.ts`: upload_documents description and to-do copy
- `src/pages/documents/Documents.tsx`: counts and "next missing" use the required list
- `src/pages/documents/components/DocumentsFundingPrompt.tsx`: copy ("required documents", "required categories uploaded")
- `src/pages/documents/components/DocumentStats.tsx`: progress reads "x of 4 required"

## Tests
- Updated: `tests/config/documents.test.ts`: the four, apostrophe and case matching, every other seeded name optional
- Updated: `tests/pages/documents/DocumentsLayout.test.tsx`: fixtures use the real names; Business Plan and Others optional; a missing required category says "Not uploaded"
- Updated: `tests/pages/documents/components/DocumentsFundingPrompt.test.tsx`: new copy, 4 categories
- Updated: `tests/components/Onboarding/OnboardingSuggestion.test.tsx`: popup names the four and says the rest are optional
- E2E: `e2e/sidebar/documents/documents.spec.ts`: new "counts only the four required categories" (real API, read-only). `e2e/topbar/getting-started.spec.ts`: new "the documents step asks for the four required documents only".
- Run: `npm run typecheck` clean. Vitest: affected files 190/190 passed; full suite 1122/1122 before the Financial change in the same session. Playwright: Documents, Getting Started and Profile specs 15/15 passed.

## Open / follow-up
- The required list is matched by name in both repos. If an admin renames one of the four categories, it silently becomes optional. A `is_required` column on `borrower_doc_types` would be sturdier, but it needs a schema change and an admin UI.
- The Funding Request wizard (`FundingRequestWizard.tsx`) and the funding application's `docSections` have their own document lists. They were not changed.
