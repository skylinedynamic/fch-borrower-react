import React, { useMemo, useState, useRef } from 'react'

export default function CreditResources() {
  type TierCard = {
    id: number
    title: string
    tier: number
    percent: number
    items: string[]
    status: 'Completed' | 'Active' | 'Pending' | 'Locked'
    badge?: string
  }

  type Task = {
    id: number
    title: string
    desc: string
    tier: number
    priority: 'High' | 'Medium' | 'Low'
    status: 'Pending' | 'Completed'
  }

  type Video = {
    id: string
    title: string
    duration: string
    views: string
  }

  type QuickItem = {
    icon: string
    label: string
    url: string
  }

  const tierCards: TierCard[] = useMemo(() => ([
    { id: 1, title: 'Business Setup & Registration', tier: 0, percent: 100, items: ['Business Bank Account','Business Registration','Business Phone Line','EIN Application'], status: 'Completed', badge: 'Foundation' },
    { id: 2, title: 'Initial Credit Building', tier: 1, percent: 100, items: ['Business Address Verification','Tier1 Vendor Applications','Credit Monitoring Setup','Website Development'], status: 'Active', badge: 'Tier 1' },
    { id: 3, title: 'Credit Profile Enhancement', tier: 2, percent: 75, items: ['Financial Statement Preparation','Additional Vendor Applications','Business Using Optimization','Trade Reference Building'], status: 'Pending', badge: 'Tier 2' },
    { id: 4, title: 'Credit Profile Enhancement', tier: 3, percent: 25, items: ['High-Limit Credit Applications','Business Credit Cards','Equipment Financing'], status: 'Locked', badge: 'Tier 3' },
    { id: 5, title: 'Maximum Credit Potential', tier: 4, percent: 0, items: ['Investment Opportunities','Large Credit Lines','Business Loans'], status: 'Locked', badge: 'Tier 4' },
  ]), [])

  const tasks = useMemo(() => ([
    { id: 1, title: 'Register EIN with IRS', desc: 'Obtain Employer Identification Number for business', tier: 0, priority: 'High', status: 'Completed' },
    { id: 2, title: 'Open Business Bank Account', desc: 'Establish business banking relationship', tier: 0, priority: 'Low', status: 'Completed' },
    { id: 3, title: 'Set up Credit Monitoring', desc: 'Monitor credit reports from NAV, D&B, and Experian', tier: 1, priority: 'High', status: 'Pending' },
    { id: 4, title: 'Apply to Additional Tier 1 Vendors', desc: 'Submit applications to 3 more Tier 1 vendors', tier: 1, priority: 'High', status: 'Pending' },
  ]), []) as Task[]

  const [taskFilter, setTaskFilter] = useState<'All' | 'Pending' | 'Completed'>('All')
  const filteredTasks = tasks.filter(t => taskFilter === 'All' ? true : t.status === taskFilter)
  const [activeTab, setActiveTab] = useState<'all' | 'ein' | 'sos' | 'services' | 'tools' | 'tutorial'>('all')
  const [highlight, setHighlight] = useState<string | null>(null)
  const resourcesTopRef = useRef<HTMLDivElement | null>(null)
  const einRef = useRef<HTMLDivElement | null>(null)
  const sosRef = useRef<HTMLDivElement | null>(null)
  const servicesRef = useRef<HTMLDivElement | null>(null)
  const toolsRef = useRef<HTMLDivElement | null>(null)
  const tutorialRef = useRef<HTMLDivElement | null>(null)

  const videos: Video[] = useMemo(() => ([
    { id: 'z1Qp8cE0y6o', title: 'Getting Started: EIN & Setup', duration: '12:04', views: '2,140' },
    { id: 'hY7m5jjJ9mM', title: 'Forming LLC vs Corporation', duration: '15:21', views: '1,356' },
    { id: 'lTTajzrSkCw', title: 'Vendor Accounts: Best Practices', duration: '09:08', views: '980' },
    { id: '3fumBcKC6RE', title: 'Credit Monitoring Walkthrough', duration: '10:35', views: '1,120' },
    { id: 'YykjpeuMNEk', title: 'Applying to Tier 1 Vendors', duration: '08:47', views: '845' },
    { id: 'RgKAFK5djSk', title: 'Business Plan Essentials', duration: '11:02', views: '1,050' },
  ]), [])

  const quickItems: QuickItem[] = useMemo(() => ([
    { icon: 'ri-database-2-line', label: 'Manta CSV', url: 'https://www.manta.com/' },
    { icon: 'ri-bar-chart-2-line', label: 'Accern Metrics', url: 'https://accern.com/' },
    { icon: 'ri-global-line', label: 'USPTTO Trademarks', url: 'https://www.uspto.gov/trademarks' },
    { icon: 'ri-file-user-line', label: 'Business CSV', url: 'https://data.gov/' },
    { icon: 'ri-shield-check-line', label: 'EIN Compliance', url: 'https://www.irs.gov/businesses/small-businesses-self-employed/employer-id-numbers' },
    { icon: 'ri-map-pin-line', label: 'Vendor Locator', url: 'https://www.google.com/maps/search/vendors' },
  ]), [])

  const onTabClick = (k: 'all' | 'ein' | 'sos' | 'services' | 'tools' | 'tutorial') => {
    setActiveTab(k)
    const map = { all: resourcesTopRef, ein: einRef, sos: sosRef, services: servicesRef, tools: toolsRef, tutorial: tutorialRef }
    const target = map[k]
    if (target && target.current) {
      target.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setHighlight(k)
      setTimeout(() => setHighlight(null), 1500)
    }
  }

  return (
    <div className="page-content progress-tracker credit-resources">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-12">
            <div className="d-flex align-items-center mb-2">
              <div>
                <h4 className="fs-20 mb-1">Credit Resources</h4>
                <p className="text-muted mb-0">Guides, tools, and milestones to build strong business credit</p>
              </div>
            </div>

            <style>{`
              .resources .stat{background:#0b2a4a;color:#fff;border:none;border-radius:12px}
              .resources .stat .value{font-weight:800;font-size:28px}
              .resources .stat .label{opacity:.9}
              .resources .badge-pill{border-radius:999px;padding:4px 10px;font-size:12px}
              .resources .pill-group{display:flex;gap:8px;flex-wrap:wrap}
              .resources .pill{border:1px solid #e5e7eb;background:#fff;border-radius:999px;padding:6px 12px}
              .resources .pill.active{border-color:#D4AF37; box-shadow:0 0 0 3px rgba(212,175,55,.15)}
              .resources .provider-card{border:1px solid #e5e7eb;border-radius:12px;background:#fff;color:#0f172a;text-align:left}
              .resources .provider-card .title{font-weight:700;color:#0f172a}
              .resources .provider-card .desc{color:#6b7280}
              .resources .provider-card .list{list-style:none;padding-left:0;margin:0}
              .resources .provider-card .list li{display:flex;align-items:center;gap:8px;padding:6px 0}
              .resources .provider-card .list .dot{width:8px;height:8px;border-radius:999px;background:#22c55e}
              .resources .provider-card .item{display:flex;align-items:center;gap:8px;padding:6px 0;margin:0}
              .resources .provider-card .item span{color:#0f172a}
              .resources .provider-card .list .dot.color-primary{background:var(--bs-primary)}
              .resources .provider-card .list li span{color:#0f172a}
              .resources .flash{box-shadow:0 0 0 3px rgba(212,175,55,.25) inset}
              .resources .service-card{border:1px solid #e5e7eb;border-radius:12px;background:#fff;color:#0f172a;box-shadow:0 4px 12px rgba(0,0,0,.04);transition:box-shadow .2s ease, transform .2s ease}
              .resources .service-card:hover{box-shadow:0 8px 20px rgba(0,0,0,.08);transform:translateY(-2px)}
              .resources .service-card .header{display:flex;align-items:center;justify-content:space-between;gap:12px}
              .resources .service-card .header .left{display:flex;align-items:center;gap:10px}
              .resources .service-card .icon{width:36px;height:36px;border-radius:8px;background:#eef2ff;color:#0b2a4a;display:flex;align-items:center;justify-content:center}
              .resources .service-card .subtitle{color:#6b7280}
              .resources .service-card .svc-list{margin-top:8px;display:flex;flex-direction:column;gap:8px}
              .resources .service-card .svc-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
              .resources .service-card .svc-pill{display:flex;align-items:center;gap:10px;background:#f5f7ff;border:1px solid #e5e7eb;border-radius:10px;padding:6px 10px}
              .resources .service-card .svc-desc{color:#6b7280;font-size:12px}
              .resources .service-card .svc-price{background:#ecfdf5;color:#065f46;border:1px solid #d1fae5;border-radius:8px;padding:4px 8px;font-size:12px;white-space:nowrap}
              .resources .service-card.accent-success{border-left:4px solid #22c55e}
              .resources .service-card.accent-info{border-left:4px solid #0ea5e9}
              .resources .service-card.accent-warning{border-left:4px solid #f59e0b}
              @media (max-width:1200px){
                .resources .service-card .icon{width:32px;height:32px}
                .resources .service-card .header{flex-wrap:wrap}
                .resources .service-card .subtitle{font-size:13px}
                .resources .service-card .svc-row{flex-direction:column;align-items:flex-start}
                .resources .service-card .svc-pill{width:100%;padding:6px 10px}
                .resources .service-card .svc-price{margin-top:6px}
              }
              @media (max-width:992px){
                .resources .service-card .svc-row{flex-direction:row;align-items:center}
                .resources .service-card .svc-price{margin-top:0;margin-left:auto}
              }
              .resources .tools-card{border:1px solid #e5e7eb;border-radius:12px;background:#fff}
              .resources .tools-card{box-shadow:0 4px 12px rgba(0,0,0,.04);transition:box-shadow .2s ease, transform .2s ease}
              .resources .tools-card:hover{box-shadow:0 8px 20px rgba(0,0,0,.08);transform:translateY(-2px)}
              .resources .tools-card .icon{width:40px;height:40px;border-radius:8px;background:#fff3cd;color:#a37500;display:flex;align-items:center;justify-content:center}
              .resources .tools-card .meta{color:var(--bs-secondary-color);font-size:12px}
              .resources .quick-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
              .resources .quick-item{background:#0b2a4a;color:#fff;border-radius:12px;padding:10px 12px;display:flex;align-items:center;gap:8px;justify-content:center;cursor:pointer;transition:background .15s ease, transform .15s ease}
              .resources .quick-item:hover{background:#103356;transform:translateY(-2px)}
              @media (max-width:992px){.resources .quick-grid{grid-template-columns:repeat(2,1fr)}}
              .resources .yt-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
              @media (max-width:992px){.resources .yt-grid{grid-template-columns:1fr}}
              .resources .yt-card{border:1px solid #e5e7eb;border-radius:12px;background:#fff;overflow:hidden}
              .resources .yt-card{box-shadow:0 4px 12px rgba(0,0,0,.04);transition:box-shadow .2s ease, transform .2s ease}
              .resources .yt-card:hover{box-shadow:0 8px 20px rgba(0,0,0,.08);transform:translateY(-2px)}
              .resources .yt-thumb{position:relative;height:160px;background:#000;background-size:cover;background-position:center}
              .resources .yt-thumb .play{position:absolute;right:10px;bottom:10px;background:rgba(255,255,255,.9);border-radius:999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:#0b2a4a}
              .resources .yt-thumb .dur{position:absolute;left:10px;bottom:10px;background:rgba(0,0,0,.6);color:#fff;border-radius:6px;padding:2px 6px;font-size:12px}
              .resources .yt-meta{padding:10px 12px}
              .resources .yt-title{font-weight:600}
              .resources .yt-sub{color:var(--bs-secondary-color);font-size:12px}
            `}</style>

            <div className="resources">
              <div ref={resourcesTopRef}></div>
              <div className="row g-3 mb-3">
                <div className="col-md-3"><div className="card stat"><div className="card-body"><div className="value">12</div><div className="label">Resources</div></div></div></div>
                <div className="col-md-3"><div className="card stat"><div className="card-body"><div className="value">10</div><div className="label">Vendor Providers</div></div></div></div>
                <div className="col-md-3"><div className="card stat"><div className="card-body"><div className="value">50</div><div className="label">States Covered</div></div></div></div>
                <div className="col-md-3"><div className="card stat"><div className="card-body"><div className="value">6</div><div className="label">Quick Links</div></div></div></div>
              </div>

              <div className="pill-group mb-3">
                <button type="button" className={`pill ${activeTab==='all'?'active':''}`} onClick={()=>onTabClick('all')}>All Providers</button>
                <button type="button" className={`pill ${activeTab==='ein'?'active':''}`} onClick={()=>onTabClick('ein')}>EIN Registration</button>
                <button type="button" className={`pill ${activeTab==='sos'?'active':''}`} onClick={()=>onTabClick('sos')}>State SOS Filing</button>
                <button type="button" className={`pill ${activeTab==='services'?'active':''}`} onClick={()=>onTabClick('services')}>Business Services</button>
                <button type="button" className={`pill ${activeTab==='tools'?'active':''}`} onClick={()=>onTabClick('tools')}>Tools & Forms</button>
                <button type="button" className={`pill ${activeTab==='tutorial'?'active':''}`} onClick={()=>onTabClick('tutorial')}>Tutorial</button>
              </div>

              <div className="card mb-3">
                <div className="card-header d-flex align-items-center justify-content-between"><h6 className="mb-0 fs-15">Legal & Registration</h6></div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div ref={einRef} className={`provider-card p-3 h-100 ${highlight==='ein'?'flash':''}`}>
                        <div className="d-flex justify-content-between align-items-center pb-2"><div className="title">EIN Registration</div><span className="badge bg-primary-subtle text-primary badge-pill">Free</span></div>
                        <div className="desc">Register your Employer Identification Number (EIN) — required for business banking</div>
                        <div className="mt-2 d-flex flex-row gap-5">
                          <p className="item"><span>Processing: 1–2 days</span></p>
                          <p className="item"><span>Requires business details</span></p>
                        </div>
                        <div className="d-flex justify-content-start mt-2"><button type="button" className="btn btn-sm btn-primary">Apply Now</button></div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div ref={sosRef} className={`provider-card p-3 h-100 ${highlight==='sos'?'flash':''}`}>
                        <div className="d-flex justify-content-between align-items-center pb-2"><div className="title">State SOS Filing</div><span className="badge bg-info-subtle text-info badge-pill">Guided</span></div>
                        <div className="desc">Register your business with your state’s Secretary of State office</div>
                        <div className="row g-2 mt-2">
                          <div className="col-md-8"><select className="form-select"><option>Select State</option><option>California</option><option>New York</option><option>Illinois</option></select></div>
                          <div className="col-md-4"><button type="button" className="btn btn-outline-primary w-100">Find Your State</button></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mb-3">
                <div className="card-header d-flex align-items-center justify-content-between"><h6 className="mb-0 fs-15">Business Services</h6></div>
                <div ref={servicesRef} className="card-body">
                  <div className="row g-3">
                    <div className="col-lg-4">
                      <div className="service-card accent-success p-3 h-100">
                        <div className="header">
                          <div className="left"><div className="icon"><i className="ri-map-pin-line"></i></div><div className="title">Virtual Office Providers</div></div>
                          <span className="badge bg-success-subtle text-success badge-pill">Recommended</span>
                        </div>
                        <div className="subtitle pt-2">Professional business address and mail handling services</div>
                        <div className="svc-list">
                          <div className="svc-row"><div className="svc-pill"><span>Regus</span><span className="svc-desc">Global locations, mail forwarding</span></div><div className="svc-price">$99–299/month</div></div>
                          <div className="svc-row"><div className="svc-pill"><span>Davinci Virtual</span><span className="svc-desc">Premium addresses, live receptionist</span></div><div className="svc-price">$79–199/month</div></div>
                          <div className="svc-row"><div className="svc-pill"><span>Alliance Virtual</span><span className="svc-desc">Affordable options, meeting rooms</span></div><div className="svc-price">$49–149/month</div></div>
                        </div>
                        <div className="d-flex justify-content-start mt-2 pt-3"><button type="button" className="btn btn-outline-primary btn-sm"><i className="ri-briefcase-line me-1"></i>Compare Providers</button></div>
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="service-card accent-info p-3 h-100">
                        <div className="header">
                          <div className="left"><div className="icon"><i className="ri-phone-line"></i></div><div className="title">Business Phone Services</div></div>
                          <span className="badge bg-info-subtle text-info badge-pill">Popular</span>
                        </div>
                        <div className="subtitle pt-2">Professional phone lines and communication systems</div>
                        <div className="svc-list">
                          <div className="svc-row"><div className="svc-pill"><span>Grasshopper</span><span className="svc-desc">Virtual phone system, mobile app</span></div><div className="svc-price">$26–80/month</div></div>
                          <div className="svc-row"><div className="svc-pill"><span>RingCentral</span><span className="svc-desc">Full business communications</span></div><div className="svc-price">$15.99–45.99/month</div></div>
                          <div className="svc-row"><div className="svc-pill"><span>Google Voice</span><span className="svc-desc">Basic business features</span></div><div className="svc-price">$10–30/month</div></div>
                        </div>
                        <div className="d-flex justify-content-start mt-2 pt-3"><button type="button" className="btn btn-outline-primary btn-sm"><i className="ri-phone-line me-1"></i>Compare Services</button></div>
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="service-card accent-warning p-3 h-100">
                        <div className="header">
                          <div className="left"><div className="icon"><i className="ri-list-check"></i></div><div className="title">411 Directory Listing</div></div>
                          <span className="badge bg-warning-subtle text-warning badge-pill">Essential</span>
                        </div>
                        <div className="subtitle pt-2">List your business in directory services for credibility</div>
                        <div className="svc-list">
                          <div className="svc-row"><div className="svc-pill"><span>Yellow Pages</span><span className="svc-desc">Primary business directory</span></div></div>
                          <div className="svc-row"><div className="svc-pill"><span>White Pages</span><span className="svc-desc">Contact information listing</span></div></div>
                          <div className="svc-row"><div className="svc-pill"><span>411.com</span><span className="svc-desc">Online directory service</span></div></div>
                          <div className="svc-row"><div className="svc-pill"><span>Superpages</span><span className="svc-desc">Enhanced business listings</span></div></div>
                        </div>
                        <div className="d-flex justify-content-start mt-2 pt-3"><button type="button" className="btn btn-outline-primary btn-sm"><i className="ri-list-check me-1"></i>Get Listed</button></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card mb-3">
                <div className="card-header d-flex align-items-center justify-content-between"><h6 className="mb-0 fs-15">Tools & Downloadable Forms</h6></div>
                <div ref={toolsRef} className="card-body">
                  <div className="row g-3">
                    <div className="col-lg-4"><div className="tools-card p-3 h-100"><div className="d-flex align-items-center gap-3"><div className="icon"><i className="ri-file-list-3-line"></i></div><div className="flex-grow-1"><div className="fw-bold">Business Formation Checklist</div><div className="meta">PDF • 2,140 views • 987 downloads</div></div><button type="button" className="btn btn-sm btn-outline-success"><i className="ri-download-2-line"></i></button></div></div></div>
                    <div className="col-lg-4"><div className="tools-card p-3 h-100"><div className="d-flex align-items-center gap-3"><div className="icon"><i className="ri-file-text-line"></i></div><div className="flex-grow-1"><div className="fw-bold">Credit Application Template</div><div className="meta">DOCX • 1,356 views • 562 downloads</div></div><button type="button" className="btn btn-sm btn-outline-success"><i className="ri-download-2-line"></i></button></div></div></div>
                    <div className="col-lg-4"><div className="tools-card p-3 h-100"><div className="d-flex align-items-center gap-3"><div className="icon"><i className="ri-file-excel-2-line"></i></div><div className="flex-grow-1"><div className="fw-bold">Financial Projections Spreadsheet</div><div className="meta">XLSX • 980 views • 420 downloads</div></div><button type="button" className="btn btn-sm btn-outline-success"><i className="ri-download-2-line"></i></button></div></div></div>
                    <div className="col-lg-4"><div className="tools-card p-3 h-100"><div className="d-flex align-items-center gap-3"><div className="icon"><i className="ri-briefcase-2-line"></i></div><div className="flex-grow-1"><div className="fw-bold">Credit Monitoring Log</div><div className="meta">PDF • 1,120 views • 500 downloads</div></div><button type="button" className="btn btn-sm btn-outline-success"><i className="ri-download-2-line"></i></button></div></div></div>
                    <div className="col-lg-4"><div className="tools-card p-3 h-100"><div className="d-flex align-items-center gap-3"><div className="icon"><i className="ri-article-line"></i></div><div className="flex-grow-1"><div className="fw-bold">Vendor Comparison Worksheet</div><div className="meta">XLSX • 845 views • 320 downloads</div></div><button type="button" className="btn btn-sm btn-outline-success"><i className="ri-download-2-line"></i></button></div></div></div>
                    <div className="col-lg-4"><div className="tools-card p-3 h-100"><div className="d-flex align-items-center gap-3"><div className="icon"><i className="ri-draft-line"></i></div><div className="flex-grow-1"><div className="fw-bold">Business Plan Template</div><div className="meta">DOCX • 1,050 views • 470 downloads</div></div><button type="button" className="btn btn-sm btn-outline-success"><i className="ri-download-2-line"></i></button></div></div></div>
                  </div>
                </div>
              </div>

              <div className="card mb-3">
                <div className="card-header d-flex align-items-center justify-content-between"><h6 className="mb-0 fs-15">Video Tutorial</h6></div>
                <div ref={tutorialRef} className="card-body">
                  
                  <div className="yt-grid mt-2">
                    {videos.map(v => (
                      <div key={v.id} className="yt-card" onClick={() => window.open(`https://www.youtube.com/watch?v=${v.id}`,'_blank')}>
                        <div className="yt-thumb" style={{ backgroundImage: `url(https://img.youtube.com/vi/${v.id}/hqdefault.jpg)` }}>
                          <div className="dur">{v.duration}</div>
                          <div className="play"><i className="ri-play-fill"></i></div>
                        </div>
                        <div className="yt-meta">
                          <div className="yt-title">{v.title}</div>
                          <div className="yt-sub">{v.views} views</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header d-flex align-items-center justify-content-between"><h6 className="mb-0 fs-15">Quick Access Tools</h6></div>
                <div className="card-body">
                  <div className="quick-grid">
                    {quickItems.map((q) => (
                      <div key={q.label} className="quick-item" onClick={() => window.open(q.url, '_blank')}>
                        <i className={q.icon}></i>
                        <span>{q.label}</span>
                      </div>
                    ))}
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

