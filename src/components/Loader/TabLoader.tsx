import React from 'react'

export default function TabLoader() {
  return (
    <div className="fade-panel">
      <form className="row g-3">
        {/* First Name & Last Name */}
        <div className="col-md-6">
          <div className="mb-2">
            <div className="placeholder-glow">
              <span className="placeholder rounded skeleton-label" style={{ width: '30%' }}></span>
            </div>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder rounded skeleton-field"></span>
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-2">
            <div className="placeholder-glow">
              <span className="placeholder rounded skeleton-label" style={{ width: '28%' }}></span>
            </div>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder rounded skeleton-field"></span>
          </div>
        </div>

        {/* Email & Phone Number */}
        <div className="col-md-6">
          <div className="mb-2">
            <div className="placeholder-glow">
              <span className="placeholder rounded skeleton-label" style={{ width: '20%' }}></span>
            </div>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder rounded skeleton-field"></span>
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-2">
            <div className="placeholder-glow">
              <span className="placeholder rounded skeleton-label" style={{ width: '38%' }}></span>
            </div>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder rounded skeleton-field"></span>
          </div>
        </div>

        {/* Country & City */}
        <div className="col-md-6">
          <div className="mb-2">
            <div className="placeholder-glow">
              <span className="placeholder rounded skeleton-label" style={{ width: '25%' }}></span>
            </div>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder rounded skeleton-field"></span>
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-2">
            <div className="placeholder-glow">
              <span className="placeholder rounded skeleton-label" style={{ width: '18%' }}></span>
            </div>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder rounded skeleton-field"></span>
          </div>
        </div>

        {/* State & Zip Code */}
        <div className="col-md-6">
          <div className="mb-2">
            <div className="placeholder-glow">
              <span className="placeholder rounded skeleton-label" style={{ width: '20%' }}></span>
            </div>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder rounded skeleton-field"></span>
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-2">
            <div className="placeholder-glow">
              <span className="placeholder rounded skeleton-label" style={{ width: '28%' }}></span>
            </div>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder rounded skeleton-field"></span>
          </div>
        </div>

        {/* Home Address & Home Phone */}
        <div className="col-md-6">
          <div className="mb-2">
            <div className="placeholder-glow">
              <span className="placeholder rounded skeleton-label" style={{ width: '35%' }}></span>
            </div>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder rounded skeleton-field"></span>
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-2">
            <div className="placeholder-glow">
              <span className="placeholder rounded skeleton-label" style={{ width: '32%' }}></span>
            </div>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder rounded skeleton-field"></span>
          </div>
        </div>

        {/* Date of Birth & Last 4 SSN */}
        <div className="col-md-6">
          <div className="mb-2">
            <div className="placeholder-glow">
              <span className="placeholder rounded skeleton-label" style={{ width: '33%' }}></span>
            </div>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder rounded skeleton-field"></span>
          </div>
        </div>
        <div className="col-md-6">
          <div className="mb-2">
            <div className="placeholder-glow">
              <span className="placeholder rounded skeleton-label" style={{ width: '28%' }}></span>
            </div>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder rounded skeleton-field"></span>
          </div>
        </div>

        {/* Save Button */}
        <div className="col-12 d-flex justify-content-end mt-4">
          <div className="placeholder-glow">
            <span className="placeholder rounded skeleton-button"></span>
          </div>
        </div>
      </form>
    </div>
  )
}
