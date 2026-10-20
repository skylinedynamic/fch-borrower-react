import { apiClient } from '../../lib/http/apiClient'
import type { EmailChangeLink, EmailChangeLinkParams } from './types'

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
