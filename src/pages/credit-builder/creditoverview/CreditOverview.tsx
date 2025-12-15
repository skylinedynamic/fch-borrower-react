import React, { useEffect, useState, useRef } from 'react'
import overviewImg from '../../../../assets/images/blog/overview.jpg'

export default function CreditOverview() {
  const playlist = [
    { type: 'youtube', id: 'dQw4w9WgXcQ', title: 'Business Credit Building Fundamentals', duration: '10:12' },
    { type: 'file', src: overviewImg, title: 'Vendor Accounts for Fast Credit', duration: '08:03' },
    { type: 'youtube', id: 'n9K9wZsYQzk', title: 'Understanding Business Credit Scores', duration: '12:45' }
  ]
  const [current, setCurrent] = useState(0)
  const [auto, setAuto] = useState(false)
  const vidRef = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    const bootstrapLib = (window as unknown as { bootstrap?: any }).bootstrap
    const els = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    if (bootstrapLib && els.length) {
      els.forEach((el) => {
        try { new bootstrapLib.Tooltip(el) } catch {}
      })
    }

  }, [])
  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex align-items-center mb-2">
              <div>
                <h4 className="fs-20 mb-1">Credit Building Overview</h4>
                <p className="text-muted mb-0">Tracks your business credit journey from startup to mature credit profile</p>
              </div>

            </div>
          </div>
          <div className="col-xl-9">
            <div className="card mb-3">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0 fs-15">Your Credit Building Progress</h6>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-dark text-white">Tier 0</span>
                  <span className="badge bg-success-subtle text-success">100% Complete</span>
                </div>
              </div>
              <div className="card-body">
                <style>{`
                  @keyframes stripeMove{from{background-position:0 0,0 0}to{background-position:0 0,24px 0}}
                  .progress-animated{
                    background-image: linear-gradient(90deg, #D4AF37 0%, #001F3F 100%),
                                      repeating-linear-gradient(45deg, rgba(255,255,255,.24) 0, rgba(255,255,255,.24) 12px, rgba(255,255,255,0) 12px, rgba(255,255,255,0) 24px);
                    animation: stripeMove 1.8s linear infinite;
                    background-size: auto, 24px 24px;
                  }
                  .progress-goldnavy{background:#eef2f7;border:1px solid #e5e7eb;overflow:hidden;border-radius:999px;box-shadow:inset 0 1px 2px rgba(0,0,0,.06)}
                  .progress-goldnavy .progress-bar{border-radius:999px}
                  .tooltip-info .tooltip-inner{background:#0b5ed7;color:#ffffff;border:none}
                  .tooltip-info.bs-tooltip-top .tooltip-arrow::before{border-top-color:#0b5ed7}
                  .tooltip-info.bs-tooltip-bottom .tooltip-arrow::before{border-bottom-color:#0b5ed7}
                  .tooltip-info.bs-tooltip-start .tooltip-arrow::before{border-left-color:#0b5ed7}
                  .tooltip-info.bs-tooltip-end .tooltip-arrow::before{border-right-color:#0b5ed7}
                `}</style>
                <div className="progress progress-goldnavy" style={{height:12}}>
                  <div className="progress-bar progress-animated" style={{width:'28%'}}></div>
                </div>
                <div className="row text-center text-muted mt-2">
                  <div className="col"><div className="fw-semibold">Tier 0</div></div>
                  <div className="col"><div className="fw-semibold">Tier 1</div></div>
                  <div className="col"><div className="fw-semibold">Tier 2</div></div>
                  <div className="col"><div className="fw-semibold">Tier 3</div></div>
                  <div className="col"><div className="fw-semibold">Tier 4</div></div>
                </div>
                <div className="mt-3">
                  <h6 className="mb-1 fs-14">Tier 0 - Business Foundation & Compliance <span className="ms-1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" data-bs-custom-class="tooltip-info" title="<strong>Why it matters:</strong> 80% of business credit applications are denied for missing or mismatched foundational data. This tier fixes that."><i className="ri-information-fill align-middle text-info" style={{ backgroundColor: 'rgba(46,116,249,.12)', borderRadius: '50%', padding: 4 }}></i></span></h6>
                  <p className="text-muted mb-0">Lay the groundwork for fundability. This phase ensures your business is properly formed, verified, and listed — including EIN registration, business phone, 411 listing, professional email, and virtual address setup. Lenders can’t approve what they can’t verify.</p>
                </div>
                <div className="d-flex justify-content-start gap-5 text-muted mt-2">
                  <small>Estimated completion: 2–3 months</small>
                  <small>Tasks remaining: 5</small>
                </div>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-body">
                <style>{`
                  .panel{position:relative;border:1px solid #e5e7eb;border-radius:12px;background:#fff;box-shadow:0 6px 16px rgba(16,24,40,.06)}
                  .panel::before{content:'';position:absolute;left:0;right:0;top:0;height:4px;border-top-left-radius:12px;border-top-right-radius:12px}
                  .panel--pending::before{background:#ff7f32}
                  .panel--completed::before{background:#16a34a}
                  .panel--score::before{background:#6f42c1}
                  .panel-header{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid #e5e7eb}
                  .panel-title{display:flex;align-items:center;gap:10px;font-weight:600}
                  .icon-badge{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center}
                  .icon-badge--pending{background:#fff2e9;color:#ff7f32}
                  .icon-badge--completed{background:#eaf9f0;color:#16a34a}
                  .icon-badge--score{background:#eee8ff;color:#6f42c1}
                  .panel-body{padding:16px}
                  .task{border:1px solid #e5e7eb;border-radius:10px;padding:12px 14px;margin-bottom:12px;background:#fff}
                  .task .title{font-weight:600}
                  .task-check{display:flex;align-items:start;gap:10px}
                  .task-check .tick{width:22px;height:22px;border-radius:10%;display:inline-flex;align-items:center;justify-content:center}
                  .tick-complete{background:#e8fbf0;color:#16a34a}
                  .tick-pending{background:#fff8e6;color:#a37500}
                  .pill{display:inline-block;border-radius:999px;padding:2px 10px;font-size:12px;margin-right:8px}
                  .pill-foundation{background:#eef6ff;color:#0b5ed7}
                  .pill-high{background:#ffe5e0;color:#cc4b37}
                  .pill-medium{background:#fff3cd;color:#a37500}
                  .status-complete{color:#16a34a;font-weight:600}
                  .status-pending{color:#a37500;font-weight:600}
                  .btn-primary{border-radius:10px}
                  
                `}</style>
                <div className="row g-3">
                  <div className="col-lg-4">
                    <div className="panel panel--pending h-100">
                      <div className="panel-header"><div className="panel-title"><span className="icon-badge icon-badge--pending"><i className="ri-time-line"></i></span><span>Pending Tasks</span></div><span className="text-muted">0 remaining</span></div>
                      <div className="panel-body">
                        <div className="task"><div className="title d-flex justify-content-between"><span>Apply to Tier 1 Vendors</span><span className="pill pill-high">High Priority</span></div></div>
                        <div className="task"><div className="title d-flex justify-content-between"><span>Set up 411 Listing</span><span className="pill pill-medium">Medium Priority</span></div></div>
                        <div className="task"><div className="title d-flex justify-content-between"><span>Virtual Office Setup</span><span className="pill pill-medium">Medium Priority</span></div></div>
                        <div className="mt-3"><button type="button" className="btn btn-primary w-100">Start Next Task</button></div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="panel panel--completed h-100">
                      <div className="panel-header"><div className="panel-title"><span className="icon-badge icon-badge--completed"><i className="ri-checkbox-circle-line"></i></span><span>Completed Tasks</span></div><span className="text-muted">6 / 6 total</span></div>
                      <div className="panel-body">
                        <div className="completed-scroll">
                        <div className="task">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="task-check"><span className="tick tick-complete"><i className="ri-check-line"></i></span><div><div className="title">Business Registration</div><div className="text-muted">Complete this task to advance your business credit profile</div></div></div>
                            <div className="status-complete">Complete</div>
                          </div>
                          <div className="mt-2"><span className="pill pill-foundation">Foundation</span><span className="pill pill-high">High</span></div>
                        </div>
                        <div className="task">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="task-check"><span className="tick tick-complete"><i className="ri-check-line"></i></span><div><div className="title">EIN Application</div><div className="text-muted">Complete this task to advance your business credit profile</div></div></div>
                            <div className="status-complete">Complete</div>
                          </div>
                          <div className="mt-2"><span className="pill pill-foundation">Foundation</span><span className="pill pill-medium">Medium</span></div>
                        </div>
                         <div className="task">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="task-check"><span className="tick tick-complete"><i className="ri-check-line"></i></span><div><div className="title">EIN Application</div><div className="text-muted">Complete this task to advance your business credit profile</div></div></div>
                            <div className="status-complete">Complete</div>
                          </div>
                          <div className="mt-2"><span className="pill pill-foundation">Foundation</span><span className="pill pill-medium">Medium</span></div>
                        </div>
                      
                      
                        </div>
                        <div className="mt-3">
                          <div className="progress progress-goldnavy" style={{height:10}}><div className="progress-bar progress-animated" style={{width:'60%'}}></div></div>
                          <div className="text-muted mt-1">60% of Tier 1 tasks complete</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="panel panel--score h-100">
                      <div className="panel-header"><div className="panel-title"><span className="icon-badge icon-badge--score"><i className="ri-line-chart-line"></i></span><span>Credit Score Status</span></div><span className="text-muted">75 D&B Score</span></div>
                      <div className="panel-body">
                        <div className="task"><div className="d-flex justify-content-between"><span>Experian:</span><span className="text-muted">Building…</span></div></div>
                        <div className="task"><div className="d-flex justify-content-between"><span>Equifax:</span><span className="text-muted">Building…</span></div></div>
                        <div className="task"><div className="d-flex justify-content-between"><span>NAV:</span><span className="text-muted">Pending</span></div></div>
                        <div className="alert alert-success mt-3 mb-0"><i className="ri-arrow-up-line align-middle me-1"></i>Building credit profile</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h6 className="mb-0 fs-15">Credit Building Introduction</h6><small className="text-muted">Essential knowledge for your business credit journey</small></div>
              <div className="card-body">
                <style>{`
                  .video-layout{display:grid;grid-template-columns:1fr 380px;gap:16px}
                  @media (max-width: 1200px){.video-layout{grid-template-columns:1fr}}
                  .video-player{position:relative;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#000}
                  .video-header{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-bottom:1px solid #e5e7eb;background:#fff}
                  .video-title{font-weight:600}
                  .playlist{border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;background:#fff}
                  .playlist-header{padding:10px 12px;border-bottom:1px solid #e5e7eb;font-weight:600}
                  .playlist-items{display:flex;flex-direction:column}
                  .playlist-item{padding:10px 12px;display:flex;gap:10px;align-items:center;border-bottom:1px solid #f0f2f5;cursor:pointer}
                  .playlist-item:last-child{border-bottom:none}
                  .pi-thumb{width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#eef6ff;color:#0b5ed7}
                  .pi-body{flex:1}
                  .pi-title{font-weight:600}
                  .pi-meta{font-size:12px;color:var(--bs-secondary-color)}
                  .pi-badge{font-size:12px;border-radius:999px;padding:2px 8px;background:#f3f4f6;color:#111827}
                  .playlist-item.active{background:#f8fafc}
                  .video-controls{display:flex;justify-content:flex-end;gap:8px;padding:8px;background:#fff;border-top:1px solid #e5e7eb}
                  .btn-play{border-radius:8px}
                  .video-surface{position:relative;height:370px}
                  .video-surface iframe,.video-surface video{position:absolute;inset:0;width:100%;height:100%}
                `}</style>
                <div className="video-layout">
                  <div className="video-player">
                    <div className="video-header"><div className="video-title">{playlist[current].title}</div><span className="pi-badge">{playlist.length} videos</span></div>
                    <div className="video-surface">
                      {playlist[current].type === 'youtube' ? (
                        <iframe src={`https://www.youtube.com/embed/${(playlist[current] as any).id}?rel=0&modestbranding=1${auto ? '&autoplay=1' : ''}`} title={playlist[current].title} frameBorder={0} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                      ) : (
                        <video ref={vidRef} controls src={(playlist[current] as any).src}></video>
                      )}
                    </div>
                    <div className="video-controls"><button type="button" className="btn btn-primary btn-sm btn-play" onClick={() => { if (playlist[current].type === 'file') { vidRef.current?.play() } else { setAuto(true) } }}><i className="ri-play-line align-middle me-1"></i>Play</button></div>
                  </div>
                  <div className="playlist">
                    <div className="playlist-header">Playlist</div>
                    <div className="playlist-items">
                      {playlist.map((p, i) => (
                        <div key={i} className={`playlist-item ${i===current?'active':''}`} onClick={() => { setCurrent(i); setAuto(false) }}>
                          <div className="pi-thumb"><i className={p.type==='youtube'? 'ri-youtube-line':'ri-film-line'}></i></div>
                          <div className="pi-body">
                            <div className="pi-title">{p.title}</div>
                            <div className="pi-meta">{p.type==='youtube'? 'YouTube':'Uploaded'} • {p.duration}</div>
                          </div>
                          <span className="pi-badge">{p.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3">
            <div className="card mb-3">
              <div className="card-header"><h6 className="mb-0">Recent Activity</h6></div>
              <div className="card-body">
                <style>{`
                  .timeline{position:relative;padding-left:48px}
                  .timeline::before{content:'';position:absolute;left:18px;top:6px;bottom:6px;border-left:2px dotted #e5e5e5}
                  .timeline .item{position:relative;min-height:40px;padding:2px 0 16px;margin-bottom:6px}
                  .timeline .dot{position:absolute;left:-47px;top:2px;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.06)}
                  .timeline .dot::after{content:'';position:absolute;width:18px;height:18px;border-radius:50%;background:#ffffff00;opacity:.95;z-index:0}
                  .timeline .icon{position:relative;font-size:16px;z-index:1}
                  .timeline .title{font-weight:600;margin-bottom:2px}
                  .timeline .desc{color:var(--bs-secondary-color)}
                  .timeline .meta{color:var(--bs-secondary-color);font-size:12px}
                `}</style>
                <div className="timeline">
                  <div className="item">
                    <span className="dot" style={{background:'#c9f3ec'}}>
                      <span className="inner"></span>
                      <i className="ri-user-3-line icon text-info"></i>
                    </span>
                    <div className="title">Business Bank Account Opened</div>
                    <div className="desc">Successfully opened account with Chase Business</div>
                    <div className="meta text-muted">1 day ago</div>
                  </div>
                  <div className="item">
                    <span className="dot" style={{background:'#ffe5e0'}}>
                      <span className="inner"></span>
                      <i className="ri-heart-2-line icon text-danger"></i>
                    </span>
                    <div className="title">Vendor Application Approved</div>
                    <div className="desc">Approved for $500 credit line with Uline</div>
                    <div className="meta text-muted">3 days ago</div>
                  </div>
                  <div className="item">
                    <span className="dot" style={{background:'#f3e6ff'}}>
                      <span className="inner"></span>
                      <i className="ri-time-line icon text-primary"></i>
                    </span>
                    <div className="title">Credit Report Monitoring</div>
                    <div className="desc">Waiting for first credit report update</div>
                    <div className="meta text-muted">1 week ago</div>
                  </div>
                  <div className="item">
                    <span className="dot" style={{background:'#f3e6ff'}}>
                      <span className="inner"></span>
                      <i className="ri-time-line icon text-primary"></i>
                    </span>
                    <div className="title">Credit Report Monitoring</div>
                    <div className="desc">Waiting for first credit report update</div>
                    <div className="meta text-muted">1 week ago</div>
                  </div>
                  
                </div>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h6 className="mb-0">Recommended Actions</h6></div>
              <div className="card-body">
                <style>{`
                  .actions-list{display:flex;flex-direction:column;gap:10px}
                  .action-item{border:1px solid #e5e7eb;border-radius:12px;padding:12px;background:#fff}
                  .action-top{display:flex;align-items:center;gap:12px}
                  .action-icon{width:36px;height:36px;border-radius:8px;background:#eef6ff;display:flex;align-items:center;justify-content:center;color:#0b5ed7;flex-shrink:0}
                  .action-title{font-weight:600}
                  .action-bottom{display:flex;justify-content:space-between;align-items:center;margin-top:6px}
                  .action-sub{color:var(--bs-secondary-color)}
                  .action-meta{color:var(--bs-secondary-color);font-size:12px;margin-top:2px}
                  .action-cta{display:flex;align-items:center;gap:8px;justify-content:space-between;padding-top:10px}
                  .priority{display:inline-block;border-radius:999px;padding:2px 10px;font-size:12px}
                  .priority-high{background:#ffe5e0;color:#cc4b37}
                  .priority-medium{background:#fff3cd;color:#a37500}
                  .btn-start{padding:6px 12px;border-radius:8px}
                `}</style>
                <div className="actions-list">
                  <div className="action-item">
                    <div className="action-top">
                      <div className="action-icon"><i className="ri-hand-heart-line"></i></div>
                      <div className="action-title">Apply to Tier 2 Vendors</div>
                    </div>
                    <div className="action-bottom">
                      <div>
                        <div className="action-sub">Ready to apply to 3 new credit-buil vendors</div>
                      </div>
                     
                    </div>
                     <div className="action-cta">
                        <span className="priority priority-high">High Priority</span>
                        <button type="button" className="btn btn-sm btn-primary btn-start">Start Now</button>
                      </div>
                  </div>
                  <div className="action-item">
                    <div className="action-top">
                      <div className="action-icon" style={{background:'#eaf2ff',color:'#0b5ed7'}}><i className="ri-phone-line"></i></div>
                      <div className="action-title">Set Up Business Phone</div>
                    </div>
                    <div className="action-bottom">
                      <div>
                        <div className="action-sub">Establish a dedicated business phone line</div>
                      </div>
                     
                    </div>
                     <div className="action-cta">
                        <span className="priority priority-medium">Medium Priority</span>
                        <button type="button" className="btn btn-sm btn-primary btn-start">Start Now</button>
                      </div>
                  </div>
                  <div className="action-item">
                    <div className="action-top">
                      <div className="action-icon" style={{background:'#f3e6ff',color:'#6f42c1'}}><i className="ri-book-2-line"></i></div>
                      <div className="action-title">Update 411 Directory</div>
                    </div>
                    <div className="action-bottom">
                      <div>
                        <div className="action-sub">Ensure your business listing is current</div>
                      </div>
                      
                    </div>
                    <div className="action-cta">
                        <span className="priority priority-medium">Medium Priority</span>
                        <button type="button" className="btn btn-sm btn-primary btn-start">Start Now</button>
                      </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>


      </div>
    </div>
  )
}
