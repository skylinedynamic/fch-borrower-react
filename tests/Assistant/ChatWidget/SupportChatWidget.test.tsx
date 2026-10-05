import { afterEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen, waitFor } from '../../test-utils'
import { server } from '../../mocks/server'
import SupportChatWidget from '../../../src/components/Common/ChatWidget/SupportChatWidget'

afterEach(() => server.resetHandlers())

const noSessions = () =>
    http.get('*/borrower/assistant/sessions', () => HttpResponse.json({ status: true, message: '', data: [] }))

// Enabled, with no welcome line or suggested questions in the agent's
// instructions — the widget shows only its greeting.
const enabledConfig = () =>
    http.get('*/borrower/assistant/config', () =>
        HttpResponse.json({ status: true, message: '', data: { is_ready: true, welcome_subtitle: null, quick_suggestions: [] } })
    )

const configWith = (welcome_subtitle: string, quick_suggestions: string[]) =>
    http.get('*/borrower/assistant/config', () =>
        HttpResponse.json({ status: true, message: '', data: { is_ready: true, welcome_subtitle, quick_suggestions } })
    )

const open = async () => {
    await userEvent.click(await screen.findByRole('button', { name: /open ask support/i }))
    await screen.findByPlaceholderText(/type a message/i)
}

const sendMessage = async (text: string) => {
    await userEvent.type(screen.getByPlaceholderText(/type a message/i), text)
    await userEvent.click(screen.getByRole('button', { name: /send message/i }))
}

describe('SupportChatWidget (borrower)', () => {
    it('is closed until the floating button is clicked, then shows the empty-state prompt once history loads', async () => {
        server.use(noSessions(), enabledConfig())

        renderWithProviders(<SupportChatWidget />)

        expect(screen.queryByText(/ask support/i)).not.toBeInTheDocument()

        await open()

        // Nothing is built in: with no copy from the backend the welcome card
        // shows only its greeting — no subtitle and no suggested questions.
        expect(await screen.findByText(/welcome to our live chat/i)).toBeInTheDocument()
        expect(screen.queryByText(/suggested questions/i)).not.toBeInTheDocument()
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
                    // Call 1 (first open) sees the old copy; the reopen (call 2) sees the new.
                    data: callCount <= 1
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

    it('closes and hides when the assistant is not ready upon open', async () => {
        let configCalls = 0
        server.use(
            noSessions(),
            http.get('*/borrower/assistant/config', () => {
                configCalls++
                return HttpResponse.json({ status: true, message: '', data: { is_ready: false, welcome_subtitle: null, quick_suggestions: [] } })
            })
        )

        renderWithProviders(<SupportChatWidget />)

        // No API calls made while closed
        expect(configCalls).toBe(0)

        // Open chat modal
        await open()

        await waitFor(() => expect(configCalls).toBe(1))

        // The panel opens before the answer arrives, so the chat going away is
        // waited for rather than asserted on the same tick the request was
        // counted — the request is counted when it is sent, and the widget can
        // only react once it has come back.
        await waitFor(() => expect(screen.queryByPlaceholderText(/type a message/i)).not.toBeInTheDocument())
        expect(screen.queryByRole('button', { name: /open ask support/i })).not.toBeInTheDocument()
    })

    it('does not call the config api when closed and calls it when the panel is opened', async () => {
        const asked: Array<string | null> = []
        server.use(
            noSessions(),
            http.get('*/borrower/assistant/config', ({ request }) => {
                asked.push(new URL(request.url).searchParams.get('intro'))
                return HttpResponse.json({ status: true, message: '', data: { is_ready: true, welcome_subtitle: null, quick_suggestions: [] } })
            })
        )

        renderWithProviders(<SupportChatWidget />)
        await screen.findByRole('button', { name: /open ask support/i })

        // No API calls made while closed!
        expect(asked).toEqual([])

        await open()

        await waitFor(() => expect(asked).toEqual(['1']))
    })

    it('sends a message and renders the bold-formatted answer', async () => {
        server.use(
            noSessions(),
            enabledConfig(),
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
            enabledConfig(),
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
            enabledConfig(),
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
            enabledConfig(),
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
            enabledConfig(),
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
            enabledConfig(),
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
            // Nothing is built in: with no copy from the backend the welcome card
            // shows only its greeting — no subtitle and no suggested questions.
            expect(screen.getByText(/welcome to our live chat/i)).toBeInTheDocument()
            expect(screen.queryByText(/suggested questions/i)).not.toBeInTheDocument()
        })
    })
})
