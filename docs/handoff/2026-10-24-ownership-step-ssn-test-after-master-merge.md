# Ownership step test — SSN field found by label after the master merge

**Date:** 2026-10-24
**Branch:** bugfix/all-bugfix (fast-forwarded to origin/master 1d48ed0)
**Author:** awlad

## Problem
On `master`, `npm test` failed one test (534/535): `OwnershipInformationStep — save messages › shows a message, not just highlighted fields, when the save fails validation` — `Unable to find an element with the placeholder text of: xxx-xx-xxxx`.

Two pull requests merged into master on the same day without a git conflict but with a clash in meaning:
- PR #15 (stage → master) brought this test (from `1b212bb`), which waits for the SSN field by the step's old placeholder `xxx-xx-xxxx`.
- PR #16 (bugfix/all-bugfix → master) switched the step's SSN field to the shared `SsnInput` (from `2fb7ec2`), placeholder `XXX-XX-XXXX`; that branch moved its own tests to find the field by label but never had stage's new test.

No app bug — the test pointed at a placeholder that no longer exists.

## Solution
The test waits for the SSN field by its label (`findByLabelText(/social security number/i)`), as the file's other SSN tests already do — robust to placeholder changes. The line only waits for the form to load; what the test asserts is unchanged.

`bugfix/all-bugfix` was fast-forwarded to `origin/master` first (no local changes, no overlap) so the fix sits on top of the merged code.

## Files changed
- `tests/pages/fundapplication/components/steps/OwnershipInformationStep.test.tsx` — line 259: find the SSN field by label, not by the old placeholder.

## Tests
- Reproduced the failure on master (1 failed, 6 passed in the file), then 7/7 after the fix.
- Full suite: 128 files, 819 tests passed. `npm run typecheck` clean.

## Open items
- Merge this to `master`; `stage` and `release` still have the old step and test together, so they are green as they are.
