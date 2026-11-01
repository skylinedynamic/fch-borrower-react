import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { DocumentStats } from '../../../../src/pages/documents/components/DocumentStats'
import { FILE_MANAGER_CONFIG } from '../../../../src/modules/filemanager/config'

const REQUIRED = [
  { name: "Driver's License", state: 'accepted' as const },
  { name: 'Voided Business Check', state: 'pending' as const },
  { name: 'EIN / Corporation Docs', state: 'reupload' as const },
  { name: 'Business Bank Statements', state: 'empty' as const },
]

describe('DocumentStats (the Documents hero)', () => {
  it('says how many required categories are in, and the percentage', () => {
    render(<DocumentStats documentCount={5} filledCount={2} categoryCount={4} requiredCategories={REQUIRED} />)

    expect(screen.getByText('2 of 4 required')).toHaveClass('docs-stat-value')
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows one segment per required category, coloured by where it stands', () => {
    render(<DocumentStats documentCount={5} filledCount={2} categoryCount={4} requiredCategories={REQUIRED} />)

    const segments = within(screen.getByRole('list', { name: 'Required categories' })).getAllByRole('listitem')
    expect(segments.map((s) => s.className)).toEqual([
      'docs-progress-segment is-accepted',
      'docs-progress-segment is-pending',
      'docs-progress-segment is-reupload',
      'docs-progress-segment is-empty',
    ])
    expect(screen.getByLabelText('EIN / Corporation Docs: Re-upload')).toBeInTheDocument()
  })

  it('counts each state in the legend, leaving out states nobody is in', () => {
    render(
      <DocumentStats
        documentCount={2}
        filledCount={2}
        categoryCount={2}
        requiredCategories={[{ name: 'A', state: 'accepted' }, { name: 'B', state: 'accepted' }]}
      />
    )

    expect(screen.getByText('2 Accepted')).toBeInTheDocument()
    expect(screen.queryByText(/In review|Re-upload|Missing/)).not.toBeInTheDocument()
  })

  it('keeps the hero short: one title, and every allowed file type on its own line at the bottom', () => {
    const { container } = render(<DocumentStats documentCount={1} filledCount={1} categoryCount={4} requiredCategories={REQUIRED} />)

    const hero = screen.getByRole('region', { name: 'Documents overview' })
    expect(within(hero).getAllByText('Documents')).toHaveLength(1)

    const all = FILE_MANAGER_CONFIG.ALLOWED_EXTENSIONS.map((e) => e.toUpperCase()).join(', ')
    const rules = container.querySelector('.docs-hero-rules') as HTMLElement
    expect(rules).toHaveTextContent(`Allowed files: ${all}`)
    expect(rules).not.toHaveTextContent(/more/)
    expect(hero.lastElementChild).toBe(rules)
  })

  it('shows the files uploaded and the size limit, and puts the next step in the hero', () => {
    render(
      <DocumentStats documentCount={7} filledCount={1} categoryCount={4} requiredCategories={REQUIRED}>
        <p>Next step here</p>
      </DocumentStats>
    )

    const hero = screen.getByRole('region', { name: 'Documents overview' })
    expect(within(hero).getByText('7')).toHaveClass('docs-fact-value')
    expect(within(hero).getByText('Files uploaded')).toBeInTheDocument()
    expect(within(hero).getByText('Next step here')).toBeInTheDocument()
  })
})
