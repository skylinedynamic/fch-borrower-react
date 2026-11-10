# Agreement modal: thank-you screen no longer lost to the post-signing check

**Date:** 2026-11-07

## Problem
CI failed on `tests/components/AgreementSignModal/AgreementSignModal.test.tsx > AgreementSignModal after the user is refreshed > keeps the thank-you screen after signing, though signing is no longer needed`:

```
Unable to find an element with the text: Thank You!
<body><div /></body>
```

It passed locally, so it was timing-dependent. After Accept & Continue:
1. `useSubmitAgreementSign` invalidates the agreement check, whose refetch now answers `needs_sign: false`.
2. The component sets `isSuccess` only once `mutateAsync` returns.

When the "not needed" answer was rendered before step 2, the effect's close branch (`!needs_sign && !isSuccess`) hid the modal. The thank-you screen never appeared and the container was empty.

The same can happen outside tests whenever a check refetch lands while the signature is being saved, e.g. a refetch on window focus.

## Solution
`AgreementSignModal.jsx`: the "no longer asked to sign, close it" branch also waits for `!isLoading`, the flag set for the whole submit. While a signature is being saved, a "not needed" answer no longer closes the modal. Afterwards `isSuccess` keeps it open on the thank-you screen. A failed submit clears `isLoading`, so a genuine waiver still closes it.

## Files changed
- `src/components/AgreementSignModal/AgreementSignModal.jsx`: close branch guarded by `!isLoading`; `isLoading` added to the effect's dependencies.
- `tests/components/AgreementSignModal/AgreementSignModal.test.tsx`: new deterministic test, "shows the thank-you screen even when the post-signing check answers first". A QueryClient whose MutationCache `onSuccess` refetches the check and lets it render before the submit returns.

## Testing
- **New test:** failed on the old code with the CI error ("Unable to find … Thank You!"), passed after the change.
- **`tests/components/AgreementSignModal`:** 26 passed. The test file ran 5 times in a row: 15/15 each time.
- **Full Vitest:** 1516 passed (204 files).
- `npm run typecheck`: clean.

## Open items
- Branch `feature/agreement-required`. Not committed.
