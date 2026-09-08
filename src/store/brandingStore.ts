import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type BrandingConfig = {
  site_name: string | null
  site_slogan: string | null
  primary_color: string | null
  secondary_color: string | null
  sidebar_bg_color?: string | null
  sidebar_text_color?: string | null
  sidebar_icon_color?: string | null
  sidebar_hover_bg_color?: string | null
  sidebar_text_hover_color?: string | null
  sidebar_icon_hover_color?: string | null
  sidebar_active_bg_color?: string | null
  sidebar_active_text_color?: string | null
  sidebar_active_icon_color?: string | null
  // Top bar — unset keeps the white bar the theme ships with
  topbar_bg_color?: string | null
  topbar_text_color?: string | null
  // Logos, one per surface they appear on
  logo_sidebar?: string | null
  logo_sidebar_full_url?: string | null
  logo_document?: string | null
  logo_document_full_url?: string | null
  logo_mail?: string | null
  logo_mail_full_url?: string | null
  logo_mobile?: string | null
  logo_mobile_full_url?: string | null
  favicon?: string | null
  favicon_full_url?: string | null
  // `website` module - the public marketing site's own settings, not branding.
  meta_title: string | null
  header_logo: string | null
  footer_logo: string | null
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
