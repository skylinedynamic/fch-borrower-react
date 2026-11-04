import { useState, type ReactNode } from 'react'
import { toast } from 'react-toastify'
import DeleteConfirmationModal from '../../../components/GlobalModal/DeleteConfirmModal'
import { useCancelChangeRequest } from '../../../modules/profile/queries'

/**
 * Asks before cancelling a change request still waiting for review, then
 * deletes it - in the app's delete modal. One per profile tab: `ask(id)` opens
 * it for a request. A refusal (e.g. already reviewed) is shown in the modal,
 * not as a toast.
 */
export function useCancelChangeRequestDialog(): { ask: (id: number) => void; dialog: ReactNode } {
  const [requestId, setRequestId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { mutate: cancel, isPending } = useCancelChangeRequest()

  const close = () => {
    if (isPending) return
    setRequestId(null)
    setError(null)
  }

  const confirm = () => {
    if (requestId === null) return
    setError(null)
    cancel(requestId, {
      onSuccess: (response) => {
        toast.success(response.message)
        setRequestId(null)
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || 'This change request could not be cancelled.')
      },
    })
  }

  // Always mounted, only `show` changes - as on every other screen. Mounting it
  // already shown raced React StrictMode's double mount in development: the
  // second Bootstrap instance showed the modal without its backdrop.
  const dialog = (
    <DeleteConfirmationModal
      show={requestId !== null}
      onConfirm={confirm}
      onClose={close}
      loading={isPending}
      error={error}
      text="This change request is still waiting for review. It will be deleted, and you can send a new one for this field."
    />
  )

  return { ask: (id: number) => { setError(null); setRequestId(id) }, dialog }
}
