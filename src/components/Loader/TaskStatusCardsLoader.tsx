import React from 'react'

export default function TaskStatusCardsLoader() {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row g-3">
          {/* Render 4 panel skeletons */}
          {[...Array(4)].map((_, index) => (
            <div className="col-lg-3" key={index}>
              <div className="panel h-100" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
                {/* Panel Header */}
                <div className="panel-header" style={{ borderBottom: '1px solid #e5e7eb', padding: '1rem' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <div className="skeleton-circle" style={{ width: 32, height: 32 }}></div>
                      <div className="skeleton-line" style={{ width: 100, height: 16, borderRadius: 4 }}></div>
                    </div>
                    <div className="skeleton-line" style={{ width: 80, height: 14, borderRadius: 4 }}></div>
                  </div>
                </div>
                
                {/* Panel Body */}
                <div className="panel-body" style={{ padding: '1rem' }}>
                  {/* Task Items */}
                  {[...Array(3)].map((_, taskIndex) => (
                    <div className="mb-3" key={taskIndex}>
                      <div className="d-flex gap-2 align-items-start">
                        <div className="skeleton-circle" style={{ width: 24, height: 24, flexShrink: 0 }}></div>
                        <div className="flex-grow-1">
                          <div className="skeleton-line" style={{ width: '85%', height: 14, borderRadius: 4, marginBottom: 6 }}></div>
                          <div className="skeleton-line" style={{ width: '65%', height: 12, borderRadius: 4 }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Bottom Action/Progress */}
                  {index === 2 ? (
                    // Progress bar for verified panel
                    <div className="mt-3">
                      <div className="skeleton-line" style={{ width: '100%', height: 10, borderRadius: 5 }}></div>
                      <div className="skeleton-line mt-2" style={{ width: '60%', height: 12, borderRadius: 4 }}></div>
                    </div>
                  ) : (
                    // Button for other panels
                    <div className="skeleton-line mt-3" style={{ width: '100%', height: 38, borderRadius: 6 }}></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
