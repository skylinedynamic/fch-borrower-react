import React from 'react'
import { useBrandingStore } from '../../store/brandingStore'
import { useAuthStore } from '../../store/auth'

export default function Footer() {
  const { branding } = useBrandingStore()
  const user = useAuthStore((state) => state.user)

  // Generated from the site name rather than stored: one less thing to keep in
  // step, and it stays correct when a partner renames themselves.
  const siteName = branding?.site_name || ''

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