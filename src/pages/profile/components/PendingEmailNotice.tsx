import { toast } from 'react-toastify'
import { useCancelEmailChange, useResendEmailChange } from '../../../modules/account'

type Props = {
  /** The new email waiting to be confirmed, if any. */
  pendingEmail?: string | null
}

const failure = (error: any) => {
  // 403s are already toasted by the shared API client.
  if (error?.response?.status !== 403) {
    toast.error(error?.response?.data?.message || 'Something went wrong. Please try again.')
  }
}

/**
 * A new email isn't applied when the profile is saved: it waits until the link
 * sent to the new address is confirmed with the password, and until then the
 * borrower signs in with the current one. This says so under the email field
 * and lets the borrower resend that link or withdraw the change.
 */
export default function PendingEmailNotice({ pendingEmail }: Props) {
  const resend = useResendEmailChange()
  const cancel = useCancelEmailChange()

  if (!pendingEmail) {
    return null
  }

  const busy = resend.isPending || cancel.isPending

  const onResend = () =>
    resend.mutate(undefined, {
      onSuccess: () => toast.success(`A new confirmation link has been sent to ${pendingEmail}.`),
      onError: failure,
    })

  const onCancel = () =>
    cancel.mutate(undefined, {
      onSuccess: () => toast.success('The pending email change has been cancelled.'),
      onError: failure,
    })

  return (
    <div
      role="status"
      className="d-flex flex-wrap align-items-center gap-2 mt-2 px-3 py-2 fs-12 bg-warning-subtle text-warning-emphasis border border-warning-subtle"
      style={{ borderRadius: 4 }}
    >
      <span className="flex-grow-1 text-break" style={{ minWidth: 0 }}>
        <i className="ri-mail-send-line me-1 align-middle"></i>
        Waiting for confirmation from <strong>{pendingEmail}</strong>. Keep signing in with your current email
        until you confirm the link sent there.
      </span>
      <span className="d-flex flex-shrink-0 gap-3 text-nowrap">
        <button type="button" className="btn btn-link p-0 fs-12 fw-medium" disabled={busy} onClick={onResend}>
          {resend.isPending ? 'Sending…' : 'Resend link'}
        </button>
        <button type="button" className="btn btn-link p-0 fs-12 fw-medium text-danger" disabled={busy} onClick={onCancel}>
          {cancel.isPending ? 'Cancelling…' : 'Cancel change'}
        </button>
      </span>
    </div>
  )
}
