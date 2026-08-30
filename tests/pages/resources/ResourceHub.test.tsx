import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { renderWithProviders, screen } from '../../test-utils'
import { server } from '../../mocks/server'
import ResourceHub from '../../../src/pages/resources/ResourceHub'

afterEach(() => server.resetHandlers())

describe('ResourceHub', () => {
  it('renders the education & help search once resources load, with no categories', async () => {
    server.use(
      http.get('*/borrower/resources', () =>
        HttpResponse.json({
          status: true,
          data: {
            legal_registration: [],
            business_services: [],
            education_help: [],
            download_assets: [],
            training_academy: [],
          },
        })
      )
    )

    renderWithProviders(<ResourceHub />)

    expect(await screen.findByPlaceholderText('Search Education & Help...')).toBeInTheDocument()
  })
})
