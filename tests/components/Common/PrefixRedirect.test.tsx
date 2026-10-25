import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import PrefixRedirect from '../../../src/components/Common/PrefixRedirect'

function Where() {
  const { pathname, search } = useLocation()
  return <div>at {pathname + search}</div>
}

function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/capital-access/*" element={<PrefixRedirect to="/credit-card-stacking" />} />
        <Route path="/credit-card-stacking/*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PrefixRedirect', () => {
  it('sends an old link to the new section', () => {
    renderAt('/capital-access')
    expect(screen.getByText('at /credit-card-stacking')).toBeInTheDocument()
  })

  it('keeps the rest of the path and the query string', () => {
    renderAt('/capital-access/7/roadmap?tab=2')
    expect(screen.getByText('at /credit-card-stacking/7/roadmap?tab=2')).toBeInTheDocument()
  })
})
