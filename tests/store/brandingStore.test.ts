import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useBrandingStore, getBranding, setBranding, clearBranding, type BrandingConfig } from '../../src/store/brandingStore'

const sampleBranding: BrandingConfig = {
  site_name: 'Four Corner Funding',
  site_slogan: null,
  copyright_text: null,
  primary_color: '#123456',
  secondary_color: null,
  meta_title: null,
  header_logo: null,
  footer_logo: null,
  primary_logo: null,
  secondary_logo: null,
  favicon: null,
  website_favicon: null,
  is_white_label: true,
}

const reset = () => {
  useBrandingStore.setState({ branding: null })
  localStorage.clear()
}

describe('brandingStore', () => {
  beforeEach(reset)
  afterEach(reset)

  it('setBranding stores the config and getBranding reads it back', () => {
    setBranding(sampleBranding)
    expect(getBranding()).toEqual(sampleBranding)
  })

  it('clearBranding resets to null', () => {
    setBranding(sampleBranding)
    clearBranding()
    expect(getBranding()).toBeNull()
  })

  it('persists branding to localStorage', () => {
    setBranding(sampleBranding)
    const persisted = JSON.parse(localStorage.getItem('branding') || '{}')
    expect(persisted.state.branding).toEqual(sampleBranding)
  })
})
