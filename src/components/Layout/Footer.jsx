import React from 'react'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-12 text-end">
            <span>Copyright © {new Date().getFullYear()} Four Corner Funding. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}