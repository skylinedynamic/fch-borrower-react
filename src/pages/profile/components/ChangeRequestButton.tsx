/**
 * The Change Request button on a locked profile field. While a request for the
 * field is waiting for review it says "Pending review" instead - the API would
 * refuse a second one (R2 BUG-039) - and pressing it offers to cancel that
 * request.
 */
type ChangeRequestButtonProps = {
  /** The id of the request waiting for review, or null/undefined when none is. */
  pendingId?: number | null
  onClick: () => void
  onCancel: (id: number) => void
  className: string
}

export default function ChangeRequestButton({ pendingId, onClick, onCancel, className }: ChangeRequestButtonProps) {
  if (pendingId != null) {
    return (
      <button
        type="button"
        className={className.replace('btn-soft-primary', 'btn-soft-warning')}
        onClick={() => onCancel(pendingId)}
        title="Your change request for this field is waiting for review. Click to cancel it."
      >
        <i className="ri-time-line me-1" aria-hidden="true"></i>
        Pending review
        <i className="ri-close-line ms-1" aria-hidden="true"></i>
      </button>
    )
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      Change Request
    </button>
  )
}
