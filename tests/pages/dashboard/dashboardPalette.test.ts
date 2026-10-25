import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The dashboard below its hero keeps to the portal's navy-on-white: no
 * gradients, no bright tone colours. Colour is left where it means something
 * or is meant to catch the eye: the hero (kept as designed), the
 * pending-invoice warning, the approved requests ready to process, the "Need
 * Help?" strip, the red-to-green credit score gauge and the invoice status edges.
 */
const css = readFileSync(join(process.cwd(), 'src/pages/dashboard/Dashboard.css'), 'utf8')

/** The stylesheet's labelled sections ("/* ---------- KPI cards ---------- *\/"), by label. */
function sections(): Map<string, string> {
  const parts = css.split(/\/\*\s*-{3,}\s*(.+?)\s*-{3,}\s*\*\//)
  const map = new Map<string, string>()
  for (let i = 1; i < parts.length; i += 2) map.set(parts[i], parts[i + 1])
  return map
}

const CALM_SECTIONS = [
  'KPI cards',
  'Card shell',
  'Empty state',
  'Credit profile (score + tier)',
  'Tier',
  'Tables',
  'Invoices (table rows)',
  'Meetings',
]

/** Sections that should catch the eye, in colour. */
const COLOURFUL_SECTIONS = ['Approved request banner', 'Support strip']

/** The body of the first rule for exactly this selector. */
const rule = (text: string, selector: string) =>
  text.match(new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

const BRIGHT_TOKENS = /var\(--db-(success|warning|violet|info|indigo|danger)-[ab]\)/

/** Colour literals that aren't a neutral grey/white/black (channels differ by more than a tint). */
function colouredLiterals(text: string): string[] {
  const found: string[] = []
  for (const [match, hex] of text.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
    const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
    if (Math.max(r, g, b) - Math.min(r, g, b) > 24) found.push(match)
  }
  for (const [match, r, g, b] of text.matchAll(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)/g)) {
    const channels = [r, g, b].map(Number)
    if (Math.max(...channels) - Math.min(...channels) > 24) found.push(match)
  }
  return found
}

describe('Dashboard palette', () => {
  const bySection = sections()

  it.each(CALM_SECTIONS)('%s: no gradients or bright colours', (name) => {
    const text = bySection.get(name)
    expect(text, `section "${name}" not found`).toBeDefined()

    expect(text).not.toMatch(/gradient\(/)
    expect(text).not.toMatch(BRIGHT_TOKENS)
    expect(colouredLiterals(text!)).toEqual([])
  })

  it.each(COLOURFUL_SECTIONS)('%s: a coloured gradient that catches the eye', (name) => {
    const text = bySection.get(name)
    expect(text, `section "${name}" not found`).toBeDefined()
    expect(text).toMatch(/linear-gradient\(/)
    expect(colouredLiterals(text!).length + (text!.match(BRIGHT_TOKENS) ? 1 : 0)).toBeGreaterThan(0)
  })

  it('tints the requests ready to process light green, with dark text', () => {
    // A strong gradient with white text was too loud; a light tint still marks it out.
    const card = rule(bySection.get('Approved request banner')!, '.db-approved')
    expect(card).toMatch(/color:\s*var\(--db-text\)/)
    expect(card).toMatch(/var\(--db-approved-tint\)/)
    expect(css).toMatch(/--db-approved-tint:\s*#e[0-9a-f]f[0-9a-f]{3}\b/i) // a pale green
    // Only its green left edge: no coloured border around it.
    expect(card).toMatch(/border-left:\s*4px solid var\(--db-success-a\)/)
    expect(card).not.toMatch(/(^|\n)\s*border:/)
  })

  it('makes Prev / Next on the requests ready to process solid green, so they show on the tint', () => {
    const pager = rule(bySection.get('Approved request banner')!, '.db-pager-btn')
    expect(pager).toMatch(/color:\s*#fff/)
    expect(pager).toMatch(/background:\s*var\(--db-success-b\)/)
  })

  it.each([
    ['Meetings', '.db-meetings'],
    ['Invoices (table rows)', '.db-invoices'],
  ])('%s: a fixed height that scrolls, so a long list does not stretch the row', (name, selector) => {
    const list = rule(bySection.get(name)!, selector)
    expect(list).toMatch(/max-height:\s*\d+px/)
    expect(list).toMatch(/overflow-y:\s*auto/)
  })

  it('draws invoices as plain rows in a framed list, no coloured edge or fill', () => {
    const invoices = bySection.get('Invoices (table rows)')!
    expect(rule(invoices, '.db-invoices')).toMatch(/border:\s*1px solid var\(--db-border\)/)
    expect(rule(invoices, '.db-invoice+.db-invoice')).toMatch(/border-top:\s*1px solid var\(--db-border\)/)
    const row = rule(invoices, '.db-invoice')
    // No fill at rest (the row only tints on hover, as a link does).
    expect(row).not.toMatch(/(^|\n)\s*background(-color)?:/)
    expect(row).not.toMatch(/border-left/)
    expect(invoices).not.toMatch(/\.db-invoice\.tone-/)
  })

  it('makes invoice rows match the meeting rows beside them', () => {
    const invoices = bySection.get('Invoices (table rows)')!
    const meetings = bySection.get('Meetings')!
    const prop = (body: string, name: string) => body.match(new RegExp(`(?:^|\\n)\\s*${name}:\\s*([^;]+);`))?.[1]
    expect(prop(rule(invoices, '.db-invoice'), 'padding')).toBe(prop(rule(meetings, '.db-meeting'), 'padding'))
    expect(prop(rule(invoices, '.db-invoices'), 'max-height')).toBe(prop(rule(meetings, '.db-meetings'), 'max-height'))
    expect(prop(rule(invoices, '.db-invoice-id'), 'font-size')).toBe(prop(rule(meetings, '.db-meeting-title'), 'font-size'))
    expect(prop(rule(invoices, '.db-invoice-meta'), 'font-size')).toBe(prop(rule(meetings, '.db-meeting-meta'), 'font-size'))
  })

  it('shows the credit score and the tier as two cards with a gap between them', () => {
    const text = bySection.get('Credit profile (score + tier)')!
    expect(rule(text, '.db-profile')).toMatch(/gap:\s*var\(--db-gap\)/)
    // Each half is a card of its own.
    expect(rule(text, '.db-profile-half')).toMatch(/border:\s*1px solid var\(--db-border\)/)
    expect(rule(text, '.db-profile-half')).toMatch(/background:\s*var\(--db-surface\)/)
  })

  it('spaces every block with the one gap, across and down', () => {
    expect(css).toMatch(/--db-gap:\s*16px;/)
    const gap = /var\(--db-gap\)/
    // Across: the stat tiles, score and tier, and the Bootstrap rows (the
    // portal's custom.min.css shrinks every row's gutter to 30% otherwise).
    expect(rule(css, '.db-kpis')).toMatch(/gap:\s*var\(--db-gap\)/)
    expect(rule(css, '.db-profile')).toMatch(/gap:\s*var\(--db-gap\)/)
    expect(rule(css, '.db-page .row>*')).toMatch(/padding-left:\s*calc\(var\(--db-gap\) \/ 2\)/)
    expect(rule(css, '.db-page .row>*')).toMatch(/padding-right:\s*calc\(var\(--db-gap\) \/ 2\)/)
    // Down: hero, stat tiles, approved requests and each row of cards.
    expect(rule(css, '.db-hero')).toMatch(/margin:\s*var\(--db-gap\) 0/)
    expect(rule(css, '.db-kpis')).toMatch(/margin-bottom:\s*var\(--db-gap\)/)
    expect(rule(css, '.db-approved')).toMatch(/margin-bottom:\s*var\(--db-gap\)/)
    expect(rule(css, '.db-page .row')).toMatch(/margin-bottom:\s*var\(--db-gap\)/)
    expect(gap.test(rule(css, '.db-page .row'))).toBe(true)
  })

  it("pins a card's own button to its bottom, so the buttons in a row line up", () => {
    expect(rule(css, '.db-stretch>.db-card>.db-card-body>.db-outline-btn')).toMatch(/margin-top:\s*auto/)
  })

  it('keeps the hero as designed', () => {
    const hero = bySection.get('Hero (greeting + Capital Access)')
    expect(hero).toMatch(/\.db-hero\s*\{[^}]*linear-gradient\(120deg, var\(--db-brand\) 0%/)
  })
})
