import { describe, expect, it } from 'vitest'
import type { ComponentType } from 'react'
import { render, screen } from '@testing-library/react'
import { DataTable as PrimeDataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'

// DataTableWrapper accepts extra props (skeletonRows) the real PrimeReact
// DataTable type doesn't declare; TS resolves the real type since only Vite's
// runtime alias points imports at the wrapper, not tsconfig's module resolution.
const DataTable = PrimeDataTable as unknown as ComponentType<Record<string, unknown>>

describe('DataTable alias resolution', () => {
  it('resolves "primereact/datatable" to DataTableWrapper and renders the skeleton loader when loading', () => {
    const { container } = render(
      <DataTable value={[]} loading skeletonRows={3}>
        <Column field="name" header="Name" />
      </DataTable>
    )

    // rows=3, single Column child -> DataTableWrapper infers 1 column -> 3 skeleton cells
    expect(container.querySelectorAll('.skeleton-table-cell')).toHaveLength(3)
  })

  it('renders real PrimeReact rows when not loading', () => {
    render(
      <DataTable value={[{ id: 1, name: 'Acme Corp' }]}>
        <Column field="name" header="Name" />
      </DataTable>
    )

    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
  })
})
