import React, { useEffect, useState, useRef } from 'react'
import overviewImg from '../../../../assets/images/blog/overview.jpg'

export default function CreditGuide() {
  const playlist = [
    { type: 'youtube', id: 'dQw4w9WgXcQ', title: 'Step-by-Step Guide: Foundations', duration: '10:12' },
    { type: 'file', src: overviewImg, title: 'Vendor Accounts Walkthrough', duration: '08:03' },
    { type: 'youtube', id: 'n9K9wZsYQzk', title: 'Understanding Business Credit Scores', duration: '12:45' }
  ]
  const [current, setCurrent] = useState(0)
  const [auto, setAuto] = useState(false)
  const vidRef = useRef<HTMLVideoElement | null>(null)
  const [openTier, setOpenTier] = useState<number>(0)

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
                <h4 className="fs-20 mb-1">Credit Building Guide</h4>
                <p className="text-muted mb-0">Follow a step-by-step path to establish, build, and monitor your business credit</p>
              </div>
            </div>
          </div>

          <div className="col-xl-9">
            <div className="card mb-3">
              <div className="card-body">
                <style>{`
                  .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
                  @media (max-width: 992px){.stats{grid-template-columns:repeat(2,1fr)}}
                  .stat{border:1px solid #e5e7eb;border-radius:12px;background:#fff;padding:12px}
                  .stat .num{font-weight:700;font-size:20px}
                  .stat .label{color:var(--bs-secondary-color)}
                  .tier{border-radius:12px;overflow:hidden;border:1px solid #0f2546;background:#fff;color:#fff}
                  .tier-head{display:flex;justify-content:space-between;align-items:flex-start;padding:14px;cursor:pointer;background:#0f2546}
                  .tier-title{font-weight:700}
                  .tier-info{display:flex;flex-direction:column;gap:6px}
                  .tier-desc{color:#cbd5e1;max-width:920px}
                  .tier-meta{display:flex;gap:12px;align-items:center}
                  .pill{display:inline-block;border-radius:999px;padding:2px 10px;font-size:12px;background:#D4AF37;color:#fff}
                  .tier-body{background:#0f2546;max-height:0;opacity:0;transition:max-height .35s ease,opacity .35s ease;overflow:hidden;display:flow-root}
                  .tier.open .tier-body{max-height:900px;opacity:1;background:#fff}
                  .caret{transition:transform .2s ease}
                  .caret.open{transform:rotate(180deg)}
                  .task{display:flex;justify-content:space-between;align-items:center;border-radius:10px;padding:12px;margin:10px 14px}
                  .task.done{background:#eaf9f0;color:#0f172a}
                  .task.pending{background:#fff7ed;color:#0f172a}
                  .task .left{max-width:72%}
                  .tooltip-info .tooltip-inner{background:#0b5ed7;color:#ffffff;border:none;border-radius:10px;padding:12px 14px;box-shadow:0 6px 16px rgba(0,0,0,.15);max-width:340px;text-align:left;line-height:1.4}
                  .tooltip-info .tt-title{font-weight:700;font-size:14px;margin-bottom:6px}
                  .tooltip-info .tt-body{color:#e6f0ff}
                  .tooltip-info .tt-list{margin:6px 0 0;padding-left:18px}
                  .tooltip-info .tt-list li{margin:3px 0}
                  .tooltip-info.bs-tooltip-top .tooltip-arrow::before{border-top-color:#0b5ed7}
                  .tooltip-info.bs-tooltip-bottom .tooltip-arrow::before{border-bottom-color:#0b5ed7}
                  .tooltip-info.bs-tooltip-start .tooltip-arrow::before{border-left-color:#0b5ed7}
                  .tooltip-info.bs-tooltip-end .tooltip-arrow::before{border-right-color:#0b5ed7}
                  .task .title{font-weight:600}
                  .title-row{display:flex;align-items:center;gap:10px}
                  .check{width:18px;height:18px;border:2px solid #94a3b8;border-radius:4px;display:flex;align-items:center;justify-content:center;background:#fff;color:#fff}
                  .task.done .check{background:#16a34a;border-color:#16a34a;color:#fff}
                  .task.pending .check i{display:none}
                  .check i{font-size:12px;line-height:1}
                  .task .desc{color:#334155}
                  .task .meta{color:#64748b;font-size:12px}
                  .task .cta{display:flex;align-items:center;gap:8px}
                  .task .cta .btn{border-radius:8px}
                  .collapse-row{border:1px solid #e5e7eb;border-radius:12px;background:#fff;margin-top:12px}
                  .collapse-head{display:flex;justify-content:space-between;align-items:center;padding:12px 14px}
                  .collapse-title{font-weight:600}
                  .collapse-meta{color:var(--bs-secondary-color)}
                `}</style>
                <div className="stats">
                  <div className="stat"><div className="num">1</div><div className="label">Current Tier</div></div>
                  <div className="stat"><div className="num">45%</div><div className="label">Overall Progress</div></div>
                  <div className="stat"><div className="num">3–4 weeks</div><div className="label">Est. Time to Next Tier</div></div>
                  <div className="stat"><div className="num">12/34</div><div className="label">Tasks Completed</div></div>
                </div>
                <div className={`tier mt-3 ${openTier===0?'open':''}`}>
                  <div className="tier-head" onClick={()=>setOpenTier(openTier===0?-1:0)}>
                    <div className="tier-info">
                      <div className="tier-title">Tier 0: Business Foundation & Compliance <span className="ms-1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" data-bs-custom-class="tooltip-info" title="<div class='tt-title'>Why it matters</div><div class='tt-body'>80% of business credit applications are denied due to missing or mismatched foundational data. This tier fixes that so lenders can verify your business.</div><ul class='tt-list'><li>Match legal name across EIN, bank, and 411</li><li>Use professional phone, email, and address</li><li>Avoid declines from unverifiable info</li></ul>"><i className="ri-information-fill align-middle text-white" style={{ fontSize: 20 }}></i></span></div>
                      <div className="tier-desc">Lay the groundwork for fundability. This phase ensures your business is properly formed, verified, and listed — including EIN registration, business phone, 411 listing, professional email, and virtual address setup. Lenders can’t approve what they can’t verify.</div>
                    </div>
                    <div className="tier-meta"><span className="pill" style={{ backgroundColor: '#D4AF37' }}>2/19</span><i className={`ri-arrow-down-s-line caret ${openTier===0?'open':''}`}></i></div>
                  </div>
                  <div className="tier-body">
                    <div className="task done">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Register for EIN with IRS</div></div>
                        <div className="desc">Obtain your Employer Identification Number from the IRS</div>
                        <div className="meta">Completed 2 weeks ago</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-success btn-sm">Apply for EIN</button></div>
                    </div>
                    <div className="task done">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Register business with state</div></div>
                        <div className="desc">File Articles of Incorporation or LLC formation documents</div>
                        <div className="meta">Completed 1 week ago</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-success btn-sm">Find State Registration</button></div>
                    </div>
                    <div className="task pending">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Open business bank account</div></div>
                        <div className="desc">Separate business and personal finances</div>
                        <div className="meta">Pending</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-primary btn-sm">Compare Banks</button></div>
                    </div>
                    <div className="task pending">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Establish business address</div></div>
                        <div className="desc">Set up a professional business address</div>
                        <div className="meta">High Priority</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-primary btn-sm">Virtual Office Options</button></div>
                    </div>
                  </div>
                </div>
                <div className={`tier mt-3 ${openTier===1?'open':''}`}>
                  <div className="tier-head" onClick={()=>setOpenTier(openTier===1?-1:1)}>
                    <div className="tier-info">
                      <div className="tier-title">Tier 1: Starter Vendor Accounts  <span className="ms-1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" data-bs-custom-class="tooltip-info" title="<div class='tt-title'>Why it matters</div><div class='tt-body'>Once vendors begin reporting on-time payments, your PAYDEX and Experian Business scores will generate — unlocking higher-tier credit.</div>"><i className="ri-information-fill align-middle text-white" style={{ fontSize: 20 }}></i></span></div>
                      <div className="tier-desc">Open your first tradelines with vendors that report to the business credit bureaus. These small starter accounts help establish your business’s first credit history and build your D-U-N-S file.</div>
                    </div>
                    <div className="tier-meta"><span className="pill">2/15</span><i className={`ri-arrow-down-s-line caret ${openTier===1?'open':''}`}></i></div>
                  </div>
                  <div className="tier-body">
                    <div className="task done">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Register for EIN with IRS</div></div>
                        <div className="desc">Obtain your Employer Identification Number from the IRS</div>
                        <div className="meta">Completed 2 weeks ago</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-success btn-sm">Apply for EIN</button></div>
                    </div>
                    <div className="task done">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Register business with state</div></div>
                        <div className="desc">File Articles of Incorporation or LLC formation documents</div>
                        <div className="meta">Completed 1 week ago</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-success btn-sm">Find State Registration</button></div>
                    </div>
                    <div className="task pending">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Open business bank account</div></div>
                        <div className="desc">Separate business and personal finances</div>
                        <div className="meta">Pending</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-primary btn-sm">Compare Banks</button></div>
                    </div>
                    <div className="task pending">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Establish business address</div></div>
                        <div className="desc">Set up a professional business address</div>
                        <div className="meta">High Priority</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-primary btn-sm">Virtual Office Options</button></div>
                    </div>
                  </div>
                </div>
                <div className={`tier mt-3 ${openTier===2?'open':''}`}>
                  <div className="tier-head" onClick={()=>setOpenTier(openTier===2?-1:2)}>
                    <div className="tier-info">
                      <div className="tier-title">Tier 2: Intermediate Vendors & Revolving Accounts <span className="ms-1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" data-bs-custom-class="tooltip-info" title="<div class='tt-title'>Why it matters</div><div class='tt-body'>A thicker credit file with multiple reporting accounts shows lenders your business can handle higher limits responsibly.</div>"><i className="ri-information-fill align-middle text-white" style={{ fontSize: 20 }}></i></span></div>
                      <div className="tier-desc">Expand your credit profile with additional vendors and store/fleet accounts that report to multiple bureaus. This phase strengthens your payment history and boosts your credit depth.</div>
                    </div>
                    <div className="tier-meta"><span className="pill">2/11</span><i className={`ri-arrow-down-s-line caret ${openTier===2?'open':''}`}></i></div>
                  </div>
                  <div className="tier-body">
                    <div className="task done">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Register for EIN with IRS</div></div>
                        <div className="desc">Obtain your Employer Identification Number from the IRS</div>
                        <div className="meta">Completed 2 weeks ago</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-success btn-sm">Apply for EIN</button></div>
                    </div>
                    <div className="task done">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Register business with state</div></div>
                        <div className="desc">File Articles of Incorporation or LLC formation documents</div>
                        <div className="meta">Completed 1 week ago</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-success btn-sm">Find State Registration</button></div>
                    </div>
                    <div className="task pending">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Open business bank account</div></div>
                        <div className="desc">Separate business and personal finances</div>
                        <div className="meta">Pending</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-primary btn-sm">Compare Banks</button></div>
                    </div>
                    <div className="task pending">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Establish business address</div></div>
                        <div className="desc">Set up a professional business address</div>
                        <div className="meta">High Priority</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-primary btn-sm">Virtual Office Options</button></div>
                    </div>
                  </div>
                </div>
                <div className={`tier mt-3 ${openTier===3?'open':''}`}>
                  <div className="tier-head" onClick={()=>setOpenTier(openTier===3?-1:3)}>
                    <div className="tier-info">
                      <div className="tier-title">Tier 3: Advanced Credit Lines <span className="ms-1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" data-bs-custom-class="tooltip-info" title="<div class='tt-title'>Why it matters</div><div class='tt-body'>Consistent payments and low utilization in this stage make your business attractive to institutional lenders.</div>"><i className="ri-information-fill align-middle text-white" style={{ fontSize: 20 }}></i></span></div>
                      <div className="tier-desc">Transition from vendor credit to revolving business credit cards, higher limit Net 55/60 terms, and equipment or fleet financing. This tier proves long term creditworthiness and payment reliability.</div>
                    </div>
                    <div className="tier-meta"><span className="pill">2/8</span><i className={`ri-arrow-down-s-line caret ${openTier===3?'open':''}`}></i></div>
                  </div>
                  <div className="tier-body">
                    <div className="task done">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Register for EIN with IRS</div></div>
                        <div className="desc">Obtain your Employer Identification Number from the IRS</div>
                        <div className="meta">Completed 2 weeks ago</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-success btn-sm">Apply for EIN</button></div>
                    </div>
                    <div className="task done">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Register business with state</div></div>
                        <div className="desc">File Articles of Incorporation or LLC formation documents</div>
                        <div className="meta">Completed 1 week ago</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-success btn-sm">Find State Registration</button></div>
                    </div>
                    <div className="task pending">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Open business bank account</div></div>
                        <div className="desc">Separate business and personal finances</div>
                        <div className="meta">Pending</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-primary btn-sm">Compare Banks</button></div>
                    </div>
                    <div className="task pending">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Establish business address</div></div>
                        <div className="desc">Set up a professional business address</div>
                        <div className="meta">High Priority</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-primary btn-sm">Virtual Office Options</button></div>
                    </div>
                  </div>
                </div>
                <div className={`tier mt-3 ${openTier===4?'open':''}`}>
                  <div className="tier-head" onClick={()=>setOpenTier(openTier===4?-1:4)}>
                    <div className="tier-info">
                      <div className="tier-title">Tier 4: Bank & Institutional Lending <span className="ms-1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" data-bs-custom-class="tooltip-info" title="<div class='tt-title'>Why it matters</div><div class='tt-body'>With a strong business credit profile, you can separate business and personal credit and qualify for capital at the best terms available.</div>"><i className="ri-information-fill align-middle text-white" style={{ fontSize: 20 }}></i></span></div>
                      <div className="tier-desc">Leverage your established credit history to access bank lines of credit, SBA loans, and corporate financing — often without a personal guarantee. This tier is where funding power meets independence.</div>
                    </div>
                    <div className="tier-meta"><span className="pill">2/9</span><i className={`ri-arrow-down-s-line caret ${openTier===4?'open':''}`}></i></div>
                  </div>
                  <div className="tier-body">
                    <div className="task done">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Register for EIN with IRS</div></div>
                        <div className="desc">Obtain your Employer Identification Number from the IRS</div>
                        <div className="meta">Completed 2 weeks ago</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-success btn-sm">Apply for EIN</button></div>
                    </div>
                    <div className="task done">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Register business with state</div></div>
                        <div className="desc">File Articles of Incorporation or LLC formation documents</div>
                        <div className="meta">Completed 1 week ago</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-success btn-sm">Find State Registration</button></div>
                    </div>
                    <div className="task pending">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Open business bank account</div></div>
                        <div className="desc">Separate business and personal finances</div>
                        <div className="meta">Pending</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-primary btn-sm">Compare Banks</button></div>
                    </div>
                    <div className="task pending">
                      <div className="left">
                        <div className="title-row"><span className="check"><i className="ri-check-line"></i></span><div className="title">Establish business address</div></div>
                        <div className="desc">Set up a professional business address</div>
                        <div className="meta">High Priority</div>
                      </div>
                      <div className="cta"><button type="button" className="btn btn-outline-primary btn-sm">Virtual Office Options</button></div>
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
                  .timeline .icon{position:relative;font-size:16px;z-index:1}
                  .timeline .title{font-weight:600;margin-bottom:2px}
                  .timeline .desc{color:var(--bs-secondary-color)}
                  .timeline .meta{color:var(--bs-secondary-color);font-size:12px}
                `}</style>
                <div className="timeline">
                  <div className="item">
                    <span className="dot" style={{background:'#c9f3ec'}}>
                      <i className="ri-user-3-line icon text-info"></i>
                    </span>
                    <div className="title">Business Bank Account Opened</div>
                    <div className="desc">Successfully opened account with Chase Business</div>
                    <div className="meta text-muted">1 day ago</div>
                  </div>
                  <div className="item">
                    <span className="dot" style={{background:'#ffe5e0'}}>
                      <i className="ri-heart-2-line icon text-danger"></i>
                    </span>
                    <div className="title">Vendor Application Approved</div>
                    <div className="desc">Approved for $500 credit line with Uline</div>
                    <div className="meta text-muted">3 days ago</div>
                  </div>
                  <div className="item">
                    <span className="dot" style={{background:'#f3e6ff'}}>
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

