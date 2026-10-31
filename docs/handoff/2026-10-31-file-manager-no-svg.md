# File manager: SVG is no longer an allowed upload (BUG-015, round 2)

**Date:** 2026-10-31
**Branch:** bugfix/round-2
**Author:** awlad (with Claude Code)

## Problem
QA round 2 defect log **BUG-015** (R2-CP-DOC-01, High/P1): Documents › Upload accepted an SVG holding a `<script>`; opened from `/storage` on the API's domain, the script ran. SVG was on this portal's allowed list (`src/modules/filemanager/config.ts`), and the API checked no type at all.

## Solution
- The API now checks every upload itself and refuses SVG and HTML documents (`fch-api/docs/handoff/2026-10-31-upload-type-allow-list.md`).
- `svg` is removed from `FILE_MANAGER_CONFIG.ALLOWED_EXTENSIONS`, so the picker and `fileRejectionReason()` refuse it before an upload is attempted ("… is not an allowed file type (.svg)").

## Files changed
- `src/modules/filemanager/config.ts` — `svg` removed, with the reason.
- `tests/modules/filemanager/config.test.ts` — new: SVG refused and not in the picker's `accept`; PDF/JPG/XLSX still taken; HTML and extension-less files refused.

## Testing
- The SVG case failed first, then passed (3/3).
- Full Vitest suite and `npm run typecheck` — see the session report.

## Open / follow-up
- No E2E uploads an SVG; none needed changing.
