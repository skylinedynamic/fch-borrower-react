import React, { useEffect, useState } from 'react'
import { getPreQualificationById, retryUnderwriting } from '../../../modules/pre-qualification/services'
import { isIncorrectUnderwriting } from '../../../modules/my-application/types'
import TabLoader from '../../../components/Loader/TabLoader'

/**
 * The FCH_Client_AUE_v4 payload, exactly as the borrower-safe schema defines it.
 *
 * This is a funding *readiness* assessment, not an approval: there is deliberately
 * no "qualified programs" list and no prequalification claim to render, and the
 * final disclosure and disclaimer are fixed strings that must always be shown.
 */
interface ReadinessSnapshotItem {
  area?: string
  assessment?: string
  source_status?: string
}

interface UnderwritingResult {
  assessment_title?: string
  funding_readiness_summary?: string
  readiness_snapshot?: ReadinessSnapshotItem[]
  estimated_funding_range?: {
    available?: boolean
    minimum?: number | null
    maximum?: number | null
    basis?: string
  }
  strengths?: string[]
  areas_requiring_attention?: string[]
  structuring_considerations?: string[]
  submission_positioning_overview?: string
  required_next_steps?: {
    complete_assessment?: string[]
    underwriting_review?: string[]
    submission_readiness?: string[]
  }
  important_notice?: string
  final_disclosure?: string
  disclaimer?: string
}

/**
 * Renders whichever bounds the assessment supplied. A missing bound is left out
 * rather than shown as 0, which would read as a real figure.
 */
const formatRange = (min?: number | null, max?: number | null): string => {
  const money = (value: number) =>
    value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  if (typeof min === 'number' && typeof max === 'number') return `${money(min)} – ${money(max)}`
  if (typeof min === 'number') return `From ${money(min)}`
  if (typeof max === 'number') return `Up to ${money(max)}`
  return 'Not determined'
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
    // Ensure body scroll is unlocked when underwriting result is displayed
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove())
    document.body.classList.remove('modal-open')
    document.body.style.overflow = ''
    document.body.style.paddingRight = ''
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

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
        <i className="ri-alert-line fs-5 mt-1"></i>
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
                <i className="ri-alert-line text-warning fs-22 lh-1"></i>
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
            <i className="ri-alert-line fs-5 mt-1"></i>
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
                <i className="ri-alert-line text-danger fs-22 lh-1"></i>
              </div>
              <div className="flex-grow-1">
                <h5 className="fw-bold text-danger mb-2 fs-16">Incorrect Information</h5>
                {/* Single statement, matching the failed state: what is wrong, followed
                    by what it prevents until it is corrected. */}
                <p className="mb-0 fs-14" style={{ lineHeight: '1.65', color: '#2d3748' }}>
                  {validationSummary || 'The submission contains an inconsistency or missing information that needs attention before underwriting can complete.'}
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

      <h5 className="fw-bold mb-3">{result.assessment_title || 'Funding Readiness Assessment'}</h5>

      {/* 1. Funding Readiness Summary */}
      {result.funding_readiness_summary && (
        <div className="mb-4">
          <h6 className="fw-bold mb-2">
            <i className="ri-file-text-line text-primary me-2"></i>
            Funding Readiness Summary
          </h6>
          <p className="mb-0">{result.funding_readiness_summary}</p>
        </div>
      )}

      {/* 2. Readiness Snapshot — each area carries how its value was sourced, so
             a borrower-reported figure is never presented as verified. */}
      {!!result.readiness_snapshot?.length && (
        <div className="mb-4">
          <h6 className="fw-bold mb-3">
            <i className="ri-dashboard-3-line text-primary me-2"></i>
            Readiness Snapshot
          </h6>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col">Area</th>
                  <th scope="col">Assessment</th>
                  <th scope="col">Source</th>
                </tr>
              </thead>
              <tbody>
                {result.readiness_snapshot.map((item, idx) => (
                  <tr key={idx}>
                    <td className="fw-medium">{item.area}</td>
                    <td>{item.assessment}</td>
                    <td>
                      <span className="badge bg-light text-muted text-uppercase">
                        {(item.source_status || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estimated range, shown only when the assessment says one is available —
          "available: false" means no range could be derived, not zero. */}
      {result.estimated_funding_range?.available && (
        <div className="mb-4">
          <h6 className="fw-bold mb-2">
            <i className="ri-money-dollar-circle-line text-primary me-2"></i>
            Estimated Funding Range
          </h6>
          <p className="mb-1 fs-5 fw-semibold">
            {formatRange(result.estimated_funding_range.minimum, result.estimated_funding_range.maximum)}
          </p>
          {result.estimated_funding_range.basis && (
            <p className="text-muted small mb-0">{result.estimated_funding_range.basis}</p>
          )}
        </div>
      )}

      {/* 3. Strengths */}
      {!!result.strengths?.length && (
        <div className="mb-4">
          <h6 className="fw-bold mb-3">
            <i className="ri-thumb-up-line text-success me-2"></i>
            Strengths
          </h6>
          <ul className="list-unstyled mb-0">
            {result.strengths.map((item, idx) => (
              <li className="d-flex align-items-start gap-2 py-2 border-bottom" key={idx}>
                <i className="ri-check-line text-success mt-1"></i>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Areas Requiring Attention */}
      {!!result.areas_requiring_attention?.length && (
        <div className="mb-4">
          <h6 className="fw-bold mb-3">
            <i className="ri-error-warning-line text-warning me-2"></i>
            Areas Requiring Attention
          </h6>
          <ul className="list-unstyled mb-0">
            {result.areas_requiring_attention.map((item, idx) => (
              <li className="d-flex align-items-start gap-2 py-2 border-bottom" key={idx}>
                <i className="ri-alert-line text-warning mt-1"></i>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Structuring Considerations */}
      {!!result.structuring_considerations?.length && (
        <div className="mb-4">
          <h6 className="fw-bold mb-3">
            <i className="ri-stack-line text-primary me-2"></i>
            Structuring Considerations
          </h6>
          <ul className="list-unstyled mb-0">
            {result.structuring_considerations.map((item, idx) => (
              <li className="d-flex align-items-start gap-2 py-2 border-bottom" key={idx}>
                <i className="ri-arrow-right-s-line text-primary mt-1"></i>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 6. Submission Positioning Overview */}
      {result.submission_positioning_overview && (
        <div className="mb-4">
          <h6 className="fw-bold mb-2">
            <i className="ri-compass-3-line text-primary me-2"></i>
            Submission Positioning Overview
          </h6>
          <p className="mb-0">{result.submission_positioning_overview}</p>
        </div>
      )}

      {/* 7. Required Next Steps — three named groups, rendered in schema order. */}
      {!!result.required_next_steps && (
        <div className="mb-4">
          <h6 className="fw-bold mb-3">
            <i className="ri-guide-line text-info me-2"></i>
            Required Next Steps
          </h6>
          {([
            ['Complete Assessment', result.required_next_steps.complete_assessment],
            ['Underwriting Review', result.required_next_steps.underwriting_review],
            ['Submission Readiness', result.required_next_steps.submission_readiness],
          ] as Array<[string, string[] | undefined]>)
            .filter(([, items]) => !!items?.length)
            .map(([label, items]) => (
              <div className="mb-3" key={label}>
                <div className="fw-medium mb-2">{label}</div>
                <ol className="mb-0 ps-3">
                  {items!.map((step, idx) => (
                    <li className="py-1" key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
        </div>
      )}

      {/* 8. Important Notice */}
      {result.important_notice && (
        <div className="alert alert-warning d-flex align-items-start gap-2" role="alert">
          <i className="ri-information-line fs-5 mt-1"></i>
          <div>
            <div className="fw-semibold mb-1">Important Notice</div>
            <div>{result.important_notice}</div>
          </div>
        </div>
      )}

      {/* 9. The exact disclosure and disclaimer the schema fixes. Rendered
             verbatim and never paraphrased — they are the compliance text. */}
      <div className="mt-4 pt-3 border-top">
        {result.final_disclosure && (
          <p className="text-muted small mb-2">{result.final_disclosure}</p>
        )}
        {result.disclaimer && (
          <p className="text-muted small mb-0">{result.disclaimer}</p>
        )}
      </div>
    </div>
  )
}
