# Profile: full Social Security Number instead of "Last 4 SSN"

**Date:** 2026-10-12
**Branch:** bugfix-awlad
**Author:** Awlad Hossain

## Problem
The Personal Info tab (`/profile`) asked for "Last 4 SSN" and sent `last_4_ssn` with every save. The API wrote those four digits into the same encrypted column that holds the borrower's **full** SSN. Saving any profile change (a name, an address) therefore replaced the full SSN with its last four, breaking whatever relies on it later (credit profile, funding application).

## Solution
- The tab now has a **Social Security Number** field. It is formatted as `XXX-XX-XXXX` while typing, masked by default with a show/hide toggle, and checked client-side with the same rules as the API's `App\Rules\Ssn` (9 digits; never area 000/666/900+, group 00 or serial 0000).
- The API never sends the number back. It sends `ssn_masked` (`***-**-6789`) and `ssn_on_file`, so the field starts **empty**:
  - With a full SSN on file it shows "On file: ***-**-6789. Leave blank to keep it."
  - With only the last 4 on file (older accounts) it asks for the full SSN.
- A blank field is left out of the save, which keeps the SSN on file. A typed SSN is sent as 9 digits (`ssn`).
- The client-side SSN check moved from `CreditProfileTab.tsx` into `src/utils/validators.ts`, so both forms share one rule.
- **Depends on the fch-api change** of the same date (`docs/handoff/2026-10-12-borrower-full-ssn-and-seeders.md` there): the request now takes `ssn`, and the response has `ssn_masked`/`ssn_on_file` instead of `last_4_ssn`. Deploy both together.

## Files changed
- `src/pages/profile/components/SsnField.tsx` — new: the SSN field (format, mask toggle, on-file/legacy hints, error)
- `src/pages/profile/components/PersonalInfo.tsx` — uses `SsnField`; validates the SSN before save and omits a blank one; drops the `last_4_ssn` field and its change-request branches
- `src/pages/profile/components/CreditProfileTab.tsx` — imports the shared `ssnError`
- `src/utils/validators.ts` — new: `ssnError`, `SSN_INVALID_MESSAGE`
- `src/modules/profile/types.ts` — `PersonalInfoData.ssn_masked`/`ssn_on_file`; `SavePersonalInfoRequest.ssn?`; `last_4_ssn` removed
- `src/pages/profile/profile.tsx` — initial state `ssn`

## Tests
- Added: `tests/utils/validators.test.ts` — valid and invalid SSNs and the message. Failed first because the module didn't exist yet.
- Added: 8 cases in `tests/pages/profile/components/PersonalInfo.test.tsx` covering the label, typing format, masked on-file hint with an empty field, the legacy last-4 prompt, a blank field omitted from the save, a typed SSN sent as digits, a malformed SSN blocked before any request, and the API's `ssn` error shown on the field. All failed first. The HTTP calls are mocked with MSW against the real `apiClient`.
- `CreditProfileTab.test.tsx` passes unchanged after the extraction.
- E2E: not added. `e2e/` has no specs yet and its suite needs the live backend.
- Run: `npm test` passed with 98 files and 591 tests. `npm run typecheck` is clean.

## Open / follow-up
- `formatLast4SSN` in `src/utils/formatters.ts` is now unused by any screen. It's kept with its tests and can be removed separately.
- SSN can't be a locked field with a change request yet. The API's change-request flow stores values in plain text (fch-api D12).

## Follow-up (same day): masked SSN in the field, default in Credit Profile
- **Problem:** after saving, the SSN field was empty, so the borrower couldn't tell their SSN was kept. The "On file: … Leave blank to keep it." note wasn't wanted. Credit Profile asked for the SSN again even though the profile had it.
- **Solution:**
  - New shared `src/components/SsnInput/SsnInput.tsx` shows the SSN on file **inside the box** as `***-**-1234`. Clicking in clears it for a new number. Leaving without typing brings the mask back.
  - The Personal Info tab uses it, and the "On file" note is gone. The legacy last-4 warning stays because it explains why the field is required.
  - `CreditProfileTab.tsx` uses the same input with the profile's masked SSN as its default, read from `usePersonalInfo()`. With nothing typed it skips the client SSN check and sends **no** `ssn`, and the API uses the profile's SSN. A typed SSN still wins. It's not a default when only the last 4 are on file.
- **API dependency:** `POST /borrower/profile/credit-profile-request` accepts a missing `ssn` when a full SSN is on the profile (fch-api, same date).
- **Tests:** in `PersonalInfo.test.tsx`, the masked-in-field test replaces the masked-note test, and two were added (shown masked after save; click clears and blur restores). `CreditProfileTab.test.tsx` gained 4 tests: masked default, no `ssn` sent when kept, typed wins, and no default with only the last 4. `tests/mocks/handlers.ts` has a default `personal-info` handler (no SSN on file).
- **Run:** `npm test` passed with 98 files and 597 tests. `npm run typecheck` is clean.

## Follow-up 2 (same day): mask stays on click, eye button shows the full SSN
- **Problem:** clicking the masked field (`***-**-5345`) cleared it, and there was no way to see the full SSN.
- **Solution:** `SsnInput` makes a masked SSN on file **read-only**, so clicking or typing doesn't change it. The eye button calls `useRevealSsn()`, a mutation that is never cached, which hits `GET /borrower/profile/personal-info/ssn` and puts the full SSN in the box as editable text. Clicking the eye again masks it. If the number wasn't changed it goes back to the one on file and no `ssn` is sent. If it was changed, the new number is sent. Personal Info and Credit Profile share this behaviour. With only the last 4 on file the box is empty and editable, and the warning stays.
- **Files:** `src/components/SsnInput/SsnInput.tsx`, `src/pages/profile/components/SsnField.tsx`, `src/pages/profile/components/CreditProfileTab.tsx`, `src/modules/profile/{services,queries,index}.ts` (`revealSsn`, `useRevealSsn`).
- **Tests:** in `PersonalInfo.test.tsx`, "keeps the mask on click" and 3 eye-button tests (shows the full SSN, masks again and keeps on save, edit and send) were added. The two typing tests now use a borrower with no SSN on file, because a masked field is read-only. `CreditProfileTab.test.tsx` gained "keeps the mask on click" and an eye-then-edit test. `services.test.ts` covers `revealSsn`. `npm test` passed with 98 files and 603 tests, and `npm run typecheck` is clean.

## Follow-up 3 (same day): final state, SSN comes with the profile (supersedes the masking notes above)
- **Decision:** no separate reveal API. `GET /borrower/profile/personal-info` returns the borrower's own `ssn` (9 digits, or the last 4 on old accounts, or `null`). `ssn_masked`, `ssn_on_file`, `revealSsn` and `useRevealSsn` were removed.
- **`SsnInput`** works entirely in the browser:
  - A complete SSN shows `***-**-1234` and is read-only, so clicking or typing doesn't change it.
  - The eye button shows it in full and editable, and clicking it again masks it.
  - A newly typed number masks only once the borrower leaves the field, not on the ninth digit.
- **Personal Info** prefills the SSN from the profile (full SSN only) and sends it with every save. With only the last 4 on file the field is empty with a warning.
- **Credit Profile** prefills the SSN from the profile when the form has none (a previously submitted request wins) and always sends `ssn`.
- **Tests:** the SSN blocks in `PersonalInfo.test.tsx` and `CreditProfileTab.test.tsx` were rewritten for this contract. The `revealSsn` service tests were removed along with the service. The default MSW `personal-info` handler returns `{ ssn: null }`. `npm test` passed with 98 files and 601 tests. `npm run typecheck` is clean.
