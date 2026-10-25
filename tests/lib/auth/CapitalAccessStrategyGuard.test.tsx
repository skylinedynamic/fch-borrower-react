import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import CapitalAccessStrategyGuard from '../../../src/lib/auth/CapitalAccessStrategyGuard'

describe('CapitalAccessStrategyGuard', () => {
  it('always renders its nested route (access checks moved to page level)', () => {
    render(
      <MemoryRouter initialEntries={['/credit-card-stacking/1']}>
        <Routes>
          <Route element={<CapitalAccessStrategyGuard />}>
            <Route path="/credit-card-stacking/:id" element={<div>Strategy Detail</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('Strategy Detail')).toBeInTheDocument()
  })
})
