import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// jsdom has no hover or cascade, so this pins the rule itself; the E2E specs
// (funding.spec, funding-locked.spec) check the colour a real browser shows.
const css = (file: string) => readFileSync(resolve(__dirname, '../../..', file), 'utf8')

describe('Funding banner breadcrumb on hover', () => {
  it('stays white, outranking custom.css', () => {
    // The global rule it has to beat: brand colour, !important.
    expect(css('assets/css/custom.css')).toMatch(/\.breadcrumb-item a:hover\s*\{[^}]*!important/)

    const rule = css('src/pages/funding/Funding.css').match(
      /\.funding-page \.fp-breadcrumb \.breadcrumb-item a:hover[^{]*\{([^}]*)\}/
    )
    expect(rule, 'hover rule for the banner breadcrumb').not.toBeNull()
    expect(rule![1]).toMatch(/color:\s*#fff\s*!important/)
  })
})
