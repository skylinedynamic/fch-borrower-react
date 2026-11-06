/**
 * The note at the foot of a Change Request modal: the field is locked, and the
 * new value is reviewed before it replaces the old one. A warning, so it reads
 * as something to be aware of before sending - one place for every profile tab.
 */
export default function ChangeRequestNotice() {
  return (
    <div className="change-request-notice alert alert-warning border-0 border-start border-3 border-warning mb-0" role="note">
      <div className="d-flex">
        <div className="flex-shrink-0">
          <i className="ri-error-warning-line fs-18" aria-hidden="true"></i>
        </div>
        <div className="flex-grow-1 ms-2">
          <p className="mb-0 fs-13">
            This field is verified and locked. Submitting this form will notify our compliance team to review and verify the new information before it is updated.
          </p>
        </div>
      </div>
    </div>
  )
}
