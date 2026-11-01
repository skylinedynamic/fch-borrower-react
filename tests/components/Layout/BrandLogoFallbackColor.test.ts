import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildBrandVars, contrastRatio } from '../../../src/utils/brandingTheme'

// jsdom has no cascade, so this pins the rule itself.
const css = readFileSync(resolve(__dirname, '../../../assets/css/custom.css'), 'utf8')

/**
 * Defect (BUG-141, CP-GLOB-08): on a white-label portal whose logo failed to
 * load, the tenant name in the sidebar was dark grey (#495057, the light
 * sidebar's menu colour) on the dark navy sidebar - nearly invisible. The
 * fallback took --vz-vertical-menu-item-active-color, which white-label
 * branding does not set. It now takes --brand-on-sidebar: the text colour the
 * branding works out for the sidebar background, the one the menu uses.
 */
describe('BrandLogo fallback name in the sidebar', () => {
  it('uses the sidebar text colour from the branding', () => {
    const rule = css.match(/(?:^|\n)\.brand-logo-text\s*\{([^}]*)\}/)
    expect(rule, '.brand-logo-text rule').not.toBeNull()
    expect(rule![1]).toMatch(/color:\s*var\(--brand-on-sidebar\b/)
  })

  it('keeps the dark heading colour in the top bar and on the sign-in page', () => {
    expect(css).toMatch(/\.navbar-header \.brand-logo-text,\s*\.auth-page-wrapper \.brand-logo-text\s*\{[^}]*color:\s*var\(--vz-heading-color/)
  })

  it('is readable on the navy sidebar QA saw', () => {
    const vars = buildBrandVars({ sidebar_bg_color: '#001F3F' })
    expect(contrastRatio(vars['--brand-on-sidebar'], '#001F3F')).toBeGreaterThanOrEqual(4.5)
  })

  it('is readable on a light sidebar too', () => {
    const vars = buildBrandVars({ sidebar_bg_color: '#F8F9FA' })
    expect(contrastRatio(vars['--brand-on-sidebar'], '#F8F9FA')).toBeGreaterThanOrEqual(4.5)
  })
})
