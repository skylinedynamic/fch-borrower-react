# Format checks server-side only (SSN, ZIP, EIN)

**Date:** 2026-10-19
**Branch:** bugfix/all-bugfix
**Author:** Awlad Hossain

## Problem
Some format checks still ran in the browser, ahead of the API, and stopped the save before anything was sent:
- **Profile → Personal Info:** the SSN went through `ssnError` (SSA area, group and serial rules).
- **Profile → Credit Profile request form:** the SSN went through `ssnError`, and the ZIP through a local 5-digit check.
- **Profile → Business Details:** the EIN was checked locally ("EIN must be 9 digits").

These checks belong to the API (`App\Rules\Ssn`, `UsPostalCode`, `BusinessEin`) and nowhere else. A second copy can drift from the real rule.

## Solution
- The three client checks were removed. Each form sends what was typed, in its usual written shape, and shows the API's 422 message on the field.
- The masks stay, since they only control how a value is written: SSN XXX-XX-XXXX, EIN XX-XXXXXXX, ZIP and phone.
- `src/utils/validators.ts` (`ssnError`, `SSN_INVALID_MESSAGE`) was deleted.
  - `SSN_DIGITS`, the length a full SSN is written to, moved to `src/utils/formatters.ts` next to `formatSSN`, which now uses it.
  - `SsnInput`, `PersonalInfo` and `CreditProfileTab` import it from there.
- No API change is needed: the API already returns these messages.

## Files changed
- `src/pages/profile/components/PersonalInfo.tsx`: SSN client check removed.
- `src/pages/profile/components/CreditProfileTab.tsx`: SSN and ZIP client checks removed.
- `src/pages/profile/components/BusinessDetails.tsx`: EIN length check removed; the example is used as the placeholder.
- `src/utils/formatters.ts`: `SSN_DIGITS`.
- `src/utils/validators.ts`: deleted.
- `src/components/SsnInput/SsnInput.tsx`: import moved.

## Tests
- **Updated:**
  - `tests/pages/profile/components/PersonalInfo.test.tsx`: a malformed SSN is sent; the server decides.
  - `tests/pages/profile/components/CreditProfileTab.test.tsx`: a short SSN, an unissuable SSN and a short ZIP are sent, and the API's answers show on their fields with no toast. An SSN that is only the last four is never sent as the number.
  - `tests/pages/profile/components/BusinessDetails.test.tsx`: a short EIN is sent, and the API's message shows on the field.
  - `tests/utils/formatters.test.ts`: `SSN_DIGITS`.
- **Removed:** `tests/utils/validators.test.ts`, together with the code it tested.
- **E2E:** added `e2e/sidebar/profile/personal-info-format-errors.spec.ts`. Against the real API, it checks that an unissuable SSN is refused by the server, the message shows on the field, and nothing is saved.
- **Run:**
  - `npm test`: 116 files, 750 passed (with `--maxWorkers=4`; under full parallel load, unrelated tests can time out at 20s).
  - `npm run typecheck`: clean.
  - Profile e2e (`personal-info-format-errors`, `business-details-format-errors`, `profile-ssn`): 9 passed.

## Open / follow-up
- None.

## Follow-up (same day): one SSN field, and a saved SSN shown formatted
- **Fund Application → Ownership step and Co-Borrower modal:** the SSN is now `SsnInput`, the same field as the profile's.
  - It shows `***-**-1234` at rest, edits on a click (dots), and shows the digits on the eye button.
- **Credit Profile form:** the SSN of a request just submitted came back from the API as nine bare digits. It is now written XXX-XX-XXXX.
- **Tests:**
  - `OwnershipInformationStep.test.tsx` and `CoBorrowerModal.test.tsx` updated (masked at rest, eye button);
  - `CreditProfileTab.test.tsx` (the submitted SSN reads back formatted).
  - **E2E:** `e2e/sidebar/funding-request/fund-application-ownership-ssn.spec.ts` (mocked API).
- **Run:**
  - `npm test`: 116 files, 752 passed (`--maxWorkers=4`).
  - typecheck: clean.
  - E2E: the ownership SSN spec passed. The earlier profile run (`profile-ssn`, `personal-info-format-errors`, `business-details-format-errors`) was 9 passed.

## Follow-up 2 (same day): SSN shown read-only, phone examples, co-borrower errors
- **My Applications → application details modal:** the SSN is now `components/SsnValue/SsnValue.tsx`: masked `***-**-6789`, digits on the eye button. It used to be shown in full.
- **Phone placeholders** (Co-Borrower modal, Ownership step, Business Details): now `(555) 555-5555`. The old `(123) 456-7890` is not a valid US number.
- **Co-Borrower modal:** a field's validation error now clears once that field is edited.
- **Tests:**
  - `tests/components/SsnValue/SsnValue.test.tsx`
  - `FundingApplicationDetailsModal.test.tsx`
  - `CoBorrowerModal.test.tsx` (placeholders, error cleared on edit)
  - `OwnershipInformationStep.test.tsx`, `BusinessDetails.test.tsx` (placeholders)
- **Run:**
  - `npm test`: 117 files, 760 passed.
  - typecheck: clean.
