# Agreement: guided signing with an adopted signature

**Date:** 2026-10-30
**Branch:** agreement-in-config

## Problem
Borrowers signing their agreement had no help finding the fields to fill and no sense of how much was left. The signature had to be an uploaded image file, and the "Signature Date" was a date picker they had to fill themselves.

## Solution
- **Guide bar** above the agreement:
  - shows "N of M required fields completed" with a progress bar;
  - **Start** / **Next field** scroll to the next required field left to fill;
  - shows "Ready to sign" when every required field is filled.
- **Marking fields in the page:** fields left to fill get a yellow flag and the current one a blue ring (CSS injected into the agreement iframe).
- **Date signed** (`…:date` field / `.p-sig-input`): filled with today ("30 Oct, 2026", the agreement calendar's format) and read-only.
- **Signing:** clicking "Sign here" opens **Adopt your signature**:
  - **Type:** your name, drawn in a handwriting face;
  - **Draw:** mouse, finger or pen.
  - Either way it produces a PNG on the signing line and in its field. The server accepts only base64 raster signatures.
  - The click arrives through the agreement page's own hook `window.parent.__openFmForBlock`. It is ignored for a logo.
- **Re-layout:** when the agreement page lays itself out again (after fonts or images load), the guide puts the date and the signature back.
- **Shared copy:** `src/utils/agreementSigning.ts`, `useGuidedSigning.ts` and `SignatureDialog` have identical copies in Fch-admin-frontend-react for partner signing. Keep them in sync.

## Files changed
- `src/utils/agreementSigning.ts`: new. Contains `listSigningFields`, `prefillSigningDates`, `formatSigningDate`, `placeSignature` and `SIGNING_GUIDE_CSS`.
- `src/components/AgreementSignModal/useGuidedSigning.ts`: new. The hook behind the guide.
- `src/components/AgreementSignModal/SignatureDialog.tsx`, `SignatureDialog.css`: new.
- `src/components/AgreementSignModal/AgreementSignModal.jsx`: guide bar, iframe `onLoad`, signature dialog.
- `src/components/AgreementSignModal/AgreementSignModal.css`: guide bar styles.

## Tests
- **Added:**
  - `tests/utils/agreementSigning.test.ts` (8). Written before the util, but not run red first: the module did not exist yet. The "no event on refill" test was added after an endless re-fill loop was found.
  - `tests/components/AgreementSignModal/SignatureDialog.test.tsx` (5). Run red first.
- **Updated:**
  - `tests/components/AgreementSignModal/AgreementSignModal.test.tsx` +3: the date fills and progress counts; Start goes to the first field; an adopted signature is placed and sent. Run red first.
  - `e2e/topbar/agreement/agreement.spec.ts` +1: guided signing end to end (progress, date, Start, typed signature, sent as a PNG).
- **Run:**
  - `npx vitest run`: 154 files, 1198 passed.
  - `npm run typecheck`: clean.
  - E2E `agreement.spec.ts`: 8 passed (local build plus local API).
- **Real browser check:** done with the real demo agreement. Screenshots of the guide, the dialog and the signed line.

## Open / follow-up
- **Old templates:** saved templates with the old signature box (`.p-sig-box`) also get the dialog and the date fill.
- **Agreement page without fields:** an agreement page with no required fields shows no guide bar.
- **Typed text and re-layout:** typed text is not put back if the agreement page lays itself out again after the signer starts typing. This was already the case before, and it is rare because re-layout happens while the page loads.

## Follow-up (same day): upload a signature, app buttons, 4px corners; empty session notes

- **Problem.** Signers could only type or draw a signature; the adopt-signature dialog and the signing modal used their own button styles and rounded corners; `docs/handoff/` filled with 257 empty `*_212a4b07.md` files.
- **Solution.**
  - `SignatureDialog.tsx`/`.css`: an Upload tab (PNG/JPG/WebP, at least 300 × 100 px, up to 5 MB), fitted into the same 720×200 PNG with near-white paper made transparent; the buttons are `btn btn-primary`/`btn btn-light`, and colours follow `--vz-primary`. Kept identical to the admin copy.
  - `AgreementSignModal.jsx`/`.css`: Start/Next field, Accept & Continue and proceed are `btn btn-primary`; the guide bar uses the primary colour; every modal corner is 4px.
  - `.claude/hooks/session-handoff.sh`: the headless `claude --resume -p` the hook starts ended as a session too, firing the hook again in a loop, and the timeout killed each run before its empty file was removed. The note-writing run is now marked (`CLAUDE_HANDOFF_RUN`) so it skips the hook, and the note is moved in only when it has content. The 257 empty files were deleted.
- **Tests.** `SignatureDialog.test.tsx` +4 (upload, too small, wrong type/too large, app buttons), `AgreementSignModal.test.tsx` +1 (primary buttons), `modalRadius.test.ts` (new). All were seen failing first. Suite: 155 files, 1205 passed; typecheck clean. The hook was checked by hand with a stub `claude`: a normal run writes a note, the nested run exits at once, and a failed run leaves no file.
- **Open.** None.
