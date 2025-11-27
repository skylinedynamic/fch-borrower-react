import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from '../src/components/Layout/Layout.jsx'
import Dashboard from '../src/pages/dashboard/Dashboard.jsx'
import SignIn from '../src/pages/singin/SignIn.jsx'
import ForgotPassword from '../src/pages/singin/ForgotPassword.jsx'
import ResetPassword from '../src/pages/singin/ResetPassword.jsx'
import SignUp from '../src/pages/singin/SignUp.jsx'
import UnderConstruction from '../src/pages/UnderConstruction.jsx'
import CreditGuide from '../src/pages/creditguide/CreditGuide.tsx'
import FundApplication from '../src/pages/fundapplication/FundApplication.tsx'
import PreQualification from '../src/pages/prequalification/PreQualification.tsx'
import Documents from '../src/pages/documents/Documents.tsx'
import { ProtectedRoute, GuestRoute, checkSession } from './lib/auth'
import Profile from '../src/pages/profile/profile.tsx'
import MyApplication from '../src/pages/myapplication/MyApplication.tsx'
import Appointmnet from '../src/pages/appointment/appointmnet.tsx'
import CreditOverview from '../src/pages/creditoverview/CreditOverview.tsx'
import VendorApplication from '../src/pages/creditvendorapplication/VendorApplication.tsx'
import ProgressTracker from '../src/pages/creditprogresstracker/ProgressTracker.tsx'
import CreditResources from '../src/pages/creditresources/CreditResources.tsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'


export default function App() {
  useEffect(() => {
    checkSession()
  }, [])

  return (
    <>
      <ToastContainer theme="colored" />
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="login" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />

        <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />
      </Route>
      <Route element={<ProtectedRoute />}> 
        <Route element={<Layout />}> 
          <Route index element={<Dashboard />} />
          <Route path="under-construction/:feature" element={<UnderConstruction />} />
          <Route path="credit-guide" element={<CreditGuide />} />
          <Route path="pre-qualification" element={<PreQualification />} />
          <Route path="fund-application" element={<FundApplication />} />
          <Route path="my-applications" element={<MyApplication />} />
          <Route path="appointment" element={<Appointmnet />} />
          <Route path="credit-overview" element={<CreditOverview />} />
          <Route path="vendor-application" element={<VendorApplication />} />
          <Route path="progress-tracker" element={<ProgressTracker />} />
          <Route path="credit-resources" element={<CreditResources />} />
          <Route path="documents" element={<Documents />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
    </Routes>
    </>
  )
}
