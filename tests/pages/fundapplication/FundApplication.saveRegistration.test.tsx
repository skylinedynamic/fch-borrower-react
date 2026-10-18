import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../test-utils'

/**
 * Defect (QA 2026-10-18): moving forward from Business Information (e.g. to
 * Document Upload from the progress sidebar) showed "Disclosures saved
 * successfully!" - and saved the disclosures consent instead of the step the
 * borrower was on.
 *
 * Every step stays mounted (hidden steps are display:none, and the desktop and
 * mobile layouts both render them). The page keeps one "save the active step"
 * slot that a step fills through onRegisterSave. Disclosures and Federal
 * Compliance were given onRegisterSave even when not active, so they kept
 * taking that slot and the wrong step was saved on navigation.
 */

const received: Record<string, Array<Record<string, unknown>>> = {}

const stub = (name: string) => ({
  default: (props: Record<string, unknown>) => {
    ;(received[name] ??= []).push(props)
    return <div data-testid={`step-${name}`} />
  },
})

vi.mock('../../../src/pages/fundapplication/components/steps/BusinessInformationStep', () => stub('business'))
vi.mock('../../../src/pages/fundapplication/components/steps/OwnershipInformationStep', () => stub('ownership'))
vi.mock('../../../src/pages/fundapplication/components/steps/FinancialInformationStep', () => stub('financial'))
vi.mock('../../../src/pages/fundapplication/components/steps/FundingRequestStep', () => stub('funding'))
vi.mock('../../../src/pages/fundapplication/components/steps/DocumentUploadStep', () => stub('documents'))
vi.mock('../../../src/pages/fundapplication/components/steps/DisclosuresStep', () => stub('disclosures'))
vi.mock('../../../src/pages/fundapplication/components/steps/FederalComplianceStep', () => stub('federal'))
vi.mock('../../../src/pages/fundapplication/components/steps/AttestationStep', () => stub('attestation'))

const { default: FundApplication } = await import('../../../src/pages/fundapplication/FundApplication')

/** The props each step received on its latest render. */
const latest = (name: string) => received[name]?.[received[name].length - 1] ?? {}

describe('FundApplication - only the active step can register its save', () => {
  it('gives onRegisterSave to the active step only (Business Information at the start)', async () => {
    renderWithProviders(<FundApplication />)
    await screen.findAllByTestId('step-disclosures')

    expect(latest('business').onRegisterSave).toBeTypeOf('function')
    for (const name of ['ownership', 'financial', 'funding', 'documents', 'disclosures', 'federal']) {
      expect(latest(name).onRegisterSave, `${name} must not register while inactive`).toBeUndefined()
    }
  })
})
