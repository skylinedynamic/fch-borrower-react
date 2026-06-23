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
        <SkLine w={160} h={16} mb={12} />
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
            <SkLine w="100%" h={14} mb={6} />
            <SkLine w="80%" h={14} />
          </SkCardBody>
        </SkCard>
      </div>

      {/* Other strategies list */}
      <SkLine w={150} h={16} mb={12} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map((n) => (
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
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}
            >
              <SkCircle size={48} />
              <div style={{ flex: 1 }}>
                <SkLine w="50%" h={17} mb={8} />
                <SkLine w="75%" h={13} />
              </div>
            </div>
            <SkRect w={110} h={32} radius={20} />
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
              <div className="ca-metric-title-block w-100">
                <SkLine w="40%" h={12} mb={12} />
                <div className="d-flex align-items-center gap-2">
                  <SkLine w="60px" h={28} />
                  <SkLine w="80px" h={20} radius={12} />
                </div>
              </div>
              <SkCircle size={44} />
            </div>

            <div className="ca-slider-wrapper my-3">
              <SkRect w="100%" h={6} radius={3} />
            </div>

            <div className="ca-score-factors mt-3" style={{ borderTop: '1px dashed var(--ca-border)' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="d-flex align-items-center justify-content-between py-2">
                  <SkLine w="35%" h={12} />
                  <SkLine w="15%" h={12} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Estimated Total Access Card Skeleton */}
        <div className="col-md-6">
          <div className="ca-metric-card h-100">
            <div className="ca-metric-header">
              <div className="ca-metric-title-block w-100">
                <SkLine w="45%" h={12} mb={12} />
                <SkLine w="120px" h={32} />
              </div>
              <SkCircle size={44} />
            </div>

            <div className="ca-access-footer mt-4">
              <SkLine w="40%" h={12} />
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Next Step Skeleton */}
      <div className="ca-next-step-card">
        <div className="ca-next-step-content w-100">
          <SkLine w="150px" h={12} mb={8} />
          <SkLine w="70%" h={14} />
        </div>
        <SkRect w={180} h={36} radius={4} />
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
