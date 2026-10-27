import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../test-utils'
import PreQualification from '../../../src/pages/prequalification/PreQualification'

/** Defect (BUG-029): the intro read "get matc.hed with pre-qualified programs". */
describe('PreQualification intro', () => {
  it('reads "get matched with pre-qualified programs"', async () => {
    renderWithProviders(<PreQualification />)

    expect(await screen.findByText(/Complete your profile to get matched with pre-qualified programs/)).toBeInTheDocument()
    expect(screen.queryByText(/matc\.hed/)).not.toBeInTheDocument()
  })
})
