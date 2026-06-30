import React from 'react'

interface CapitalAccessLoaderProps {
  type?: 'list' | 'detail' | 'roadmap' | 'checklist' | 'overview'
}

/* ─── Reusable skeleton primitives ─────────────────────────── */
const SkLine = ({
  w = '100%',
  h = 16,
  radius = 6,
  mb = 0,
  mx = '',
}: {
  w?: string | number
  h?: number
  radius?: number
  mb?: number
  mx?: string
}) => (
  <div
    className="skeleton-line"
    style={{
      width: typeof w === 'number' ? `${w}px` : w,
      height: `${h}px`,
      borderRadius: `${radius}px`,
      marginBottom: mb ? `${mb}px` : undefined,
      marginLeft: mx === 'auto' ? 'auto' : undefined,
      marginRight: mx === 'auto' ? 'auto' : undefined,
    }}
  />
)

const SkCircle = ({ size = 48 }: { size?: number }) => (
  <div
    className="skeleton-line"
    style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      flexShrink: 0,
    }}
  />
)

const SkRect = ({
  w = '100%',
  h = 48,
  radius = 8,
  mb = 0,
}: {
  w?: string | number
  h?: number
  radius?: number
  mb?: number
}) => (
  <div
    className="skeleton-line"
    style={{
      width: typeof w === 'number' ? `${w}px` : w,
      height: `${h}px`,
      borderRadius: `${radius}px`,
      marginBottom: mb ? `${mb}px` : undefined,
    }}
  />
)

/* ─── Metric block (label + big value) ─────────────────────── */
const SkMetric = () => (
  <div
    style={{
      padding: '16px',
      borderRadius: '8px',
      background: 'rgba(0,0,0,0.03)',
      border: '1px solid rgba(0,0,0,0.07)',
      height: '100%',
    }}
  >
    <SkLine w="55%" h={11} mb={10} />
    <SkLine w="70%" h={32} />
  </div>
)

/* ─── Card shell ────────────────────────────────────────────── */
const SkCard = ({
  children,
  mb = 20,
}: {
  children: React.ReactNode
  mb?: number
}) => (
  <div
    style={{
      background: 'var(--vz-card-bg, #fff)',
      border: '1px solid var(--vz-border-color, #e9ebec)',
      borderRadius: '6px',
      overflow: 'hidden',
      boxShadow: 'var(--vz-card-box-shadow)',
      marginBottom: mb,
    }}
  >
    {children}
  </div>
)

const SkCardHeader = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      padding: '16px 20px',
      borderBottom: '1px solid var(--vz-border-color, #e9ebec)',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}
  >
    {children}
  </div>
)

const SkCardBody = ({
  children,
  pad = 20,
}: {
  children: React.ReactNode
  pad?: number
}) => <div style={{ padding: pad }}>{children}</div>

/* ═══════════════════════════════════════════════════════════
   LIST  (strategy selection page)
   ═══════════════════════════════════════════════════════════ */
function ListLoader() {
  return (
    <>
      {/* Recommended / Hero card */}
      <div className="mb-4">
        <SkCard mb={0}>
          <SkCardHeader>
            <SkCircle size={52} />
            <div style={{ flex: 1 }}>
              <SkLine w="45%" h={20} mb={8} />
              <SkLine w="70%" h={14} />
            </div>
            <SkRect w={100} h={34} radius={20} />
          </SkCardHeader>
          <SkCardBody>
            <div className="row g-3 mb-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="col-sm-4">
                  <SkMetric />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
              <SkRect w={140} h={40} radius={6} />
            </div>
          </SkCardBody>
        </SkCard>
      </div>

      {/* Other strategies list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px',
              border: '1px solid var(--vz-border-color, #e9ebec)',
              borderLeft: '3px solid transparent',
              borderRadius: '6px',
              background: 'var(--vz-card-bg, #fff)',
              boxShadow: 'var(--vz-card-box-shadow)',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
              <SkCircle size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <SkLine w="50%" h={14} mb={6} />
                <SkLine w="70%" h={12} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <SkRect w={90} h={36} radius={6} />
              <SkRect w={90} h={36} radius={6} />
              <SkCircle size={20} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ─── DETAIL  (strategy detail / about page) ─────────────────── */
function DetailLoader() {
  return (
    <>
      {/* Metrics Row */}
      <div className="row g-4 mb-4">
        {/* Funding Readiness Score Card Skeleton */}
        <div className="col-md-6">
          <div className="ca-metric-card h-100">
            <div className="ca-metric-header">
              <div className="ca-metric-title-block">
                <h6 className="ca-metric-card-label">
                  <SkLine w={160} h={14} />
                </h6>
                <div className="ca-score-display">
                  <span className="ca-score-value">
                    <SkLine w={50} h={34} />
                  </span>
                  <span className="ca-score-status" style={{ background: 'none', padding: 0 }}>
                    <SkLine w={65} h={22} radius={12} />
                  </span>
                </div>
              </div>
              <div className="ca-metric-icon-wrapper">
                <SkCircle size={44} />
              </div>
            </div>

            <div className="ca-slider-wrapper">
              <div className="ca-custom-progress-container">
                <div className="progress ca-custom-progress">
                  <div
                    className="progress-bar skeleton-line"
                    style={{
                      width: '60%',
                      background: 'none',
                      height: '100%',
                      borderRadius: '3px'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="ca-score-factors">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="ca-factor-row d-flex align-items-center justify-content-between py-1">
                  <span className="ca-factor-label fw-medium text-muted small">
                    <SkLine w={120} h={12} />
                  </span>
                  <span className="ca-factor-value fw-semibold small">
                    <SkLine w={40} h={12} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estimated Total Access Card Skeleton */}
        <div className="col-md-6">
          <div className="ca-metric-card h-100">
            <div className="ca-metric-header">
              <div className="ca-metric-title-block">
                <h6 className="ca-metric-card-label">
                  <SkLine w={140} h={14} />
                </h6>
                <div className="ca-access-value">
                  <SkLine w={160} h={34} />
                </div>
              </div>
              <div className="ca-metric-icon-wrapper">
                <SkCircle size={44} />
              </div>
            </div>

            <div className="ca-exposure-vertical-chart">
              {[1, 2, 3, 4, 5].map((_, index) => (
                <div
                  key={index}
                  className="skeleton-line"
                  style={{
                    height: `${25 + (index % 3) * 20}%`,
                    width: '24px',
                    borderRadius: '4px 4px 0 0',
                    border: 'none',
                    margin: 0
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
              <SkCircle size={6} />
              <SkLine w={120} h={12} />
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Next Step Skeleton */}
      <div className="ca-next-step-card">
        <div className="ca-next-step-content">
          <h6 className="ca-next-step-label">
            <SkLine w={180} h={14} mb={8} />
          </h6>
          <p className="ca-next-step-desc" style={{ margin: 0 }}>
            <SkLine w="100%" h={12} mb={4} />
            <SkLine w="65%" h={12} />
          </p>
        </div>
        <div className="skeleton-line" style={{ width: '180px', height: '41px', borderRadius: 'var(--ca-radius, 4px)', flexShrink: 0 }} />
      </div>
    </>
  )
}

/* ─── CHECKLIST  (checklist / apply page) ─────────────────────── */
function ChecklistLoader() {
  return (
    <SkCard>
      <SkCardHeader>
        <SkCircle size={52} />
        <div style={{ flex: 1 }}>
          <SkLine w="45%" h={20} mb={8} />
          <SkLine w="70%" h={14} />
        </div>
      </SkCardHeader>
      <SkCardBody>
        {/* Progress bar area */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <SkLine w={100} h={13} />
          <SkLine w={60} h={13} />
        </div>
        <SkRect w="100%" h={7} radius={4} mb={24} />

        {/* Checklist items */}
        <SkLine w={180} h={18} mb={14} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              border: '1px solid var(--vz-border-color, #e9ebec)',
              borderLeft: '3px solid transparent',
              borderRadius: '6px',
              marginBottom: 8,
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <SkCircle size={28} />
              <SkLine w="60%" h={15} />
            </div>
            <SkRect w={90} h={30} radius={16} />
          </div>
        ))}

        {/* Action button */}
        <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <SkRect w={110} h={40} radius={6} />
          <SkRect w={140} h={40} radius={6} />
        </div>
      </SkCardBody>
    </SkCard>
  )
}

/* ─── ROADMAP  (play roadmap / stepper page) ─────────────────── */
function RoadmapLoader() {
  return (
    <>
      {/* Summary bar */}
      <SkCard mb={20}>
        <SkCardBody pad={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ flex: 1 }}>
                <SkMetric />
              </div>
            ))}
          </div>
        </SkCardBody>
      </SkCard>

      {/* Roadmap steps */}
      <SkCard>
        <SkCardHeader>
          <div style={{ flex: 1 }}>
            <SkLine w="40%" h={20} mb={8} />
            <SkLine w="55%" h={14} />
          </div>
          <SkRect w={120} h={32} radius={20} />
        </SkCardHeader>
        <SkCardBody>
          {/* Stepper */}
          <div style={{ paddingLeft: 54, position: 'relative' }}>
            {/* Vertical line */}
            <div
              style={{
                position: 'absolute',
                left: 27,
                top: 24,
                bottom: 24,
                width: 2,
                background: 'var(--vz-border-color, #ced4da)',
                borderRadius: 2,
              }}
            />
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  marginBottom: 16,
                  zIndex: 1,
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: -45,
                    top: 6,
                  }}
                >
                  <SkCircle size={36} />
                </div>
                {/* Step card */}
                <div
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    border: '1px solid var(--vz-border-color, #e9ebec)',
                    borderLeft: '3px solid transparent',
                    borderRadius: 6,
                    background: 'var(--vz-card-bg, #fff)',
                    boxShadow: 'var(--vz-card-box-shadow)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <SkLine w="45%" h={18} />
                    <SkRect w={90} h={26} radius={14} />
                  </div>
                  <SkLine w="70%" h={13} mb={6} />
                  <SkLine w="50%" h={13} />
                </div>
              </div>
            ))}
          </div>
        </SkCardBody>
      </SkCard>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   OVERVIEW  (play overview page)
   ═══════════════════════════════════════════════════════════ */
function OverviewLoader() {
  return (
    <div className="ca-hero-card-premium">
      <div className="ca-hero-header-premium">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
          <SkCircle size={44} />
          <div style={{ flex: 1 }}>
            <SkLine w="40%" h={18} mb={8} />
            <SkLine w="60%" h={13} />
          </div>
        </div>
      </div>

      <div className="ca-card-body" style={{ padding: '28px' }}>
        <div className="row g-3 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="col-md-4">
              <div className="ca-metric-card-premium">
                <SkLine w="55%" h={12} mb={12} />
                <SkLine w="70%" h={24} />
              </div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <SkLine w="100px" h={12} mb={16} />
          <div className="row g-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="col-12 mt-0">
                <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--vz-secondary-bg)', display: 'flex', gap: 10 }}>
                  <SkCircle size={16} />
                  <SkLine w="85%" h={12} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="ca-divider my-4" />

        <div className="d-flex align-items-center justify-content-between gap-3 w-100">
          <SkRect w="50%" h={40} radius={6} />
          <SkRect w="50%" h={40} radius={6} />
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   EXPORT
   ═══════════════════════════════════════════════════════════ */
export default function CapitalAccessLoader({ type = 'list' }: CapitalAccessLoaderProps) {
  if (type === 'detail') return <DetailLoader />
  if (type === 'checklist') return <ChecklistLoader />
  if (type === 'roadmap') return <RoadmapLoader />
  if (type === 'overview') return <OverviewLoader />
  return <ListLoader />
}
