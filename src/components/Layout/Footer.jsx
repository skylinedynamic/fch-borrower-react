import React from 'react'
import { useBrandingStore } from '../../store/brandingStore'
import { useAuthStore } from '../../store/auth'

export default function Footer() {
  const { branding } = useBrandingStore()
  const user = useAuthStore((state) => state.user)

  const isWhiteLabel = branding?.is_white_label

  const siteName = isWhiteLabel ? (branding?.site_name) : branding?.site_name

  const defaultCopyright = `Copyright © ${new Date().getFullYear()} ${siteName}. All rights reserved.`
  const copyrightText = isWhiteLabel ? (branding?.copyright_text || defaultCopyright) : defaultCopyright

  return (
    <footer className="footer">
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-12 text-end">
            <span>
              {`Copyright © ${new Date().getFullYear()} ${siteName}. All rights reserved.`}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}