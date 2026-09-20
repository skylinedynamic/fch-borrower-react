import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import Funding from '../../../src/pages/funding/Funding'

afterEach(() => server.resetHandlers())

describe('Funding', () => {
  it('renders the page heading once an empty funding options list loads', async () => {
    server.use(
      http.get('*/borrower/funding', () =>
        HttpResponse.json({ status: true, data: { groups: [], types: [], stats: {} } })
      )
    )

    renderWithProviders(<Funding />)

    expect(await screen.findByText('No funding options found')).toBeInTheDocument()
  })
})
