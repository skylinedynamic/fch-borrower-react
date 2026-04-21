import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResources, downloadResource } from '../../modules/resources';
import ResourceHubLoader from "../../components/Loader/ResourceHubLoader";
import { toast } from 'react-toastify';

const BRAND = '#405189';

const ResourceHub = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: resourcesData, isLoading } = useResources();

  const [modal, setModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);

  const toggleModal = () => setModal(prev => !prev);
  const resources = resourcesData || {};

  /* ---- Handlers ---- */
  const handleItemClick = (item) => {
    if (item.file_url) {
      console.log(item);
      setSelectedResource(item);
      setModal(true);
      return;
    }

    const externalLink = item.link || item.external_url || item.url;
    if (externalLink) {
      window.open(externalLink, '_blank');
      return;
    }

    toast.error('Resource not available');
  };

  const handleDownload = async (resourceItem = null) => {
    const item = resourceItem || selectedResource;
    if (!item) return;
    try {
      const response = await downloadResource(item.id);
      const contentDisposition = response.headers['content-disposition'];
      let fileName = item.title || 'download';
      if (contentDisposition) {
        const m = contentDisposition.match(/filename="(.+)"/);
        if (m?.[1]) fileName = m[1];
      } else if (item.file_url) {
        const ext = item.file_url.split('.').pop();
        if (ext) fileName = `${fileName}.${ext}`;
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', fileName);
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed. Please try again.');
    }
  };

  /* ---- Data helpers ---- */
  const getColorByIcon = (icon = '') => {
    if (icon.includes('lightbulb') || icon.includes('warning') || icon.includes('flash')) return 'warning';
    if (icon.includes('government') || icon.includes('folder') || icon.includes('question') || icon.includes('faqs') ||
      icon.includes('honour') || icon.includes('bank') || icon.includes('book') || icon.includes('glossary') || icon.includes('shield')) return 'primary-custom';
    if (icon.includes('building') || icon.includes('wallet') || icon.includes('cash')) return 'info';
    if (icon.includes('delete') || icon.includes('danger') || icon.includes('denial')) return 'danger';
    if (icon.includes('list') || icon.includes('checklist') || icon.includes('excel')) return 'success';
    return 'primary';
  };

  const filterItems = (items) => {
    if (!items) return [];
    if (!searchTerm) return items;
    const q = searchTerm.toLowerCase();
    return items.filter(it =>
      it.title.toLowerCase().includes(q) ||
      (it.subtitle && it.subtitle.toLowerCase().includes(q))
    );
  };

  const getYoutubeThumb = (url) => {
    if (!url) return null;
    const m = url.match(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/);
    return (m && m[1].length === 11) ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : null;
  };

  const colorClass = (c) => c === 'primary-custom' ? 'primary-custom' : c;
  const bgClass = (c) => c === 'primary-custom' ? 'primary-custom-subtle' : `${c}-subtle`;

  const filteredLegal = filterItems(resources.legal_registration);
  const filteredBus = filterItems(resources.business_services);

  const filteredEdu = filterItems(resources.education_help).map(item => ({
    id: item.id, title: item.title, sub: item.subtitle,
    icon: item.icon || 'ri-book-line',
    color: getColorByIcon(item.icon || ''),
    original: item,
  }));

  const documentItems = filterItems(resources.download_assets).map(item => ({
    id: item.id, title: item.title,
    color: getColorByIcon(item.icon || ''),
    icon: item.icon || 'ri-file-list-3-line',
    original: item,
  }));

  const trainingVideos = filterItems(resources.training_academy).map((item, i) => {
    return {
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      date: item.created_at,
      thumb: getYoutubeThumb(item.link || item.external_url || item.url),
      original: item,
    };
  });

  const visibleVideos = trainingVideos;



  return (
    <div className="page-content resource-hub-page">
      <div className="container-fluid">

        {/* Subheader */}
        <div className="row page-subheader-sticky bg-body">
          <div className="col-12">
            <div className="d-flex align-items-center justify-content-between py-2">
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

        {isLoading ? <ResourceHubLoader /> : (
          <>
            {/* ── Metric Cards ── */}
            <div className="row g-3">
              {[
                { label: 'Total Resources', value: filteredEdu.length + documentItems.length + trainingVideos.length, icon: 'ri-grid-fill' },
                { label: 'Service Providers', value: (resources.business_services || []).length, icon: 'ri-briefcase-fill' },
                { label: 'Categories Covered', value: '6', icon: 'ri-stack-fill', color: 'warning' },
                { label: 'Quick Tools', value: documentItems.length, icon: 'ri-rocket-2-fill' },
              ].map((stat, i) => (
                <div className="col-md-3" key={i}>
                  <div className="card shadow-sm border-0 rounded-2 bg-white card-animate">
                    <div className="card-body py-3 px-4 d-flex align-items-center">
                      <div className={`avatar-md bg-${bgClass(stat.color || 'primary-custom')} rounded d-flex align-items-center justify-content-center me-3 flex-shrink-0`}>
                        <i className={`${stat.icon} text-${colorClass(stat.color || 'primary-custom')} fs-24`}></i>
                      </div>
                      <div>
                        <p className="text-muted mb-0 fs-13 fw-medium text-uppercase">{stat.label}</p>
                        <h4 className="mb-0 fw-bold text-dark fs-22 lh-1">{stat.value}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row g-3">

              {/* ── Left Column (8/12) ── */}
              <div className="col-lg-8">
                <div className="row g-3">

                  {/* Legal & Registration */}
                  <div className="col-md-6">
                    <div className="card shadow-sm border-0 rounded-2 bg-white d-flex flex-column">
                      <div className="card-header bg-transparent border-0 pt-3 px-3">
                        <h6 className="fw-bold mb-0 fs-15" style={{ color: BRAND }}>Legal & Registration</h6>
                      </div>
                      <div className="card-body p-3 pt-2 rh-cat-body position-relative mb-0">
                        <div className="rh-scroll rh-scroll-sm" style={{ height: '290px', overflowY: 'auto', paddingRight: '4px' }}>
                          <div className="rh-cat-list d-flex flex-column gap-2">
                            {filteredLegal.map(item => (
                              <div key={item.id} className="p-2 px-3 rounded-2 rh-luxe-item d-flex align-items-center" style={{ minHeight: '65px' }} onClick={() => handleItemClick(item)}>
                                <div className="flex-shrink-0 avatar-xs rounded d-flex align-items-center justify-content-center me-3 rh-item-icon" style={{ backgroundColor: 'rgba(64,81,137,0.1)' }}>
                                  <i className={`${item.icon || 'ri-article-line'} fs-18`} style={{ color: BRAND }}></i>
                                </div>
                                <div className="flex-grow-1 overflow-hidden pe-1">
                                  <h6 className="mb-0 semi-bold fs-13 text-dark text-truncate">{item.title}</h6>
                                  <span className="text-muted fs-11 text-truncate d-block">{item.subtitle}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Services */}
                  <div className="col-md-6">
                    <div className="card shadow-sm border-0 rounded-2 bg-white d-flex flex-column">
                      <div className="card-header bg-transparent border-0 pt-3 px-3">
                        <h6 className="fw-bold mb-0 fs-15" style={{ color: BRAND }}>Business Services</h6>
                      </div>
                      <div className="card-body p-3 pt-2 rh-cat-body position-relative mb-0">
                        <div className="rh-scroll rh-scroll-sm" style={{ height: '290px', overflowY: 'auto', paddingRight: '4px' }}>
                          <div className="rh-cat-list d-flex flex-column gap-2">
                            {filteredBus.map(item => (
                              <div key={item.id} className="p-2 px-3 rounded-2 rh-luxe-item d-flex align-items-center" style={{ minHeight: '65px' }} onClick={() => handleItemClick(item)}>
                                <div className="flex-shrink-0 avatar-xs rounded d-flex align-items-center justify-content-center me-3 rh-item-icon" style={{ backgroundColor: 'rgba(64,81,137,0.1)' }}>
                                  <i className={`${item.icon || 'ri-phone-circle-line'} fs-18`} style={{ color: BRAND }}></i>
                                </div>
                                <div className="flex-grow-1 overflow-hidden pe-1">
                                  <h6 className="mb-0 semi-bold fs-13 text-dark text-truncate">{item.title}</h6>
                                  <span className="text-muted fs-11 text-truncate d-block">{item.subtitle}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Education & Help */}
                  <div className="col-12">
                    <div className="card shadow-sm border-0 rounded-2 bg-white">
                      <div className="card-header border-0 p-3" style={{ background: 'linear-gradient(135deg, #405189 0%, #2a355a 100%)' }}>
                        <div className="d-flex flex-column flex-lg-row align-items-center justify-content-between gap-4">
                          <div className="flex-grow-1">
                            <h5 className="fw-bold text-white mb-1 fs-18">Education & Help</h5>
                            <p className="text-white opacity-75 mb-0 fs-13">
                              Detailed library of borrower education guides, credit building tips, and FAQs.
                            </p>
                          </div>
                          <div className="search-box-premium position-relative" style={{ minWidth: 240 }}>
                            <i className="ri-search-2-line text-white opacity-50 fs-16 position-absolute top-50 start-0 translate-middle-y ms-3"></i>
                            <input
                              type="text"
                              className="form-control bg-white bg-opacity-10 border-white border-opacity-20 rounded-pill ps-5 py-2 fs-13 text-white shadow-none"
                              placeholder="Search Education & Help..."
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="card-body p-3 position-relative">
                        <div className="rh-scroll rh-scroll-edu" style={{ height: '450px', overflowY: 'auto' }}>
                          <div className="row g-3">
                            {filteredEdu.map((edu, i) => (
                              <div className="col-6 col-md-4 col-xl-3" key={edu.id || i}>
                                <div
                                  className="p-3 rounded-3 text-center rh-edu-card h-100 border border-light-subtle bg-white shadow-sm"
                                  onClick={() => handleItemClick(edu.original)}
                                >
                                  <div className={`avatar-sm bg-${bgClass(edu.color)} rounded-3 d-flex align-items-center justify-content-center mx-auto mb-3`}>
                                    <i className={`${edu.icon} text-${colorClass(edu.color)} fs-20`}></i>
                                  </div>
                                  <h6 className="mb-1 semi-bold fs-14 text-dark">{edu.title}</h6>
                                  <p className="text-muted fs-11 mb-0 fw-medium opacity-75">{edu.sub}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* ── Right Sidebar (4/12) ── */}
              <div className="col-lg-4">
                <div className="d-flex flex-column gap-3 h-100">

                  {/* Download Assets */}
                  <div className="card shadow-sm border-0 rounded-2 bg-white mb-0">
                    <div className="card-header border-bottom border-light p-3">
                      <h6 className="fw-bold text-dark mb-0 fs-14 text-uppercase">Download Assets</h6>
                    </div>
                    <div className="card-body p-0 position-relative">
                      <div className="rh-scroll rh-scroll-assets" style={{ height: '295px', overflowY: 'auto' }}>
                        {documentItems.map(doc => (
                          <div
                            key={doc.id}
                            className="rh-asset-row list-group-item border-0 p-3 d-flex align-items-center justify-content-between"
                            style={{ minHeight: '73px' }}
                            onClick={() => handleItemClick(doc.original)}
                          >
                            <div className="d-flex align-items-center flex-grow-1 pe-2">
                              <div className={`avatar-xs bg-${bgClass(doc.color)} rounded d-flex align-items-center justify-content-center me-3 flex-shrink-0`}>
                                <i className={`${doc.icon} text-${colorClass(doc.color)} fs-16`}></i>
                              </div>
                              <h6 className="mb-0 fs-13 fw-semibold text-dark text-truncate">{doc.title}</h6>
                            </div>
                            <i
                              className="ri-download-2-line rh-download-btn"
                              onClick={e => { e.stopPropagation(); handleDownload(doc.original); }}
                              title="Download"
                            ></i>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Training Academy */}
                  <div className="card shadow-sm border-0 rounded-2 bg-white flex-grow-1 d-flex flex-column">
                    <div className="card-header border-bottom border-light p-3 d-flex align-items-center justify-content-between">
                      <h6 className="fw-bold text-dark mb-0 fs-15">
                        <i className="ri-youtube-fill text-danger me-2"></i>Training Academy
                      </h6>
                      <span className="badge bg-danger-subtle text-danger fs-10">{trainingVideos.length} Videos</span>
                    </div>
                    <div className="card-body p-3 pt-2 d-flex flex-column position-relative">
                      <div className="rh-scroll rh-scroll-videos d-flex flex-column gap-2 flex-grow-1" style={{ height: '295px', overflowY: 'auto' }}>
                        {visibleVideos.map((video, i) => (
                          <div key={video.id} className="rh-video-item d-flex align-items-center gap-3" onClick={() => handleItemClick(video.original)} style={{ minHeight: '65px' }}>
                            <div className="rh-video-thumb">
                              <img
                                src={video.thumb || video.original.file_url || `https://placehold.co/220x128/cccccc/white?text=Training +${i + 1}`}
                                alt={video.title}
                              />
                              <div className="rh-video-overlay"></div>
                              <i className="ri-play-circle-fill rh-video-play"></i>
                            </div>
                            <div className="flex-grow-1 overflow-hidden">
                              <p className="rh-video-title mb-0 fs-13">{video.title}</p>
                              {video.subtitle && <p className="text-muted fs-11 mb-0 text-truncate">{video.subtitle}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── PDF Preview Modal ── */}
      {modal && selectedResource && (
        <div className="resource-modal-overlay" onClick={toggleModal}>
          <div className="resource-modal-container" onClick={e => e.stopPropagation()}>
            <div className="resource-modal-header">
              <div className="d-flex align-items-center min-width-0">
                <div className="resource-modal-icon-wrapper">
                  <i className="ri-file-pdf-2-fill fs-22" style={{ color: BRAND }}></i>
                </div>
                <div className="resource-modal-title-group">
                  <h6 className="resource-modal-title">{selectedResource.title}</h6>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span className="resource-modal-badge">PDF</span>
                    {selectedResource.subtitle && (
                      <span className="text-muted fs-12 text-truncate">{selectedResource.subtitle}</span>
                    )}
                  </div>
                </div>
              </div>
              <button className="resource-modal-close" onClick={toggleModal}>
                <i className="ri-close-line fs-18"></i>
              </button>
            </div>

            <div className="resource-modal-body">
              {selectedResource.file_url?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={`${selectedResource.file_url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                  className="resource-modal-iframe"
                  title={selectedResource.title}
                />
              ) : (
                <div className="resource-modal-empty">
                  <div className="avatar-lg bg-light rounded-circle d-flex align-items-center justify-content-center">
                    <i className="ri-file-warning-line fs-32 text-muted"></i>
                  </div>
                  <div className="text-center">
                    <p className="fw-bold fs-15 text-dark mb-1">No Preview Available</p>
                    <p className="text-muted fs-13 mb-0">Download the file to view it on your device.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="resource-modal-footer">
              <div className="resource-modal-status">
                <span className="resource-modal-status-dot"></span>
                <span className="text-muted fs-12 fw-medium">Secure Document Preview</span>
              </div>
              <div className="resource-modal-btn-group">
                <button className="btn-secondary-resource" onClick={toggleModal}>Close</button>
                <button className="btn-primary-resource" onClick={() => handleDownload()}>
                  <i className="ri-download-2-line"></i> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceHub;
