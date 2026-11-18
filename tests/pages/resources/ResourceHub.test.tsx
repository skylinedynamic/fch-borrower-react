import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  /**
   * R3-BUG-003: resource files are private, so file_url is a signed link
   * (…/ein.pdf?expires=…&signature=…). The hub took it for a non-PDF ("Preview
   * Not Available"), and the API's frame headers would refuse it in an iframe
   * anyway. The preview now reads the file through the API and shows it from a
   * local blob: link.
   */
  describe('a file preview', () => {
    const SIGNED = 'https://api.test/private-files/resources/ein.pdf?expires=1&signature=abc'
    const doc = (file_url: string) => ({
      id: 7, title: 'EIN Overview', subtitle: 'Sub', icon: 'ri-file-line', resource_type: 'legal_registration',
      file_url, link: null, status: true, overview: null, impact: null, providers: [],
    })

    beforeEach(() => {
      Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: vi.fn(() => 'blob:preview-7') })
      Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: vi.fn() })
    })

    async function openPreview(file_url: string, file: () => Response) {
      const downloads: string[] = []
      server.use(
        http.get('*/borrower/resources', () => HttpResponse.json({
          status: true,
          data: { legal_registration: [doc(file_url)], business_services: [], education_help: [], download_assets: [], training_academy: [] },
        })),
        http.get('*/borrower/resources/:id/download', ({ params }) => { downloads.push(String(params.id)); return file() }),
      )
      renderWithProviders(<ResourceHub />, { route: '/resources' })
      await userEvent.click(await screen.findByText('EIN Overview'))
      return downloads
    }

    const pdf = () => new HttpResponse('%PDF-1.4', { headers: { 'Content-Type': 'application/pdf' } })

    it('shows a PDF behind a signed link, read through the API', async () => {
      const downloads = await openPreview(SIGNED, pdf)

      const frame = await screen.findByTitle('EIN Overview')
      expect(frame.tagName).toBe('IFRAME')
      expect(frame.getAttribute('src')).toMatch(/^blob:preview-7/)
      expect(downloads).toEqual(['7'])
      expect(screen.queryByText('Preview Not Available')).not.toBeInTheDocument()
    })

    it('says so when the file cannot be read', async () => {
      await openPreview(SIGNED, () => HttpResponse.json({ status: false, message: 'File not found on server' }, { status: 400 }))

      expect(await screen.findByText('The preview could not be loaded.')).toBeInTheDocument()
      expect(screen.queryByTitle('EIN Overview')).not.toBeInTheDocument()
    })

    it('does not read a file it cannot preview', async () => {
      const downloads = await openPreview('https://api.test/private-files/resources/kit.docx?expires=1&signature=abc', pdf)

      expect(await screen.findByText('Preview Not Available')).toBeInTheDocument()
      expect(downloads).toEqual([])
    })
  })
})

