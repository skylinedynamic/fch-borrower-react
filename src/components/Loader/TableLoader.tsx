import React from 'react'

interface TableLoaderProps {
  rows?: number
  columns?: number
}

export const TableLoader: React.FC<TableLoaderProps> = ({ rows = 4, columns = 6 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j}>
              <div 
                className="skeleton-line" 
                style={{ 
                  width: `${Math.floor(Math.random() * (80 - 40 + 1) + 40)}%` 
                }}
              ></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
