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
<<<<<<< HEAD
import Profile from '../src/pages/profile/Profile.tsx'
import MyApplication from '../src/pages/myapplication/MyApplication.tsx'
import Appointmnet from '../src/pages/appointment/appointmnet.tsx'
=======
import Profile from "./pages/profile/profile";
>>>>>>> 5b95763fc7608c9ac8ba1235b01cf0148bac6114

import CreditOverview from '../src/pages/creditoverview/CreditOverview.tsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function DashboardPage() {
  return (
    <div className="page-content">
      <div className="container-fluid">
        <h4 className="fs-20 mb-1">Dashboard</h4>
        <p className="text-muted">Welcome to your React app.</p>
      </div>
    </div>
  )
}

function PartnersPage() {
  return (
    <div className="page-content">
      <div className="container-fluid">
        <h4 className="fs-20 mb-1">Partners</h4>
        <p className="text-muted">This is a placeholder Partners page.</p>
      </div>
    </div>
  )
}


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

<<<<<<< HEAD
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
          <Route path="documents" element={<Documents />} />
          <Route path="profile" element={<Profile />} />
=======
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
>>>>>>> 5b95763fc7608c9ac8ba1235b01cf0148bac6114
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="under-construction/:feature" element={<UnderConstruction />} />
            <Route path="pre-qualification" element={<PreQualification />} />
            <Route path="documents" element={<Documents />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </>
  )
}
