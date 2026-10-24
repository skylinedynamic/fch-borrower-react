import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/query'
import { cancelEmailChange, readEmailChangeLink, resendEmailChange, submitEmailChangeLink } from './services'
import type { EmailChangeLinkParams } from './types'

/** What an email-change link is about. Reading it never changes anything. */
export const useEmailChangeLink = (link: EmailChangeLinkParams | null) =>
  useQuery({
    queryKey: link
      ? queryKeys.account.emailChangeLink(link.action, link.user, link.hash, link.query)
      : queryKeys.account.all,
    queryFn: () => readEmailChangeLink(link as EmailChangeLinkParams),
    enabled: !!link,
    retry: false,
    staleTime: Infinity,
  })

/** Confirms (with the password), cancels or undoes the change a link is for. */
export const useSubmitEmailChangeLink = (link: EmailChangeLinkParams | null) =>
  useMutation({
    mutationFn: (password?: string) => submitEmailChangeLink(link as EmailChangeLinkParams, password),
  })

/** Sends the confirmation link for the borrower's pending email change again. */
export const useResendEmailChange = () =>
  useMutation({
    mutationFn: resendEmailChange,
  })

/** Withdraws the borrower's pending email change; the profile then shows none. */
export const useCancelEmailChange = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelEmailChange,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.personalInfo() }),
  })
}
