import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, within } from '../../test-utils'
import { server } from '../../mocks/server'
import Documents from '../../../src/pages/documents/Documents'

vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

afterEach(() => server.resetHandlers())

describe('Documents page', () => {
  it('renders a section per document type once types and documents load', async () => {
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
      http.get('*/borrower/documents', () => HttpResponse.json({ status: true, data: {} }))
    )

    renderWithProviders(<Documents />)

    expect(await screen.findByText('Bank Statements')).toBeInTheDocument()
    expect(screen.getByText('Tax Returns')).toBeInTheDocument()
  })

  it('toasts an error when document data fails to load', async () => {
    const { toast } = await import('react-toastify')
    server.use(
      http.get('*/borrower/documents/borrower-document-types', () => HttpResponse.error()),
      http.get('*/borrower/documents', () => HttpResponse.error())
    )

    renderWithProviders(<Documents />)

    await new Promise((resolve) => setTimeout(resolve, 0))
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load documents'))
  })
})

/**
 * BUG-087: the client saw the same green tick on an accepted and a rejected
 * document, and never the reason - although the rejection modal says it is
 * shared with the borrower. Each file now carries its review badge, and a
 * rejected one its reason and what to do next.
 */
describe('Documents page - review status', () => {
  const serveReviewed = () =>
    server.use(
      http.get('*/borrower/documents/borrower-document-types', () =>
        HttpResponse.json({
          status: true,
          data: [
            { id: 1, name: 'Business Bank Statements', sort_order: 1 },
            { id: 2, name: 'Driver License', sort_order: 2 },
            { id: 3, name: 'Tax Returns', sort_order: 3 },
          ],
        })
      ),
      http.get('*/borrower/documents', () =>
        HttpResponse.json({
          status: true,
          data: {
            1: [{ id: 11, borrower_id: 5, document_type_id: 1, file_name: 'march-statement.pdf', file_path: 'a.pdf', url: '', status: 'Rejected', rejection_reason: 'Statement is older than 90 days' }],
            2: [{ id: 12, borrower_id: 5, document_type_id: 2, file_name: 'licence.jpg', file_path: 'b.jpg', url: '', status: 'Accepted', rejection_reason: null }],
            3: [{ id: 13, borrower_id: 5, document_type_id: 3, file_name: 'tax-2025.pdf', file_path: 'c.pdf', url: '', status: 'Uploaded', rejection_reason: null }],
          },
        })
      )
    )

  // The page shows one category at a time: open it from the list, then read its files.
  const openCategory = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
    // From the start of the name: the next-step button reads "Upload <category>".
    await user.click(await screen.findByRole('button', { name: new RegExp(`^${name}`) }))
  }
  const fileRow = (name: string) => screen.getAllByText(name)[0].closest('.docs-file') as HTMLElement

  it('shows Rejected with the reason, Accepted, and Pending review on each file', async () => {
    serveReviewed()
    const user = userEvent.setup()
    renderWithProviders(<Documents />)

    await openCategory(user, 'Business Bank Statements')
    const rejected = fileRow('march-statement.pdf')
    expect(within(rejected).getByText('Rejected')).toBeInTheDocument()
    expect(within(rejected).getByText(/Statement is older than 90 days/)).toBeInTheDocument()
    expect(within(rejected).getByText(/upload a new file/i)).toBeInTheDocument()

    await openCategory(user, 'Driver License')
    const accepted = fileRow('licence.jpg')
    expect(within(accepted).getByText('Accepted')).toBeInTheDocument()
    expect(within(accepted).queryByText(/Reason/)).not.toBeInTheDocument()

    await openCategory(user, 'Tax Returns')
    expect(within(fileRow('tax-2025.pdf')).getByText('Pending review')).toBeInTheDocument()
  })

  // A category's list entry says where it stands: the green tick only once a
  // file is accepted, a pending clock while it waits for review.
  it('ticks an accepted category, and shows a pending one as Pending review', async () => {
    serveReviewed()
    renderWithProviders(<Documents />)

    const accepted = await screen.findByRole('button', { name: /^Driver License/ })
    expect(accepted.querySelector('.docs-category-status.is-done .ri-check-line')).not.toBeNull()

    const pending = screen.getByRole('button', { name: /^Tax Returns/ })
    expect(pending.querySelector('.docs-category-status.is-pending')).not.toBeNull()
    expect(pending.querySelector('.docs-category-status.is-done')).toBeNull()
    expect(pending).toHaveTextContent('Pending review')
  })
})

/**
 * BUG-135: a category whose only file was Rejected still counted as uploaded -
 * green tick, "Uploaded", counted in "x of N", and Your next step moved on -
 * so the client was never told to upload a new one. The server's onboarding
 * step already left rejected documents out.
 */
describe('Documents page - a rejected file needs a new upload', () => {
  const serve = (documents: Record<number, unknown[]>) =>
    server.use(
      http.get('*/borrower/documents/borrower-document-types', () =>
        HttpResponse.json({
          status: true,
          data: [
            { id: 1, name: "Driver's License", sort_order: 1 },
            { id: 2, name: 'Voided Business Check', sort_order: 2 },
            { id: 3, name: 'EIN / Corporation Docs', sort_order: 3 },
            { id: 4, name: 'Business Bank Statements', sort_order: 4 },
          ],
        })
      ),
      http.get('*/borrower/documents', () => HttpResponse.json({ status: true, data: documents }))
    )
  const doc = (id: number, typeId: number, status: string) => ({
    id, borrower_id: 5, document_type_id: typeId, file_name: `file-${id}.pdf`, file_path: `${id}.pdf`, url: '', status,
    rejection_reason: status === 'Rejected' ? 'Not readable' : null,
  })

  it('shows the category as needing a re-upload, not counted, and points Your next step at it', async () => {
    serve({ 1: [doc(11, 1, 'Accepted')], 2: [doc(12, 2, 'Rejected')] })
    const user = userEvent.setup()
    renderWithProviders(<Documents />)

    const category = await screen.findByRole('button', { name: /^Voided Business Check/ })
    expect(category.querySelector('.docs-category-status.is-done')).toBeNull()
    expect(category).toHaveTextContent('Re-upload needed')

    expect(screen.getByText('1 of 4 required categories uploaded')).toBeInTheDocument()
    const next = screen.getByRole('button', { name: /Upload Voided Business Check/ })

    // The next-step button opens that category, where the rejected file asks for a new one.
    await user.click(next)
    const detail = screen.getByRole('region', { name: 'Voided Business Check' })
    expect(within(detail).getByText(/upload a new file/i)).toBeInTheDocument()
    expect(within(detail).queryByText(/^Uploaded$/)).not.toBeInTheDocument()
  })

  it('counts a category again once it also has a file that is not rejected (shown as pending)', async () => {
    serve({ 1: [doc(11, 1, 'Accepted')], 2: [doc(12, 2, 'Rejected'), doc(13, 2, 'Uploaded')] })
    renderWithProviders(<Documents />)

    const category = await screen.findByRole('button', { name: /^Voided Business Check/ })
    expect(category.querySelector('.docs-category-status.is-pending')).not.toBeNull()
    expect(screen.getByText('2 of 4 required categories uploaded')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Upload EIN \/ Corporation Docs/ })).toBeInTheDocument()
  })

  it('marks each required document in Your next step, the rejected one as the next', async () => {
    serve({ 1: [doc(11, 1, 'Accepted')], 2: [doc(12, 2, 'Rejected')], 3: [doc(13, 3, 'Uploaded')] })
    renderWithProviders(<Documents />)

    const prompt = await screen.findByRole('region', { name: /your next step/i })
    const steps = within(within(prompt).getByRole('list', { name: 'Required documents' })).getAllByRole('listitem')
    expect(steps.map((s) => s.className)).toEqual([
      'docs-prompt-step is-accepted',
      'docs-prompt-step is-reupload is-next',
      'docs-prompt-step is-pending',
      'docs-prompt-step is-empty',
    ])
  })
})


describe('Documents page - the next step', () => {
  it('is its own section under the hero, not inside it', async () => {
    server.use(
      http.get('*/borrower/documents/borrower-document-types', () =>
        HttpResponse.json({ status: true, data: [{ id: 1, name: "Driver's License", sort_order: 1 }] })
      ),
      http.get('*/borrower/documents', () => HttpResponse.json({ status: true, data: {} }))
    )
    renderWithProviders(<Documents />)

    const prompt = await screen.findByRole('region', { name: /your next step/i })
    const hero = screen.getByRole('region', { name: 'Documents overview' })
    expect(hero).not.toContainElement(prompt)
    expect(hero.compareDocumentPosition(prompt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
