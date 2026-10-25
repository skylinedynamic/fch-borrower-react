import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, within } from '../../test-utils'
import { server } from '../../mocks/server'
import Documents from '../../../src/pages/documents/Documents'
import { useOnboardingPopupStore } from '../../../src/store/onboardingPopupStore'

vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

/**
 * Documents lays the categories out as a split view on wide screens (list on
 * the left, the chosen category on the right) and as a list that opens in
 * place on narrow ones.
 */
function mockDocuments() {
  server.use(
    http.get('*/borrower/documents/borrower-document-types', () =>
      HttpResponse.json({
        status: true,
        data: [
          { id: 1, name: 'Bank Statements', sort_order: 1 },
          { id: 2, name: 'Tax Returns', sort_order: 2 },
        ],
      })
    ),
    http.get('*/borrower/documents', () =>
      HttpResponse.json({
        status: true,
        data: { 1: [{ id: 11, document_type_id: 1, file_name: 'march.pdf', file_path: 'a/march.pdf', url: '#' }] },
      })
    )
  )
}

function setWideScreen(wide: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: wide,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
}

const originalMatchMedia = window.matchMedia
beforeEach(mockDocuments)
afterEach(() => {
  window.matchMedia = originalMatchMedia
  server.resetHandlers()
})

describe('Documents layout', () => {
  describe('on a wide screen', () => {
    beforeEach(() => setWideScreen(true))

    it('shows the first category beside the list, with its files', async () => {
      renderWithProviders(<Documents />)

      const pane = await screen.findByRole('region', { name: 'Bank Statements' })
      expect(within(pane).getByText('march.pdf')).toBeInTheDocument()
      expect(within(pane).getByText('Click here to upload documents.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /bank statements/i })).toHaveAttribute('aria-expanded', 'true')
    })

    it('shows another category when it is picked from the list', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Documents />)

      await user.click(await screen.findByRole('button', { name: /^tax returns/i }))

      const pane = screen.getByRole('region', { name: 'Tax Returns' })
      expect(within(pane).queryByText('march.pdf')).toBeNull()
      expect(screen.queryByRole('region', { name: 'Bank Statements' })).toBeNull()
    })
  })

  describe('on a narrow screen', () => {
    beforeEach(() => setWideScreen(false))

    it('opens a category in place', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Documents />)

      await user.click(await screen.findByRole('button', { name: /^tax returns/i }))

      expect(screen.getByRole('button', { name: /^tax returns/i })).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('region', { name: 'Tax Returns' })).toBeInTheDocument()
    })
  })

  it('keeps the walkthrough popup from opening by itself while the borrower is uploading', async () => {
    setWideScreen(true)
    const { unmount } = renderWithProviders(<Documents />)
    await screen.findByRole('region', { name: 'Bank Statements' })

    // Held for this page's own prompt, not as an open modal.
    expect(useOnboardingPopupStore.getState().pageHeld).toBe(true)
    expect(useOnboardingPopupStore.getState().held).toBe(false)
    unmount()
    expect(useOnboardingPopupStore.getState().pageHeld).toBe(false)
  })

  it('pushes for every document, then shows the next one missing when asked', async () => {
    const user = userEvent.setup()
    setWideScreen(true)
    renderWithProviders(<Documents />)

    const prompt = await screen.findByRole('region', { name: /your next step/i })
    expect(prompt).toHaveTextContent(/1 of 2 categories uploaded/i)

    await user.click(screen.getByRole('button', { name: /upload tax returns/i }))
    expect(screen.getByRole('region', { name: 'Tax Returns' })).toBeInTheDocument()
  })

  it('says how many categories have documents', async () => {
    setWideScreen(true)
    renderWithProviders(<Documents />)

    expect(await screen.findByText(/^1 of 2 categories$/i)).toBeInTheDocument()
  })

  describe('the optional Others category', () => {
    // Funding needs every document except Others: it can stay empty.
    const serveWithOthers = (uploadedIds: number[]) =>
      server.use(
        http.get('*/borrower/documents/borrower-document-types', () =>
          HttpResponse.json({
            status: true,
            data: [
              { id: 1, name: 'Bank Statements', sort_order: 1 },
              { id: 2, name: 'Tax Returns', sort_order: 2 },
              { id: 3, name: 'Others', sort_order: 3 },
            ],
          })
        ),
        http.get('*/borrower/documents', () =>
          HttpResponse.json({
            status: true,
            data: Object.fromEntries(
              uploadedIds.map((id) => [id, [{ id: id * 10, document_type_id: id, file_name: `f${id}.pdf`, file_path: `a/f${id}.pdf`, url: '#' }]])
            ),
          })
        )
      )

    it('does not hold up applying for funding when it is empty', async () => {
      setWideScreen(true)
      serveWithOthers([1, 2])
      renderWithProviders(<Documents />)

      const prompt = await screen.findByRole('region', { name: /your next step/i })
      expect(prompt).toHaveTextContent(/your documents are in\. you can apply for funding now/i)
      expect(within(prompt).getByRole('link', { name: /continue to funding/i })).toBeInTheDocument()
      expect(within(prompt).queryByRole('button', { name: /upload others/i })).toBeNull()
    })

    it('counts only the required categories', async () => {
      setWideScreen(true)
      serveWithOthers([1])
      renderWithProviders(<Documents />)

      const prompt = await screen.findByRole('region', { name: /your next step/i })
      expect(prompt).toHaveTextContent(/1 of 2 categories uploaded/i)
      // Asks for the next required one, never for Others.
      expect(within(prompt).getByRole('button', { name: /upload tax returns/i })).toBeInTheDocument()
    })

    it('says in the list that it is optional', async () => {
      setWideScreen(true)
      serveWithOthers([1, 2])
      renderWithProviders(<Documents />)

      const others = await screen.findByRole('button', { name: /^others/i })
      expect(others).toHaveTextContent(/optional/i)
      expect(others).not.toHaveTextContent(/not uploaded/i)
    })

    it('still takes uploads and counts them as files', async () => {
      setWideScreen(true)
      serveWithOthers([1, 2, 3])
      renderWithProviders(<Documents />)

      expect(await screen.findByRole('button', { name: /^others/i })).toHaveTextContent(/1 file/i)
    })
  })
})
