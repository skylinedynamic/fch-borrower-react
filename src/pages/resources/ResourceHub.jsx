import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const mockResources = {
  education_help: [
    { id: 1, title: 'Credit Building Basics', subtitle: 'Understanding the fundamentals of credit scoring', icon: 'ri-book-line' },
    { id: 2, title: 'Loan Application Guide', subtitle: 'Step-by-step process for applying', icon: 'ri-question-fill' },
    { id: 3, title: 'Financial Planning', subtitle: 'How to manage your wealth', icon: 'ri-bank-card-line' },
    { id: 4, title: 'Debt Consolidation', subtitle: 'Strategies to lower interest', icon: 'ri-exchange-dollar-line' }
  ],
  legal_registration: [
    { id: 5, title: 'LLC Formation Guide', subtitle: 'Complete guide to forming an LLC', icon: 'ri-building-line' },
    { id: 6, title: 'EIN Registration', subtitle: 'How to get your tax ID', icon: 'ri-file-paper-2-line' },
    { id: 7, title: 'State Licenses', subtitle: 'Directory of state business licenses', icon: 'ri-government-line' }
  ],
  business_services: [
    { id: 8, title: 'Accounting Resources', subtitle: 'Top rated accounting software', icon: 'ri-calculator-line' },
    { id: 9, title: 'Business Insurance', subtitle: 'Protecting your assets', icon: 'ri-shield-star-line' },
    { id: 10, title: 'Marketing Tools', subtitle: 'Grow your customer base', icon: 'ri-megaphone-line' }
  ],
  download_assets: [
    { id: 11, title: 'Business Plan Template', subtitle: 'PDF Download', icon: 'ri-file-pdf-line' },
    { id: 12, title: 'Cash Flow Spreadsheet', subtitle: 'Excel Download', icon: 'ri-file-excel-line' },
    { id: 13, title: 'Loan Eligibility Checklist', subtitle: 'PDF Download', icon: 'ri-file-list-3-line' }
  ],
  training_academy: [
    { id: 14, title: 'How to Boost Credit Score Fast', subtitle: 'Video Tutorial', duration: '12:30', views: '2.5k' },
    { id: 15, title: 'Navigating the Borrower Portal', subtitle: 'Platform Walkthrough', duration: '08:45', views: '1.2k' },
    { id: 16, title: 'Structuring Business Debt', subtitle: 'Advanced Class', duration: '45:00', views: '800' }
  ]
};

const ResourceHub = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Visibility states for pagination
  const [showAllLegal, setShowAllLegal] = useState(false);
  const [showAllBusiness, setShowAllBusiness] = useState(false);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [showAllEducation, setShowAllEducation] = useState(false);
  const [showAllVideos, setShowAllVideos] = useState(false);

  const isLoading = false;
  const resources = mockResources;

  // Handlers
  const handleEdit = (resource, type) => {
    console.log('Edit clicked', resource, type);
  };

  const handleAddNew = (type) => {
    console.log('Add new clicked', type);
  };

  const handleDeleteClick = (resource) => {
    console.log('Delete clicked', resource);
  };

  const handleItemClick = (item, forceDownload = false) => {
    console.log('Resource Clicked:', item);
  };

  // Data Logic
  const getColorByIcon = (icon) => {
    if (!icon) return 'primary';
    if (icon.includes('lightbulb') || icon.includes('warning') || icon.includes('flash')) return 'warning';
    if (icon.includes('government') || icon.includes('folder') || icon.includes('question') || icon.includes('faqs')) return 'primary';
    if (icon.includes('honour') || icon.includes('bank') || icon.includes('book') || icon.includes('glossary') || icon.includes('shield')) return 'indigo';
    if (icon.includes('building') || icon.includes('wallet') || icon.includes('cash')) return 'info';
    if (icon.includes('delete') || icon.includes('danger') || icon.includes('denial')) return 'danger';
    if (icon.includes('list') || icon.includes('checklist') || icon.includes('excel')) return 'success';
    return 'primary';
  };

  const filterItems = (items) => {
    if (!items) return [];
    if (!searchTerm) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const filteredEdu = filterItems(resources.education_help).map(item => ({
    id: item.id,
    title: item.title,
    sub: item.subtitle,
    icon: item.icon || 'ri-book-line',
    color: getColorByIcon(item.icon || ''),
    original: item
  }));

  const filteredLegal = filterItems(resources.legal_registration);
  const filteredBus = filterItems(resources.business_services);

  const documentItems = filterItems(resources.download_assets).map(item => ({
    id: item.id,
    title: item.title,
    sub: item.subtitle,
    type: "PDF",
    color: getColorByIcon(item.icon || 'ri-file-list-3-line'),
    icon: item.icon || "ri-file-list-3-line",
    original: item
  }));

  const trainingVideos = filterItems(resources.training_academy).map((item, i) => ({
    id: item.id,
    title: item.title,
    duration: item.duration || "10:00",
    views: item.views || "1k",
    color: i % 2 === 0 ? "#4b38b3" : "#0ab39c",
    original: item
  }));

  const visibleVideos = showAllVideos ? trainingVideos : trainingVideos.slice(0, 4);

  return (
    <div className="page-content" style={{ backgroundColor: '#f4f6f9' }}>
      <div className="container-fluid">

        {/* Standard Sticky Subheader - Always Shown */}
        <div className="row page-subheader-sticky bg-body">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between flex-row py-2">
              <div className="flex-grow-1">
                <h4 className="fs-20 mb-1">Resource Hub</h4>
                <nav aria-label="breadcrumb" className="d-none d-sm-block">
                  <ol className="breadcrumb m-0">
                    <li className="breadcrumb-item"><Link to="/">Dashboard</Link></li>
                    <li className="breadcrumb-item active fw-medium" aria-current="page">Resource Hub</li>
                  </ol>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Header */}
        <div className="row g-3">
          {[
            { label: 'Total Resources', value: filteredEdu.length + documentItems.length + trainingVideos.length, icon: 'ri-grid-fill', color: 'primary' },
            { label: 'Service Providers', value: (resources.business_services || []).length, icon: 'ri-briefcase-fill', color: 'primary' },
            { label: 'Categories Covered', value: '6', icon: 'ri-stack-fill', color: 'warning' },
            { label: 'Quick Tools', value: documentItems.length, icon: 'ri-rocket-2-fill', color: 'primary' }
          ].map((stat, i) => (
            <div className="col-md-3" key={i}>
              <div className="card shadow-sm border-0 rounded-2 bg-white card-animate">
                <div className="card-body py-3 px-4 d-flex align-items-center animate-blur-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={`avatar-md bg-${stat.color}-subtle rounded d-flex align-items-center justify-content-center me-3 flex-shrink-0`}>
                    <i className={`${stat.icon} text-${stat.color} fs-24`}></i>
                  </div>
                  <div>
                    <p className="text-muted mb-0 fs-13 fw-medium text-uppercase tracking-tight">{stat.label}</p>
                    <h4 className="mb-0 fw-bold text-dark fs-22 lh-1">{stat.value}</h4>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="row g-4">

              {/* Category Sections */}
              <div className="col-md-6">
                <div className="card shadow-sm border-0 rounded-2 h-100 bg-white">
                  <div className="card-header bg-transparent border-0 pt-4 px-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <h6 className="fw-bold text-dark mb-0 fs-15">Legal & Registration</h6>
                  </div>
                  <div className="card-body p-4 pt-2">
                    <div className={`d-flex flex-column gap-3 ${showAllLegal && filteredLegal.length > 4 ? 'scrollable-container' : ''}`}>
                      {(showAllLegal ? filteredLegal : filteredLegal.slice(0, 4)).map((item, i) => (
                        <div className="p-3 rounded-2 border border-light-subtle d-flex align-items-center luxe-item transition-all" key={item.id} onClick={() => handleEdit(item, "legal_registration")}>
                          <div className="flex-shrink-0 avatar-xs bg-indigo-subtle rounded d-flex align-items-center justify-content-center me-3 luxe-icon">
                            <i className={`${item.icon || 'ri-article-line'} text-indigo fs-18`}></i>
                          </div>
                          <div className="flex-grow-1 overflow-hidden pe-2">
                            <h6 className="mb-1 fw-bold fs-14 text-dark text-truncate">{item.title}</h6>
                            <span className="text-muted fs-11 text-truncate d-block">{item.subtitle}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {!showAllLegal && (resources.legal_registration || []).length > 4 && (
                      <div className="text-center mt-3 pt-2 border-top border-light-subtle">
                        <button className="btn btn-link btn-sm text-primary fw-bold text-decoration-none p-0" onClick={() => setShowAllLegal(true)}>
                          View More <i className="ri-arrow-down-s-line align-middle"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card shadow-sm border-0 rounded-2 h-100 bg-white">
                  <div className="card-header bg-transparent border-0 pt-4 px-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <h6 className="fw-bold text-dark mb-0 fs-15">Business Services</h6>
                  </div>
                  <div className="card-body p-4 pt-2">
                    <div className={`d-flex flex-column gap-3 ${showAllBusiness && filteredBus.length > 4 ? 'scrollable-container' : ''}`}>
                      {(showAllBusiness ? filteredBus : filteredBus.slice(0, 4)).map((item, i) => (
                        <div className="p-3 rounded-2 border border-light-subtle d-flex align-items-center luxe-item-success transition-all" key={item.id} onClick={() => handleEdit(item, 'business_services')}>
                          <div className="flex-shrink-0 avatar-xs bg-success-subtle rounded d-flex align-items-center justify-content-center me-3 luxe-icon">
                            <i className={`${item.icon || 'ri-phone-circle-line'} text-success fs-18`}></i>
                          </div>
                          <div className="flex-grow-1 overflow-hidden pe-2">
                            <h6 className="mb-1 fw-bold fs-14 text-dark text-truncate">{item.title}</h6>
                            <span className="text-muted fs-11 text-truncate d-block">{item.subtitle}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {!showAllBusiness && (resources.business_services || []).length > 4 && (
                      <div className="text-center mt-3 pt-2 border-top border-light-subtle">
                        <button className="btn btn-link btn-sm text-success fw-bold text-decoration-none p-0" onClick={() => setShowAllBusiness(true)}>
                          View More <i className="ri-arrow-down-s-line align-middle"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Education Library - Search Field Moved Here */}
              <div className="col-12">
                <div className="card shadow-sm border-0 rounded-2 bg-white">
                  <div className="card-header border-0 bg-navy-gradient p-4">
                    <div className="d-flex flex-column flex-lg-row align-items-center justify-content-between gap-4">
                      <div className="flex-grow-1 header-text-group">
                        <h5 className="fw-bold text-white mb-1 fs-18">Education & Help</h5>
                        <p className="text-white opacity-75 mb-0 fs-13 description-text">
                          Detailed library of borrower education guides, credit building tips, and FAQs.
                        </p>
                      </div>
                      <div className="d-flex align-items-center gap-2 gap-md-2 w-lg-auto mt-3 mt-lg-0 justify-content-end">
                        <div className="search-box-premium position-relative flex-grow-1 flex-lg-grow-0" style={{ maxWidth: '250px', minWidth: '150px' }}>
                          <i className="ri-search-2-line text-white opacity-50 fs-16 position-absolute top-50 start-0 translate-middle-y ms-3"></i>
                          <input
                            type="text"
                            className="form-control bg-white bg-opacity-10 border-white border-opacity-20 rounded-pill ps-5 py-2 fs-13 text-white shadow-none focus-white-glow transition-all placeholder-white-50"
                            style={{ height: '40px' }}
                            placeholder="Search Education & Help..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card-body p-4">
                    <div className={`${showAllEducation && filteredEdu.length > 12 ? 'scrollable-container-edu' : ''}`}>
                      <div className="row g-4 mb-2">
                        {(showAllEducation ? filteredEdu : filteredEdu.slice(0, 12)).map((edu, i) => (
                          <div className="col-6 col-md-4 col-xl-3" key={edu.id || i}>
                            <div className="p-4 rounded-3 text-center edu-box-premium transition-all cursor-pointer h-100 border border-light-subtle position-relative bg-white shadow-sm" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }} onClick={() => handleEdit(edu.original, "education_help")}>
                              <div className={`avatar-sm bg-${edu.color}-subtle rounded-3 d-flex align-items-center justify-content-center mx-auto mb-3`}>
                                <i className={`${edu.icon} text-${edu.color} fs-20`}></i>
                              </div>
                              <h6 className="mb-2 fw-bold fs-14 text-dark">{edu.title}</h6>
                              <p className="text-muted fs-11 mb-0 fw-medium opacity-75">{edu.sub}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {!showAllEducation && filteredEdu.length > 12 && (
                      <div className="text-center mt-4 pt-4 border-top border-light-subtle">
                        <button className="btn btn-soft-primary px-4 py-2 fs-12 fw-bold rounded-pill" onClick={() => setShowAllEducation(true)}>
                          Show More Articles <i className="ri-arrow-down-s-line ms-1"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="d-flex flex-column gap-4">

              {/* Asset Sidebar */}
              <div className="card shadow-sm border-0 rounded-2 bg-white mb-0">
                <div className="card-header border-bottom border-light p-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <h6 className="fw-bold text-dark mb-0 fs-14 text-uppercase tracking-wider">Download Assets</h6>
                </div>
                <div className="card-body p-0">
                  <div className={`list-group list-group-flush ${showAllAssets && documentItems.length > 4 ? 'scrollable-container-assets' : ''}`}>
                    {(showAllAssets ? documentItems : documentItems.slice(0, 4)).map((doc, i) => (
                      <div className="list-group-item border-0 p-3 transition-all d-flex align-items-center justify-content-between cursor-pointer download-asset-item" key={doc.id} onClick={() => handleEdit(doc.original, "download_assets")}>
                        <div className="d-flex align-items-center flex-grow-1 pe-2">
                          <div className={`avatar-xs bg-${doc.color}-subtle rounded d-flex align-items-center justify-content-center me-3 flex-shrink-0`}>
                            <i className={`${doc.icon} text-${doc.color} fs-16`}></i>
                          </div>
                          <h6 className="mb-0 fs-13 fw-semibold text-dark text-truncate">{doc.title}</h6>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <i
                            className="ri-download-2-line text-muted fs-18 cursor-pointer hover-primary p-2 download-icon-action transition-all"
                            onClick={(e) => { e.stopPropagation(); handleItemClick(doc.original, true); }}
                            title="Download"
                          ></i>
                        </div>
                      </div>
                    ))}
                  </div>
                  {!showAllAssets && documentItems.length > 4 && (
                    <div className="p-3 text-center border-top border-light-subtle">
                      <button className="btn btn-link btn-sm text-danger fw-bold text-decoration-none p-0" onClick={() => setShowAllAssets(true)}>
                        View More Assets <i className="ri-arrow-down-s-line align-middle"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Training Academy */}
              <div className="card shadow-sm border-0 rounded-2 bg-white animate-fade-in-right">
                <div className="card-header border-bottom border-light p-4 d-flex align-items-center justify-content-between gap-2">
                  <h6 className="fw-bold text-dark mb-0 fs-15 text-nowrap"><i className="ri-youtube-fill text-danger me-2"></i> Training Academy</h6>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-danger-subtle text-danger fs-10 text-nowrap">{trainingVideos.length} Videos</span>
                  </div>
                </div>
                <div className="card-body p-4 pt-3">
                  <div className={`d-flex flex-column gap-4 ${showAllVideos && trainingVideos.length > 4 ? 'scrollable-container' : ''}`}>
                    {visibleVideos.map((video, i) => (
                      <div className="video-item d-flex align-items-center gap-3 cursor-pointer group" key={video.id} onClick={() => handleEdit(video.original, "training_academy")}>
                        <div className="video-thumb position-relative rounded-2 flex-shrink-0 overflow-hidden shadow-sm" style={{ width: '110px', height: '64px' }}>
                          <img
                            src={video.original.file_url || `https://placehold.co/220x128/${video.color.replace('#', '')}/white?text=Tutorial+${i + 1}`}
                            alt={video.title}
                            className="w-100 h-100 object-cover"
                          />
                          <div className="bg-overlay-dark position-absolute top-0 start-0 w-100 h-100 bg-dark opacity-25"></div>
                          <i className="ri-play-circle-fill text-white fs-28 position-absolute top-50 start-50 translate-middle z-1 mb-0 transition-all play-icon"></i>
                          <span className="position-absolute bottom-0 end-0 bg-dark bg-opacity-75 text-white fs-9 px-1 rounded-1 m-1 fw-semibold">{video.duration}</span>
                        </div>
                        <div className="flex-grow-1 pe-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <h6 className="mb-1 fs-13 fw-bold text-dark lh-base transition-all video-title multi-line-truncate">{video.title}</h6>
                          </div>
                          <div className="d-flex align-items-center gap-1 opacity-75">
                            <span className="fs-10 text-muted">{video.views} views</span>
                            <span className="fs-10 text-muted">•</span>
                            <span className="fs-10 text-muted">Tutorial</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {!showAllVideos && trainingVideos.length > 4 && (
                    <div className="mt-4 pt-2 border-top border-light text-center">
                      <button
                        className="btn btn-link btn-sm text-secondary p-0 fw-bold text-decoration-none hover-indigo"
                        onClick={() => setShowAllVideos(true)}
                      >
                        Load More Videos <i className="ri-arrow-down-s-line align-middle"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
        .description-text {
          display: -webkit-box;
          -webkit-line-clamp: 3; /* max 3 lines */
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Desktop: force 1 line */
        @media (min-width: 992px) {
          .description-text {
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
          }
        }
        .bg-indigo { background: #4b38b3; }
        .text-indigo { color: #4b38b3 !important; }
        .bg-indigo-subtle { background: rgba(75, 56, 179, 0.12); }
        .bg-success-subtle { background: rgba(10, 179, 156, 0.12); }
        .bg-danger-subtle { background: rgba(240, 101, 72, 0.12); }
        .bg-warning-subtle { background: rgba(247, 184, 75, 0.12); }
        .bg-primary-subtle { background: rgba(75, 56, 179, 0.12); }
        .bg-navy { background: #1a1e4a; }
        .bg-navy-gradient { background: linear-gradient(135deg, #1a1e4a 0%, #293275 100%); }
        
        .placeholder-white-50::placeholder { color: rgba(255, 255, 255, 0.5); }
        
        .metric-accent { position: absolute; top: 0; left: 0; height: 100%; width: 4px; }
        .luxe-item:hover { background: #f8faff; border-color: rgba(75, 56, 179, 0.3) !important; box-shadow: 0 2px 8px rgba(75, 56, 179, 0.05); transform: translateY(-2px); }
        .luxe-item-success:hover { background: #f0fdf4; border-color: rgba(10, 179, 156, 0.3) !important; box-shadow: 0 2px 8px rgba(10, 179, 156, 0.05); transform: translateY(-2px); }
        .edu-box-premium:hover { transform: translateY(-4px); border-color: rgba(75, 56, 179, 0.3) !important; box-shadow: 0 8px 16px rgba(75, 56, 179, 0.06) !important; }
        
        .download-asset-item:hover { background-color: #ffffff !important; border-color: rgba(75, 56, 179, 0.15) !important; box-shadow: 0 4px 15px rgba(75, 56, 179, 0.08) !important; transform: translateY(-2px); z-index: 2; position: relative; }
        .download-asset-item:hover h6 { color: #4b38b3 !important; }
        .download-asset-item:hover .download-icon-action { background-color: #4b38b3 !important; color: #ffffff !important; border-radius: 6px; transform: scale(1.1) !important; box-shadow: 0 4px 8px rgba(75, 56, 179, 0.2); p: 6px; }
        
        .video-item:hover .play-icon { transform: translate(-50%, -50%) scale(1.1); color: #f06548 !important; }
        .video-item:hover .video-title { color: #4b38b3 !important; }
        .object-cover { object-fit: cover; }
        
        .multi-line-truncate {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
          .resource-card-icon{ 
          }

        .hover-indigo:hover { color: #4b38b3 !important; }
        .tracking-tight { letter-spacing: -0.01em; }

        @keyframes blurIn { from { opacity: 0; filter: blur(5px); } to { opacity: 1; filter: blur(0); } }
        .animate-blur-in { animation: blurIn 0.5s ease-out; }

        .transition-all { transition: all 0.25s ease; }
        .tracking-widest { letter-spacing: 0.1em; }
        .card-animate:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.06) !important; }

        .scrollable-container { max-height: 380px; overflow-y: auto; padding-right: 8px; }
        .scrollable-container-assets { max-height: 280px; overflow-y: auto; }
        .scrollable-container-edu { max-height: 450px; overflow-y: auto; padding: 4px; overflow-x: hidden; }
        
        .scrollable-container::-webkit-scrollbar, 
        .scrollable-container-assets::-webkit-scrollbar,
        .scrollable-container-edu::-webkit-scrollbar { width: 4px; }

        .scrollable-container::-webkit-scrollbar-track, 
        .scrollable-container-assets::-webkit-scrollbar-track,
        .scrollable-container-edu::-webkit-scrollbar-track { background: #f1f1f1; }

        .scrollable-container::-webkit-scrollbar-thumb, 
        .scrollable-container-assets::-webkit-scrollbar-thumb,
        .scrollable-container-edu::-webkit-scrollbar-thumb { background: #e2e5ec; border-radius: 10px; }

        .scrollable-container::-webkit-scrollbar-thumb:hover, 
        .scrollable-container-assets::-webkit-scrollbar-thumb:hover,
        .scrollable-container-edu::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
      </div>
    </div>
  );
};

export default ResourceHub;
