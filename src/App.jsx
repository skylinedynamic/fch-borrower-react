import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../src/components/Layout/Layout.jsx'
import Dashboard from '../src/pages/dashboard/Dashboard.jsx'
import SignIn from '../src/pages/singin/SignIn.jsx'
import ForgotPassword from '../src/pages/singin/ForgotPassword.jsx'
import ResetPassword from '../src/pages/singin/ResetPassword.jsx'
import SignUp from '../src/pages/singin/SignUp.jsx'
import UnderConstruction from '../src/pages/UnderConstruction.jsx'
import CreditGuide from '../src/pages/credit-builder/creditguide/CreditGuide.tsx'
import FundApplication from '../src/pages/fundapplication/FundApplication.tsx'
import PreQualification from '../src/pages/prequalification/PreQualification.tsx'
import Documents from '../src/pages/documents/Documents.tsx'
import { ProtectedRoute, GuestRoute, checkSession } from './lib/auth'
import Profile from '../src/pages/profile/profile.tsx'
import MyApplication from '../src/pages/myapplication/MyApplication.tsx'
import Invoices from '../src/pages/invoices/Invoices.jsx'
import Appointments from '../src/pages/appointment/Appointments.tsx'
import CreditOverview from '../src/pages/credit-builder/creditoverview/CreditOverview.tsx'
import VendorApplication from '../src/pages/credit-builder/creditvendorapplication/VendorApplication.tsx'
import ProgressTracker from '../src/pages/credit-builder/creditprogresstracker/ProgressTracker.tsx'
import CreditResources from '../src/pages/credit-builder/creditresources/CreditResources.tsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ProfileCompleteCheckModal from './components/ProfileCompleteCheckModal/ProfileCompleteCheckModal'
import { UnpaidInvoiceProvider } from './contexts/UnpaidInvoiceContext'
import { UnpaidInvoiceGuard } from './lib/auth/UnpaidInvoiceGuard'


export default function App() {
  useEffect(() => {
    checkSession()
  }, [])

  return (
    <UnpaidInvoiceProvider>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="login" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />

        <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      </Route>
      <Route element={
        <>
          <ProfileCompleteCheckModal />
          <ProtectedRoute />
        </>
      }>
       
        <Route element={<Layout />}> 
        
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pre-qualification" element={<UnpaidInvoiceGuard><PreQualification /></UnpaidInvoiceGuard>} />
          <Route path="fund-application" element={<UnpaidInvoiceGuard><FundApplication /></UnpaidInvoiceGuard>} />
          <Route path="my-applications" element={<UnpaidInvoiceGuard><MyApplication /></UnpaidInvoiceGuard>} />
          <Route path="invoices" element={<Invoices />} />
           <Route path="appointment" element={<UnpaidInvoiceGuard><Appointments /></UnpaidInvoiceGuard>} />

          <Route path="credit-builder">
            <Route index element={<UnpaidInvoiceGuard><CreditOverview /></UnpaidInvoiceGuard>} />
            <Route path="overview" element={<UnpaidInvoiceGuard><CreditOverview /></UnpaidInvoiceGuard>} />
            <Route path="guide" element={<UnpaidInvoiceGuard><CreditGuide /></UnpaidInvoiceGuard>} />
            <Route path="vendor-application" element={<UnpaidInvoiceGuard><VendorApplication /></UnpaidInvoiceGuard>} />
            <Route path="progress-tracker" element={<UnpaidInvoiceGuard><ProgressTracker /></UnpaidInvoiceGuard>} />
            <Route path="resources" element={<UnpaidInvoiceGuard><CreditResources /></UnpaidInvoiceGuard>} />
          </Route>

          <Route path="documents" element={<UnpaidInvoiceGuard><Documents /></UnpaidInvoiceGuard>} />
          <Route path="profile" element={<UnpaidInvoiceGuard><Profile /></UnpaidInvoiceGuard>} />

        </Route>
      </Route>
    </Routes>
    </UnpaidInvoiceProvider>
  )
}
