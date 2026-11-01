import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { Route, Routes, useParams } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
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

  /**
   * E2E-007: Legal & Registration, Download Assets and Education & Help items
   * carry no file or link yet. Clicking one only toasted "Resource not
   * available"; it now opens the item's detail page, which already handles
   * missing content ("Guidance details coming soon.").
   */
  describe('an item with no file or link', () => {
    const item = (id: number, resource_type: string, title: string) => ({
      id, title, subtitle: 'Sub', icon: 'ri-file-line', resource_type,
      file_url: null, link: null, status: true, overview: null, impact: null, providers: [],
    })

    function DetailStub() {
      const { id } = useParams()
      return <div>detail page {id}</div>
    }

    async function clickItem(title: string) {
      server.use(
        http.get('*/borrower/resources', () =>
          HttpResponse.json({
            status: true,
            data: {
              legal_registration: [item(1, 'legal_registration', 'EIN Overview')],
              business_services: [],
              education_help: [item(24, 'education_help', 'Getting Started')],
              download_assets: [item(21, 'download_assets', 'Business Formation Checklist')],
              training_academy: [],
            },
          })
        )
      )

      renderWithProviders(
        <Routes>
          <Route path="/resources" element={<ResourceHub />} />
          <Route path="/resources/:id" element={<DetailStub />} />
        </Routes>,
        { route: '/resources' }
      )

      await userEvent.click(await screen.findByText(title))
    }

    it.each([
      ['EIN Overview', '1'],
      ['Business Formation Checklist', '21'],
      ['Getting Started', '24'],
    ])('"%s" opens its detail page', async (title, id) => {
      await clickItem(title)
      expect(await screen.findByText(`detail page ${id}`)).toBeInTheDocument()
      expect(screen.queryByText('Resource not available')).toBeNull()
    })
  })

  /**
   * BUG-065: the Education & Help search showed an empty white area when
   * nothing matched. It searches that section only (by design) and now says
   * nothing matched.
   */
  describe('the Education & Help search', () => {
    const edu = (id: number, title: string) => ({
      id, title, subtitle: 'Sub', icon: 'ri-book-line', resource_type: 'education_help',
      file_url: null, link: null, status: true, overview: null, impact: null, providers: [],
    })

    function loadHub() {
      server.use(
        http.get('*/borrower/resources', () =>
          HttpResponse.json({
            status: true,
            data: {
              legal_registration: [{ ...edu(1, 'EIN Overview'), resource_type: 'legal_registration' }],
              business_services: [],
              education_help: [edu(24, 'Credit Basics'), edu(25, 'Building Business Credit')],
              download_assets: [],
              training_academy: [],
            },
          })
        )
      )
      renderWithProviders(<ResourceHub />)
    }

    it('says nothing matched instead of leaving the area blank', async () => {
      const user = userEvent.setup()
      loadHub()

      await user.type(await screen.findByPlaceholderText('Search Education & Help...'), 'EIN')

      expect(await screen.findByText('No Education & Help resources match "EIN".')).toBeInTheDocument()
      expect(screen.queryByText('Credit Basics')).not.toBeInTheDocument()
    })

    it('still lists the matches, with no message', async () => {
      const user = userEvent.setup()
      loadHub()

      await user.type(await screen.findByPlaceholderText('Search Education & Help...'), 'credit')

      expect(await screen.findByText('Credit Basics')).toBeInTheDocument()
      expect(screen.getByText('Building Business Credit')).toBeInTheDocument()
      expect(screen.queryByText(/No Education & Help resources match/)).not.toBeInTheDocument()
    })
  })
})

