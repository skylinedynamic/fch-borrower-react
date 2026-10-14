import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import BrandLogo from '../../../src/components/Layout/BrandLogo'

describe('BrandLogo', () => {
  it('renders the image with the tenant name as alt text', () => {
    render(<BrandLogo src="/logo.png" fallbackText="Acme Capital" height="50" />)
    const img = screen.getByRole('img', { name: 'Acme Capital' })
    expect(img).toHaveAttribute('src', '/logo.png')
    expect(img).toHaveAttribute('height', '50')
  })

  it('swaps a broken image for the tenant name', () => {
    render(<BrandLogo src="/missing.png" fallbackText="Acme Capital" />)
    fireEvent.error(screen.getByRole('img'))

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('Acme Capital')).toBeInTheDocument()
  })

  it('renders nothing for a broken image when there is no name to show', () => {
    const { container } = render(<BrandLogo src="/missing.png" />)
    fireEvent.error(container.querySelector('img') as HTMLImageElement)
    expect(container).toBeEmptyDOMElement()
  })

  it('retries when given a new URL', () => {
    const { rerender } = render(<BrandLogo src="/missing.png" fallbackText="Acme Capital" />)
    fireEvent.error(screen.getByRole('img'))

    rerender(<BrandLogo src="/new.png" fallbackText="Acme Capital" />)
    expect(screen.getByRole('img')).toHaveAttribute('src', '/new.png')
  })

  it('passes className through to the image', () => {
    render(<BrandLogo src="/logo.png" fallbackText="Acme" className="auth-logo-img" />)
    expect(screen.getByRole('img')).toHaveClass('auth-logo-img')
  })
})
