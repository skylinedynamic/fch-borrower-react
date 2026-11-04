import { afterEach, describe, expect, it, vi } from 'vitest'
import { StrictMode } from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createTestQueryClient } from '../../../test-utils'
import { useCancelChangeRequestDialog } from '../../../../src/pages/profile/components/CancelChangeRequestDialog'

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

/**
 * The cancel question is the app's delete modal, driven by Bootstrap's real
 * Modal here. In development React StrictMode mounts every component twice;
 * the dialog used to be mounted already shown, and in the browser the second
 * Bootstrap instance then showed the modal with no backdrop - the page behind
 * was not dimmed. It stays mounted now and only `show` changes.
 *
 * jsdom does not reproduce that race (the old mounting passes here too); this
 * guards the backdrop under StrictMode. The race itself was checked in a real
 * browser against the dev server (see the handoff), and the E2E spec asserts
 * the backdrop on the built app.
 */
let ask: (id: number) => void = () => {}

function Harness() {
  const dialog = useCancelChangeRequestDialog()
  ask = dialog.ask
  return <>{dialog.dialog}</>
}

describe('Cancel change request dialog', () => {
  afterEach(() => {
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove())
  })

  it('opens with the page dimmed behind it, also under StrictMode', async () => {
    const { unmount } = render(
      <StrictMode>
        <QueryClientProvider client={createTestQueryClient()}>
          <Harness />
        </QueryClientProvider>
      </StrictMode>
    )

    // A borrower presses "Pending review" well after the page loaded. Asking at
    // once would land inside the stray-backdrop sweep StrictMode's mount/unmount
    // schedules (100-300ms), which jsdom's slow start stretches into the opening.
    await new Promise((resolve) => setTimeout(resolve, 400))
    act(() => ask(46))

    await waitFor(() => expect(document.querySelector('.modal.show')).not.toBeNull())
    expect(screen.getByText(/This change request is still waiting for review/)).toBeInTheDocument()
    // Bootstrap adds the backdrop a moment after showing; the stray-backdrop
    // sweeps run at 100ms and 300ms. It must be there, and still there after.
    await waitFor(() => expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(1))
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(1)

    // Unmounting hides the real Bootstrap modal, which finishes on a timer
    // (its transition end, then the 100ms backdrop sweep). Let those run here:
    // left to the end of the file they fire after jsdom is torn down, and
    // Vitest fails the run with an unhandled error.
    unmount()
    await new Promise((resolve) => setTimeout(resolve, 400))
  })
})
