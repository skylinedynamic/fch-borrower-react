import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import CreditGuide from '../../../src/pages/credit-builder/creditguide/CreditGuide'

afterEach(() => server.resetHandlers())

describe('CreditGuide', () => {
  it('shows the error card when the tier task list or progress fails to load', async () => {
    server.use(
      http.get('*/borrower/credit-builder/tier-wise-tasklist', () => HttpResponse.error()),
      http.get('*/borrower/credit-builder/my-progress', () => HttpResponse.error())
    )

    renderWithProviders(<CreditGuide />)

    expect(await screen.findByText('Failed to load credit guide')).toBeInTheDocument()
  })
})
