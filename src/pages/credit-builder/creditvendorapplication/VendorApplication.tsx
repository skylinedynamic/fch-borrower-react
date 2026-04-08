import React, { useEffect, useMemo, useState } from 'react'

type Vendor = {
  id: number
  issuer: string
  card_name: string
  category: string
  min_fico: number | null
  time_in_business: number
  pg_required: string
  approval_level: string
  image: string
  link: string
}

export default function VendorApplication() {
  const vendorsData = useMemo(() => ([
    { difficulty_rank: 1, issuer: "Capital One", card_name: "Spark Classic", credit_category: "Revolving", approval_level: "Easy", typical_personal_fico_min: 600, time_in_business_min_months: 0, pg_required: "Yes", image: "/assets/images/vendor/1-Capital One - Spark.avif", link: "https://www.capitalone.com/small-business/credit-cards/spark-classic/" },
    { difficulty_rank: 2, issuer: "Bank of America", card_name: "Business Advantage Secured", credit_category: "Revolving", approval_level: "Easy", typical_personal_fico_min: 580, time_in_business_min_months: 0, pg_required: "Yes", image: "/assets/images/vendor/2-Bank of America-Business Advantage Secured.png", link: "https://business.bankofamerica.com/en/credit-cards/business-advantage-unlimited-cash-rewards-secured-business" },
    { difficulty_rank: 3, issuer: "Regions", card_name: "Business Visa", credit_category: "Revolving", approval_level: "Easy", typical_personal_fico_min: 620, time_in_business_min_months: 3, pg_required: "Yes", image: "/assets/images/vendor/3-Regions-Business Visa.webp", link: "https://www.regions.com/personal-banking/credit-cards" },
    { difficulty_rank: 4, issuer: "PNC", card_name: "Cash Rewards Business", credit_category: "Revolving", approval_level: "Easy", typical_personal_fico_min: 620, time_in_business_min_months: 6, pg_required: "Yes", image: "/assets/images/vendor/4-PNC-Cash Reqards Business.avif", link: "https://lending.pnc.com/bccr/getting-started" },
    { difficulty_rank: 5, issuer: "TD Bank", card_name: "Business Solutions", credit_category: "Revolving", approval_level: "Easy", typical_personal_fico_min: 640, time_in_business_min_months: 6, pg_required: "Yes", image: "/assets/images/vendor/5 TD Bank Business Solutions.webp", link: "https://www.td.com/us/en/personal-banking/credit-cards/business-solutions-credit-card" },
    { difficulty_rank: 10, issuer: "Chase", card_name: "Ink Cash", credit_category: "Revolving", approval_level: "Moderate", typical_personal_fico_min: 660, time_in_business_min_months: 12, pg_required: "Yes", image: "/assets/images/vendor/10-Chase – Ink Cash.png", link: "https://creditcards.chase.com/business-credit-cards/ink-cash" },
    { difficulty_rank: 11, issuer: "Chase", card_name: "Ink Unlimited", credit_category: "Revolving", approval_level: "Moderate", typical_personal_fico_min: 660, time_in_business_min_months: 12, pg_required: "Yes", image: "/assets/images/vendor/11-chase-ink-business-unlimited.webp", link: "https://creditcards.chase.com/business-credit-cards/ink-unlimited" },
    { difficulty_rank: 13, issuer: "Wells Fargo", card_name: "Signify Business Cash", credit_category: "Revolving", approval_level: "Moderate", typical_personal_fico_min: 680, time_in_business_min_months: 12, pg_required: "Yes", image: "/assets/images/vendor/13-Wells Fargo – Signify Business Cash.jpg", link: "https://creditcards.wellsfargo.com/cards/business-credit-cards/signify-business-cash-credit-card/" },
    { difficulty_rank: 14, issuer: "U.S. Bank", card_name: "Triple Cash Rewards", credit_category: "Revolving", approval_level: "Moderate", typical_personal_fico_min: 680, time_in_business_min_months: 12, pg_required: "Yes", image: "/assets/images/vendor/14-U.S. Bank – Triple Cash Rewards.jpg", link: "https://www.usbank.com/business-banking/business-credit-cards/business-triple-cash-back-credit-card.html" },
    { difficulty_rank: 15, issuer: "Citi", card_name: "AAdvantage Business", credit_category: "Revolving", approval_level: "Moderate", typical_personal_fico_min: 680, time_in_business_min_months: 12, pg_required: "Yes", image: "/assets/images/vendor/15-Citi – AAdvantage Business.webp", link: "https://creditcards.aa.com/credit-cards/citi-business-card-american-airlines-direct/" },
    { difficulty_rank: 24, issuer: "American Express", card_name: "Blue Business Plus", credit_category: "Revolving", approval_level: "Moderate", typical_personal_fico_min: 700, time_in_business_min_months: 24, pg_required: "Yes", image: "/assets/images/vendor/24-American Express – Blue Business Plus.avif", link: "https://www.americanexpress.com/us/credit-cards/business/business-credit-cards/american-express-blue-business-plus-credit-card-amex/" },
    { difficulty_rank: 30, issuer: "American Express", card_name: "Business Gold", credit_category: "Charge", approval_level: "Very Hard", typical_personal_fico_min: 720, time_in_business_min_months: 36, pg_required: "Yes", image: "/assets/images/vendor/30-American Express – Business Gold.jpg", link: "https://www.americanexpress.com/us/credit-cards/business/business-credit-cards/american-express-business-gold-card-amex/" },
    { difficulty_rank: 36, issuer: "Stripe", card_name: "Corporate Card", credit_category: "Corporate", approval_level: "Invite Only", typical_personal_fico_min: null, time_in_business_min_months: 12, pg_required: "No", image: "/assets/images/vendor/36-Stripe – Corporate Card.png", link: "https://stripe.com/corporate-card" },
    { difficulty_rank: 37, issuer: "Brex", card_name: "Corporate Card", credit_category: "Corporate", approval_level: "Invite Only", typical_personal_fico_min: null, time_in_business_min_months: 12, pg_required: "No", image: "/assets/images/vendor/37-Brex – Corporate Card.jpg", link: "https://www.brex.com/product/credit-card" },
    { difficulty_rank: 38, issuer: "Ramp", card_name: "Corporate Card", credit_category: "Corporate", approval_level: "Invite Only", typical_personal_fico_min: null, time_in_business_min_months: 12, pg_required: "No", image: "/assets/images/vendor/38-Ramp – Corporate Card.webp", link: "https://ramp.com/corporate-cards" },
    { difficulty_rank: 40, issuer: "HSBC", card_name: "Corporate Card", credit_category: "Corporate", approval_level: "Very Hard", typical_personal_fico_min: 760, time_in_business_min_months: 36, pg_required: "Yes", image: "/assets/images/vendor/40-HSBC – Corporate Card.jpg", link: "https://www.business.us.hsbc.com/en/products/corporate-world-elite" },
  ]), [])

  const vendors: Vendor[] = useMemo(() => vendorsData.map(v => ({
    id: v.difficulty_rank,
    issuer: v.issuer,
    card_name: v.card_name,
    category: v.credit_category,
    min_fico: v.typical_personal_fico_min,
    time_in_business: v.time_in_business_min_months,
    pg_required: v.pg_required,
    approval_level: v.approval_level,
    image: v.image,
    link: v.link
  })), [vendorsData])

  const [tier, setTier] = useState('All Tier')
  const [category, setCategory] = useState('All Categories')
  const [bureau, setBureau] = useState('All Bureau')
  const [q, setQ] = useState('')

  const filtered = vendors.filter((v) => {
    const bureauOk = bureau === 'All Bureau' ? true : v.approval_level === bureau
    const qOk = q.trim() ? (v.issuer + " " + v.card_name).toLowerCase().includes(q.trim().toLowerCase()) : true
    return bureauOk && qOk
  })

  useEffect(() => {
    const bootstrapLib = (window as unknown as { bootstrap?: any }).bootstrap
    const els = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    if (bootstrapLib && els.length) {
      els.forEach((el) => {
        try { new bootstrapLib.Tooltip(el) } catch { }
      })
    }
  }, [])

  return (
    <div className="page-content">
      <div className="container-fluid">

        {/* Header Matching Profile Page Style */}
        <div className="text-center mb-4">
          <h3 className="mb-1">Vendor Accounts</h3>
          <div className="text-muted mx-auto intro-text">
            <span className="d-block">Apply to pre-vetted vendors for business credit. Filter by tier, category, or reporting</span>
            <span className="d-block">bureau to find the best matches for your business.</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="row mb-1">
          <div className="col-12">
            <div className="card shadow-sm border-0 bg-white">
              <div className="card-body p-4">
                <h6 className="fw-bold mb-4 d-flex align-items-center">
                  <i className="ri-filter-2-line me-2 text-primary"></i> Filter Vendors
                </h6>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label small text-muted mb-2">Filter by Tier</label>
                    <select className="form-select bg-light border-0" value={tier} onChange={(e) => setTier(e.target.value)}>
                      <option>All Tier</option>
                      <option>Tier 1</option>
                      <option>Tier 2</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small text-muted mb-2">Filter by Category</label>
                    <select className="form-select bg-light border-0" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option>All Categories</option>
                      <option>Revolving</option>
                      <option>Corporate</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small text-muted mb-2">Reporting Bureau</label>
                    <select className="form-select bg-light border-0" value={bureau} onChange={(e) => setBureau(e.target.value)}>
                      <option>All Bureau</option>
                      <option>Easy</option>
                      <option>Moderate</option>
                      <option>Hard</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small text-muted mb-2">Search Vendors</label>
                    <div className="d-flex gap-2">
                      <input
                        type="text"
                        className="form-control bg-light border-0"
                        placeholder="Search by vendor name..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                      />
                      <button className="btn btn-dark px-3 fw-bold flex-shrink-0" style={{ backgroundColor: '#00204a' }}>+ Filters</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colorful Premium Cards - Sharp Design */}
        <div className="row g-4">
          {filtered.length ? (
            filtered.map((v) => (
              <div key={v.id} className="col-md-6 col-lg-4 col-xl-3">
                <div className={`card h-100 vendor-card-colorful border-0 shadow-sm overflow-hidden bg-white mt-1 border-top-accent-${v.category.toLowerCase()}`}>

                  {/* Visual Header with Subtle Gradient Background */}
                  <div className="v-card-visual position-relative" style={{ height: '160px' }}>
                    <div className="position-absolute top-0 end-0 m-3 z-1">
                      <span className={`badge px-3 py-1 fs-10 fw-bold shadow-sm ${v.approval_level === 'Easy' ? 'bg-success text-white' :
                        v.approval_level === 'Moderate' ? 'bg-primary text-white' :
                          v.approval_level === 'Hard' ? 'bg-warning text-dark' :
                            'bg-danger text-white'
                        }`} style={{ borderRadius: '4px' }}>
                        {v.approval_level}
                      </span>
                    </div>
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center p-4 v-gradient-bg">
                      <img
                        src={v.image}
                        alt={v.card_name}
                        className="vendor-logo-luxury w-100 h-100 object-fit-contain transition-all"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/fch-logo-ver.png' }}
                      />
                    </div>
                  </div>

                  <div className="card-body p-4 d-flex flex-column">
                    <div className="mb-auto">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className={`issuer-dot dot-${v.category.toLowerCase()}`}></span>
                        <span className="text-primary text-uppercase fw-bold tracking-widest fs-10">{v.issuer}</span>
                      </div>
                      <h5 className="card-title fw-bold text-dark mb-1 fs-16 lh-base" style={{ height: '38px', overflow: 'hidden' }}>{v.card_name}</h5>
                      <div className="text-muted fs-12 mb-3 d-flex align-items-center gap-1">
                        <span className={`badge fs-10 border text-uppercase ${v.category === 'Revolving' ? 'border-primary text-primary' :
                          v.category === 'Charge' ? 'border-success text-success' :
                            'border-dark text-dark'
                          }`} style={{ borderRadius: '2px', backgroundColor: 'transparent' }}>
                          {v.category}
                        </span>
                      </div>

                      {/* Professional Metric Grid with Color Accents */}
                      <div className="row g-2 mb-4">
                        <div className="col-6">
                          <div className="p-2 border border-light rounded-1 metric-box-primary h-100 shadow-sm-hover">
                            <div className="d-flex align-items-center gap-1 mb-1">
                              <i className="ri-user-star-line text-primary smaller"></i>
                              <span className="text-muted smaller fw-bold text-uppercase tracking-wider">Min FICO</span>
                            </div>
                            <div className="fw-bold text-dark fs-13 ps-3">{v.min_fico || 'No Min'}</div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="p-2 border border-light rounded-1 metric-box-success h-100 shadow-sm-hover">
                            <div className="d-flex align-items-center gap-1 mb-1">
                              <i className="ri-calendar-line text-success smaller"></i>
                              <span className="text-muted smaller fw-bold text-uppercase tracking-wider">TIB</span>
                            </div>
                            <div className="fw-bold text-dark fs-13 ps-3">{v.time_in_business} Mo+</div>
                          </div>
                        </div>
                        <div className="col-12 mt-2">
                          <div className="p-2 border border-light rounded-1 metric-box-warning d-flex justify-content-between align-items-center shadow-sm-hover transition-all">
                            <div className="d-flex align-items-center gap-1">
                              <i className="ri-shield-user-line text-warning smaller"></i>
                              <span className="text-muted smaller fw-bold text-uppercase tracking-wider">PG Required</span>
                            </div>
                            <span className="fw-bold text-dark fs-13">{v.pg_required}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3">
                      <a
                        href={v.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-luxury-action w-100 py-2 fs-13 fw-bold d-flex align-items-center justify-content-center gap-2 transition-all"
                        style={{ borderRadius: '4px' }}
                      >
                        Apply Now <i className="ri-arrow-right-up-line fs-14"></i>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center py-5">
              <div className="avatar-lg mx-auto mb-4">
                <div className="avatar-title bg-light text-primary fs-24 rounded-circle">
                  <i className="ri-search-line"></i>
                </div>
              </div>
              <h5 className="fw-bold">No matching vendors</h5>
              <p className="text-muted">Adjust your filters to discover more results.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .vendor-card-colorful {
          border-radius: 4px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-top: 3px solid transparent;
        }
        .vendor-card-colorful:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.12) !important;
        }
        
        /* Category Accent Bars */
        .border-top-accent-revolving { border-top-color: #0d6efd; }
        .border-top-accent-charge { border-top-color: #198754; }
        .border-top-accent-corporate { border-top-color: #212529; }
        
        /* Metric Box Tints */
        .metric-box-primary { background-color: #f0f7ff; border-color: #d0e7ff !important; }
        .metric-box-success { background-color: #f2faf5; border-color: #dcf2e6 !important; }
        .metric-box-warning { background-color: #fffaf0; border-color: #fcedcf !important; }
        
        .v-gradient-bg {
          background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }
        
        .issuer-dot { height: 6px; width: 6px; border-radius: 50%; display: inline-block; }
        .dot-revolving { background-color: #0d6efd; }
        .dot-charge { background-color: #198754; }
        .dot-corporate { background-color: #212529; }
        
        .btn-luxury-action {
          background: linear-gradient(to right, #00204a, #00306c);
          color: white;
          border: none;
        }
        .btn-luxury-action:hover {
          background: linear-gradient(to right, #00306c, #00408d);
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,32,74,0.3);
        }
        
        .shadow-sm-hover { transition: all 0.2s ease; }
        .shadow-sm-hover:hover { box-shadow: 0 2px 4px rgba(0,0,0,0.05); transform: scale(1.01); }
        
        .smaller { font-size: 10px; }
        .fs-10 { font-size: 10px; }
        .fs-13 { font-size: 13px; }
        .fs-16 { font-size: 16px; }
        .tracking-widest { letter-spacing: 0.15em; }
        .tracking-wider { letter-spacing: 0.05em; }
        
        .vendor-logo-luxury { transition: transform 0.4s ease; }
        .vendor-card-colorful:hover .vendor-logo-luxury { transform: scale(1.08); }
      `}</style>
    </div>
  )
}
