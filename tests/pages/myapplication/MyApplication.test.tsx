import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import MyApplication from '../../../src/pages/myapplication/MyApplication'

/**
 * BUG-086: the right-hand panel (and its mobile copy) read "Advertisements" /
 * "Ad space" with nothing behind it. Nothing supplies ad content, so the
 * placeholder is not shown at all.
 */
describe('MyApplication', () => {
  it('shows no empty advertisement placeholder', async () => {
    server.use(http.all('*/borrower/*', () => HttpResponse.json({ status: true, data: [] })))

    renderWithProviders(<MyApplication />)

    expect(await screen.findByText(/schedule a meeting/i)).toBeInTheDocument()
    expect(screen.queryByText('Advertisements')).not.toBeInTheDocument()
    expect(screen.queryByText('Ad space')).not.toBeInTheDocument()
  })
})
