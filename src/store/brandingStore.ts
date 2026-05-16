import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type BrandingConfig = {
  site_name: string | null
  site_slogan: string | null
  copyright_text: string | null
  primary_color: string | null
  secondary_color: string | null
  meta_title: string | null
  header_logo: string | null
  footer_logo: string | null
  primary_logo: string | null
  secondary_logo: string | null
  favicon: string | null
  website_favicon: string | null
  is_white_label: boolean | null
}

type BrandingState = {
  branding: BrandingConfig | null
  setBranding: (branding: BrandingConfig | null) => void
  clearBranding: () => void
}

export const useBrandingStore = create<BrandingState>()(
  persist(
    (set) => ({
      branding: null,
      setBranding: (branding) => set(() => ({ branding })),
      clearBranding: () => set(() => ({ branding: null })),
    }),
    {
      name: 'branding',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

export const getBranding = () => useBrandingStore.getState().branding
export const setBranding = (branding: BrandingConfig | null) => useBrandingStore.getState().setBranding(branding)
export const clearBranding = () => useBrandingStore.getState().clearBranding()
