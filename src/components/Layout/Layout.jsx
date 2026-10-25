import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import Footer from './Footer.jsx'
import GlobalFundingBanner from './GlobalFundingBanner'
import { useActiveFundingRequests } from '../../modules/dashboard'
import SupportChatWidget from '../Common/ChatWidget/SupportChatWidget.tsx'

export default function Layout() {
  const { data: activeFundingRequests } = useActiveFundingRequests();
  const activeApprovedRequest = activeFundingRequests?.data?.active_approved_funding_request;

  const activeApprovedRequestCount = activeFundingRequests?.data?.active_approved_funding_request_count || 0;

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
      <SupportChatWidget />
    </div>
  )
}