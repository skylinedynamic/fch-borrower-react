import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import { useResources, downloadResource } from '../../modules/resources';
import ResourceHubLoader from "../../components/Loader/ResourceHubLoader";
import { toast } from 'react-toastify';


const ResourceHub = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [eduSearch, setEduSearch] = useState('');
  const { data: resourcesData, isLoading } = useResources();

  const [modal, setModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [modalType, setModalType] = useState('file'); // 'file' | 'video'

  // Fundability System State
  const [activeFundabilityStep, setActiveFundabilityStep] = useState(null);
  const [showFundabilityModal, setShowFundabilityModal] = useState(false);

  const getFundabilityData = (item) => {
    return {
      title: item.title,
      icon: item.icon || 'ri-briefcase-line',
      color: getColorByIcon(item.icon || ''),
      overview: item.overview && item.overview.length > 0 ? item.overview : [item.subtitle || 'Step-by-step guidance for this business service.'],
      impact: item.impact && item.impact.length > 0 ? item.impact : ['Meeting this requirement significantly enhances your business fundability profile.'],
      providers: item.providers || []
    };
  };

  const handleFundabilityClick = (item) => {
    navigate(`/resources/${item.id}`);
  };

  const toggleModal = () => setModal(prev => !prev);
  const resources = resourcesData || {};

  /* ---- Handlers ---- */
  const isVideoItem = (item) => {
    if (!item) return false;
    const link = item.link || item.external_url || item.url || '';
    return (
      item.resource_type === 'training_academy' ||
      /youtu\.be|youtube\.com\/watch|youtube\.com\/embed|youtube\.com\/shorts/i.test(link) ||
      /\.(mp4|webm|ogg|mov)$/i.test(link)
    );
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    const m = url.match(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&?]*).*/);
    if (m && m[1].length === 11) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0`;
    return url;
  };

  const handleItemClick = (item) => {
    if (!item) return;

    if (isVideoItem(item)) {
      const link = item.link || item.external_url || item.url;
      if (link) {
        setSelectedResource(item);
        setModalType('video');
        setModal(true);
        return;
      }
    }

    if (item.file_url) {
      setSelectedResource(item);
      setModalType('file');
      setModal(true);
      return;
    }

    const externalLink = item.link || item.external_url || item.url;
    if (externalLink) {
      window.open(externalLink, '_blank');
      return;
    }

    // No file or link yet: the detail page shows the title/subtitle and its own
    // "coming soon" state, which beats a dead click with an error toast.
    navigate(`/resources/${item.id}`);
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

  const filterItems = (items, customSearch = null) => {
    if (!items) return [];
    const query = customSearch !== null ? customSearch : searchTerm;
    if (!query) return items;
    const q = query.toLowerCase();
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

  const filteredEdu = filterItems(resources.education_help, eduSearch).map(item => ({
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
                <nav aria-label="breadcrumb" className="">
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
            <div className="row g-4">
              {[
                { label: 'Total Resources', value: filteredEdu.length + documentItems.length + trainingVideos.length + filteredLegal.length + filteredBus.length, icon: 'ri-grid-fill', color: 'primary' },
                { label: 'Education & Help', value: filteredEdu.length, icon: 'ri-book-open-line', color: 'info' },
                { label: 'Training Academy', value: trainingVideos.length, icon: 'ri-video-line', color: 'danger' },
                { label: 'Resource Categories', value: Object.keys(resources || {}).length, icon: 'ri-stack-line', color: 'warning' },
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

            <div className="row g-4">

              {/* ── Left Column (8/12) ── */}
              <div className="col-lg-8">
                <div className="row g-3">

                  {/* Legal & Registration */}
                  <div className="col-md-6">
                    <div className="card shadow-sm border-0 rounded-2 bg-white d-flex flex-column mb-0 h-100">
                      <div className="card-header bg-transparent border-0 pt-3 px-3">
                        <h6 className="fw-bold mb-0 fs-15 rh-text-brand">Legal & Registration</h6>
                      </div>
                      <div className="card-body p-3 pt-0 rh-cat-body position-relative mb-0 flex-grow-1">
                        <div className={`rh-scroll rh-scroll-sm rh-h-310`}>
                          <div className="rh-cat-list d-flex flex-column gap-2">
                            {filteredLegal.map(item => (
                              <div key={item.id} className="p-2 px-3 rounded-2 rh-luxe-item d-flex align-items-center" onClick={() => handleItemClick(item)}>
                                <div className="flex-shrink-0 avatar-xs rounded d-flex align-items-center justify-content-center me-3 rh-item-icon rh-icon-bg-light">
                                  <i className={`${item.icon || 'ri-article-line'} fs-18 rh-text-brand`}></i>
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
                    <div className="card shadow-sm border-0 rounded-2 bg-white d-flex flex-column mb-0 h-100">
                      <div className="card-header bg-transparent border-0 pt-3 px-3">
                        <h6 className="fw-bold mb-0 fs-15 rh-text-brand">Business Services</h6>
                      </div>
                      <div className="card-body p-3 pt-0 rh-cat-body position-relative mb-0 flex-grow-1">
                        <div className={`rh-scroll rh-scroll-sm rh-h-310`}>
                          <div className="rh-cat-list d-flex flex-column gap-2">
                            {filteredBus.map(item => (
                              <div key={item.id} className="p-2 px-3 rounded-2 rh-luxe-item d-flex align-items-center cursor-pointer" onClick={() => handleFundabilityClick(item)}>
                                <div className="flex-shrink-0 avatar-xs rounded d-flex align-items-center justify-content-center me-3 rh-item-icon rh-icon-bg-light">
                                  <i className={`${item.icon || 'ri-service-line'} fs-18 rh-text-brand`}></i>
                                </div>
                                <div className="flex-grow-1 overflow-hidden pe-1">
                                  <h6 className="mb-0 semi-bold fs-13 text-dark text-truncate">{item.title}</h6>
                                  <span className="text-muted fs-11 text-truncate d-block">{item.subtitle || 'Service Category'}</span>
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
                      <div className="card-header border-0 p-3 rh-card-header-gradient">
                        <div className="d-flex flex-column flex-lg-row align-items-center justify-content-between gap-4">
                          <div className="flex-grow-1">
                            <h5 className="fw-bold text-white mb-1 fs-18">Education & Help</h5>
                            <p className="text-white opacity-75 mb-0 fs-13">
                              Detailed library of borrower education guides, credit building tips, and FAQs.
                            </p>
                          </div>
                          <div className="search-box-premium position-relative">
                            <i className="ri-search-2-line text-white opacity-50 fs-16 position-absolute top-50 start-0 translate-middle-y ms-3"></i>
                            <input
                              type="text"
                              className="form-control bg-white bg-opacity-10 border-white border-opacity-20 rounded-pill ps-5 py-2 fs-13 text-white shadow-none"
                              placeholder="Search Education & Help..."
                              value={eduSearch}
                              onChange={e => setEduSearch(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="card-body p-3 position-relative">
                        <div className={`rh-scroll rh-scroll-edu ${filteredEdu.length > 12 ? 'rh-h-454' : ''}`}>
                          <div className="row g-3 pe-1">
                            {filteredEdu.map((edu, i) => (
                              <div className="col-6 col-md-4 col-xl-3" key={edu.id || i}>
                                <div
                                  className="p-3 rounded-3 text-center rh-edu-card h-100 bg-white border border-light-subtle transition-all"
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
                      <h6 className="fw-bold text-dark mb-0 fs-14 ">Download Assets</h6>
                    </div>
                    <div className="card-body p-3 pt-0 rh-cat-body position-relative mb-0">
                      <div className={`rh-scroll rh-scroll-assets p-0 rh-h-200`}>
                        {documentItems.map(doc => (
                          <div
                            key={doc.id}
                            className="rh-asset-row list-group-item border-0 p-2 d-flex align-items-center justify-content-between"
                            onClick={() => handleItemClick(doc.original)}
                          >
                            <div className="d-flex align-items-center flex-grow-1 pe-2">
                              <div className={`avatar-xs bg-${bgClass(doc.color)} rounded d-flex align-items-center justify-content-center me-3 flex-shrink-0`}>
                                <i className={`${doc.icon} text-${colorClass(doc.color)} fs-16`}></i>
                              </div>
                              <h6 className="mb-0 fs-13 fw-semibold text-dark text-truncate">{doc.title}</h6>
                            </div>
                            {doc.original.file_url && (
                              <i
                                className="ri-download-2-line rh-download-btn"
                                onClick={e => { e.stopPropagation(); handleDownload(doc.original); }}
                                title="Download"
                              ></i>
                            )}
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
                    <div className="card-body p-3 pt-0 d-flex flex-column position-relative">
                      <div className={`rh-scroll rh-scroll-videos d-flex flex-column gap-2 flex-grow-1 p-0 pt-3 rh-h-480`}>
                        {visibleVideos.map((video, i) => (
                          <div key={video.id} className="rh-video-item d-flex align-items-center gap-3" onClick={() => handleItemClick(video.original)}>
                            <div className="rh-video-thumb">
                              <img
                                src={video.thumb || video.original.file_url || `https://placehold.co/220x128/cccccc/white?text=Training +${i + 1}`}
                                alt={video.title}
                              />
                              <div className="rh-video-overlay"></div>
                              <i className="ri-play-circle-fill rh-video-play"></i>
                            </div>
                            <div className="flex-grow-1 overflow-hidden pe-1">
                              <p className="rh-video-title mb-0 fs-13 text-truncate">{video.title}</p>
                              {video.subtitle && <p className="text-muted fs-11 mb-0 text-truncate">{video.subtitle}</p>}
                              <p className="text-muted fs-10 mb-0 opacity-75 mt-1">
                                <i className="ri-calendar-event-line me-1"></i>
                                {new Date(video.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
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

      {/* ── Resource Preview Modal ── */}
      {modal && selectedResource && (
        <div className="resource-modal-overlay" onClick={toggleModal}>
          <div
            className={`resource-modal-container${modalType === 'video' ? ' resource-modal-video' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="resource-modal-header py-3 px-4">
              <div className="d-flex align-items-center min-width-0">
                <div className={`resource-modal-icon-box me-3 ${modalType === 'video' ? 'bg-danger' : ''}`}>
                  {modalType === 'video'
                    ? <i className="ri-play-fill fs-20 text-white"></i>
                    : <i className="ri-file-text-fill fs-20 text-white"></i>
                  }
                </div>
                <div className="resource-modal-title-group">
                  <h6 className="resource-modal-title mb-0 fw-bold">{selectedResource.title}</h6>
                  <p className="text-muted fs-12 mb-0">{selectedResource.subtitle || 'Resource Hub Preview'}</p>
                </div>
              </div>

              {/* Header right-side actions */}
              <div className="d-flex align-items-center gap-3 flex-shrink-0">
                {modalType !== 'video' && selectedResource.file_url && (
                  <button className="btn-primary-resource px-3 py-2 d-flex align-items-center" onClick={() => handleDownload()}>
                    <i className="ri-download-2-line me-2"></i> Download
                  </button>
                )}
                <button className="resource-modal-close-simple" onClick={toggleModal}>
                  <i className="ri-close-line fs-24"></i>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="resource-modal-body">
              {modalType === 'video' ? (
                <iframe
                  src={getYoutubeEmbedUrl(selectedResource.link || selectedResource.external_url || selectedResource.url || '')}
                  className="resource-modal-iframe"
                  title={selectedResource.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : selectedResource.file_url ? (
                <div className="d-flex flex-column h-100">
                  {/* Mobile-only view: Clean, full-height portal */}
                  <div className="d-flex d-md-none flex-column align-items-center justify-content-center flex-grow-1 p-4 text-center bg-white">
                    <div className="mb-4">
                      <div className="avatar-xl bg-primary-subtle rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm border border-white border-4">
                        <i className={`${selectedResource.file_url?.toLowerCase().endsWith('.pdf') ? 'ri-file-pdf-fill text-danger' : 'ri-file-text-line text-primary'} display-4`}></i>
                      </div>
                      <h5 className="fw-bold fs-18 text-dark mb-2">Secure Document Portal</h5>
                      <p className="text-muted fs-13 mb-4 px-3">
                        This document is ready for viewing. Click below to open it in your mobile viewer.
                      </p>
                    </div>

                    <a
                      href={selectedResource.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary d-flex align-items-center justify-content-center gap-2 py-3 px-5 rounded-pill shadow-lg w-100"
                      style={{ maxWidth: '280px' }}
                    >
                      <i className="ri-external-link-line fs-18"></i>
                      <span className="fw-bold">Open Document</span>
                    </a>
                  </div>

                  {/* Desktop View: Keep original logic where ONLY PDFs show iframe */}
                  {selectedResource.file_url?.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={`${selectedResource.file_url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                      className="resource-modal-iframe d-none d-md-block flex-grow-1"
                      title={selectedResource.title}
                      width="100%"
                      height="100%"
                    />
                  ) : (
                    <div className="resource-modal-empty flex-grow-1 d-none d-md-flex">
                      <div className="avatar-lg bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3">
                        <i className="ri-file-3-line fs-32 rh-text-brand"></i>
                      </div>
                      <div className="text-center">
                        <p className="fw-bold fs-15 text-dark mb-1">Preview Not Available</p>
                        <p className="text-muted fs-13 mb-0">Click Download to save this file to your device.</p>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="resource-modal-empty">
                  <div className="avatar-lg bg-light rounded-circle d-flex align-items-center justify-content-center">
                    <i className="ri-file-warning-line fs-32 text-muted"></i>
                  </div>
                  <div className="text-center">
                    <p className="fw-bold fs-15 text-dark mb-1">No Content Available</p>
                    <p className="text-muted fs-13 mb-0">This resource has no file or link attached.</p>
                  </div>
                </div>
              )}
            </div>


            {/* Footer — file modal: compact status only; video modal: status + close */}
            {modalType === 'video' ? (
              <div className="resource-modal-footer">
                <div className="resource-modal-status">
                  <span className="resource-modal-status-dot resource-modal-status-dot-video"></span>
                  <span className="text-muted fs-12 fw-medium">Streaming Video</span>
                </div>
                <div className="resource-modal-btn-group">
                  <button className="btn-secondary-resource" onClick={toggleModal}>Close</button>
                </div>
              </div>
            ) : (
              <div className="resource-modal-footer resource-modal-footer-sm">
                <div className="resource-modal-status">
                  <span className="resource-modal-status-dot"></span>
                  <span className="text-muted fs-11 fw-medium">Secure Document Preview</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Fundability System Modal ── */}
      <Modal isOpen={showFundabilityModal} toggle={() => setShowFundabilityModal(false)} size="lg" centered className="fundability-modal flip">
        {activeFundabilityStep && (
          <>
            <ModalHeader className="bg-white border-bottom py-3 px-4" toggle={() => setShowFundabilityModal(false)}>
              <div className="d-flex align-items-center">
                <div className={`avatar-sm bg-${bgClass(activeFundabilityStep.color)} rounded-3 me-3 d-flex align-items-center justify-content-center`}>
                  <i className={`${activeFundabilityStep.icon} text-${colorClass(activeFundabilityStep.color)} fs-24`}></i>
                </div>
                <div>
                  <h5 className="mb-0 fs-18 fw-semibold text-dark">{activeFundabilityStep.title}</h5>
                </div>
              </div>
            </ModalHeader>
            <ModalBody className="p-4 bg-light bg-opacity-50">
              <div className="row g-4 mb-4">
                <div className="col-lg-7">
                  <div className="mb-4 mb-lg-0">
                    <h5 className="fw-semibold text-dark mb-3 d-flex align-items-center">
                      <i className="ri-article-line text-primary me-2 fs-18"></i> Overview
                    </h5>
                    <ul className="list-unstyled mb-0">
                      {activeFundabilityStep.overview.map((text, i) => (
                        <li key={i} className="d-flex align-items-start mb-2 fs-14 text-muted">
                          <i className="ri-checkbox-circle-fill text-success me-2 mt-1"></i>
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="p-3 bg-primary-subtle bg-opacity-30 rounded-3 border border-primary border-opacity-10 h-100">
                    <h5 className="fw-semibold text-primary mb-2 d-flex align-items-center">
                      <i className="ri-flashlight-line me-2"></i> Why It Matters
                    </h5>
                    <ul className="list-unstyled mb-0">
                      {activeFundabilityStep.impact.map((text, i) => (
                        <li key={i} className="d-flex align-items-start mb-2 fs-13 text-dark opacity-75">
                          <i className="ri-arrow-right-s-line text-primary me-1"></i>
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <hr className="my-2 border-light" />

              {activeFundabilityStep.providers?.length > 0 ? (
                <div className="recommended-providers-section">
                  <h5 className="fw-semibold text-dark mb-4 d-flex align-items-center">
                    <i className="ri-shield-check-fill text-success me-2 fs-18"></i> Recommended Providers
                  </h5>
                  <div className={`rh-scroll rh-h-437`}>
                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3 mx-n2 pb-2">
                      {activeFundabilityStep.providers.map((provider, i) => (
                        <div className="col px-2" key={i}>
                          <div className="p-3 bg-white rounded-3 shadow-sm h-100 d-flex flex-column transition-all hover-shadow" style={{ border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="mb-0 fw-semibold fs-15 text-dark">{provider.name}</h6>
                              {provider.is_recommended && (
                                <span className="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2 py-1 fs-10">
                                  <i className="ri-star-fill align-middle"></i>
                                </span>
                              )}
                            </div>
                            <p className="text-muted fs-13 mb-3 lh-base flex-grow-1">{provider.desc}</p>
                            <a
                              href={provider.link}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-primary btn-sm w-100 py-2 rounded-2 shadow-sm d-flex align-items-center justify-content-center gap-2 transition-all mt-auto"
                            >
                              {provider.btn_label || 'Get Started'}
                              <i className="ri-external-link-line fs-14"></i>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center bg-white rounded-3 border border-light-subtle border-dashed">
                  <i className="ri-search-eye-line fs-40 text-muted mb-2"></i>
                  <h6 className="fw-semibold text-dark mb-1">More Resources Needed?</h6>
                  <p className="text-muted fs-12 mb-0">Check the main library for additional tools and partners.</p>
                </div>
              )}
            </ModalBody>
            <ModalFooter className="bg-white border-top py-3 px-4">
              <button className="btn btn-light fw-semibold px-4" onClick={() => setShowFundabilityModal(false)}>Close</button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  );
};

export default ResourceHub;
