import React, { useEffect, useMemo, useState } from 'react'

export default function VendorApplication() {
  type Vendor = {
    id: number
    name: string
    category: string
    tier: number
    requirements: string[]
    benefits: string[]
    reports: Array<'D&B' | 'Experian' | 'Equifax'>
    status: 'approved' | 'pending' | 'not_applied'
  }
  const vendors: Vendor[] = useMemo(() => ([
    { id: 1, name: 'Staples Business Credit', category: 'Office Supplies', tier: 0, requirements: ['Business Bank Account','Business Address','EIN'], benefits: ['Online Account Management','Rewards Program','Net 30 Terms'], reports: ['D&B'], status: 'approved' },
    { id: 2, name: 'Uline Business Credit', category: 'Industrial Supplies', tier: 1, requirements: ['6 Months in Business','Trade References','D&B Profile'], benefits: ['Volume Discounts','Free Shipping','Net 30 Terms'], reports: ['D&B','Experian'], status: 'pending' },
    { id: 3, name: 'Dell Business Credit', category: 'Technology', tier: 2, requirements: ['Established Credit History','Strong Payment History','Financial Statements'], benefits: ['Technology Financing','Business Support','Flexible Terms'], reports: ['D&B','Experian','Equifax'], status: 'not_applied' },
    { id: 4, name: 'Quill Business Credit', category: 'Office Supplies', tier: 1, requirements: ['6 Months in Business','Trade References','D&B Profile'], benefits: ['Volume Discounts','Net 30 Terms','Order Tracking'], reports: ['D&B','Experian'], status: 'approved' },
    { id: 5, name: 'Grainger Commercial Account', category: 'Industrial Supplies', tier: 1, requirements: ['Business Bank Account','Trade References','D&B Profile'], benefits: ['Bulk Pricing','Quick Delivery','Net 30 Terms'], reports: ['D&B'], status: 'approved' },
    { id: 6, name: 'Amazon Business Net Terms', category: 'Technology', tier: 2, requirements: ['Established Credit','Business Financials','Trade References'], benefits: ['Flexible Financing','Wide Selection','Payment Terms'], reports: ['Experian','Equifax'], status: 'pending' },
    { id: 7, name: 'Office Depot Business Credit', category: 'Office Supplies', tier: 0, requirements: ['Business Bank Account','Business Address','EIN'], benefits: ['Rewards Program','Order History','Net 30 Terms'], reports: ['D&B'], status: 'approved' },
    { id: 8, name: 'CDW Business Credit', category: 'Technology', tier: 3, requirements: ['Established Credit History','Strong Payment History','Financial Statements'], benefits: ['Tech Advisory','Flexible Financing','Business Support'], reports: ['Experian','Equifax'], status: 'not_applied' },
    { id: 9, name: 'MSC Industrial Supply', category: 'Industrial Supplies', tier: 1, requirements: ['Business Bank Account','Trade References','D&B Profile'], benefits: ['Volume Discounts','Account Management','Net 30 Terms'], reports: ['D&B','Experian'], status: 'pending' }
  ]), [])

  const [tier, setTier] = useState<'All' | 0 | 1 | 2 | 3 | 4>('All')
  const [category, setCategory] = useState<'All' | 'Office Supplies' | 'Industrial Supplies' | 'Technology'>('All')
  const [bureau, setBureau] = useState<'All' | 'D&B' | 'Experian' | 'Equifax'>('All')
  const [q, setQ] = useState('')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const totalCount = 1250
  const lastPage = Math.max(1, Math.ceil(totalCount / pageSize))
  const [modalVendor, setModalVendor] = useState<Vendor | null>(null)
  const [prefillVendor, setPrefillVendor] = useState<Vendor | null>(null)
  type FormField = {name:string; label:string; type:'text'|'email'|'number'|'textarea'|'select'; options?: string[]; full?: boolean}
  const vendorForms: Record<string,{title:string; fields:FormField[]; initial:Record<string,string>}> = {
    'Uline Business Credit': {
      title: 'Apply to Uline Business Credit',
      fields: [
        {name:'businessName',label:'Business Name',type:'text'},
        {name:'ein',label:'EIN',type:'text'},
        {name:'address',label:'Business Address',type:'textarea',full:true},
        {name:'phone',label:'Phone Number',type:'text'},
        {name:'email',label:'Email Address',type:'email'},
        {name:'years',label:'Years in Business',type:'number'},
        {name:'revenue',label:'Annual Revenue',type:'number'},
        {name:'limit',label:'Requested Credit Limit',type:'select',options:['$1,000','$2,500','$5,000','$10,000'],full:true}
      ],
      initial: {businessName:'Sample Business LLC',ein:'12-3456789',address:'123 Business St, City, State 12345',phone:'(555) 123-4567',email:'owner@samplebusiness.com',years:'2',revenue:'250000',limit:''}
    },
    'Dell Business Credit': {
      title: 'Apply to Dell Business Credit',
      fields: [
        {name:'businessName',label:'Business Name',type:'text'},
        {name:'duns',label:'DUNS Number',type:'text'},
        {name:'contact',label:'Primary Contact',type:'text'},
        {name:'email',label:'Email Address',type:'email'},
        {name:'revenue',label:'Annual Revenue',type:'number'},
        {name:'limit',label:'Requested Credit Limit',type:'select',options:['$2,500','$5,000','$10,000','$25,000'],full:true}
      ],
      initial: {businessName:'Sample Business LLC',duns:'12-345-6789',contact:'John Doe',email:'owner@samplebusiness.com',revenue:'450000',limit:''}
    },
    'Staples Business Credit': {
      title: 'Apply to Staples Business Credit',
      fields: [
        {name:'businessName',label:'Business Name',type:'text'},
        {name:'taxid',label:'Tax ID',type:'text'},
        {name:'address',label:'Business Address',type:'textarea',full:true},
        {name:'phone',label:'Phone Number',type:'text'},
        {name:'email',label:'Email Address',type:'email'},
        {name:'limit',label:'Requested Credit Limit',type:'select',options:['$1,000','$3,000','$5,000','$7,500'],full:true}
      ],
      initial: {businessName:'Sample Business LLC',taxid:'12-3456789',address:'123 Business St, City, State 12345',phone:'(555) 123-4567',email:'owner@samplebusiness.com',limit:''}
    },
    default: {
      title: 'Apply to Vendor',
      fields: [
        {name:'businessName',label:'Business Name',type:'text'},
        {name:'ein',label:'EIN',type:'text'},
        {name:'address',label:'Business Address',type:'textarea',full:true},
        {name:'phone',label:'Phone Number',type:'text'},
        {name:'email',label:'Email Address',type:'email'},
        {name:'years',label:'Years in Business',type:'number'},
        {name:'revenue',label:'Annual Revenue',type:'number'},
        {name:'limit',label:'Requested Credit Limit',type:'select',options:['$1,000','$2,500','$5,000','$10,000'],full:true}
      ],
      initial: {businessName:'Sample Business LLC',ein:'12-3456789',address:'123 Business St, City, State 12345',phone:'(555) 123-4567',email:'owner@samplebusiness.com',years:'2',revenue:'250000',limit:''}
    }
  }
  const [pf, setPf] = useState<Record<string,string>>(vendorForms.default.initial)

  const filtered = vendors.filter((v) => {
    const tierOk = tier === 'All' ? true : v.tier === tier
    const catOk = category === 'All' ? true : v.category === category
    const bureauOk = bureau === 'All' ? true : v.reports.includes(bureau)
    const qOk = q.trim() ? v.name.toLowerCase().includes(q.trim().toLowerCase()) : true
    return tierOk && catOk && bureauOk && qOk
  })

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  const vendorSiteUrl = (v: Vendor) => {
    switch (v.name) {
      case 'Staples Business Credit': return 'https://www.staples.com';
      case 'Uline Business Credit': return 'https://www.uline.com';
      case 'Dell Business Credit': return 'https://www.dell.com';
      case 'Quill Business Credit': return 'https://www.quill.com';
      case 'Grainger Commercial Account': return 'https://www.grainger.com';
      case 'Amazon Business Net Terms': return 'https://business.amazon.com';
      case 'Office Depot Business Credit': return 'https://www.officedepot.com';
      case 'CDW Business Credit': return 'https://www.cdw.com';
      case 'MSC Industrial Supply': return 'https://www.mscdirect.com';
      default: return `https://www.google.com/search?q=${encodeURIComponent(v.name+" credit application")}`
    }
  }

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
    <div className="page-content vendor-application">
      <div className="container-fluid">
        <div className="row">
          <div className="col-xl-9">
            <div className="d-flex align-items-center mb-2">
              <div>
                <h4 className="fs-20 mb-1">Vendor Application</h4>
                <p className="text-muted mb-0">Apply to foundational vendors to establish reportable trade lines</p>
              </div>
            </div>
          </div>
          <div className="col-xl-9">
            <div className="card mb-3">
              <div className="card-header d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <h6 className="mb-0">Filter Vendors</h6>
                  <span className="ms-1" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" data-bs-custom-class="tooltip-info" title="<div class='tt-title'>Tip</div><div class='tt-body'>Apply to vendors that report to bureaus to build credit fast.</div>"><i className="ri-information-fill align-middle text-info info-icon-circle"></i></span>
                </div>
              </div>
              <div className="card-body">
                  
                
                <div className="row g-3 align-items-end mb-3 filter-toolbar">
                  <div className="col-12 col-md-6 col-lg-3 col-xl-2">
                    <label className="form-label">Filter by Tier</label>
                    <select className="form-select" value={tier} onChange={(e)=>setTier((e.target.value as any))}>
                      <option value="All">All Tier</option>
                      <option value={0}>Tier 0</option>
                      <option value={1}>Tier 1</option>
                      <option value={2}>Tier 2</option>
                      <option value={3}>Tier 3</option>
                      <option value={4}>Tier 4</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6 col-lg-3 col-xl-2">
                    <label className="form-label">Filter by Category</label>
                    <select className="form-select" value={category} onChange={(e)=>setCategory((e.target.value as any))}>
                      <option value="All">All Categories</option>
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Industrial Supplies">Industrial Supplies</option>
                      <option value="Technology">Technology</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6 col-lg-3 col-xl-2">
                    <label className="form-label">Reporting Bureaus</label>
                    <select className="form-select" value={bureau} onChange={(e)=>setBureau((e.target.value as any))}>
                      <option value="All">All Bureaus</option>
                      <option value="D&B">D&amp;B</option>
                      <option value="Experian">Experian</option>
                      <option value="Equifax">Equifax</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-6 col-lg-3 col-xl-4 d-flex flex-column">
                    <label className="form-label">Search Vendors</label>
                    <div className="input-group w-100">
                      <input type="text" className="form-control" placeholder="Search by vendor name" value={q} onChange={(e)=>setQ(e.target.value)} />
                    </div>
                  </div>
                  <div className="col-12 col-md-6 col-lg-3 col-xl-2 d-flex align-items-end">
                    <button type="button" className="btn btn-primary w-100"><i className="ri-filter-3-line align-middle me-1"></i>Filters</button>
                  </div>
                </div>

              </div>
            </div>

            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <h6 className="mb-0">Vendors</h6>
                </div>
              </div>
              <div className="card-body">
                {filtered.length ? (
                  <div className="vendor-grid">
                    {filtered.map((v) => (
                      <div key={v.id} className="vendor-card">
                        <div className="vendor-card-header">
                          <span className="tier-badge">Tier {v.tier}</span>
                          <span className={`status-badge ${v.status==='approved'?'status-approved':v.status==='pending'?'status-pending':'status-not'}`}>{v.status==='approved'?'Approved':v.status==='pending'?'Pending':'Not Applied'}</span>
                        </div>
                        <div className="vendor-card-body">
                          <div className="vc-title pb-1">{v.name}</div>
                          <div className="vc-sub">{v.category}</div>
                          <div className="mt-2 fw-semibold">Requirements</div>
                          <ul className="list">
                            {v.requirements.map((r,i)=>(
                              <li key={i}><i className="ri-check-line text-success"></i><span>{r}</span></li>
                            ))}
                          </ul>
                          <div className="mt-2 fw-semibold">Benefits</div>
                          <ul className="list">
                            {v.benefits.map((b,i)=>(
                              <li key={i}><i className="ri-checkbox-circle-line text-primary"></i><span>{b}</span></li>
                            ))}
                          </ul>
                          <div className="mt-2 fw-semibold pb-2">Reports to</div>
                          <div className="report-badges">
                            {v.reports.map((r,i)=> (
                              <span key={i} className={`rb ${r==='D&B'?'rb-yellow':r==='Experian'?'rb-green':'rb-blue'}`}>{r}</span>
                            ))}
                          </div>
                          <div className="vc-actions">
                            <button type="button" className="btn btn-apply" onClick={()=>setModalVendor(v)}><i className="ri-external-link-line align-middle me-1"></i>Apply Now</button>
                            <button type="button" className="btn btn-prefill" onClick={()=>{setPrefillVendor(v); const cfg = vendorForms[v.name] ?? vendorForms.default; setPf(cfg.initial)}}><i className="ri-pencil-line align-middle me-1"></i>Pre-fill form</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state" role="status" aria-live="polite">
                    <div className="empty-icon"><i className="ri-file-search-line"></i></div>
                    <div className="empty-title">No vendors found</div>
                  </div>
                )}

                {modalVendor && (
                  <>
                    <div className="va-modal-backdrop" onClick={()=>setModalVendor(null)}></div>
                    <div className="va-modal" role="dialog" aria-modal="true">
                      <div className="va-modal-header">
                        <div className="va-modal-title">Apply to {modalVendor.name}</div>
                        <button type="button" className="btn btn-sm btn-light" onClick={()=>setModalVendor(null)} aria-label="Close">Close</button>
                      </div>
                      <div className="va-modal-body">
                        <div className="va-option">
                          <div className="va-option-icon"><i className="ri-external-link-line"></i></div>
                          <div className="va-option-content">
                            <div className="va-option-title">Apply on Vendor Site</div>
                            <div className="va-option-desc">Complete application directly on the vendor's website</div>
                            <a className="va-link" href={vendorSiteUrl(modalVendor)} target="_blank" rel="noopener noreferrer">Go to Vendor Site</a>
                          </div>
                        </div>
                        <div className="va-option">
                          <div className="va-option-icon"><i className="ri-pencil-line"></i></div>
                          <div className="va-option-content">
                            <div className="va-option-title">Apply in Portal</div>
                            <div className="va-option-desc">Complete application here with pre-filled data and e-signature</div>
                            <a className="va-link" href={`/application/start?vendor=${encodeURIComponent(modalVendor.name)}`} target="_blank" rel="noopener noreferrer">Start Application</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {prefillVendor && (
                  <>
                    <div className="va-modal-backdrop" onClick={()=>setPrefillVendor(null)}></div>
                    <div className="va-modal pf-modal" role="dialog" aria-modal="true">
                      <div className="va-modal-header">
                        <div className="va-modal-title">{(vendorForms[prefillVendor.name] ?? vendorForms.default).title}</div>
                        <button type="button" className="btn btn-sm btn-light" onClick={()=>setPrefillVendor(null)} aria-label="Close">Close</button>
                      </div>
                      <div className="va-modal-body">
                        <form onSubmit={(e)=>{e.preventDefault(); window.open(`/application/start?vendor=${encodeURIComponent(prefillVendor.name)}`,'_blank','noopener'); setPrefillVendor(null)}}>
                          <div className="pf-form-grid">
                            {((vendorForms[prefillVendor.name] ?? vendorForms.default).fields).map((field)=> (
                              <div key={field.name} className={field.full?'full-col':''}>
                                <label className="form-label">{field.label}</label>
                                {field.type==='textarea' ? (
                                  <textarea className="form-control" rows={3} value={pf[field.name] || ''} onChange={(e)=>setPf({...pf,[field.name]:e.target.value})}></textarea>
                                ) : field.type==='select' ? (
                                  <select className="form-select" value={pf[field.name] || ''} onChange={(e)=>setPf({...pf,[field.name]:e.target.value})}>
                                    <option value="">Select</option>
                                    {(field.options || []).map((opt)=> (<option key={opt} value={opt}>{opt}</option>))}
                                  </select>
                                ) : (
                                  <input type={field.type} className="form-control" value={pf[field.name] || ''} onChange={(e)=>setPf({...pf,[field.name]:e.target.value})} />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="pf-actions">
                            <button type="button" className="btn btn-light" onClick={()=>setPrefillVendor(null)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Submit Application</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </>
                )}

                <div className="pagination-footer">
                  <div className="d-flex align-items-center gap-2">
                    <span>Result per page</span>
                    <select className="form-select rpp-select" value={pageSize} onChange={(e)=>{setPageSize(parseInt(e.target.value,10)); setPage(1)}}>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  <div className="text-muted">{start}-{end} of {totalCount}</div>
                  <div className="btn-group" role="group">
                    <button type="button" className="btn btn-outline-secondary" disabled={page===1} onClick={()=>setPage(1)}>&laquo;</button>
                    <button type="button" className="btn btn-outline-secondary" disabled={page===1} onClick={()=>setPage((p)=>Math.max(1,p-1))}>&lsaquo;</button>
                    <button type="button" className="btn btn-outline-secondary" disabled={page===lastPage} onClick={()=>setPage((p)=>Math.min(lastPage,p+1))}>&rsaquo;</button>
                    <button type="button" className="btn btn-outline-secondary" disabled={page===lastPage} onClick={()=>setPage(lastPage)}>&raquo;</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3">
            <div className="card mb-3">
              <div className="card-header"><h6 className="mb-0">Recent Activity</h6></div>
              <div className="card-body">
                <div className="timeline">
                  <div className="item">
                    <span className="dot bg-soft-cyan">
                      <i className="ri-user-3-line icon text-info"></i>
                    </span>
                    <div className="title">Business Bank Account Opened</div>
                    <div className="desc">Successfully opened account with Chase Business</div>
                    <div className="meta text-muted">1 day ago</div>
                  </div>
                  <div className="item">
                    <span className="dot bg-soft-red">
                      <i className="ri-heart-2-line icon text-danger"></i>
                    </span>
                    <div className="title">Vendor Application Approved</div>
                    <div className="desc">Approved for $500 credit line with Uline</div>
                    <div className="meta text-muted">3 days ago</div>
                  </div>
                  <div className="item">
                    <span className="dot bg-soft-purple">
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
                      <div className="action-icon action-icon-blue"><i className="ri-phone-line"></i></div>
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
                      <div className="action-icon action-icon-purple"><i className="ri-book-2-line"></i></div>
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
