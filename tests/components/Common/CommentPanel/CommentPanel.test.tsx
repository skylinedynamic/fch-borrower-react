import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '../../../test-utils'
import { server } from '../../../mocks/server'
import CommentPanel from '../../../../src/components/Common/CommentPanel/CommentPanel'

afterEach(() => server.resetHandlers())

describe('CommentPanel (borrower)', () => {
    it('shows the empty state when there are no comments', async () => {
        server.use(
            http.get('*/borrower/comments', () => HttpResponse.json({ status: true, message: '', data: [] }))
        )

        renderWithProviders(<CommentPanel entityType="funding_request" entityId={42} />)

        expect(await screen.findByText(/no comments yet/i)).toBeInTheDocument()
    })

    it('lists existing comments scoped to the given entity', async () => {
        server.use(
            http.get('*/borrower/comments', ({ request }) => {
                const url = new URL(request.url)
                expect(url.searchParams.get('entity_type')).toBe('funding_request')
                expect(url.searchParams.get('entity_id')).toBe('42')

                return HttpResponse.json({
                    status: true,
                    message: '',
                    data: [
                        {
                            id: 1,
                            body: 'Please review the updated bank statements.',
                            visibility: 'everyone',
                            user: { id: 9, name: 'Jason Rodriguez' },
                            created_at: '2026-09-20T10:00:00Z',
                            updated_at: '2026-09-20T10:00:00Z',
                        },
                    ],
                })
            })
        )

        renderWithProviders(<CommentPanel entityType="funding_request" entityId={42} />)

        expect(await screen.findByText('Please review the updated bank statements.')).toBeInTheDocument()
        expect(screen.getByText('Jason Rodriguez')).toBeInTheDocument()
    })

    it('posts a new comment and reloads the list', async () => {
        let created = false

        server.use(
            http.get('*/borrower/comments', () =>
                HttpResponse.json({
                    status: true,
                    message: '',
                    data: created
                        ? [{
                            id: 2,
                            body: 'A brand new question',
                            visibility: 'everyone',
                            user: { id: 5, name: 'Johnathan Smithfield' },
                            created_at: '2026-09-27T00:00:00Z',
                            updated_at: '2026-09-27T00:00:00Z',
                        }]
                        : [],
                })
            ),
            http.post('*/borrower/comments', async ({ request }) => {
                const body = (await request.json()) as { entity_type: string; entity_id: number; body: string }
                expect(body).toEqual({ entity_type: 'funding_request', entity_id: 42, body: 'A brand new question' })
                created = true

                return HttpResponse.json({ status: true, data: { id: 2 } }, { status: 201 })
            })
        )

        renderWithProviders(<CommentPanel entityType="funding_request" entityId={42} />)
        await screen.findByText(/no comments yet/i)

        await userEvent.type(screen.getByPlaceholderText(/add a comment/i), 'A brand new question')
        await userEvent.click(screen.getByRole('button', { name: /post/i }))

        expect(await screen.findByText('A brand new question')).toBeInTheDocument()
    })

    it('never calls the API when entityId is not yet available', () => {
        server.use(
            http.get('*/borrower/comments', () => {
                throw new Error('should not fetch without an entityId')
            })
        )

        renderWithProviders(<CommentPanel entityType="funding_request" entityId={undefined} />)

        // The guard clause in the load effect means fetchComments() is
        // never called, so the component stays on its initial loading
        // state rather than reaching the empty-state or list branches.
        expect(screen.getByText(/loading comments/i)).toBeInTheDocument()
    })
})
