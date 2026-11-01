import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../../../test-utils'
import StepNavigation from '../../../../../src/pages/fundapplication/components/shared/StepNavigation'

/**
 * Defect (BUG-071): with Full Name cleared on step 1, Save & Next just greyed
 * out - nothing said why.
 */
describe('StepNavigation', () => {
  it('says why Save & Next is unavailable', () => {
    renderWithProviders(<StepNavigation onNext={() => {}} isNextDisabled />)

    expect(screen.getByRole('button', { name: /save & next/i })).toBeDisabled()
    expect(screen.getByText('Complete the required fields (*) to continue.')).toBeInTheDocument()
  })

  it('says nothing while it is available, or while a save is running', () => {
    const { rerender } = renderWithProviders(<StepNavigation onNext={() => {}} />)
    expect(screen.queryByText(/required fields/)).not.toBeInTheDocument()

    rerender(<StepNavigation onNext={() => {}} isNextDisabled loading />)
    expect(screen.queryByText(/required fields/)).not.toBeInTheDocument()
  })
})
