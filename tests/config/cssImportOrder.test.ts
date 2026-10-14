import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * E2E-009: an @import that follows any other rule is ignored by the browser
 * (and `vite build` warns about it), so the fonts it pulled in never loaded.
 * Only @charset and @layer statements may come before @import.
 */
const ROOTS = ['assets/css', 'src']

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return cssFiles(path)
    // Minified vendor bundles are third-party output, not edited by hand.
    return name.endsWith('.css') && !name.endsWith('.min.css') ? [path] : []
  })
}

// One leading @charset / @layer / @import statement. URLs are matched whole
// because Google Fonts URLs carry semicolons (`wght@300;400`).
const LEADING_STATEMENT = /^@(?:charset\s+"[^"]*"|layer\s+[^;{]*|import\s+(?:url\([^)]*\)|"[^"]*"|'[^']*')[^;]*)\s*;/

function importsAfterOtherRules(css: string): string[] {
  let rest = css.replace(/\/\*[\s\S]*?\*\//g, '').trimStart()
  for (let m = rest.match(LEADING_STATEMENT); m; m = rest.match(LEADING_STATEMENT)) {
    rest = rest.slice(m[0].length).trimStart()
  }
  return rest.match(/@import\s[^\n]*/g) ?? []
}

describe('CSS @import placement', () => {
  const files = ROOTS.flatMap(cssFiles)

  it('finds the project stylesheets', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map((f) => [relative('.', f).replace(/\\/g, '/')]))('%s keeps @import at the top', (file) => {
    expect(importsAfterOtherRules(readFileSync(file, 'utf8'))).toEqual([])
  })
})

/**
 * E2E-011: a React-style `zIndex: 1;` in custom.css was silently dropped by the
 * browser (CSS property names are kebab-case), and `vite build` warned about it.
 */
describe('CSS property names', () => {
  it.each(ROOTS.flatMap(cssFiles).map((f) => [relative('.', f).replace(/\\/g, '/')]))('%s has no camelCase properties', (file) => {
    const body = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(body.match(/^\s*[a-z]+[A-Z][A-Za-z]*\s*:/gm) ?? []).toEqual([])
  })
})
