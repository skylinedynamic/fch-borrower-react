import React, { useEffect, useMemo, useState } from 'react'
import { useCreditAccounts, useCreditAccountFilters, applyForCreditAccount } from '../../../modules/credit-accounts'
import VendorCardLoader from '../../../components/Loader/VendorCardLoader'
import CustomDropdown from '../../../components/Common/CustomDropdown'
import { creditAccountStatusOptions } from '../../../config/creditAccountStatusOptions'
import { toast } from 'react-toastify'

const API_STORAGE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace('/api/v1', '/storage/')

export default function VendorApplication() {
  const [localFilters, setLocalFilters] = useState({
    category: 'All Categories',
    issuer: 'All Issuers',
    q: ''
  })
  const [appliedFilters, setAppliedFilters] = useState({
    category: '',
    issuer: '',
    q: ''
  })
  const [page, setPage] = useState(1)

  // Fetch filter options from DB
  const { data: filterOptionsData } = useCreditAccountFilters()

  const categories = useMemo(() => {
    const list = filterOptionsData?.data?.categories || []
    return [{ id: 'All Categories', name: 'All Categories' }, ...list.map(c => ({ id: c, name: c }))]
  }, [filterOptionsData])

  const issuers = useMemo(() => {
    const list = filterOptionsData?.data?.issuers || []
    return [{ id: 'All Issuers', name: 'All Issuers' }, ...list.map(i => ({ id: i, name: i }))]
  }, [filterOptionsData])

  const handleApplyFilters = () => {
    setPage(1)
    setAppliedFilters({
      category: localFilters.category === 'All Categories' ? '' : localFilters.category,
      issuer: localFilters.issuer === 'All Issuers' ? '' : localFilters.issuer,
      q: localFilters.q.trim()
    })
  }

  const handleResetFilters = () => {
    const defaultFilters = {
      category: 'All Categories',
      issuer: 'All Issuers',
      q: ''
    }
    setLocalFilters(defaultFilters)
    setPage(1)
    setAppliedFilters({
      category: '',
      issuer: '',
      q: ''
    })
  }

  const { data: accountsData, isLoading, refetch: refetchVendors } = useCreditAccounts({
    ...appliedFilters,
    page: page
  })

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response: any = await applyForCreditAccount(id, status);
      toast.success(response?.message || "Status updated successfully");
      refetchVendors();
    } catch (err: any) {
      console.error("Status update failed:", err);
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const vendors = useMemo(() => {
    // API response is now { status: true, message: ..., data: [...] }
    const list = accountsData?.data || []
    return list.map((v: any) => ({
      id: v.id,
      issuer: v.issuer,
      card_name: v.card_name,
      category: v.credit_category,
      min_fico: v.typical_personal_fico_min,
      time_in_business: v.time_in_business_min_months,
      pg_required: v.pg_required,
      approval_level: v.approval_level,
      image: v.image_url ? (v.image_url.startsWith('http') ? v.image_url : `${API_STORAGE_URL}${v.image_url}`) : '/assets/images/fch-logo-ver.png',
      link: v.reference_url,
      status: v.status
    }))
  }, [accountsData])

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
          <h3 className="mb-1">Credit Accounts</h3>
          <div className="text-muted mx-auto intro-text">
            <span className="d-block">Apply to pre-vetted vendors for business credit. Filter by category or issuer</span>
            <span className="d-block">to find the best matches for your business.</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="row mb-1">
          <div className="col-12">
            <div className="card shadow-sm border-0 bg-white">
              <div className="card-body p-4">
                <div className="vendor-filter-container">
                  {/* Search Field */}
                  <div className="vendor-filter-search">
                    <div className="input-group vendor-filter-input-group border-0 transition-all shadow-sm-hover">
                      <span className="input-group-text bg-transparent border-0 pe-1">
                        <i className="ri-search-line text-muted opacity-75"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control bg-transparent border-0 ps-1 fs-13"
                        placeholder="Search here..."
                        value={localFilters.q}
                        onChange={(e) => setLocalFilters({ ...localFilters, q: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Category Dropdown */}
                  <div className="vendor-filter-select">
                    <CustomDropdown
                      options={categories}
                      value={localFilters.category}
                      onChange={(val) => setLocalFilters({ ...localFilters, category: val })}
                      optionLabel="name"
                      optionValue="id"
                      placeholder="All Categories"
                      className="border-0 rounded-2 fs-13 vendor-filter-bg"
                    />
                  </div>

                  {/* Issuer Dropdown */}
                  <div className="vendor-filter-select">
                    <CustomDropdown
                      options={issuers}
                      value={localFilters.issuer}
                      onChange={(val) => setLocalFilters({ ...localFilters, issuer: val })}
                      optionLabel="name"
                      optionValue="id"
                      placeholder="All Issuers"
                      searchable={true}
                      className="border-0 rounded-2 fs-13 vendor-filter-bg"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 ms-lg-auto">
                    <button
                      className="btn vendor-filter-btn-apply fw-bold d-flex align-items-center justify-content-center gap-2 px-3 transition-all fs-13 shadow-sm"
                      onClick={handleApplyFilters}
                    >
                      <i className="ri-equalizer-line"></i> Filters
                    </button>
                    <button
                      className="btn vendor-filter-btn-clear fw-bold d-flex align-items-center justify-content-center gap-2 px-3 transition-all fs-13"
                      onClick={handleResetFilters}
                    >
                      <i className="ri-close-line"></i> Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colorful Premium Cards - Sharp Design */}
        <div className="row g-4">
          {isLoading ? (
            <VendorCardLoader count={8} />
          ) : vendors.length ? (
            vendors.map((v: any) => (
              <div key={v.id} className="col-md-6 col-lg-4 col-xl-3">
                <div className={`card vendor-card-colorful mb-0 border-0 shadow-sm overflow-hidden bg-white mt-1 border-top-accent-${v.category.toLowerCase()}`}>

                  {/* Visual Header with Subtle Gradient Background */}
                  <div className="v-card-visual position-relative" style={{ height: '130px' }}>

                    {/* Approval Level - Modern Tag Style */}
                    <div className="position-absolute top-0 start-0 m-0 z-2">
                      <span className={`approval-tag-modern tag-${v.approval_level.toLowerCase()}`}>
                        {v.approval_level}
                      </span>
                    </div>

                    <div className="position-absolute top-0 end-0 m-3 z-2 d-flex align-items-center gap-2">
                      {/* Manual Status Dropdown */}
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center p-0"
                          style={{ width: '26px', height: '26px' }}
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                        >
                          <i className="ri-more-2-fill fs-14"></i>
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end shadow border-0 fs-13">
                          <li><h6 className="dropdown-header text-uppercase fw-bold fs-10 tracking-widest">Mark As</h6></li>
                          {creditAccountStatusOptions.map((opt) => (
                            <li key={opt.id}>
                              <button
                                className="dropdown-item d-flex align-items-center gap-2"
                                onClick={() => handleUpdateStatus(v.id, opt.id)}
                              >
                                <span className={`dot-${opt.id.toLowerCase()}`}></span> {opt.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center p-3 v-gradient-bg">
                      <img
                        src={v.image}
                        alt={v.card_name}
                        className="vendor-logo-luxury w-100 h-100 object-fit-contain transition-all"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/assets/images/fch-logo-ver.png' }}
                      />
                    </div>
                  </div>

                  <div className="card-body p-3 d-flex flex-column">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1" style={{ minHeight: '18px' }}>
                        <span className={`issuer-dot dot-${v.category.toLowerCase()}`}></span>
                        <span className="text-primary text-uppercase fw-bold tracking-widest fs-10">{v.issuer}</span>
                      </div>
                      <h5 className="card-title fw-bold text-dark mb-2 fs-14 lh-sm" style={{
                        height: '38px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {v.card_name}
                      </h5>
                      <div className="text-muted fs-12 mb-3 mt-1 d-flex align-items-center gap-1">
                        <span className={`badge fs-10 border text-uppercase ${v.category === 'Revolving' ? 'border-primary text-primary' :
                          v.category === 'Charge' ? 'border-success text-success' :
                            'border-dark text-dark'
                          }`} style={{ borderRadius: '2px', backgroundColor: 'transparent' }}>
                          {v.category}
                        </span>
                        {/* Status Label - Reverted to Ribbon Style */}
                        {v.status && (
                          <span className={`ms-auto status-ribbon ribbon-${v.status.toLowerCase()}`}>
                            {v.status}
                          </span>
                        )}
                      </div>

                      {/* Professional Metric Grid with Color Accents */}
                      <div className="row g-2 mb-3">
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

                    <div className="mt-2">
                      <a
                        href={v.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-luxury-action w-100 py-1.5 fs-13 fw-bold d-flex align-items-center justify-content-center gap-2 transition-all"
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

        {/* Pagination Section */}
        {!isLoading && accountsData?.meta && accountsData.meta.last_page > 1 && (
          <div className="d-flex justify-content-center mt-4 mb-5">
            <nav aria-label="Vendor pagination">
              <ul className="pagination pagination-rounded gap-1 mb-0">
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link border-0 shadow-sm d-flex align-items-center justify-content-center"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ width: '36px', height: '36px', borderRadius: '6px' }}
                  >
                    <i className="ri-arrow-left-s-line fs-18"></i>
                  </button>
                </li>

                {Array.from({ length: accountsData.meta.last_page }, (_, i) => i + 1)
                  .filter(p => {
                    const lastPage = accountsData.meta?.last_page || 1;
                    return p === 1 || p === lastPage || (p >= page - 1 && p <= page + 1);
                  })
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <li className="page-item disabled">
                          <span className="page-link border-0 bg-transparent px-2">...</span>
                        </li>
                      )}
                      <li className={`page-item ${page === p ? 'active' : ''}`}>
                        <button
                          className={`page-link border-0 shadow-sm d-flex align-items-center justify-content-center fw-bold ${page === p ? 'bg-primary text-white' : 'bg-white text-dark'}`}
                          onClick={() => setPage(p)}
                          style={{ width: '36px', height: '36px', borderRadius: '6px' }}
                        >
                          {p}
                        </button>
                      </li>
                    </React.Fragment>
                  ))
                }

                <li className={`page-item ${page === accountsData.meta.last_page ? 'disabled' : ''}`}>
                  <button
                    className="page-link border-0 shadow-sm d-flex align-items-center justify-content-center"
                    onClick={() => setPage(p => Math.min(accountsData.meta?.last_page || 1, p + 1))}
                    disabled={page === accountsData.meta.last_page}
                    style={{ width: '36px', height: '36px', borderRadius: '6px' }}
                  >
                    <i className="ri-arrow-right-s-line fs-18"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
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

        /* Subtle Skeleton Loader Overrides */
        .skeleton-line {
          background: #f5f6f7;
          background: linear-gradient(90deg, #f5f6f7 25%, #ebedf0 45%, #f5f6f7 65%);
          background-size: 200% 100%;
          animation: skeleton-loading 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          display: block;
          height: 1em;
          border-radius: 4px;
          opacity: 0.8;
        }

        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}
