import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'

import ConfirmationModal from '../../../src/components/GlobalModal/ConfirmationModal'
import DeleteConfirmModal from '../../../src/components/GlobalModal/DeleteConfirmModal'

/**
 * A confirm modal unmounted while Bootstrap is still opening it (the page is
 * left, or the component goes away, right after it was asked to show) came
 * back. Bootstrap finishes a show on a timer, and when it found the modal no
 * longer in the page it appended it to <body> again - open, with its backdrop,
 * owned by nothing. In CI the next Documents test clicked that stray modal's
 * "Yes, Delete It" and nothing happened.
 */
const afterBootstrapTimers = () => new Promise((resolve) => setTimeout(resolve, 600))
const noop = () => {}

describe('a confirm modal unmounted while it is opening', () => {
  afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
  })

  it('DeleteConfirmModal does not come back', async () => {
    const { unmount } = render(<DeleteConfirmModal show onClose={noop} onConfirm={noop} text="Delete it?" />)
    unmount()

    await afterBootstrapTimers()

    expect(document.querySelectorAll('.modal')).toHaveLength(0)
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(0)
  })

  it('ConfirmationModal does not come back', async () => {
    const { unmount } = render(<ConfirmationModal show onClose={noop} onConfirm={noop} />)
    unmount()

    await afterBootstrapTimers()

    expect(document.querySelectorAll('.modal')).toHaveLength(0)
    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(0)
  })
})
