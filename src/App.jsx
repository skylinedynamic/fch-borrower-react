import React, { useEffect } from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import Layout from '../src/components/Layout/Layout.jsx'
import Dashboard from '../src/pages/dashboard/Dashboard.jsx'
import SignIn from '../src/pages/singin/SignIn.jsx'
import ForgotPassword from '../src/pages/singin/ForgotPassword.jsx'
import ResetPassword from '../src/pages/singin/ResetPassword.jsx'
import SignUp from '../src/pages/singin/SignUp.jsx'
import CreditGuide from '../src/pages/credit-builder/creditguide/CreditGuide.tsx'
import FundApplication from '../src/pages/fundapplication/FundApplication.tsx'
import PreQualification from '../src/pages/prequalification/PreQualification.tsx'
import Documents from '../src/pages/documents/Documents.tsx'
import { ProtectedRoute, GuestRoute, HostRoute, checkSession, refreshSubscription } from './lib/auth'
import Profile from '../src/pages/profile/profile.tsx'
import MyApplication from '../src/pages/myapplication/MyApplication.tsx'
import Invoices from '../src/pages/invoices/Invoices.jsx'
import Payments from '../src/pages/payments/Payments.jsx'
import Appointments from '../src/pages/appointment/Appointments.tsx'
import ChangePassword from '../src/pages/settings/ChangePassword.jsx'
import CreditOverview from '../src/pages/credit-builder/creditoverview/CreditOverview.tsx'
import VendorApplication from '../src/pages/credit-builder/creditvendorapplication/VendorApplication.tsx'
import ProgressTracker from '../src/pages/credit-builder/creditprogresstracker/ProgressTracker.tsx'
import CreditResources from '../src/pages/credit-builder/creditresources/CreditResources.tsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import GlobalModals from './components/Common/Modals/GlobalModals'
import DownloadAgreement from './pages/documents/DownloadAgreement.jsx'
import ErrorPage from './pages/Utility/ErrorPage.jsx'


export default function App() {
  useEffect(() => {
    // Check session immediately on app load
    checkSession();
    // Refresh user details to ensure permissions/subscription are up to date
    refreshSubscription();

    // Set up periodic session validation (every 5 minutes)
    const intervalId = setInterval(() => {
      checkSession();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="login" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="download-agreement/:userId" element={<DownloadAgreement />} />
          <Route element={
            <>
              <GlobalModals />
              <Layout />
            </>
          }>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />

            <Route element={<HostRoute />}>
              <Route path="invoices" element={<Invoices />} />
              <Route path="payments" element={<Payments />} />
            </Route>

            <Route path="change-password" element={<ChangePassword />} />

            <Route path="pre-qualification" element={<PreQualification />} />
            <Route path="fund-application" element={<FundApplication />} />
            <Route path="my-applications" element={<MyApplication />} />
            <Route path="appointment" element={<Appointments />} />

            <Route path="credit-builder">
              <Route index element={<CreditOverview />} />
              <Route path="overview" element={<CreditOverview />} />
              <Route path="guide" element={<CreditGuide />} />
              <Route path="vendor-application" element={<VendorApplication />} />
              <Route path="progress-tracker" element={<ProgressTracker />} />
              <Route path="resources" element={<CreditResources />} />
            </Route>

            <Route path="documents" element={<Documents />} />
            <Route path="profile" element={<Profile />} />
            <Route path="access-denied" element={<ErrorPage status={403} />} />
            <Route path="not-found" element={<ErrorPage status={404} />} />
            <Route path="*" element={<ErrorPage status={404} />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}
