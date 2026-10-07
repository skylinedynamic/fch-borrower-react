import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/themes/material_blue.css'
import type { SignatureBlockSettings } from '../../../../modules/funding-application/types'
import { signatureLabel, signatureMetaStyle, signatureTextStyle, signatureWrapperStyle } from './signatureBlock'
import { FileManagerModal } from '../../../../components/FileManagerModal/FileManagerModal'
import { apiClient } from '../../../../lib/http/apiClient'
import type { FileSystemItem } from '../../../../modules/filemanager/types'
import { getUser } from '../../../../lib/auth/auth'

interface SignaturePadProps {
  /** The signature as a PNG data URL, or '' when nothing has been signed. */
  value: string
  onChange: (dataUrl: string) => void
  invalid?: boolean
  /** The Borrower Agreement's Signature block settings, from the agreement builder. */
  block?: SignatureBlockSettings | null
  /** Show the signature date box beside the pad. On by default. */
  showDate?: boolean
  /** The signature date, as YYYY-MM-DD. */
  date?: string
  onDateChange?: (date: string) => void
  /**
   * Let the signer draw on the pad. On by default; when off, the signature can
   * only come from the file manager, and clicking the pad opens it.
   */
  drawable?: boolean
  /** The server's limits for a signature image, for wording the hint. */
  rules?: SignatureImageRules | null
}

// The one box every signature on this step sits in - the previous signature,
// the new e-signature and the typed name alike - so they are the same box, not
// three that nearly match. Its border and corners are the page's own (the same
// as the consent boxes underneath), not a rounder style of its own.
export const SIGNATURE_PANEL_STYLE: CSSProperties = {
  border: '1px solid var(--vz-border-color, var(--bs-border-color, #e9ebec))',
  borderRadius: 'var(--vz-border-radius, var(--bs-border-radius, 0.25rem))',
  background: '#fff',
  outline: 'none',
}

// The drawing surface is a fixed size whatever the screen, so every signature
// is stored at the same resolution and the image sent stays small. CSS scales
// it to the column; pointer positions are scaled back to match.
const PAD_WIDTH = 600
const PAD_HEIGHT = 180
// The borrower's own files, the same folder the Document Upload step opens.
const FILE_MANAGER_ENTITY_TYPE = 'borrowers'

/** What a signature image may be, as the server enforces it. */
export interface SignatureImageRules {
  max_file_kb?: number
  mime_types?: string[]
}

// The image types a borrower can sign with when the server allows any image.
const ALL_IMAGE_TYPES = ['JPG', 'JPEG', 'PNG', 'WEBP', 'AVIF', 'GIF', 'BMP']

// "JPG, JPEG, PNG, WEBP, AVIF, GIF, BMP · Max 1 MB" - worded from the server's own limits.
const describeRules = (rules?: SignatureImageRules | null): string => {
  const allowed = rules?.mime_types?.length ? rules.mime_types : ['image/*']
  const maxKb = rules?.max_file_kb || 1024
  const size = maxKb >= 1024 ? `${Number((maxKb / 1024).toFixed(1))} MB` : `${maxKb} KB`

  // Every type named here really works: PNG and JPEG show as they are, and the
  // server turns the others into a PNG before sending them. The line is allowed
  // to wrap beside the buttons rather than be cut off.
  const types = allowed.includes('image/*')
    ? ALL_IMAGE_TYPES.join(', ')
    : allowed.map(type => (type === 'image/jpeg' ? 'JPG, JPEG' : type.replace('image/', '').toUpperCase())).join(', ')

  return `${types} · Max ${size}`
}

// The server accepted the file, but this browser has no way to show its format
// (HEIC outside Safari, for one). Nothing to validate - it simply cannot be drawn.
class UndisplayableImage extends Error {}

// The picked file, checked by the server - that it is the borrower's own, really
// a PNG or JPG, and within the size limit - and returned as an image only when
// it passes. Nothing about the file is decided in the browser.
const fetchSignatureImage = async (path: string): Promise<string> => {
  const { data } = await apiClient.post('/borrower/funding-application/signature-image', { path })
  return data.data.image
}

/**
 * An e-signature the borrower draws with a mouse, finger or pen - or picks as
 * an image from the file manager, the way the agreement builder's signature
 * block takes one.
 *
 * Either way the result is the same thing: what is on the pad, exported as a
 * PNG on a white background so it prints cleanly on the signature certificate.
 */
/** A local calendar date as YYYY-MM-DD (not UTC - "today" must mean the signer's today). */
export const toYmd = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const parseYmd = (value?: string): Date | undefined => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined
}

export default function SignaturePad({ value, onChange, invalid, block, showDate = true, date, onDateChange, drawable = true, rules }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [hasInk, setHasInk] = useState(Boolean(value))
  const [showFileManager, setShowFileManager] = useState(false)
  const [isLoadingFile, setIsLoadingFile] = useState(false)
  // Why the last picked file was refused, in the server's words.
  const [fileError, setFileError] = useState<string | null>(null)

  const paintBlank = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  // Start blank, or with the signature already held (the step was left and
  // come back to).
  useEffect(() => {
    paintBlank()

    if (!value) return

    const image = new Image()
    image.onload = () => canvasRef.current?.getContext('2d')?.drawImage(image, 0, 0, PAD_WIDTH, PAD_HEIGHT)
    image.src = value
    // Only on mount: after that the pad itself is the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The signature was reset from outside (a new one is owed) - wipe the pad too.
  useEffect(() => {
    if (!value && hasInk) {
      paintBlank()
      setHasInk(false)
    }
  }, [value, hasInk, paintBlank])

  const pointOf = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drawingRef.current = true

    const { x, y } = pointOf(event)
    // Signed in the Signature block's text colour, so a colour change in the
    // agreement builder shows in the signature itself, not just around it.
    ctx.strokeStyle = block?.color || '#0f172a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    // A dot, so a tap leaves a mark even without a move.
    ctx.lineTo(x + 0.1, y + 0.1)
    ctx.stroke()
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return

    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const { x, y } = pointOf(event)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const finishStroke = () => {
    if (!drawingRef.current) return

    drawingRef.current = false
    setHasInk(true)
    onChange(canvasRef.current!.toDataURL('image/png'))
  }

  const handleClear = () => {
    paintBlank()
    setHasInk(false)
    setFileError(null)
    onChange('')
  }

  // The borrower picked (or just uploaded) a file in the file manager - the same
  // way the agreement builder's signature block takes its image. Its bytes are
  // fetched through the API and drawn onto the pad, so what is stored is the
  // signature as signed, not a link to a file that could later be replaced.
  const handleFileSelected = async (selected: FileSystemItem[]) => {
    const file = selected.find(item => !item.isDirectory)
    if (!file) return

    setFileError(null)
    setIsLoadingFile(true)

    try {
      const source = await fetchSignatureImage(file.path)

      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new UndisplayableImage())
        img.src = source
      })

      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return

      // Fit the whole image inside the pad, centred, keeping its proportions.
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height)
      const width = image.width * scale
      const height = image.height * scale

      paintBlank()
      ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
      setHasInk(true)
      onChange(canvas.toDataURL('image/png'))
    } catch (error: any) {
      // The server's own reason - wrong type, too large, not found - shown on
      // the signature box. The signature already in the box, if any, is kept.
      setFileError(
        error instanceof UndisplayableImage
          ? `"${file.name}" is an image, but this browser cannot display its format. Please choose a JPG or PNG version.`
          : error?.response?.data?.errors?.signature_image
          || error?.response?.data?.message
          || 'That image could not be read. Please choose another file.'
      )
    } finally {
      setIsLoadingFile(false)
    }
  }

  const openFileManager = () => {
    if (!isLoadingFile) setShowFileManager(true)
  }

  // One panel, laid out as the agreement builder lays out its Signature block:
  // the signature on the left, the signature date on the right, and the tools
  // in a footer underneath so nothing floats loose around the pad.
  return (
    <div style={signatureWrapperStyle(block)}>
      <div className="overflow-hidden" style={{ ...SIGNATURE_PANEL_STYLE, ...(invalid || fileError ? { borderColor: '#f06548' } : {}) }}>
      <div className="row g-0">
        <div className={showDate ? 'col-sm-7' : 'col-12'}>
          <div className="position-relative h-100 d-flex align-items-center bg-white">
            <canvas
              ref={canvasRef}
              width={PAD_WIDTH}
              height={PAD_HEIGHT}
              className="d-block w-100"
              style={{ touchAction: drawable ? 'none' : undefined, cursor: drawable ? 'crosshair' : 'pointer', outline: 'none', aspectRatio: `${PAD_WIDTH} / ${PAD_HEIGHT}` }}
              aria-label={drawable
                ? `${signatureLabel(block)}. Draw your signature here.`
                : `${signatureLabel(block)}. Choose your signature from the file manager.`}
              // Drawable: the pad is drawn on. Otherwise it behaves like the
              // agreement builder's signature box - a click opens the file manager.
              {...(drawable
                ? {
                    onPointerDown: handlePointerDown,
                    onPointerMove: handlePointerMove,
                    onPointerUp: finishStroke,
                    onPointerCancel: finishStroke,
                    onPointerLeave: finishStroke,
                  }
                : {
                    role: 'button',
                    tabIndex: 0,
                    onClick: openFileManager,
                    onKeyDown: (event: React.KeyboardEvent) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openFileManager()
                      }
                    },
                  })}
            />
            {/* Waiting on the server to check and return the picked file: a
                skeleton over the signature area, the same shimmer the rest of
                the portal loads with, rather than a box that looks idle. */}
            {isLoadingFile && (
              <div
                className="position-absolute top-0 start-0 w-100 h-100 bg-white d-flex flex-column align-items-center justify-content-center gap-2 placeholder-glow px-4"
                role="status"
                aria-live="polite"
              >
                <span className="placeholder rounded w-75" style={{ height: 14 }}></span>
                <span className="placeholder rounded w-50" style={{ height: 14 }}></span>
                <span className="placeholder rounded w-25" style={{ height: 10 }}></span>
                <span className="visually-hidden">Checking your signature image...</span>
              </div>
            )}
            {!hasInk && !isLoadingFile && (
              <div
                className="position-absolute top-50 start-50 translate-middle text-center w-100 px-2"
                style={{ pointerEvents: 'none' }}
              >
                <i className="ri-quill-pen-line d-block" style={{ fontSize: 28, color: '#3b518d', opacity: 0.7, lineHeight: 1.1 }}></i>
                <div style={signatureMetaStyle(block)}>{signatureLabel(block)}</div>
                {!drawable && <div className="small text-muted mt-1">Click to choose your signature</div>}
              </div>
            )}
          </div>
        </div>

        {showDate && (
          <div className="col-sm-5" style={{ borderLeft: SIGNATURE_PANEL_STYLE.border }}>
            <label
              className="h-100 w-100 d-flex flex-column align-items-center justify-content-center px-3 py-3 mb-0"
              style={{ background: '#f8fafc', cursor: 'pointer' }}
            >
              <i className="ri-calendar-event-line mb-1" style={{ fontSize: 20, color: '#3b518d', opacity: 0.7 }}></i>
              <Flatpickr
                value={parseYmd(date)}
                onChange={(selected) => selected[0] && onDateChange?.(toYmd(selected[0]))}
                // The same format the builder's Signature Date uses. A signature
                // cannot be dated in the future.
                options={{ dateFormat: 'd M, Y', maxDate: 'today', disableMobile: true, allowInput: false }}
                className="form-control border-0 rounded-0 bg-transparent shadow-none p-0 pb-1 w-100"
                style={{ ...signatureTextStyle(block), textAlign: 'center', borderBottom: '1px solid #64748b', cursor: 'pointer' }}
                placeholder="Select date"
                aria-label="Signature date"
              />
              <span className="mt-1" style={{ ...signatureMetaStyle(block), color: '#94a3b8', whiteSpace: 'nowrap' }}>Signature Date</span>
            </label>
          </div>
        )}
      </div>

      <div
        className="d-flex align-items-center justify-content-between flex-nowrap gap-3 px-3 py-2"
        style={{ borderTop: SIGNATURE_PANEL_STYLE.border, background: '#f8fafc' }}
      >
        <small className="text-muted d-flex align-items-start gap-1" style={{ minWidth: 0, lineHeight: 1.35 }}>
          <i className="ri-information-line"></i>
          <span>
            {drawable
              ? 'Draw, or choose an image from your files.'
              : describeRules(rules)}
          </span>
        </small>
        <div className="d-flex gap-2 ms-auto flex-shrink-0">
          <button
            type="button"
            className={`btn btn-sm ${drawable || hasInk ? 'btn-light border' : 'btn-primary'}`}
            onClick={openFileManager}
            disabled={isLoadingFile}
          >
            {isLoadingFile ? (
              <><span className="spinner-border spinner-border-sm align-middle me-1" aria-hidden="true"></span> Loading...</>
            ) : (
              <><i className="ri-folder-open-line align-bottom me-1"></i> File Manager</>
            )}
          </button>
          <button type="button" className="btn btn-sm btn-light border text-danger" onClick={handleClear} disabled={!hasInk || isLoadingFile}>
            <i className="ri-eraser-line align-bottom me-1"></i> Clear
          </button>
        </div>
      </div>
      </div>

      {fileError && (
        <div className="invalid-feedback d-flex align-items-start gap-1 mt-1" role="alert">
          <i className="ri-error-warning-line lh-sm"></i>
          <span>{fileError}</span>
        </div>
      )}

      <FileManagerModal
        isOpen={showFileManager}
        toggle={() => setShowFileManager(false)}
        selectionMode={true}
        onSelectFiles={handleFileSelected}
        entityType={FILE_MANAGER_ENTITY_TYPE}
        entityId={getUser()?.entity_id}
      />
    </div>
  )
}
