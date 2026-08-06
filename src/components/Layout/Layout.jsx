import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import Footer from './Footer.jsx'
import GlobalFundingBanner from './GlobalFundingBanner.jsx'
import { useDashboard } from '../../modules/dashboard'

export default function Layout() {
  const { data: dashboardData } = useDashboard();
  const activeApprovedRequest = dashboardData?.data?.active_approved_funding_request;

  const activeApprovedRequestCount = dashboardData?.data?.active_approved_funding_request_count || 0;

  return (
    <div id="layout-wrapper">
      <Header />
      <Sidebar />
      <div
        className="vertical-overlay"
        onClick={() => {
          document.body.classList.remove('vertical-sidebar-enable')
        }}
      />
      <div className="main-content">
        <GlobalFundingBanner activeRequest={activeApprovedRequest} count={activeApprovedRequestCount} />
        <Outlet />
        <Footer />
      </div>
    </div>
  )
}