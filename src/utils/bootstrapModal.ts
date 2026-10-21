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
}

const FALLBACK_MS = 1000

export function hideAndDisposeModal(modal: DisposableModal | null | undefined, element: HTMLElement | null | undefined): void {
  if (!modal) return

  let disposed = false
  const dispose = () => {
    if (disposed) return
    disposed = true
    try {
      modal.dispose()
    } catch {
      /* already torn down */
    }
  }

  element?.addEventListener('hidden.bs.modal', dispose, { once: true })
  try {
    modal.hide()
  } catch {
    /* already torn down */
  }
  setTimeout(dispose, FALLBACK_MS)
}
