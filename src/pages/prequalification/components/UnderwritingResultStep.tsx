import React, { useEffect, useState } from 'react'
import { getPreQualificationById, retryUnderwriting } from '../../../modules/pre-qualification/services'
import { isIncorrectUnderwriting } from '../../../modules/my-application/types'
import TabLoader from '../../../components/Loader/TabLoader'

interface UnderwritingResult {
  borrower_summary?: string
  qualified_programs?: string[]
  document_checklist?: string[]
  next_steps?: string[]
}

interface UnderwritingResultStepProps {
  /** Id of the submitted pre-qualification. */
  preQualId: string | number | null
}

// The evaluation now runs inline during submit, so by the time this screen opens
// the result is already stored. A single fetch is enough — there is nothing to
// poll for. If the evaluation failed, the borrower is offered an explicit retry
// rather than being told to come back later.

export default function UnderwritingResultStep({ preQualId }: UnderwritingResultStepProps) {
  const [status, setStatus] = useState<string | null>(null)
  // The application's own workflow status, which an FCH reviewer controls.
  const [appStatus, setAppStatus] = useState<string | null>(null)
  const [evaluatedAt, setEvaluatedAt] = useState<string | null>(null)
  const [result, setResult] = useState<UnderwritingResult | null>(null)
  const [validationStatus, setValidationStatus] = useState<string | null>(null)
  const [validationSummary, setValidationSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  // True while a retry is running, which takes as long as the original
  // evaluation, so the button has to show it is working.
  const [retrying, setRetrying] = useState<boolean>(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState<number>(0)

  const applyData = (data: any) => {
    setStatus(data?.gpt_status || null)
    setAppStatus(data?.status || null)
    setEvaluatedAt(data?.gpt_generated_at || null)
    setResult(data?.underwriting_result || null)
    setValidationStatus(data?.validation_status || null)
    setValidationSummary(data?.validation_summary || null)
  }

  useEffect(() => {
    if (!preQualId) {
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const response = await getPreQualificationById(preQualId)
        if (cancelled) return

        applyData(response?.data || response)
        setError(null)
      } catch (e) {
        if (cancelled) return
        setError('We could not load your underwriting result. Please refresh in a moment.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    setLoading(true)
    load()

    return () => {
      cancelled = true
    }
  }, [preQualId, reloadToken])

  // Runs the evaluation again. The API accepts this only while the review is in
  // the failed state, so it can never regenerate a result that already succeeded.
  const handleRetry = async () => {
    if (!preQualId || retrying) return

    setRetrying(true)
    setRetryError(null)

    try {
      const response = await retryUnderwriting(preQualId)
      applyData(response?.data || response)
    } catch (e: any) {
      setRetryError(
        e?.response?.data?.message
          || 'We could not complete the review. Please try again in a few minutes.'
      )
      // Pick up whatever state the server actually recorded for the attempt.
      setReloadToken(t => t + 1)
    } finally {
      setRetrying(false)
    }
  }

  if (!preQualId) {
    return (
      <div className="text-center py-5">
        <i className="ri-lock-line fs-1 text-muted"></i>
        <h5 className="mt-3 mb-1">Not available yet</h5>
        <p className="text-muted mb-0">Submit your pre-qualification to see your underwriting result.</p>
      </div>
    )
  }

  if (loading && !result) {
    // The evaluation already ran during submit, so this is only fetching the stored
    // result — saying "reviewing" here would promise a wait that is not happening.
    return (
      <>
        <div className="text-center mb-4">
          <h5 className="mb-1">Loading your result…</h5>
          <p className="text-muted mb-0">
            Your underwriting review is complete. Fetching the outcome now.
          </p>
        </div>
        <TabLoader count={6} colClass="col-md-6" />
      </>
    )
  }

  if (error) {
    return (
      <div className="alert alert-warning d-flex align-items-start gap-2" role="alert">
        <i className="ri-error-warning-line fs-5 mt-1"></i>
        <div>{error}</div>
      </div>
    )
  }

  // The review did not complete. The application is safe either way, so this
  // offers a retry first and falls back to manual review if it keeps failing.
  if (status === 'FAILED') {
    return (
      <div className="step-content">
        {/* Same status header the other outcomes use, so the borrower reads the
            state the same way on every variant of this screen. */}
        <div className="d-flex flex-wrap align-items-center gap-2 p-3 mb-4 rounded border bg-light">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Underwriting Review Status:</span>
            {/* Mirrors the stored gpt_status so the borrower, the admin screen and
                the database all use one word for the same state. */}
            <span className="badge bg-danger-subtle text-danger fs-12 fw-semibold px-2.5 py-1 rounded">Failed</span>
          </div>
          <span className="text-muted opacity-50 mx-2">|</span>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Application Status:</span>
            <span className="badge bg-warning-subtle text-warning fs-12 fw-semibold px-2.5 py-1 rounded">{appStatus || 'Pending'}</span>
          </div>
        </div>

        {/* Amber, matching the "Incorrect Information" card's structure — the review
            did not finish, but unlike that case nothing the borrower entered is wrong. */}
        <div
          className="card shadow-none mb-4 rounded-3"
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderLeft: '5px solid #f59e0b',
          }}
        >
          <div className="card-body p-4">
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '44px', height: '44px', backgroundColor: '#fef3c7' }}
              >
                <i className="ri-error-warning-fill text-warning fs-22"></i>
              </div>
              <div className="flex-grow-1">
                <h5 className="fw-bold text-warning mb-2 fs-16">We could not complete the automated review</h5>
                {/* One statement, in the order the borrower needs it: their submission is
                    safe, the cause was ours, what it prevents, and what happens next. */}
                <p className="mb-0 fs-14" style={{ lineHeight: '1.65', color: '#2d3748' }}>
                  Your submission was received and nothing is lost — this was a problem on our
                  side, not with the details you provided. A completed review is required before
                  you can start a funding application, so please run it again below. If it keeps
                  failing, our team will complete it manually and contact you.
                </p>
              </div>
            </div>
          </div>
        </div>

        {retryError && (
          <div className="alert alert-danger d-flex align-items-start gap-2" role="alert">
            <i className="ri-error-warning-line fs-5 mt-1"></i>
            <div>{retryError}</div>
          </div>
        )}

        <div className="d-flex align-items-center gap-3 pt-3 border-top">
          <button type="button" className="btn btn-primary" onClick={handleRetry} disabled={retrying}>
            {retrying ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Reviewing…
              </>
            ) : (
              <>
                <i className="ri-refresh-line me-1"></i> Try again
              </>
            )}
          </button>

          {retrying && (
            <span className="text-muted small">
              This takes up to a minute. Please stay on this page.
            </span>
          )}
        </div>
      </div>
    )
  }

  const isNeedsCorrection = isIncorrectUnderwriting({
    gpt_status: status,
    validation_status: validationStatus,
  })

  if (isNeedsCorrection) {
    return (
      <div className="step-content">
        <div className="d-flex flex-wrap align-items-center gap-2 p-3 mb-4 rounded border bg-light">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Underwriting Review Status:</span>
            <span className="badge bg-danger-subtle text-danger fs-12 fw-semibold px-2.5 py-1 rounded">Incorrect</span>
          </div>
          <span className="text-muted opacity-50 mx-2">|</span>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Application Status:</span>
            <span className="badge bg-warning-subtle text-warning fs-12 fw-semibold px-2.5 py-1 rounded">{appStatus || 'Pending'}</span>
          </div>
          {evaluatedAt && <span className="text-muted small ms-auto">Evaluated {evaluatedAt}</span>}
        </div>

        <div
          className="card shadow-none mb-4 rounded-3"
          style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #fecaca',
            borderLeft: '5px solid #ef4444',
          }}
        >
          <div className="card-body p-4">
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '44px',
                  height: '44px',
                  backgroundColor: '#fee2e2',
                }}
              >
                <i className="ri-error-warning-fill text-danger fs-22"></i>
              </div>
              <div className="flex-grow-1">
                <h5 className="fw-bold text-danger mb-2 fs-16">Incorrect Information</h5>
                {/* Single statement, matching the failed state: what is wrong, followed
                    by what it prevents until it is corrected. */}
                <p className="mb-0 fs-14" style={{ lineHeight: '1.65', color: '#2d3748' }}>
                  {validationSummary || result?.borrower_summary || 'The submission contains an inconsistency or missing information that needs attention before underwriting can complete.'}
                  {' '}A completed review is required before you can start a funding application,
                  so these details need to be corrected first. Our team is reviewing the file and
                  will contact you if anything further is needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="step-content">
        <div className="d-flex flex-wrap align-items-center gap-3 p-3 mb-4 rounded border bg-light">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Underwriting Review Status:</span>
            <span className="badge bg-warning-subtle text-warning">In Progress</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Application Status:</span>
            <span className="badge bg-warning-subtle text-warning">{appStatus || 'Pending'}</span>
          </div>
          {evaluatedAt && <span className="text-muted small ms-auto">Evaluated {evaluatedAt}</span>}
        </div>

        <div className="alert alert-info d-flex align-items-start gap-2" role="alert">
          <i className="ri-information-line fs-5 mt-1"></i>
          <div>
            <div className="fw-semibold">Your application is being reviewed</div>
            <div>
              We need to check a few details before we can complete your evaluation. Our team will be in touch shortly.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="step-content">
      {/* Status first: the outcome of the automated check and where the file sits
          with a reviewer, so it is read before the recommendations below it. */}
      <div className="d-flex flex-wrap align-items-center gap-3 p-3 mb-4 rounded border bg-light">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted">Underwriting Review Status:</span>
          {status === 'FAILED' ? (
            <span className="badge bg-danger-subtle text-danger">Failed</span>
          ) : (
            <span className="badge bg-success-subtle text-success">Completed</span>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted">Application Status:</span>
          <span className="badge bg-warning-subtle text-warning">{appStatus || 'Pending'}</span>
        </div>
        {evaluatedAt && <span className="text-muted small ms-auto">Evaluated {evaluatedAt}</span>}
      </div>

      {result.borrower_summary && (
        <div className="alert alert-success d-flex align-items-start gap-2" role="alert">
          <i className="ri-checkbox-circle-line fs-5 mt-1"></i>
          <div>{result.borrower_summary}</div>
        </div>
      )}

      {!!result.qualified_programs?.length && (
        <div className="mb-4">
          <h6 className="fw-bold mb-3">
            <i className="ri-shield-check-line text-success me-2"></i>
            Programs You May Qualify For
          </h6>
          <div className="row g-3">
            {result.qualified_programs.map((program, idx) => (
              <div className="col-md-6 col-lg-4" key={idx}>
                <div className="card border shadow-none mb-0 h-100">
                  <div className="card-body p-3 d-flex align-items-center gap-2">
                    <i className="ri-checkbox-circle-fill text-success"></i>
                    <span className="fw-medium">{program}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!result.document_checklist?.length && (
        <div className="mb-4">
          <h6 className="fw-bold mb-3">
            <i className="ri-file-list-3-line text-primary me-2"></i>
            Documents to Prepare
          </h6>
          <ul className="list-unstyled mb-0">
            {result.document_checklist.map((doc, idx) => (
              <li className="d-flex align-items-start gap-2 py-2 border-bottom" key={idx}>
                <i className="ri-checkbox-circle-line text-primary mt-1"></i>
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!result.next_steps?.length && (
        <div className="mb-0">
          <h6 className="fw-bold mb-3">
            <i className="ri-guide-line text-info me-2"></i>
            Next Steps
          </h6>
          <ol className="mb-0 ps-3">
            {result.next_steps.map((step, idx) => (
              <li className="py-1" key={idx}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* An automated pre-qualification is not an offer, so say so explicitly. */}
      <p className="text-muted small mb-0 mt-4 pt-3 border-top">
        This is an automated pre-qualification, not a final decision. Our team is reviewing
        your application and will contact you with the outcome.
      </p>
    </div>
  )
}
