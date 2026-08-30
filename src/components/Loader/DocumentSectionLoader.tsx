import React from 'react'

export const DocumentSectionLoader: React.FC = () => {
  return (
    <div>
      {[1, 2, 3, 4].map((i) => (
        <div className="mb-3" key={i}>
          <div 
            className="skeleton-line w-50" 
            style={{ height: 22, borderRadius: 6 }}
          ></div>
          <div 
            className="skeleton-line w-100 mt-2" 
            style={{ height: 120, borderRadius: 8 }}
          ></div>
          <div className="d-flex gap-2 mt-2">
            <div 
              className="skeleton-line" 
              style={{ width: 160, height: 14, borderRadius: 6 }}
            ></div>
            <div 
              className="skeleton-line" 
              style={{ width: 90, height: 14, borderRadius: 6 }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  )
}
