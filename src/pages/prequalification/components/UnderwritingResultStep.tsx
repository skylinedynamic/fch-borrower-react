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

function renderSourceBadge(status?: string) {
  const val = (status || 'Reported').toLowerCase()
  if (val.includes('conflict')) {
    return (
      <span
        className="badge rounded-pill px-2.5 py-1 text-uppercase fw-semibold"
        style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '11px', whiteSpace: 'nowrap' }}
      >
        Conflicting
      </span>
    )
  }
  if (val.includes('verified')) {
    return (
      <span
        className="badge rounded-pill px-2.5 py-1 text-uppercase fw-semibold"
        style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '11px', whiteSpace: 'nowrap' }}
      >
        Verified
      </span>
    )
  }
  if (val.includes('derived')) {
    return (
      <span
        className="badge rounded-pill px-2.5 py-1 text-uppercase fw-semibold"
        style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '11px', whiteSpace: 'nowrap' }}
      >
        Derived Data
      </span>
    )
  }
  return (
    <span
      className="badge rounded-pill px-2.5 py-1 text-uppercase fw-semibold"
      style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontSize: '11px', whiteSpace: 'nowrap' }}
    >
      Borrower Reported
    </span>
  )
}

interface UnderwritingResultStepProps {
  /** Id of the submitted pre-qualification. */
  preQualId: string | number | null
  initialData?: any
  onDataLoaded?: (data: any) => void
}

// Helper to safely extract pre-qualification record whether raw or wrapped in response/data envelope
const extractPayload = (data: any) => {
  if (!data) return null
  if (data.underwriting_result || data.gpt_status) return data
  if (data.data?.underwriting_result || data.data?.gpt_status) return data.data
  if (data.data?.data?.underwriting_result || data.data?.data?.gpt_status) return data.data.data
  return data
}

// The evaluation runs inline during submit in the confirmation modal, so by the time this screen opens
// the result is already available. If initialData is provided, it is rendered immediately with zero delay.
export default function UnderwritingResultStep({
  preQualId,
  initialData,
  onDataLoaded
}: UnderwritingResultStepProps) {
  const initialPayload = extractPayload(initialData)
  const [status, setStatus] = useState<string | null>(initialPayload?.gpt_status || null)
  // The application's own workflow status, which an FCH reviewer controls.
  const [appStatus, setAppStatus] = useState<string | null>(initialPayload?.status || null)
  const [evaluatedAt, setEvaluatedAt] = useState<string | null>(initialPayload?.gpt_generated_at || null)
  const [result, setResult] = useState<UnderwritingResult | null>(initialPayload?.underwriting_result || null)
  const [validationStatus, setValidationStatus] = useState<string | null>(initialPayload?.validation_status || null)
  const [validationSummary, setValidationSummary] = useState<string | null>(initialPayload?.validation_summary || null)
  const [loading, setLoading] = useState<boolean>(!initialPayload?.underwriting_result)
  const [error, setError] = useState<string | null>(null)
  // True while a retry is running, which takes as long as the original
  // evaluation, so the button has to show it is working.
  const [retrying, setRetrying] = useState<boolean>(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState<number>(0)

  const applyData = (raw: any) => {
    const data = extractPayload(raw)
    setStatus(data?.gpt_status || null)
    setAppStatus(data?.status || null)
    setEvaluatedAt(data?.gpt_generated_at || null)
    setResult(data?.underwriting_result || null)
    setValidationStatus(data?.validation_status || null)
    setValidationSummary(data?.validation_summary || null)
    onDataLoaded?.(data)
  }

  useEffect(() => {
    const normalized = extractPayload(initialData)
    if (normalized?.underwriting_result && !result) {
      applyData(normalized)
      setLoading(false)
    }
  }, [initialData])

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

    const normalized = extractPayload(initialData)
    // If we already have the result (from initialData or prior fetch) and not a retry, skip fetching & avoid skeleton loader!
    if ((result || normalized?.underwriting_result) && reloadToken === 0) {
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        if (!result && !normalized?.underwriting_result) {
          setLoading(true)
        }
        const response = await getPreQualificationById(preQualId)
        if (cancelled) return

        applyData(response)
        setError(null)
      } catch (e) {
        if (cancelled) return
        setError('We could not load your underwriting result. Please refresh in a moment.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

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
      applyData(response)
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
    return (
      <TabLoader count={6} colClass="col-md-6" />
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
    <div className="underwriting-result-content pb-4">
      {/* 1. Header Banner & Status Bar */}
      <div className="card shadow-sm border mb-4 rounded-3 overflow-hidden bg-white">
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: '46px',
                  height: '46px',
                  backgroundColor: status === 'FAILED' ? '#fee2e2' : '#ecfdf5',
                  color: status === 'FAILED' ? '#ef4444' : '#10b981',
                }}
              >
                <i className={status === 'FAILED' ? 'ri-error-warning-fill' : 'ri-shield-check-fill'} style={{ fontSize: '24px' }}></i>
              </div>
              <div>
                <h5 className="fw-bold mb-1 fs-18 text-dark">
                  {result.assessment_title || 'Funding Readiness Assessment'}
                </h5>
                <p className="text-muted small mb-0">
                  Pre-qualification underwriting analysis &amp; funding eligibility assessment
                </p>
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              {/* Review Status Badge */}
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-light border">
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Underwriting Review:</span>
                {status === 'FAILED' ? (
                  <span className="badge rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1" style={{ backgroundColor: '#ef4444', color: '#ffffff', fontSize: '11px', fontWeight: 600 }}>
                    <i className="ri-close-circle-fill"></i> Failed
                  </span>
                ) : (
                  <span className="badge rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1" style={{ backgroundColor: '#059669', color: '#ffffff', fontSize: '11px', fontWeight: 600 }}>
                    <i className="ri-check-line"></i> Completed
                  </span>
                )}
              </div>

              {/* Application Status Badge */}
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-light border">
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Status:</span>
                <span className="badge rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1" style={{ backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontSize: '11px', fontWeight: 700 }}>
                  <i className="ri-time-fill"></i> {appStatus || 'Pending'}
                </span>
              </div>

              {/* Evaluated At Date */}
              {evaluatedAt && (
                <div className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill bg-light border text-muted" style={{ fontSize: '12px', fontWeight: 500 }}>
                  <i className="ri-calendar-line"></i>
                  <span>{evaluatedAt}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Estimated Funding Range Hero (if available) */}
      {result.estimated_funding_range?.available && (
        <div
          className="card shadow-sm mb-4 rounded-3 border-0"
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
            border: '1px solid #bbf7d0',
            borderLeft: '5px solid #16a34a',
          }}
        >
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <span className="badge bg-success-subtle text-success fs-11 fw-semibold text-uppercase px-2 py-1 rounded">
                    Indicative Capacity
                  </span>
                  <span className="text-muted fs-12">Preliminary Assessment</span>
                </div>
                <h6 className="text-muted fs-13 fw-semibold text-uppercase mb-2" style={{ letterSpacing: '0.05em' }}>
                  Estimated Funding Range
                </h6>
                <div className="fs-2 fw-bold text-success mb-1">
                  {formatRange(result.estimated_funding_range.minimum, result.estimated_funding_range.maximum)}
                </div>
                {result.estimated_funding_range.basis && (
                  <p className="text-muted fs-13 mb-0">
                    <i className="ri-information-line me-1"></i>
                    {result.estimated_funding_range.basis}
                  </p>
                )}
              </div>
              <div
                className="d-none d-md-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: '64px', height: '64px', backgroundColor: '#dcfce7', color: '#16a34a' }}
              >
                <i className="ri-money-dollar-circle-fill" style={{ fontSize: '36px' }}></i>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Funding Readiness Summary */}
      {result.funding_readiness_summary && (
        <div
          className="card shadow-sm mb-4 rounded-3"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #3b82f6',
          }}
        >
          <div className="card-body p-3 p-md-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <i className="ri-file-text-line text-primary fs-18"></i>
              <h6 className="fw-bold mb-0 text-dark fs-15">Executive Readiness Summary</h6>
            </div>
            <p className="mb-0 fs-14" style={{ lineHeight: '1.7', color: '#334155' }}>
              {result.funding_readiness_summary}
            </p>
          </div>
        </div>
      )}

      {/* 4. Readiness Snapshot */}
      {!!result.readiness_snapshot?.length && (
        <div className="card shadow-sm mb-4 rounded-3 border">
          <div className="card-header bg-light py-3 px-3 px-md-4 border-bottom d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <i className="ri-dashboard-3-line text-primary fs-18"></i>
              <h6 className="fw-bold mb-0 text-dark fs-15">Readiness Snapshot</h6>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-white text-muted border fs-12 fw-medium">
                {result.readiness_snapshot.length} Areas Evaluated
              </span>
            </div>
          </div>

          {/* Desktop & Tablet Table (>= md screens) */}
          <div className="card-body p-0 d-none d-md-block">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ minWidth: '620px' }}>
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-4 py-3 text-muted text-uppercase fs-11 fw-bold" style={{ width: '28%', minWidth: '180px' }}>
                      Evaluation Area
                    </th>
                    <th scope="col" className="py-3 text-muted text-uppercase fs-11 fw-bold">
                      Assessment
                    </th>
                    <th scope="col" className="pe-4 py-3 text-muted text-uppercase fs-11 fw-bold text-end" style={{ width: '22%', minWidth: '160px' }}>
                      Source Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.readiness_snapshot.map((item, idx) => (
                    <tr key={idx}>
                      <td className="ps-4 py-3 fw-semibold text-dark fs-13">
                        {item.area}
                      </td>
                      <td className="py-3 fs-13" style={{ lineHeight: '1.5', color: '#334155' }}>
                        {item.assessment}
                      </td>
                      <td className="pe-4 py-3 text-end">
                        {renderSourceBadge(item.source_status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Cards (< md screens) */}
          <div className="card-body p-0 d-md-none">
            <div className="d-flex flex-column">
              {result.readiness_snapshot.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 ${idx < result.readiness_snapshot.length - 1 ? 'border-bottom' : ''}`}
                  style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}
                >
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <span className="fw-bold text-dark fs-13">{item.area}</span>
                    {renderSourceBadge(item.source_status)}
                  </div>
                  <p className="mb-0 fs-13" style={{ lineHeight: '1.55', color: '#334155' }}>
                    {item.assessment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Strengths & Areas Requiring Attention (2-Column Grid) */}
      <div className="row g-3 g-md-4 mb-4">
        {/* Strengths Card */}
        {!!result.strengths?.length && (
          <div className={result.areas_requiring_attention?.length ? 'col-lg-6' : 'col-12'}>
            <div
              className="card h-100 shadow-sm rounded-3 border"
              style={{ backgroundColor: '#ffffff', borderColor: '#bbf7d0' }}
            >
              <div
                className="card-header py-3 px-3 px-md-4 border-bottom d-flex align-items-center justify-content-between"
                style={{ backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="ri-shield-check-fill text-success fs-18"></i>
                  <h6 className="fw-bold mb-0 text-success fs-15">Profile Strengths</h6>
                </div>
                <span className="badge bg-white text-success border border-success-subtle fs-12 fw-semibold px-2 py-1 rounded-pill">
                  {result.strengths.length} {result.strengths.length === 1 ? 'Strength' : 'Strengths'}
                </span>
              </div>
              <div className="card-body p-3 p-md-4">
                <div className="d-flex flex-column" style={{ gap: '12px' }}>
                  {result.strengths.map((item, idx) => (
                    <div
                      className="d-flex align-items-start rounded-3"
                      style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        padding: '12px 14px',
                        gap: '12px',
                      }}
                      key={idx}
                    >
                      <i
                        className="ri-checkbox-circle-fill text-success fs-17 flex-shrink-0"
                        style={{ marginTop: '2px', lineHeight: 1 }}
                      ></i>
                      <span
                        style={{
                          fontSize: '13px',
                          lineHeight: '1.55',
                          color: '#166534',
                          fontWeight: 500,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Areas Requiring Attention Card */}
        {!!result.areas_requiring_attention?.length && (
          <div className={result.strengths?.length ? 'col-lg-6' : 'col-12'}>
            <div
              className="card h-100 shadow-sm rounded-3 border"
              style={{ backgroundColor: '#ffffff', borderColor: '#fde68a' }}
            >
              <div
                className="card-header py-3 px-3 px-md-4 border-bottom d-flex align-items-center justify-content-between"
                style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <i className="ri-alert-fill text-warning fs-18"></i>
                  <h6 className="fw-bold mb-0 text-warning fs-15">Areas Requiring Attention</h6>
                </div>
                <span className="badge bg-white text-warning border border-warning-subtle fs-12 fw-semibold px-2 py-1 rounded-pill">
                  {result.areas_requiring_attention.length} {result.areas_requiring_attention.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
              <div className="card-body p-3 p-md-4">
                <div className="d-flex flex-column" style={{ gap: '12px' }}>
                  {result.areas_requiring_attention.map((item, idx) => (
                    <div
                      className="d-flex align-items-start rounded-3"
                      style={{
                        backgroundColor: '#fffbeb',
                        border: '1px solid #fde68a',
                        padding: '12px 14px',
                        gap: '12px',
                      }}
                      key={idx}
                    >
                      <i
                        className="ri-error-warning-fill text-warning fs-17 flex-shrink-0"
                        style={{ marginTop: '2px', lineHeight: 1 }}
                      ></i>
                      <span
                        style={{
                          fontSize: '13px',
                          lineHeight: '1.55',
                          color: '#92400e',
                          fontWeight: 500,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Structuring Considerations & Submission Positioning Overview */}
      {(result.submission_positioning_overview || !!result.structuring_considerations?.length) && (
        <div className="row g-3 g-md-4 mb-4">
          {result.submission_positioning_overview && (
            <div className={result.structuring_considerations?.length ? 'col-lg-6' : 'col-12'}>
              <div className="card h-100 shadow-sm rounded-3 border">
                <div className="card-header bg-light py-3 px-3 px-md-4 border-bottom d-flex align-items-center gap-2">
                  <i className="ri-compass-3-line text-primary fs-18"></i>
                  <h6 className="fw-bold mb-0 text-dark fs-15">Submission Positioning Overview</h6>
                </div>
                <div className="card-body p-3 p-md-4">
                  <p className="mb-0 fs-14" style={{ lineHeight: '1.7', color: '#334155' }}>
                    {result.submission_positioning_overview}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!!result.structuring_considerations?.length && (
            <div className={result.submission_positioning_overview ? 'col-lg-6' : 'col-12'}>
              <div className="card h-100 shadow-sm rounded-3 border">
                <div className="card-header bg-light py-3 px-3 px-md-4 border-bottom d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <i className="ri-stack-line text-primary fs-18"></i>
                    <h6 className="fw-bold mb-0 text-dark fs-15">Structuring Considerations</h6>
                  </div>
                  <span className="badge bg-white text-primary border fs-12 fw-semibold px-2 py-1 rounded-pill">
                    {result.structuring_considerations.length} {result.structuring_considerations.length === 1 ? 'Point' : 'Points'}
                  </span>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="d-flex flex-column" style={{ gap: '12px' }}>
                    {result.structuring_considerations.map((item, idx) => (
                      <div
                        className="d-flex align-items-start rounded-3"
                        style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '12px 14px',
                          gap: '12px',
                        }}
                        key={idx}
                      >
                        <i
                          className="ri-arrow-right-circle-fill text-primary fs-17 flex-shrink-0"
                          style={{ marginTop: '2px', lineHeight: 1 }}
                        ></i>
                        <span
                          style={{
                            fontSize: '13px',
                            lineHeight: '1.55',
                            color: '#334155',
                            fontWeight: 500,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Required Next Steps (Milestone / Roadmap Flow) */}
      {!!result.required_next_steps && (
        <div className="card shadow-sm mb-4 rounded-3 border">
          <div className="card-header bg-light py-3 px-3 px-md-4 border-bottom d-flex align-items-center gap-2">
            <i className="ri-guide-line text-info fs-18"></i>
            <h6 className="fw-bold mb-0 text-dark fs-15">Required Next Steps</h6>
          </div>
          <div className="card-body p-3 p-md-4">
            <div className="d-flex flex-column gap-4">
              {([
                {
                  label: 'Complete Assessment',
                  icon: 'ri-file-list-3-line',
                  color: '#3b82f6',
                  bg: '#eff6ff',
                  items: result.required_next_steps.complete_assessment,
                },
                {
                  label: 'Underwriting Review',
                  icon: 'ri-search-eye-line',
                  color: '#8b5cf6',
                  bg: '#f5f3ff',
                  items: result.required_next_steps.underwriting_review,
                },
                {
                  label: 'Submission Readiness',
                  icon: 'ri-rocket-line',
                  color: '#10b981',
                  bg: '#ecfdf5',
                  items: result.required_next_steps.submission_readiness,
                },
              ] as const)
                .filter((group) => !!group.items?.length)
                .map((group) => (
                  <div key={group.label} className="p-3 rounded-3 border bg-white">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: '28px', height: '28px', backgroundColor: group.bg, color: group.color }}
                      >
                        <i className={`${group.icon} fs-14`}></i>
                      </span>
                      <span className="fw-bold text-dark fs-14">{group.label}</span>
                    </div>

                    <div className="d-flex flex-column gap-2 ms-1">
                      {group.items!.map((step, idx) => (
                        <div className="d-flex align-items-start gap-3 fs-13" style={{ color: '#334155' }} key={idx}>
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold fs-11"
                            style={{
                              width: '20px',
                              height: '20px',
                              marginTop: '2px',
                              backgroundColor: group.bg,
                              color: group.color,
                              border: `1px solid ${group.color}40`,
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span style={{ lineHeight: '1.6' }}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. Important Notice */}
      {result.important_notice && (
        <div
          className="card shadow-none mb-4 rounded-3"
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderLeft: '5px solid #f59e0b',
          }}
        >
          <div className="card-body p-3 p-md-4">
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '42px', height: '42px', backgroundColor: '#fef3c7', color: '#d97706' }}
              >
                <i className="ri-alert-fill" style={{ fontSize: '22px' }}></i>
              </div>
              <div className="flex-grow-1">
                <h6 className="fw-bold mb-1 fs-15" style={{ color: '#92400e' }}>Important Notice</h6>
                <p className="mb-0 fs-13" style={{ lineHeight: '1.65', color: '#451a03' }}>
                  {result.important_notice}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Disclosures & Disclaimers */}
      {(result.final_disclosure || result.disclaimer) && (
        <div className="pt-3 border-top fs-12" style={{ lineHeight: '1.65' }}>
          {result.final_disclosure && (
            <p className="mb-2" style={{ color: '#64748b' }}>{result.final_disclosure}</p>
          )}
          {result.disclaimer && (
            <p className="mb-0" style={{ color: '#64748b' }}>{result.disclaimer}</p>
          )}
        </div>
      )}
    </div>
  )
}
