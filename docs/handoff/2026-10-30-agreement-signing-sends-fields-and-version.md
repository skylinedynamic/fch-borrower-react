# Agreement signing sends the version and the entered values; signed copy shown without scripts

2026-10-30

## Problem
- **The browser built the signed record.** The agreement sign modal posted the whole filled-in page (`content_html`), and the API stored it as the signed record. Whatever the browser sent became the record, and nothing said which wording of the agreement was signed. fch-api now builds the record itself from the version and the values entered (fch-api `docs/handoff/2026-10-30-agreement-versions-and-server-built-signatures.md`).
- **Scripts could run in the viewer.** Topbar › My Agreement (`/download-agreement/:userId`) wrote the stored HTML into a same-origin iframe without a sandbox. Any script in an older signed copy could run in the portal.

## Solution
- **Signing sends three things.** `AgreementSignModal` now sends:
  - `agreement_template_version_id`: the version it was shown;
  - `fields`: the values entered, by field;
  - `content_html`: still sent, only so an API not yet updated keeps working.
- **New `collectAgreementFields(document)`** in `src/utils/agreementFields.ts`. It names fields exactly as the server does:
  - by `data-field-id`, or `field_{n}` by order for older templates;
  - it skips the upload input, hidden inputs and buttons;
  - a field shown on two pages (a block split by pagination) counts once, keeping what was entered in either copy.
  - It runs before `getFilledHTML()`, which re-lays the page out on phones.
- **409 (wording changed while open):** the modal shows the server's message, unticks the consent and reloads the agreement.
- **422 (a required field empty):** the modal shows the server's message.
- **Viewer sandbox:** the iframe is `sandbox="allow-same-origin allow-modals"`, so no script runs; it is still same origin, to size and print it.

## Files changed
- `src/utils/agreementFields.ts`: new.
- `src/components/AgreementSignModal/AgreementSignModal.jsx`: sends `fields` and the version; handles 409 and 422.
- `src/modules/agreement/types.ts`: `version_id`/`version`; request `agreement_template_version_id`/`fields`.
- `src/pages/agreement/DownloadAgreement.jsx`: sandboxed iframe.

## Testing
- Unit: `tests/utils/agreementFields.test.ts` (5). Note: this test was written before the util but not run red first (it would have failed on the missing module).
- Unit: `tests/modules/agreement/services.test.ts`, +1 (the version is sent).
- Integration: `tests/components/AgreementSignModal/AgreementSignModal.test.tsx`, +4 (version sent, fields sent, 409 reload, 422 message).
- Integration: `tests/pages/agreement/DownloadAgreement.test.tsx`, +1 (sandbox).
- E2E: `e2e/topbar/agreement/agreement.spec.ts`. Updated the sign flow (fills a field; asserts version + fields) and split errors into 422 (server message) and 400 (generic). 7/7 passed against the local API. The signed-agreement test rendered the E2E borrower's real signed copy inside the sandboxed frame.
- `npm run typecheck` clean. `npx vitest run`: 152 files, 1180 passed.

## Open items
- Stop sending `content_html` once fch-api's legacy path is removed.
- A server-built signed copy shows as one long page in My Agreement, not A4 pages.
