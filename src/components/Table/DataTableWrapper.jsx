import React from 'react'
import { DataTable as PrimeDataTable } from '@primereact/datatable'
import { Skeleton } from 'primereact/skeleton'

export const DataTable = (props) => {
  const { value, loading, className, children } = props
  const showSkeleton = !!loading

  if (showSkeleton) {
    // Use the current data length if available to prevent jumping, otherwise fallback to rows prop or 10
    const count = value && value.length > 0 ? value.length : (typeof props.rows === 'number' ? props.rows : 10)    
    // Dynamically get the number of columns from the children props
    const columns = React.Children.toArray(children).filter(child => child && child.props)
    const numColumns = columns.length > 0 ? columns.length : 5

    return (
      <div className={className || ''}>
        <div className="p-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="d-flex align-items-center gap-4 py-2 border-bottom">
              {Array.from({ length: numColumns }).map((_, j) => (
                 <Skeleton key={j} height="2rem" className="flex-grow-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return <PrimeDataTable {...props} />
}