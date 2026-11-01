import React, { useEffect, useState } from 'react'
import { getPreQualificationById, retryUnderwriting } from '../../../modules/pre-qualification/services'
import { isIncorrectUnderwriting } from '../../../modules/my-application/types'
import TabLoader from '../../../components/Loader/TabLoader'
import SubmitProgress from './SubmitProgress'
import ConfirmationModal from '../../../components/GlobalModal/ConfirmationModal'
import { clearStrayModalBackdrops } from '../../../utils/modalBackdrop'
import { readableLabel } from '../../../utils/underwritingLabels'
import '../../../../assets/css/underwriting-result.css'

/**
 * The borrower-safe assessment, as the agent returned it.
 *
 * This is a funding *readiness* assessment, not an approval: there is deliberately
 * no "qualified programs" list and no prequalification claim to render.
 *
 * The named fields below are the ones with a section designed for them. They are
 * not the whole contract: the schema lives on the OpenAI agent, so a field added
 * or renamed there would otherwise simply vanish from this screen. Anything the
 * agent returns that is not named here is rendered by renderExtraSection() in the
 * same styles, so the borrower sees the assessment that was actually produced.
 */
interface ReadinessSnapshotItem {
  area?: string
  assessment?: string
  source_status?: string
}

/** One blocking finding, worded for the borrower by the validator agent. */
interface ValidationCorrection {
  field?: string | null
  message?: string
}

interface UnderwritingResult {
  /** Whatever else the agent's schema defines — see renderExtraSection(). */
  [key: string]: unknown
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
        className="badge rounded-pill px-2.5 py-1 text-uppercase fw-semibold uw-source-badge uw-source-badge--conflict"
      >
        Conflicting
      </span>
    )
  }
  if (val.includes('verified')) {
    return (
      <span
        className="badge rounded-pill px-2.5 py-1 text-uppercase fw-semibold uw-source-badge uw-source-badge--verified"
      >
        Verified
      </span>
    )
  }
  if (val.includes('derived')) {
    return (
      <span
        className="badge rounded-pill px-2.5 py-1 text-uppercase fw-semibold uw-source-badge uw-source-badge--derived"
      >
        Derived Data
      </span>
    )
  }
  // Was falling through to "Borrower Reported" - the opposite of what it says.
  if (val.includes('not_provided') || val.includes('not provided')) {
    return (
      <span
        className="badge rounded-pill px-2.5 py-1 text-uppercase fw-semibold uw-source-badge uw-source-badge--reported"
      >
        Not Provided
      </span>
    )
  }
  return (
    <span
      className="badge rounded-pill px-2.5 py-1 text-uppercase fw-semibold uw-source-badge uw-source-badge--reported"
    >
      Borrower Reported
    </span>
  )
}

/**
 * The fields that have a section of their own above. Everything else the agent
 * returns falls through to renderExtraSection().
 */
const SECTIONED_RESULT_KEYS = new Set([
  'assessment_title',
  'funding_readiness_summary',
  'readiness_snapshot',
  'estimated_funding_range',
  'strengths',
  'areas_requiring_attention',
  'structuring_considerations',
  'submission_positioning_overview',
  'required_next_steps',
  'important_notice',
  'final_disclosure',
  'disclaimer',
  // Provenance the agent states about itself. It describes the run, not the
  // borrower's funding readiness, so it is not shown to them.
  'prompt_version',
  'submission_id',
  'schema_version',
  'generated_at',
])

/** "submission_positioning" -> "Submission Positioning". */
const humanizeKey = (key: string): string =>
  key
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())

const isFilledString = (value: unknown): value is string => typeof value === 'string' && value.trim() !== ''

/**
 * A plain scalar the agent can state as a value: shown as written, except a
 * field path or source code, which is put into words (BUG-061).
 */
const asScalarText = (value: unknown): string | null => {
  if (isFilledString(value)) return readableLabel(value.trim())
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return null
}

/** A bullet list in the same style the designed sections use. */
function renderBullets(items: string[], key: string) {
  return (
    <div className="d-flex flex-column uw-stack" key={`${key}-items`}>
      {items.map((item, idx) => (
        <div
          className="d-flex align-items-start rounded-3 uw-item uw-item--neutral"
          key={idx}
        >
          <i className="ri-arrow-right-circle-fill text-primary fs-17 flex-shrink-0 uw-item-icon"></i>
          <span className="uw-item-text uw-item-text--neutral">
            {item}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * One field the agent returned that has no section designed for it.
 *
 * The shape decides how it reads, not the name: text becomes a paragraph, a
 * list of strings becomes bullets, a list of objects becomes a table, and an
 * object becomes its own labelled rows. A field whose value is empty renders
 * nothing at all rather than an empty card — "the agent had nothing to say
 * here" and "there is a heading with nothing under it" are different things to
 * put in front of a borrower.
 */
function renderExtraSection(key: string, value: unknown): React.ReactNode {
  const scalar = asScalarText(value)

  if (scalar !== null) {
    return (
      <div className="card shadow-sm mb-4 rounded-3 border" key={key}>
        <div className="card-header bg-light py-3 px-3 px-md-4 border-bottom d-flex align-items-center gap-2">
          <i className="ri-file-text-line text-primary fs-18"></i>
          <h6 className="fw-bold mb-0 text-dark fs-15">{humanizeKey(key)}</h6>
        </div>
        <div className="card-body p-3 p-md-4">
          <p className="mb-0 fs-14 uw-prose">{scalar}</p>
        </div>
      </div>
    )
  }

  if (Array.isArray(value)) {
    const bullets = value.map(asScalarText).filter(isFilledString)

    if (bullets.length === value.length && bullets.length > 0) {
      return (
        <div className="card shadow-sm mb-4 rounded-3 border" key={key}>
          <div className="card-header bg-light py-3 px-3 px-md-4 border-bottom d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <i className="ri-stack-line text-primary fs-18"></i>
              <h6 className="fw-bold mb-0 text-dark fs-15">{humanizeKey(key)}</h6>
            </div>
            <span className="badge bg-white text-primary border fs-12 fw-semibold px-2 py-1 rounded-pill">
              {bullets.length} {bullets.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>
          <div className="card-body p-3 p-md-4">{renderBullets(bullets, key)}</div>
        </div>
      )
    }

    // A list of records: the union of their keys becomes the columns, so a row
    // that omits one is blank there rather than shifting the table.
    const rows = value.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object' && !Array.isArray(row))

    if (rows.length === 0) return null

    const columns = Array.from(new Set(rows.flatMap(row => Object.keys(row))))
    if (columns.length === 0) return null

    return (
      <div className="card shadow-sm mb-4 rounded-3 border" key={key}>
        <div className="card-header bg-light py-3 px-3 px-md-4 border-bottom d-flex align-items-center gap-2">
          <i className="ri-table-line text-primary fs-18"></i>
          <h6 className="fw-bold mb-0 text-dark fs-15">{humanizeKey(key)}</h6>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  {columns.map(column => (
                    <th scope="col" className="py-3 px-4 text-muted text-uppercase fs-11 fw-bold" key={column}>
                      {humanizeKey(column)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map(column => {
                      const cell = asScalarText(row[column])

                      return (
                        <td className="py-3 px-4 fs-13 uw-cell" key={column}>
                          {cell ?? (Array.isArray(row[column]) ? (row[column] as unknown[]).map(asScalarText).filter(isFilledString).join(', ') : '')}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (value && typeof value === 'object') {
    const groups = Object.entries(value as Record<string, unknown>)
      .map(([childKey, childValue]) => {
        const scalarChild = asScalarText(childValue)
        const listChild = Array.isArray(childValue) ? childValue.map(asScalarText).filter(isFilledString) : []

        return { childKey, scalarChild, listChild }
      })
      .filter(group => group.scalarChild !== null || group.listChild.length > 0)

    if (groups.length === 0) return null

    return (
      <div className="card shadow-sm mb-4 rounded-3 border" key={key}>
        <div className="card-header bg-light py-3 px-3 px-md-4 border-bottom d-flex align-items-center gap-2">
          <i className="ri-list-check-2 text-primary fs-18"></i>
          <h6 className="fw-bold mb-0 text-dark fs-15">{humanizeKey(key)}</h6>
        </div>
        <div className="card-body p-3 p-md-4">
          <div className="d-flex flex-column gap-3">
            {groups.map(({ childKey, scalarChild, listChild }) => (
              <div key={childKey}>
                <div className="fw-bold text-dark fs-13 mb-2">{humanizeKey(childKey)}</div>
                {scalarChild !== null ? (
                  <p className="mb-0 fs-13 uw-prose-sm">{scalarChild}</p>
                ) : (
                  renderBullets(listChild, `${key}-${childKey}`)
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
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
  // What the validator agent wrote for the borrower about each blocking
  // finding. These are the corrections to make, in the agent's own words.
  const [corrections, setCorrections] = useState<ValidationCorrection[]>(initialPayload?.validation_corrections || [])
  const [loading, setLoading] = useState<boolean>(!initialPayload?.underwriting_result)
  const [error, setError] = useState<string | null>(null)
  // True while a retry is running, which takes as long as the original
  // evaluation, so the button has to show it is working.
  const [retrying, setRetrying] = useState<boolean>(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  // Set when the borrower presses Try again and cleared once that run settles,
  // so the wait is shown in the same modal the original submit uses rather
  // than by swapping the page out from under them.
  const [retryStarted, setRetryStarted] = useState<boolean>(false)
  const [reloadToken, setReloadToken] = useState<number>(0)
  const [pollCount, setPollCount] = useState<number>(0)

  const applyData = (raw: any) => {
    const data = extractPayload(raw)
    setStatus(data?.gpt_status || null)
    setAppStatus(data?.status || null)
    setEvaluatedAt(data?.gpt_generated_at || null)
    setResult(data?.underwriting_result || null)
    setValidationStatus(data?.validation_status || null)
    setValidationSummary(data?.validation_summary || null)
    setCorrections(Array.isArray(data?.validation_corrections) ? data.validation_corrections : [])
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
    // Ensure body scroll is unlocked when underwriting result is displayed.
    // Stray backdrops only - the globally mounted profile modal's overlay is
    // not ours to remove, and deleting it left that modal over an undimmed page.
    clearStrayModalBackdrops()
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
        // Only the first load shows the skeleton; a status re-check while the
        // evaluation is running keeps the waiting screen in place.
        if (!result && !normalized?.underwriting_result && status !== 'PENDING') {
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

  // The evaluation runs on the server after submit returns, so the result
  // arrives later: re-check every POLL_INTERVAL_MS until it settles, for at
  // most POLL_LIMIT checks (~10 minutes) before showing the "taking longer" note.
  const POLL_INTERVAL_MS = 10000
  const POLL_LIMIT = 60
  const isEvaluating = status === 'PENDING' && !result && pollCount < POLL_LIMIT
  useEffect(() => {
    if (!preQualId || !isEvaluating) return
    const timer = setTimeout(() => {
      setPollCount(c => c + 1)
      setReloadToken(t => t + 1)
    }, POLL_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [preQualId, isEvaluating, reloadToken])

  // Runs the evaluation again. The API accepts this only while the review is in
  // the failed state, so it can never regenerate a result that already succeeded.
  const handleRetry = async () => {
    if (!preQualId || retrying) return

    setRetrying(true)
    setRetryStarted(true)
    setRetryError(null)

    try {
      const response = await retryUnderwriting(preQualId)
      setPollCount(0)
      applyData(response)
    } catch (e: any) {
      setRetryError(
        e?.response?.data?.message
        || 'We could not complete the review. Please try again in a few minutes.'
      )
      setRetryStarted(false)
      // Pick up whatever state the server actually recorded for the attempt.
      setReloadToken(t => t + 1)
    } finally {
      setRetrying(false)
    }
  }

  // The retry is in flight: the request itself, then the evaluation the server
  // runs after answering it.
  const retryRunning = retryStarted && (retrying || isEvaluating)

  useEffect(() => {
    if (retryStarted && !retrying && status !== 'PENDING') setRetryStarted(false)
  }, [retryStarted, retrying, status])

  if (!preQualId) {
    return (
      <div className="text-center py-5">
        <i className="ri-lock-line fs-1 text-muted"></i>
        <h5 className="mt-3 mb-1">Not available yet</h5>
        <p className="text-muted mb-0">Submit your pre-qualification to see your underwriting result.</p>
      </div>
    )
  }

  if (loading && !result && !isEvaluating) {
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
  if (status === 'FAILED' || retryRunning) {
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
            <span className={`badge ${appStatus === 'Failed' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'} fs-12 fw-semibold px-2.5 py-1 rounded`}>{appStatus || 'Pending'}</span>
          </div>
        </div>

        {/* Amber, matching the "Incorrect Information" card's structure — the review
            did not finish, but unlike that case nothing the borrower entered is wrong. */}
        <div
          className="card shadow-none mb-4 rounded-3 uw-notice uw-notice--warning"
        >
          <div className="card-body p-4">
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 uw-notice-icon uw-notice-icon--warning"
              >
                <i className="ri-alert-line text-warning fs-22 lh-1"></i>
              </div>
              <div className="flex-grow-1">
                <h5 className="fw-bold text-warning mb-2 fs-16">We could not complete the automated review</h5>
                {/* One statement, in the order the borrower needs it: their submission is
                    safe, the cause was ours, what it prevents, and what happens next. */}
                <p className="mb-0 fs-14 uw-notice-text">
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
          <button type="button" className="btn btn-primary" onClick={handleRetry} disabled={retryRunning}>
            <i className="ri-refresh-line me-1"></i> Try again
          </button>
        </div>

        {/* The same waiting modal the original submit shows, so running the
            review again looks and behaves like running it the first time. */}
        <ConfirmationModal
          show={retryRunning}
          onClose={() => {}}
          onConfirm={() => {}}
          title="Evaluating Underwriting Result"
          message=""
          confirmText="Try again"
          cancelText="No, Cancel"
          loading
          hideIcon
          loadingText="Evaluating..."
        >
          <SubmitProgress />
        </ConfirmationModal>
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
            <span className={`badge ${appStatus === 'Failed' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'} fs-12 fw-semibold px-2.5 py-1 rounded`}>{appStatus || 'Pending'}</span>
          </div>
          {evaluatedAt && <span className="text-muted small ms-auto">Evaluated {evaluatedAt}</span>}
        </div>

        <div
          className="card shadow-none mb-4 rounded-3 uw-notice uw-notice--danger"
          // No fill: the card and the findings inside it share one plain
          // background, and the theme's danger colour is kept to the accent
          // bar, the borders and the icons.
        >
          <div className="card-body p-4">
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 uw-notice-icon uw-notice-icon--danger"
              >
                <i className="ri-alert-line text-danger fs-22 lh-1"></i>
              </div>
              <div className="flex-grow-1">
                <h5 className="fw-bold text-danger mb-2 fs-16">Incorrect Information</h5>
                {/* What is wrong comes from the validator agent, in the words it
                    wrote for the borrower — the summary it gave, then each
                    blocking finding. Nothing is paraphrased here, and the
                    standing sentence below only says what it prevents. */}
                {(validationSummary || corrections.length === 0) && (
                  <p className={`uw-notice-text fs-14 ${corrections.length ? 'mb-3' : 'mb-0'}`}>
                    {validationSummary || 'The submission contains an inconsistency or missing information that needs attention before underwriting can complete.'}
                  </p>
                )}

                {corrections.length > 0 && (
                  <div className="d-flex flex-column mb-3 uw-corrections">
                    {corrections.map((correction, idx) => (
                      <div
                        className="d-flex align-items-start rounded-3 uw-correction"
                        key={idx}
                      >
                        <i className="ri-error-warning-fill text-danger fs-17 flex-shrink-0 uw-item-icon"></i>
                        <div className="flex-grow-1 uw-min-w-0">
                          {correction.field && (
                            <div className="fw-bold text-dark fs-13 mb-1">{humanizeKey(correction.field)}</div>
                          )}
                          <span className="uw-correction-text">
                            {correction.message}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mb-0 fs-14 uw-notice-text">
                  A completed review is required before you can start a funding application,
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

  // The review is still running — after a page reload, or on a first load
  // that arrives mid-evaluation. The wait is shown in the same modal the
  // submit and Try again use, over the status bar, never as a card in the page.
  if (isEvaluating) {
    return (
      <div className="step-content">
        <div className="d-flex flex-wrap align-items-center gap-2 p-3 mb-4 rounded border bg-light">
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Underwriting Review Status:</span>
            <span className="badge bg-warning-subtle text-warning fs-12 fw-semibold px-2.5 py-1 rounded">In Progress</span>
          </div>
          <span className="text-muted opacity-50 mx-2">|</span>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Application Status:</span>
            <span className={`badge ${appStatus === 'Failed' ? 'bg-danger-subtle text-danger' : 'bg-warning-subtle text-warning'} fs-12 fw-semibold px-2.5 py-1 rounded`}>{appStatus || 'Pending'}</span>
          </div>
        </div>

        <ConfirmationModal
          show
          onClose={() => {}}
          onConfirm={() => {}}
          title="Evaluating Underwriting Result"
          message=""
          confirmText="Evaluating..."
          cancelText="No, Cancel"
          loading
          hideIcon
          loadingText="Evaluating..."
        >
          <SubmitProgress />
        </ConfirmationModal>
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
                className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 uw-result-icon${status === 'FAILED' ? ' is-failed' : ''}`}
              >
                <i className={`uw-icon-24 ${status === 'FAILED' ? 'ri-error-warning-fill' : 'ri-shield-check-fill'}`}></i>
              </div>
              <div>
                <h5 className="fw-bold mb-1 fs-18 text-dark">
                  {result.assessment_title || 'Funding Readiness Assessment'}
                </h5>
                <p className="text-muted small mb-0">
                  Preliminary funding readiness assessment
                </p>
              </div>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2">
              {/* Review Status Badge */}
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-light border">
                <span className="uw-pill-label">Underwriting Review:</span>
                {status === 'FAILED' ? (
                  <span className="badge rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 uw-pill-badge uw-pill-badge--failed">
                    <i className="ri-close-circle-fill"></i> Failed
                  </span>
                ) : (
                  <span className="badge rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 uw-pill-badge uw-pill-badge--completed">
                    <i className="ri-check-line"></i> Completed
                  </span>
                )}
              </div>

              {/* Application Status Badge */}
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-light border">
                <span className="uw-pill-label">Status:</span>
                <span className="badge rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 uw-pill-badge uw-pill-badge--pending">
                  <i className="ri-time-fill"></i> {appStatus || 'Pending'}
                </span>
              </div>

              {/* Evaluated At Date & Time */}
              {evaluatedAt && (
                <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-light border">
                  <span className="uw-pill-label">Evaluated:</span>
                  <span className="d-inline-flex align-items-center text-muted uw-pill-value">
                    <i className="ri-calendar-line"></i>
                    <span>{evaluatedAt}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Estimated Funding Range Hero (if available) */}
      {result.estimated_funding_range?.available && (
        <div
          className="card shadow-sm mb-4 rounded-3 border-0 uw-range-hero"
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
                <h6 className="text-muted fs-13 fw-semibold text-uppercase mb-2 uw-tracking">
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
                className="d-none d-md-flex align-items-center justify-content-center rounded-circle flex-shrink-0 uw-range-icon"
              >
                <i className="ri-money-dollar-circle-fill uw-icon-36"></i>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Funding Readiness Summary */}
      {result.funding_readiness_summary && (
        <div
          className="card shadow-sm mb-4 rounded-3 uw-summary-card"
        >
          <div className="card-body p-3 p-md-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <i className="ri-file-text-line text-primary fs-18"></i>
              <h6 className="fw-bold mb-0 text-dark fs-15">Executive Readiness Summary</h6>
            </div>
            <p className="mb-0 fs-14 uw-prose">
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
              <table className="table table-hover align-middle mb-0 uw-snapshot-table">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-4 py-3 text-muted text-uppercase fs-11 fw-bold uw-col-area">
                      Evaluation Area
                    </th>
                    <th scope="col" className="py-3 text-muted text-uppercase fs-11 fw-bold">
                      Assessment
                    </th>
                    <th scope="col" className="pe-4 py-3 text-muted text-uppercase fs-11 fw-bold text-end uw-col-source">
                      Source Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.readiness_snapshot.map((item, idx) => (
                    <tr key={idx}>
                      <td className="ps-4 py-3 fw-semibold text-dark fs-13">
                        {readableLabel(item.area)}
                      </td>
                      <td className="py-3 fs-13 uw-cell">
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
              {result.readiness_snapshot.map((item, idx, items) => (
                <div
                  key={idx}
                  className={`uw-snapshot-row p-3 ${idx < items.length - 1 ? 'border-bottom' : ''}`}
                >
                  <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                    <span className="fw-bold text-dark fs-13">{readableLabel(item.area)}</span>
                    {renderSourceBadge(item.source_status)}
                  </div>
                  <p className="mb-0 fs-13 uw-snapshot-text">
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
              className="card h-100 shadow-sm rounded-3 border uw-card--success"
            >
              <div
                className="card-header py-3 px-3 px-md-4 border-bottom d-flex align-items-center justify-content-between uw-card-header--success"
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
                <div className="d-flex flex-column uw-stack">
                  {result.strengths.map((item, idx) => (
                    <div
                      className="d-flex align-items-start rounded-3 uw-item uw-item--success"
                      key={idx}
                    >
                      <i
                        className="ri-checkbox-circle-fill text-success fs-17 flex-shrink-0 uw-item-icon"
                      ></i>
                      <span className="uw-item-text uw-item-text--success"
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
              className="card h-100 shadow-sm rounded-3 border uw-card--warning"
            >
              <div
                className="card-header py-3 px-3 px-md-4 border-bottom d-flex align-items-center justify-content-between uw-card-header--warning"
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
                <div className="d-flex flex-column uw-stack">
                  {result.areas_requiring_attention.map((item, idx) => (
                    <div
                      className="d-flex align-items-start rounded-3 uw-item uw-item--warning"
                      key={idx}
                    >
                      <i
                        className="ri-error-warning-fill text-warning fs-17 flex-shrink-0 uw-item-icon"
                      ></i>
                      <span className="uw-item-text uw-item-text--warning"
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
                  <p className="mb-0 fs-14 uw-prose">
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
                  <div className="d-flex flex-column uw-stack">
                    {result.structuring_considerations.map((item, idx) => (
                      <div
                        className="d-flex align-items-start rounded-3 uw-item uw-item--neutral"
                        key={idx}
                      >
                        <i
                          className="ri-arrow-right-circle-fill text-primary fs-17 flex-shrink-0 uw-item-icon"
                        ></i>
                        <span className="uw-item-text uw-item-text--neutral"
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
                  tone: 'blue',
                  items: result.required_next_steps.complete_assessment,
                },
                {
                  label: 'Underwriting Review',
                  icon: 'ri-search-eye-line',
                  tone: 'purple',
                  items: result.required_next_steps.underwriting_review,
                },
                {
                  label: 'Submission Readiness',
                  icon: 'ri-rocket-line',
                  tone: 'green',
                  items: result.required_next_steps.submission_readiness,
                },
              ] as const)
                .filter((group) => !!group.items?.length)
                .map((group) => (
                  <div key={group.label} className={`p-3 rounded-3 border bg-white uw-step-group--${group.tone}`}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span
                        className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 uw-step-icon"
                      >
                        <i className={`${group.icon} fs-14`}></i>
                      </span>
                      <span className="fw-bold text-dark fs-14">{group.label}</span>
                    </div>

                    <div className="d-flex flex-column gap-2 ms-1">
                      {group.items!.map((step, idx) => (
                        <div className="d-flex align-items-start gap-3 fs-13 uw-step" key={idx}>
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold fs-11 uw-step-number"
                          >
                            {idx + 1}
                          </span>
                          <span className="uw-step-text">{step}</span>
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
          className="card shadow-none mb-4 rounded-3 uw-notice uw-notice--warning"
        >
          <div className="card-body p-3 p-md-4">
            <div className="d-flex align-items-start gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 uw-notice-icon uw-notice-icon--important"
              >
                <i className="ri-alert-fill uw-icon-22"></i>
              </div>
              <div className="flex-grow-1">
                <h6 className="fw-bold mb-1 fs-15 uw-notice-title--important">Important Notice</h6>
                <p className="mb-0 fs-13 uw-notice-text--important">
                  {result.important_notice}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8b. Anything else this agent's schema defines.
          The sections above are designed for the fields they name; the schema
          itself lives on the OpenAI agent, so a field added or renamed there
          would otherwise be dropped silently and the borrower would be shown a
          partial assessment with no sign that anything was missing. */}
      {Object.entries(result)
        .filter(([key]) => !SECTIONED_RESULT_KEYS.has(key))
        .map(([key, value]) => renderExtraSection(key, value))}

      {/* 9. Disclosures & Disclaimers */}
      {(result.final_disclosure || result.disclaimer) && (
        <div className="pt-3 border-top fs-12 uw-disclosures">
          {result.final_disclosure && (
            <p className="mb-2 uw-disclosure-text">{result.final_disclosure}</p>
          )}
          {result.disclaimer && (
            <p className="mb-0 uw-disclosure-text">{result.disclaimer}</p>
          )}
        </div>
      )}
    </div>
  )
}
