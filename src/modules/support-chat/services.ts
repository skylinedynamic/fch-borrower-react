import { apiClient } from '../../lib/http/apiClient';
import type { SendMessagePayload, SendMessageResponse, HistoryResponse, SessionsResponse } from './types';

// Borrower support assistant — knowledge-only, white-label boundary enforced
// server-side in SupportAssistantService.
export const sendAssistantMessage = async (payload: SendMessagePayload): Promise<SendMessageResponse> => {
    const { data } = await apiClient.post('/borrower/assistant/messages', payload);
    return data;
};

export const fetchAssistantHistory = async (sessionId: string): Promise<HistoryResponse> => {
    const { data } = await apiClient.get(`/borrower/assistant/conversations/${sessionId}/messages`);
    return data;
};

// The authenticated borrower's own sessions only (server-enforced) — newest first.
export const listAssistantSessions = async (): Promise<SessionsResponse> => {
    const { data } = await apiClient.get('/borrower/assistant/sessions');
    return data;
};

// Explicitly closes the current open session and starts a fresh one —
// backs a "New conversation" control, as opposed to sendAssistantMessage's
// session_id-omitted call, which only ever resumes the existing thread.
export const startNewAssistantSession = async (): Promise<{ status: boolean; message: string; data: { session_id: string } }> => {
    const { data } = await apiClient.post('/borrower/assistant/sessions');
    return data;
};

// The safe, non-host-gated subset of the assistant's state: whether it's
// ready, and the welcome subtitle + quick-reply suggestion chips. Both are
// live-derived by the backend straight from the current system prompt on
// every call (see SupportAssistantService::deriveWidgetIntro()) — nothing
// here is stored, so editing the prompt changes what this returns on the
// very next fetch, with no separate save step.
export const fetchAssistantConfig = async (): Promise<{
    status: boolean;
    message: string;
    data: { is_ready: boolean; welcome_subtitle: string | null; quick_suggestions: string[] };
}> => {
    const { data } = await apiClient.get('/borrower/assistant/config');
    return data;
};
