/**
 * Clear modal backdrops that no longer belong to anything on screen.
 *
 * Bootstrap and Reactstrap both append `.modal-backdrop` to the body and both
 * clean up after themselves, but a modal torn down mid-transition can leave one
 * behind, greying the page with nothing on top of it. Several screens dealt with
 * that by removing *every* backdrop in the document.
 *
 * That is too blunt: this app mounts ProfileCompleteCheckModal globally, so on
 * any page that also ran the sweep, the profile modal appeared over an undimmed
 * page - its overlay had been deleted out from under it. ConfirmationModal and
 * DeleteConfirmModal already guard against that; this is the same guard in one
 * place, so the next caller inherits it instead of rediscovering the bug.
 *
 * A backdrop is only stray when no modal is currently shown, so that is the
 * whole test: if anything is open, leave everything alone.
 */
export function clearStrayModalBackdrops(): void {
  // Fires from timers and unmount handlers, where the document can already be
  // gone in a torn-down test environment.
  if (typeof document === 'undefined') return

  if (document.querySelector('.modal.show')) return

  document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove())
  document.body.classList.remove('modal-open')
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
}
