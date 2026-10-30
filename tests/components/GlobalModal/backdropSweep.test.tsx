import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'

import ConfirmationModal from '../../../src/components/GlobalModal/ConfirmationModal'
import DeleteConfirmModal from '../../../src/components/GlobalModal/DeleteConfirmModal'

/**
 * Complete Your Profile is mounted globally and had no overlay on some pages.
 * Those pages render ConfirmationModal or DeleteConfirmModal, which sweep up
 * leftover backdrops shortly after they mount and unmount. The sweep skipped
 * only a modal with `show`, but Reactstrap adds `show` after its fade, with the
 * modal (display: block) and its backdrop already in the page - so a profile
 * modal opening as the page loaded lost its overlay.
 */
function addFadingInModal() {
  const modal = document.createElement('div')
  modal.className = 'modal fade'
  modal.style.display = 'block'
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop fade'
  document.body.append(modal, backdrop)
}

const afterSweeps = () => new Promise((resolve) => setTimeout(resolve, 450))
const noop = () => {}

describe('confirm modals leave the overlay of a modal still fading in', () => {
  afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
  })

  it('ConfirmationModal, on mount', async () => {
    addFadingInModal()

    render(<ConfirmationModal show={false} onClose={noop} onConfirm={noop} />)
    await afterSweeps()

    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(1)
  })

  it('ConfirmationModal, on unmount', async () => {
    const view = render(<ConfirmationModal show={false} onClose={noop} onConfirm={noop} />)
    addFadingInModal()

    view.unmount()
    await afterSweeps()

    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(1)
  })

  it('DeleteConfirmModal, on mount', async () => {
    addFadingInModal()

    render(<DeleteConfirmModal show={false} onClose={noop} onConfirm={noop} />)
    await afterSweeps()

    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(1)
  })

  it('DeleteConfirmModal, on unmount', async () => {
    const view = render(<DeleteConfirmModal show={false} onClose={noop} onConfirm={noop} />)
    addFadingInModal()

    view.unmount()
    await afterSweeps()

    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(1)
  })

  it('still clears a stray backdrop when nothing is open', async () => {
    const view = render(<ConfirmationModal show={false} onClose={noop} onConfirm={noop} />)
    const stray = document.createElement('div')
    stray.className = 'modal-backdrop fade show'
    document.body.appendChild(stray)

    view.unmount()
    await afterSweeps()

    expect(document.querySelectorAll('.modal-backdrop')).toHaveLength(0)
  })
})
