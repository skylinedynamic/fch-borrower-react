import type { CreditPullStatus as CreditPullStatusData } from '../../../modules/credit-profile'
import { CREDIT_REQUEST_STATUS, CREDIT_REQUEST_STATUS_DISPLAY } from '../../../config/creditPullStatus'

interface Props {
  status?: CreditPullStatusData | null
}

/**
 * When the credit was last pulled, and where the latest update request stands.
 *
 * Both come from the API already in the client's own time zone, so this only
 * displays them. A request is pending until the pull behind it has run.
 */
export default function CreditPullStatus({ status }: Props) {
  if (!status) return null

  const request = status.last_request
  const requestState = request ? CREDIT_REQUEST_STATUS_DISPLAY[request.status] : null

  return (
    <div className="cp-pull-status">
      <div className="cp-pull-cell" data-testid="last-pulled">
        <span className="cp-pull-icon is-pulled">
          <i className="ri-history-line"></i>
        </span>
        <div className="cp-pull-body">
          <div className="cp-pull-label">Last pulled</div>
          {status.last_pulled_at ? (
            <div className="cp-pull-value">{status.last_pulled_at}</div>
          ) : (
            <div className="cp-pull-value is-empty">Not pulled yet</div>
          )}
        </div>
      </div>

      <div className={`cp-pull-cell ${requestState?.tone ?? ''}`} data-testid="last-request">
        <span className={`cp-pull-icon ${requestState?.tone ?? 'is-none'}`}>
          <i className={requestState?.icon ?? 'ri-send-plane-line'}></i>
        </span>
        <div className="cp-pull-body">
          <div className="cp-pull-label">Last request</div>
          {request && requestState ? (
            <>
              <div className="cp-pull-value">
                {request.requested_at ?? <span className="is-empty">Date not recorded</span>}
              </div>
              <div className="cp-pull-sub">{requestState.hint}</div>
            </>
          ) : (
            <div className="cp-pull-value is-empty">No request yet</div>
          )}
        </div>
        {request && requestState && (
          <span className={`cp-request-pill ${requestState.tone}`}>
            {request.status === CREDIT_REQUEST_STATUS.PENDING && <span className="cp-request-dot"></span>}
            {requestState.label}
          </span>
        )}
      </div>
    </div>
  )
}
