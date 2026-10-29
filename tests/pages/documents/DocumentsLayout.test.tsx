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
          { id: 1, name: 'Business Bank Statements', sort_order: 1 },
          { id: 2, name: 'Voided Business Check', sort_order: 2 },
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

      const pane = await screen.findByRole('region', { name: 'Business Bank Statements' })
      expect(within(pane).getByText('march.pdf')).toBeInTheDocument()
      expect(within(pane).getByText('Click here to upload documents.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /bank statements/i })).toHaveAttribute('aria-expanded', 'true')
    })

    it('shows another category when it is picked from the list', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Documents />)

      await user.click(await screen.findByRole('button', { name: /^voided business check/i }))

      const pane = screen.getByRole('region', { name: 'Voided Business Check' })
      expect(within(pane).queryByText('march.pdf')).toBeNull()
      expect(screen.queryByRole('region', { name: 'Business Bank Statements' })).toBeNull()
    })
  })

  describe('on a narrow screen', () => {
    beforeEach(() => setWideScreen(false))

    it('opens a category in place', async () => {
      const user = userEvent.setup()
      renderWithProviders(<Documents />)

      await user.click(await screen.findByRole('button', { name: /^voided business check/i }))

      expect(screen.getByRole('button', { name: /^voided business check/i })).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('region', { name: 'Voided Business Check' })).toBeInTheDocument()
    })
  })

  it('keeps the walkthrough popup from opening by itself while the borrower is uploading', async () => {
    setWideScreen(true)
    const { unmount } = renderWithProviders(<Documents />)
    await screen.findByRole('region', { name: 'Business Bank Statements' })

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
    expect(prompt).toHaveTextContent(/1 of 2 required categories uploaded/i)

    await user.click(screen.getByRole('button', { name: /upload voided business check/i }))
    expect(screen.getByRole('region', { name: 'Voided Business Check' })).toBeInTheDocument()
  })

  it('says how many categories have documents', async () => {
    setWideScreen(true)
    renderWithProviders(<Documents />)

    expect(await screen.findByText(/^1 of 2 required$/i)).toBeInTheDocument()
  })

  describe('the optional categories', () => {
    // Only Driver's License, Voided Business Check, EIN / Corporation Docs and
    // Business Bank Statements are required; Business Plan, Others and the
    // rest can stay empty.
    const serveWithOthers = (uploadedIds: number[]) =>
      server.use(
        http.get('*/borrower/documents/borrower-document-types', () =>
          HttpResponse.json({
            status: true,
            data: [
              { id: 1, name: 'Business Bank Statements', sort_order: 1 },
              { id: 2, name: 'Voided Business Check', sort_order: 2 },
              { id: 3, name: 'Others', sort_order: 3 },
              { id: 4, name: 'Business Plan', sort_order: 4 },
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
      expect(within(prompt).queryByRole('button', { name: /upload business plan/i })).toBeNull()
    })

    it('counts only the required categories', async () => {
      setWideScreen(true)
      serveWithOthers([1])
      renderWithProviders(<Documents />)

      const prompt = await screen.findByRole('region', { name: /your next step/i })
      expect(prompt).toHaveTextContent(/1 of 2 required categories uploaded/i)
      // Asks for the next required one, never for Others.
      expect(within(prompt).getByRole('button', { name: /upload voided business check/i })).toBeInTheDocument()
    })

    it('says in the list that they are optional', async () => {
      setWideScreen(true)
      serveWithOthers([1, 2])
      renderWithProviders(<Documents />)

      for (const name of [/^others/i, /^business plan/i]) {
        const category = await screen.findByRole('button', { name })
        expect(category).toHaveTextContent(/optional/i)
        expect(category).not.toHaveTextContent(/not uploaded/i)
      }
    })

    it('says a required category without a document is not uploaded', async () => {
      setWideScreen(true)
      serveWithOthers([1])
      renderWithProviders(<Documents />)

      expect(await screen.findByRole('button', { name: /^voided business check/i })).toHaveTextContent(/not uploaded/i)
    })

    it('still takes uploads and counts them as files', async () => {
      setWideScreen(true)
      serveWithOthers([1, 2, 3])
      renderWithProviders(<Documents />)

      expect(await screen.findByRole('button', { name: /^others/i })).toHaveTextContent(/1 file/i)
    })
  })
})
