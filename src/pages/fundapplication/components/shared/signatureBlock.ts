import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import type { SignatureBlockSettings } from '../../../../modules/funding-application/types'

/**
 * The Borrower Agreement's Signature block, as set up in the agreement builder's
 * Block Properties panel, applied to the signature on the funding application -
 * so the two look like the same thing, and a change in the builder shows here
 * without anyone touching this page.
 *
 * The fallbacks are the builder's own (see `gen()` in its utils), so a block
 * with nothing customised renders exactly as the builder previews it.
 */

// The families the builder offers, and the weights it loads them at.
const GOOGLE_FONTS: Record<string, string> = {
  Inter: 'Inter:wght@400;500;600;700;800',
  'Playfair Display': 'Playfair+Display:ital,wght@0,400;0,700;1,400',
  Roboto: 'Roboto:wght@400;500;700',
  Lora: 'Lora:ital,wght@0,400;0,700;1,400',
  Montserrat: 'Montserrat:wght@400;600;700',
  'Fira Code': 'Fira+Code:wght@400;500',
}

/** `'Playfair Display', serif` -> `Playfair Display`. */
const primaryFamily = (fontFamily?: string | null): string | null =>
  fontFamily ? fontFamily.split(',')[0].trim().replace(/^['"]|['"]$/g, '') || null : null

/**
 * Load the block's font if it is one of the builder's web fonts. The borrower
 * portal does not ship them, and without this the signature would quietly fall
 * back to the page font.
 */
export const useSignatureBlockFont = (block?: SignatureBlockSettings | null): void => {
  const family = primaryFamily(block?.fontFamily)

  useEffect(() => {
    const spec = family ? GOOGLE_FONTS[family] : null
    if (!spec) return

    const id = `signature-block-font-${family!.replace(/\s+/g, '-').toLowerCase()}`
    if (document.getElementById(id)) return

    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`
    document.head.appendChild(link)
  }, [family])
}

/** The block's typography: what the signer's own text is set in. */
export const signatureTextStyle = (block?: SignatureBlockSettings | null): CSSProperties => {
  if (!block) return {}

  return {
    fontFamily: block.fontFamily || undefined,
    fontSize: `${block.fontSize || 15}px`,
    fontWeight: block.fontWeight || 400,
    fontStyle: block.fontStyle || undefined,
    textDecoration: block.textDecoration || undefined,
    textAlign: (block.textAlign as CSSProperties['textAlign']) || undefined,
    lineHeight: block.lineHeight || undefined,
    letterSpacing: block.letterSpacing ? `${block.letterSpacing}px` : undefined,
    color: block.color || '#0f172a',
  }
}

/** The small uppercase caption under the box - the builder's `.p-sig-meta`. */
export const signatureMetaStyle = (block?: SignatureBlockSettings | null): CSSProperties => ({
  fontSize: `${(block?.fontSize || 15) * 0.7}px`,
  fontFamily: block?.fontFamily || undefined,
  fontWeight: 800,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '1px',
})

/** The block's own background, spacing and corners around the signature. */
export const signatureWrapperStyle = (block?: SignatureBlockSettings | null): CSSProperties => {
  if (!block) return {}

  return {
    backgroundColor: block.bgColor || 'transparent',
    padding: `${block.padding || 0}px`,
    borderRadius: `${block.borderRadius || 0}px`,
    opacity: block.bgOpacity ?? 1,
    marginTop: `${block.marginTop || 0}px`,
    marginBottom: `${block.marginBottom || 0}px`,
  }
}

/** `AUTHORIZED SIGNER *` - the block's label, with its required mark. */
export const signatureLabel = (block?: SignatureBlockSettings | null): string =>
  `${block?.fieldLabel || 'Signature'}${block?.fieldRequired ? ' *' : ''}`
