import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCreditAccounts, useCreditAccountFilters, applyForCreditAccount } from '../../../modules/credit-accounts'
import { useAuthStore } from '../../../store/auth/authStore'
import VendorCardLoader from '../../../components/Loader/VendorCardLoader'
import CustomDropdown from '../../../components/Common/CustomDropdown'
import { creditAccountStatusOptions } from '../../../config/creditAccountStatusOptions'
import { toast } from 'react-toastify'
import { refreshUser as refreshUserService } from '../../../modules/auth-profile/services'

const API_STORAGE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace('/api/v1', '/storage/')

export default function CreditAccounts() {
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

  const { user, setUserData } = useAuthStore()
  const isTierLocked = (user?.current_tier ?? 0) < 2

  useEffect(() => {
    const fetchFreshUser = async () => {
      const response = await refreshUserService()
      const freshUser = response?.user || response
      if (freshUser && typeof freshUser === 'object') {
        setUserData(freshUser)
      }
    }
    fetchFreshUser()
  }, [setUserData])



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
  }, { enabled: !isTierLocked })

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
      personal_guarantee: v.personal_guarantee,
      business_credit_profile: v.business_credit_profile,
      final_approval: v.final_approval,
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
        <div className="text-center my-4">
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
                        disabled={isTierLocked}
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
                      disabled={isTierLocked}
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
                      disabled={isTierLocked}
                      className="border-0 rounded-2 fs-13 vendor-filter-bg"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 ms-lg-auto">
                    <button
                      className="btn vendor-filter-btn-apply d-flex align-items-center justify-content-center gap-2 px-3 transition-all fs-13 shadow-sm"
                      onClick={handleApplyFilters}
                      disabled={isTierLocked}
                    >
                      <i className="ri-equalizer-line"></i> Filters
                    </button>
                    <button
                      className="btn vendor-filter-btn-clear d-flex align-items-center justify-content-center gap-2 px-3 transition-all fs-13"
                      onClick={handleResetFilters}
                      disabled={isTierLocked}
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
          {isTierLocked ? (
            <div className="col-12 mt-4">
              <div className="no-result-elegant d-flex align-items-center justify-content-center rounded-1 overflow-hidden position-relative bg-white border border-light-subtle shadow-sm" style={{ minHeight: '400px' }}>
                {/* Refined Geometric Background Elements */}
                <div className="position-absolute top-0 start-0 w-100 h-100 opacity-25">
                  <div className="position-absolute top-0 start-0 w-100 h-100" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(13,110,253,0.03) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(13,110,253,0.03) 0%, transparent 50%)' }}></div>
                  <div className="position-absolute top-0 start-0 w-100 h-100" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%230d6efd\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M0 40h40V0H0v40zM1 39h38V1H1v38z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
                </div>

                <div className="text-center position-relative z-1 p-4">
                  <div className="mb-4 position-relative d-inline-block">
                    <div className="floating-icon-wrapper rounded-circle bg-warning-subtle d-flex align-items-center justify-content-center shadow-md" style={{ width: '100px', height: '100px' }}>
                      <i className="ri-lock-password-line fs-48 text-warning opacity-75"></i>
                    </div>
                  </div>

                  <h4 className="text-dark mb-2">Feature Locked</h4>
                  <p className="text-muted fs-14 mx-auto mb-4 fw-normal lh-base" style={{ maxWidth: '550px' }}>
                    You must complete tier 0 for applying credit account.
                    Please visit the Credit Builder dashboard to track your progress and unlock this feature.
                  </p>

                  <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-3">
                    <Link
                      to="/credit-builder/guide"
                      className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2 transition-all hover-translate-y fs-13"
                    >
                      <i className="ri-book-open-line fs-16"></i> Go to Guide
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <VendorCardLoader count={8} />
          ) : vendors.length ? (
            vendors.map((v: any) => (
              <div key={v.id} className="col-md-6 col-lg-4 col-xl-3">
                <div className={`card vendor-card-colorful mb-0 border-0 shadow-sm overflow-hidden bg-white mt-1 border-top-accent-${(v.category || '').toLowerCase()}`}>

                  {/* Visual Header with Subtle Gradient Background */}
                  <div className="v-card-visual position-relative h-130px">

                    {/* Approval Level - Modern Tag Style */}
                    <div className="position-absolute top-0 start-0 m-0 z-2">
                      <span className={`approval-tag-modern tag-${(v.approval_level || '').toLowerCase()}`}>
                        {v.approval_level || 'N/A'}
                      </span>
                    </div>

                    <div className="position-absolute top-0 end-0 m-3 z-2 d-flex align-items-center gap-2">
                      {/* Manual Status Dropdown */}
                      <div className="dropdown">
                        <button
                          className="btn btn-sm btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center p-0 w-26px h-26px"
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
                        <span className={`issuer-dot dot-${(v.category || '').toLowerCase()}`}></span>
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
                        {/* Supplemental Details */}
                        <div className="col-12 mt-2">
                          <div className="p-2 border border-light border-dashed rounded-2 d-flex flex-column gap-2">
                            <div className="d-flex justify-content-between align-items-start">
                              <span className="text-muted fs-12 fw-medium d-flex align-items-center gap-1"><i className="ri-shield-user-line text-primary fs-13"></i> PG Required</span>
                              <span className="text-muted fs-12 text-end" style={{ maxWidth: '60%' }}>{(v.personal_guarantee && v.personal_guarantee.trim() !== '') ? v.personal_guarantee : 'Not Required'}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-start">
                              <span className="text-muted fs-12 fw-medium d-flex align-items-center gap-1"><i className="ri-briefcase-4-line text-warning fs-13"></i>Credit Profile</span>
                              <span className="text-muted fs-12 text-end" style={{ maxWidth: '60%' }}>{(v.business_credit_profile && v.business_credit_profile.trim() !== '') ? v.business_credit_profile : 'Not Required'}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-start">
                              <span className="text-muted fs-12 fw-medium d-flex align-items-center gap-1"><i className="ri-checkbox-circle-line text-success fs-13"></i> Final Approval</span>
                              <span className="text-muted fs-12 text-end" style={{ maxWidth: '60%' }}>{(v.final_approval && v.final_approval.trim() !== '') ? v.final_approval : 'Not Required'}</span>
                            </div>
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
            <div className="col-12 mt-4">
              <div className="no-result-elegant d-flex align-items-center justify-content-center rounded-1 overflow-hidden position-relative bg-white border border-light-subtle shadow-sm" style={{ minHeight: '400px' }}>
                {/* Refined Geometric Background Elements */}
                <div className="position-absolute top-0 start-0 w-100 h-100 opacity-25">
                  <div className="position-absolute top-0 start-0 w-100 h-100" style={{ backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(13,110,253,0.03) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(13,110,253,0.03) 0%, transparent 50%)' }}></div>
                  <div className="position-absolute top-0 start-0 w-100 h-100" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%230d6efd\' fill-opacity=\'0.02\'%3E%3Cpath d=\'M0 40h40V0H0v40zM1 39h38V1H1v38z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
                </div>

                <div className="text-center position-relative z-1 p-4">
                  <div className="mb-4 position-relative d-inline-block">
                    <div className="floating-icon-wrapper rounded-circle bg-primary-subtle d-flex align-items-center justify-content-center shadow-md" style={{ width: '100px', height: '100px' }}>
                      <i className="ri-database-2-line fs-48 text-primary opacity-75"></i>
                      <div className="position-absolute bottom-0 end-0 mb-0 me-0">
                        <div className="bg-white rounded-circle p-1.5 shadow-sm border border-light">
                          <i className="ri-search-line fs-18 text-primary"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-dark mb-2">No Matching Accounts</h4>
                  <p className="text-muted fs-14 mx-auto mb-4 fw-normal lh-base" style={{ maxWidth: '550px' }}>
                    We couldn't find any credit opportunities matching your current search or eligibility parameters.
                    Meeting different business metrics or clearing filters may reveal more options.
                  </p>

                  <div className="d-flex flex-column flex-sm-row align-items-center justify-content-center gap-3">
                    <button
                      className="btn btn-primary px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center gap-2 transition-all hover-translate-y fs-13"
                      onClick={handleResetFilters}
                    >
                      <i className="ri-restart-line fs-16"></i> Clear All Requirements
                    </button>

                  </div>
                </div>
              </div>
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
                    className="page-link border-0 shadow-sm d-flex align-items-center justify-content-center w-36px h-36px rounded-6"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
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
                          className={`page-link border-0 shadow-sm d-flex align-items-center justify-content-center fw-bold w-36px h-36px rounded-6 ${page === p ? 'bg-primary text-white' : 'bg-white text-dark'}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </button>
                      </li>
                    </React.Fragment>
                  ))
                }

                <li className={`page-item ${page === accountsData.meta.last_page ? 'disabled' : ''}`}>
                  <button
                    className="page-link border-0 shadow-sm d-flex align-items-center justify-content-center w-36px h-36px rounded-6"
                    onClick={() => setPage(p => Math.min(accountsData.meta?.last_page || 1, p + 1))}
                    disabled={page === accountsData.meta.last_page}
                  >
                    <i className="ri-arrow-right-s-line fs-18"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

    </div>
  )
}
