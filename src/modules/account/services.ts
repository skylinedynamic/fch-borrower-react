import { apiClient } from '../../lib/http/apiClient'
import type { EmailChangeLink, EmailChangeLinkParams, PendingEmailChange } from './types'

/**
 * A new email saved on the profile isn't applied at once: it waits as
 * `pending_email` until the link emailed to the new address is confirmed.
 * These act on the borrower's own pending change.
 */
export const resendEmailChange = async (): Promise<PendingEmailChange> => {
  const { data } = await apiClient.post('/borrower/profile/email-change/resend')
  return data.data
}

export const cancelEmailChange = async (): Promise<PendingEmailChange> => {
  const { data } = await apiClient.post('/borrower/profile/email-change/cancel')
  return data.data
}

/**
 * An email-change link opens on the portal. Its page reads and acts on the
 * link at the API endpoint with the same path, passing the link's query
 * (expires + signature) along exactly as it came: the API checks the signature
 * against it.
 */
const emailChangeLinkPath = ({ action, user, hash, query }: EmailChangeLinkParams) =>
  `/email-change/${action}/${encodeURIComponent(user)}/${encodeURIComponent(hash)}${query}`

export const readEmailChangeLink = async (link: EmailChangeLinkParams): Promise<EmailChangeLink> => {
  const { data } = await apiClient.get(emailChangeLinkPath(link))
  return data.data
}

export const submitEmailChangeLink = async (link: EmailChangeLinkParams, password?: string): Promise<EmailChangeLink> => {
  const { data } = await apiClient.post(emailChangeLinkPath(link), password === undefined ? {} : { password })
  return data.data
}
