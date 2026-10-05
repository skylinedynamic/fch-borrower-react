import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'

import CreditAuthorizationConsent from '../../../src/components/CreditAuthorization/CreditAuthorizationConsent'
import { CREDIT_AUTHORIZATION_URLS } from '../../../src/config/creditAuthorization'
import { renderWithProviders, screen } from '../../test-utils'

/**
 * The consent a client gives before we pull their credit.
 *
 * This replaced a one-line notice that claimed authorisation by the act of
 * submitting. Under the FCRA a report may only be pulled on the consumer's
 * written instructions, and iSoftPull can ask months later to see them - so what
 * matters here is that the client performed an act, that the two consents are
 * separable, and that neither starts given.
 */
const unticked = {
  credit_authorization_accepted: false,
  e_consent_accepted: false,
}

function boxes() {
  return {
    authorization: screen.getByRole('checkbox', { name: /Credit Authorization/i }),
    eConsent: screen.getByRole('checkbox', { name: /Electronic Communications Consent/i }),
  }
}

describe('CreditAuthorizationConsent', () => {
  it('starts with both boxes unticked', () => {
    // A pre-ticked box is not agreement, and would make the record worthless.
    renderWithProviders(<CreditAuthorizationConsent values={unticked} onChange={vi.fn()} />)

    expect(boxes().authorization).not.toBeChecked()
    expect(boxes().eConsent).not.toBeChecked()
  })

  it('reports each box separately', async () => {
    // The FCRA authorisation and the E-SIGN consent are legally distinct, so
    // ticking one must never imply the other.
    const onChange = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(<CreditAuthorizationConsent values={unticked} onChange={onChange} />)

    await user.click(boxes().authorization)

    expect(onChange).toHaveBeenCalledWith({
      credit_authorization_accepted: true,
      e_consent_accepted: false,
    })
  })

  it('reports the electronic consent on its own', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    renderWithProviders(<CreditAuthorizationConsent values={unticked} onChange={onChange} />)

    await user.click(boxes().eConsent)

    expect(onChange).toHaveBeenCalledWith({
      credit_authorization_accepted: false,
      e_consent_accepted: true,
    })
  })

  it('shows the authorization wording in full', () => {
    // The client has to be able to read what they are agreeing to without
    // following a link - the link is the published copy, not the source.
    renderWithProviders(<CreditAuthorizationConsent values={unticked} onChange={vi.fn()} />)

    expect(screen.getByText(/Fair Credit Reporting Act/)).toBeInTheDocument()
    expect(screen.getByText(/Four Corner Holdings, LLC/)).toBeInTheDocument()
    expect(screen.getByText(/Equifax, TransUnion, and\/or Experian/)).toBeInTheDocument()
  })

  it('links the electronic disclosures to the consent document in a new tab', () => {
    renderWithProviders(<CreditAuthorizationConsent values={unticked} onChange={vi.fn()} />)

    const link = screen.getByRole('link', { name: 'Electronic Disclosures and Communications' })

    expect(link).toHaveAttribute('href', CREDIT_AUTHORIZATION_URLS.eConsent)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('does not link the disclosures page, which is not a consent document', () => {
    renderWithProviders(<CreditAuthorizationConsent values={unticked} onChange={vi.fn()} />)

    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))

    expect(hrefs).not.toContain('https://fourcornerholdings.com/disclosures')
  })

  it('offers the published authorization copy for a client who wants detail', () => {
    renderWithProviders(<CreditAuthorizationConsent values={unticked} onChange={vi.fn()} />)

    const link = screen.getByRole('link', { name: /What this means/i })

    expect(link).toHaveAttribute('href', CREDIT_AUTHORIZATION_URLS.authorization)
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('carries the prequalification notice without a checkbox', () => {
    // Information only - agreeing to it is not being asked for, so it must not
    // look like one of the two consents.
    renderWithProviders(<CreditAuthorizationConsent values={unticked} onChange={vi.fn()} />)

    expect(screen.getByText(/does not constitute an application approval/i)).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })

  it('labels the prequalification notice so it reads as its own statement', () => {
    // It was pale small text on a pale background and went unread. The label
    // carries the point - this is the limit of what a prequalification means.
    renderWithProviders(<CreditAuthorizationConsent values={unticked} onChange={vi.fn()} />)

    expect(screen.getByRole('note')).toHaveTextContent('Prequalification Notice')
  })

  it('links the privacy policy and terms of use separately', () => {
    renderWithProviders(<CreditAuthorizationConsent values={unticked} onChange={vi.fn()} />)

    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      CREDIT_AUTHORIZATION_URLS.privacy
    )
    expect(screen.getByRole('link', { name: 'Terms of Use' })).toHaveAttribute(
      'href',
      CREDIT_AUTHORIZATION_URLS.terms
    )
  })

  it('shows the API refusal when consent was missing', () => {
    renderWithProviders(
      <CreditAuthorizationConsent
        values={unticked}
        onChange={vi.fn()}
        error="You must agree to the Credit Authorization before your credit profile can be requested."
      />
    )

    expect(screen.getByText(/You must agree to the Credit Authorization/)).toBeInTheDocument()
  })
})
