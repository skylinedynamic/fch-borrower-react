import React from 'react';

interface CommonErrorPageProps {
  title?: string;
  description?: string;
}

export default function CommonErrorPage({
  title = 'Something went wrong',
  description = 'Please try reloading the page.',
}: CommonErrorPageProps) {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="page-content capital-access-page">
      <div className="container-fluid">
        <div className="ca-error-container animate__animated animate__fadeIn">
          <div className="ca-error-card">
            <div className="ca-error-icon-wrap">
              <i className="ri-error-warning-fill"></i>
            </div>
            <h5 className="ca-error-title">{title}</h5>
            <p className="ca-error-desc">{description}</p>
            <button
              type="button"
              className="ca-error-btn"
              onClick={handleReload}
            >
              <i className="ri-refresh-line me-1 align-bottom"></i> Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
