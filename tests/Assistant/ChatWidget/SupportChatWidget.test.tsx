import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import SupportChatWidget from '../../../src/components/Common/ChatWidget/SupportChatWidget'

afterEach(() => server.resetHandlers())

const noSessions = () =>
    http.get('*/borrower/assistant/sessions', () => HttpResponse.json({ status: true, message: '', data: [] }))

// is_ready: false, no welcome_subtitle/quick_suggestions — the widget must
// fall back to its own generic defaults, never a hardcoded domain-specific
// guess, when the assistant hasn't been configured with a prompt yet.
const notReadyConfig = () =>
    http.get('*/borrower/assistant/config', () =>
        HttpResponse.json({ status: true, message: '', data: { is_ready: false, welcome_subtitle: null, quick_suggestions: [] } })
    )

const configWith = (welcome_subtitle: string, quick_suggestions: string[]) =>
    http.get('*/borrower/assistant/config', () =>
        HttpResponse.json({ status: true, message: '', data: { is_ready: true, welcome_subtitle, quick_suggestions } })
    )

const open = async () => {
    await userEvent.click(screen.getByRole('button', { name: /open ask support/i }))
    await screen.findByPlaceholderText(/type a message/i)
}

const sendMessage = async (text: string) => {
    await userEvent.type(screen.getByPlaceholderText(/type a message/i), text)
    await userEvent.click(screen.getByRole('button', { name: /send message/i }))
}

describe('SupportChatWidget (borrower)', () => {
    it('is closed until the floating button is clicked, then shows the empty-state prompt once history loads', async () => {
        server.use(noSessions(), notReadyConfig())

        renderWithProviders(<SupportChatWidget />)

        expect(screen.queryByText(/ask support/i)).not.toBeInTheDocument()

        await open()

        // The generic fallback subtitle — no config saved yet, and nothing
        // hardcoded to a specific domain like "account or funding journey".
        expect(await screen.findByText(/ask a question and i will do my best to help/i)).toBeInTheDocument()
    })

    it('renders the live-derived welcome subtitle and suggestion chips from the config endpoint', async () => {
        server.use(
            noSessions(),
            configWith('Ask a question about your application status or documents.', [
                'What documents do I need to upload?',
                'How does Credit Builder work?',
            ])
        )

        renderWithProviders(<SupportChatWidget />)
        await open()

        expect(await screen.findByText(/ask a question about your application status or documents\./i)).toBeInTheDocument()
        expect(screen.getByText('What documents do I need to upload?')).toBeInTheDocument()
        expect(screen.getByText('How does Credit Builder work?')).toBeInTheDocument()
    })

    it('re-fetches on every reopen, so an edited prompt is reflected without a page reload', async () => {
        let callCount = 0
        server.use(
            noSessions(),
            http.get('*/borrower/assistant/config', () => {
                callCount += 1
                return HttpResponse.json({
                    status: true,
                    message: '',
                    data: callCount === 1
                        ? { is_ready: true, welcome_subtitle: 'Ask about the old prompt topic.', quick_suggestions: ['Old prompt question?'] }
                        : { is_ready: true, welcome_subtitle: 'Ask about the new prompt topic.', quick_suggestions: ['New prompt question?'] },
                })
            })
        )

        renderWithProviders(<SupportChatWidget />)
        await open()
        expect(await screen.findByText(/ask about the old prompt topic\./i)).toBeInTheDocument()

        await userEvent.click(screen.getByRole('button', { name: /minimize ask support/i }))
        await userEvent.click(screen.getByRole('button', { name: /open ask support/i }))

        expect(await screen.findByText(/ask about the new prompt topic\./i)).toBeInTheDocument()
        expect(screen.getByText('New prompt question?')).toBeInTheDocument()
        expect(screen.queryByText('Old prompt question?')).not.toBeInTheDocument()
    })

    it('clicking a suggestion chip sends it as a real message', async () => {
        server.use(
            noSessions(),
            configWith('Ask a question about your application status.', ['How do I check my application status?']),
            http.post('*/borrower/assistant/messages', async ({ request }) => {
                const body = (await request.json()) as { message: string }
                expect(body.message).toBe('How do I check my application status?')
                return HttpResponse.json({
                    status: true,
                    message: '',
                    data: {
                        session_id: 'session-1',
                        message_id: 'message-1',
                        answer: 'Here is your status.',
                        created_at: 'Sep 27, 2026 3:00 PM',
                        actions: [],
                        sources: [],
                        escalation: { required: false, reason: null, route: null },
                        policy: { live_data_used: false, restricted_content_blocked: false, sensitive_input_detected: false },
                    },
                })
            })
        )

        renderWithProviders(<SupportChatWidget />)
        await open()

        await userEvent.click(await screen.findByText('How do I check my application status?'))

        expect(await screen.findByText('Here is your status.')).toBeInTheDocument()
    })

    it('falls back to the generic defaults when the config fetch fails, without crashing', async () => {
        server.use(
            noSessions(),
            http.get('*/borrower/assistant/config', () => HttpResponse.error())
        )

        renderWithProviders(<SupportChatWidget />)
        await open()

        expect(await screen.findByText('How can you help me?')).toBeInTheDocument()
        expect(screen.getByText(/ask a question and i will do my best to help/i)).toBeInTheDocument()
    })

    it('sends a message and renders the bold-formatted answer', async () => {
        server.use(
            noSessions(),
            notReadyConfig(),
            http.post('*/borrower/assistant/messages', async ({ request }) => {
                const body = (await request.json()) as { session_id: string | null; message: string }
                expect(body.message).toBe('How do I check my application status?')

                return HttpResponse.json({
                    status: true,
                    message: '',
                    data: {
                        session_id: 'session-123',
                        message_id: 'message-456',
                        answer: 'Check **My Applications** for the latest status.',
                        actions: [],
                        sources: [],
                        escalation: { required: false, reason: null, route: null },
                        policy: { live_data_used: false, restricted_content_blocked: false, sensitive_input_detected: false },
                    },
                })
            })
        )

        renderWithProviders(<SupportChatWidget />)
        await open()
        await sendMessage('How do I check my application status?')

        const bold = await screen.findByText('My Applications')
        expect(bold.tagName.toLowerCase()).toBe('strong')
        expect(screen.getByText(/for the latest status\./)).toBeInTheDocument()
    })

    it('does not render a button for an action id that is not locally allowlisted', async () => {
        server.use(
            noSessions(),
            notReadyConfig(),
            http.post('*/borrower/assistant/messages', () =>
                HttpResponse.json({
                    status: true,
                    message: '',
                    data: {
                        session_id: 'session-123',
                        message_id: 'message-456',
                        // The borrower assistant has no approved actions yet — see
                        // ACTION_ALLOWLIST in SupportChatWidget.tsx — so this token
                        // must render as nothing (not crash, not a raw token).
                        answer: 'Here is the info.\n\n[[ACTION:settings_home]]\n\nThat is all.',
                        actions: [{ type: 'navigate', id: 'settings_home', label: 'Take Me There', path: '/admin/settings' }],
                        sources: [],
                        escalation: { required: false, reason: null, route: null },
                        policy: { live_data_used: false, restricted_content_blocked: false, sensitive_input_detected: false },
                    },
                })
            )
        )

        renderWithProviders(<SupportChatWidget />)
        await open()
        await sendMessage('Where do I go?')

        await screen.findByText(/here is the info\./i)
        expect(screen.queryByRole('button', { name: 'Take Me There' })).not.toBeInTheDocument()
    })

    it('minimizing hides the panel without losing the in-memory conversation', async () => {
        server.use(
            noSessions(),
            notReadyConfig(),
            http.post('*/borrower/assistant/messages', () =>
                HttpResponse.json({
                    status: true,
                    message: '',
                    data: {
                        session_id: 'session-123',
                        message_id: 'message-456',
                        answer: 'Sure thing.',
                        actions: [],
                        sources: [],
                        escalation: { required: false, reason: null, route: null },
                        policy: { live_data_used: false, restricted_content_blocked: false, sensitive_input_detected: false },
                    },
                })
            )
        )

        renderWithProviders(<SupportChatWidget />)
        await open()
        await sendMessage('Hi')
        await screen.findByText('Sure thing.')

        await userEvent.click(screen.getByRole('button', { name: /minimize ask support/i }))
        expect(screen.queryByText('Sure thing.')).not.toBeInTheDocument()

        // History/session restore must not refetch on reopen — historyLoadedRef
        // already ran once, and the mocked sessions/messages endpoints only
        // handle one shape of request each, so a stray refetch would surface
        // as an unhandled-request error here. (Config IS refetched on every
        // open — see the dedicated suggestions-refresh test above — but that
        // handler tolerates repeat calls.)
        await userEvent.click(screen.getByRole('button', { name: /open ask support/i }))
        await waitFor(() => expect(screen.getByText('Sure thing.')).toBeInTheDocument())
    })

    it('renders the server-provided timestamp under an assistant reply', async () => {
        server.use(
            noSessions(),
            notReadyConfig(),
            http.post('*/borrower/assistant/messages', () =>
                HttpResponse.json({
                    status: true,
                    message: '',
                    data: {
                        session_id: 'session-123',
                        message_id: 'message-456',
                        answer: 'Here you go.',
                        created_at: 'Sep 27, 2026 2:58 PM',
                        actions: [],
                        sources: [],
                        escalation: { required: false, reason: null, route: null },
                        policy: { live_data_used: false, restricted_content_blocked: false, sensitive_input_detected: false },
                    },
                })
            )
        )

        renderWithProviders(<SupportChatWidget />)
        await open()
        await sendMessage('What time is it?')

        await screen.findByText('Here you go.')
        // The timestamp is rendered exactly as the backend formatted it
        // (toTimezone() against the caller's own X-Timezone header) — no
        // client-side re-parsing that could disagree with the server.
        expect(screen.getByText('Sep 27, 2026 2:58 PM')).toBeInTheDocument()
    })

    it('badges the launcher and plays a notification when a reply arrives while minimized, and clears on reopen', async () => {
        // A manually-resolved deferred, not a real setTimeout — the reply
        // resolves only when this test says so, so "minimize before the
        // reply arrives" is guaranteed by explicit control flow rather than
        // a race against wall-clock timing (which can flake under the CPU
        // contention a full parallel suite run creates — see vitest.config.ts).
        let resolveReply!: () => void;
        const replyGate = new Promise<void>((resolve) => { resolveReply = resolve; });

        server.use(
            noSessions(),
            notReadyConfig(),
            http.post('*/borrower/assistant/messages', async () => {
                await replyGate;
                return HttpResponse.json({
                    status: true,
                    message: '',
                    data: {
                        session_id: 'session-123',
                        message_id: 'message-456',
                        answer: 'Delayed reply.',
                        created_at: 'Sep 27, 2026 2:58 PM',
                        actions: [],
                        sources: [],
                        escalation: { required: false, reason: null, route: null },
                        policy: { live_data_used: false, restricted_content_blocked: false, sensitive_input_detected: false },
                    },
                })
            })
        )

        renderWithProviders(<SupportChatWidget />)
        await open()
        await userEvent.type(screen.getByPlaceholderText(/type a message/i), 'Will you be quick?')
        await userEvent.click(screen.getByRole('button', { name: /send message/i }))

        // Minimize while the reply is still deliberately held back.
        await userEvent.click(screen.getByRole('button', { name: /minimize ask support/i }))

        // Only now does the response settle — openRef.current is guaranteed
        // to already be false by this point.
        resolveReply();

        await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument())

        await userEvent.click(screen.getByRole('button', { name: /open ask support/i }))
        expect(screen.queryByText('1')).not.toBeInTheDocument()
        expect(await screen.findByText('Delayed reply.')).toBeInTheDocument()
    })

    it('starts a new session and clears the conversation when clicking the New Session button', async () => {
        server.use(
            notReadyConfig(),
            http.get('*/borrower/assistant/sessions', () =>
                HttpResponse.json({
                    status: true,
                    message: '',
                    data: [{ session_id: 'session-1', status: 'open', last_message_at: '2026-09-27T00:00:00Z', created_at: '2026-09-27T00:00:00Z' }],
                })
            ),
            http.get('*/borrower/assistant/conversations/session-1/messages', () =>
                HttpResponse.json({
                    status: true,
                    message: '',
                    data: [
                        { message_id: 'm1', role: 'user', content: 'Previous question', actions: [], sources: [], created_at: '2026-09-27T00:00:00Z' },
                        { message_id: 'm2', role: 'assistant', content: 'Previous answer', actions: [], sources: [], created_at: '2026-09-27T00:01:00Z' },
                    ],
                })
            ),
            http.post('*/borrower/assistant/sessions', () =>
                HttpResponse.json({
                    status: true,
                    message: 'Session created',
                    data: {
                        session_id: 'session-new-999',
                        status: 'open',
                        created_at: '2026-09-27T00:02:00Z',
                    },
                })
            )
        )

        renderWithProviders(<SupportChatWidget />)
        await open()

        expect(await screen.findByText('Previous question')).toBeInTheDocument()

        const newSessionBtn = screen.getByRole('button', { name: /start new conversation|start new session/i })
        await userEvent.click(newSessionBtn)

        await waitFor(() => {
            expect(screen.queryByText('Previous question')).not.toBeInTheDocument()
            expect(screen.getByText(/ask a question and i will do my best to help/i)).toBeInTheDocument()
        })
    })
})
