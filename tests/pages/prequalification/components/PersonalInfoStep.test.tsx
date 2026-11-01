import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, screen } from '../../../test-utils'
import PersonalInfoStep from '../../../../src/pages/prequalification/components/PersonalInfoStep'

const personal = (overrides = {}) => ({
  firstName: '', lastName: 'Doe', email: 'bad@', phoneNumber: '(555) 234-5678',
  businessWebsite: '', stateOfIncorporation: '',
  ...overrides,
})

const renderStep = (props: Record<string, unknown> = {}) =>
  renderWithProviders(
    <PersonalInfoStep
      personal={personal() as any}
      business={{} as any}
      setPersonal={vi.fn()}
      setBusiness={vi.fn()}
      onNext={vi.fn()}
      errors={{}}
      {...props}
    />
  )

/**
 * Defect (BUG-017, Client Pre-Qualification step 1): the browser's own email
 * check held Next back on "bad@", so the API never answered and its errors
 * came one field at a time. The step leaves validation to the API and shows
 * every error it returns.
 */
describe('PersonalInfoStep validation', () => {
  it('sends an invalid email on to the API instead of the browser stopping it', async () => {
    const onNext = vi.fn()
    const { container } = renderStep({ onNext })

    expect((container.querySelector('form') as HTMLFormElement).noValidate).toBe(true)
    await userEvent.setup().click(screen.getByRole('button', { name: /next step/i }))

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('shows every field error the API returns at once', () => {
    renderStep({
      errors: {
        firstName: 'First name is required',
        email: 'The email field must be a valid email address.',
        stateOfIncorporation: 'State of incorporation is required',
      },
    })

    expect(screen.getByText('First name is required')).toBeInTheDocument()
    expect(screen.getByText('The email field must be a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('State of incorporation is required')).toBeInTheDocument()
  })
})
