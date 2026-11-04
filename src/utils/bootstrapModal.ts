/**
 * Close and tear down a Bootstrap modal instance from a React unmount cleanup.
 *
 * Calling `hide()` and then `dispose()` straight away races Bootstrap: dispose
 * nulls the instance's element, and the hide animation's queued callback then
 * writes `element.style`, throwing an uncaught "Cannot read properties of null
 * (reading 'style')" (E2E-018). So dispose waits for `hidden.bs.modal`, with a
 * fallback for a modal that was already closed (no event comes then).
 */
interface DisposableModal {
  hide: () => void
  dispose: () => void
  /** Bootstrap's own reference to the modal element. */
  _element?: HTMLElement | null
}

const FALLBACK_MS = 1000

export function hideAndDisposeModal(modal: DisposableModal | null | undefined, element: HTMLElement | null | undefined): void {
  if (!modal) return

  const el = element ?? modal._element ?? null
  // React has already taken an unmounted component's modal out of the page.
  // A show still under way then ends with Bootstrap putting it back in <body>,
  // open and owned by nothing; such a modal is closed and taken out again.
  // (Under StrictMode's development remount the element never leaves the page,
  // and is left alone.)
  const unmounted = !!el && !el.isConnected

  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    try {
      modal.dispose()
    } catch {
      /* already torn down */
    }
    if (unmounted && el?.isConnected) el.remove()
  }

  el?.addEventListener('hidden.bs.modal', dispose, { once: true })
  if (unmounted) {
    el?.addEventListener('shown.bs.modal', () => {
      try {
        modal.hide()
      } catch {
        /* already torn down */
      }
    }, { once: true })
  }
  try {
    modal.hide()
  } catch {
    /* already torn down */
  }
  setTimeout(dispose, FALLBACK_MS)
}
