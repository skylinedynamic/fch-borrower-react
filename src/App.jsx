import React, { useEffect } from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import Layout from '../src/components/Layout/Layout.jsx'
import Dashboard from '../src/pages/dashboard/Dashboard.jsx'
import SignIn from '../src/pages/singin/SignIn.jsx'
import ForgotPassword from '../src/pages/singin/ForgotPassword.jsx'
import ResetPassword from '../src/pages/singin/ResetPassword.jsx'
// import SignUp from '../src/pages/singin/SignUp.jsx'
import CreditGuide from '../src/pages/credit-builder/creditguide/CreditGuide.tsx'
import Documents from '../src/pages/documents/Documents.tsx'
import { ProtectedRoute, GuestRoute, HostRoute, CapitalAccessGuard, CapitalAccessStrategyGuard, checkSession, refreshSubscription } from './lib/auth'
import { useAuthStore } from './store/auth'
import Profile from '../src/pages/profile/profile.tsx'
import PreQualification from '../src/pages/prequalification/PreQualification.tsx'
import MyApplication from '../src/pages/myapplication/MyApplication.tsx'
import FundingApplicationDetailPage from '../src/pages/myapplication/FundingApplicationDetailPage.tsx'
import FundApplication from '../src/pages/fundapplication/FundApplication.tsx'
import Invoices from '../src/pages/invoices/Invoices.jsx'
import InvoiceDetails from '../src/pages/invoices/InvoiceDetails.jsx'
import Payments from '../src/pages/payments/Payments.jsx'
import PaymentDetails from '../src/pages/payments/PaymentDetails.jsx'
import BillingDetails from '../src/pages/billing-details/BillingDetails.tsx'
import Appointments from '../src/pages/appointment/Appointments.tsx'
import ChangePassword from '../src/pages/settings/ChangePassword.jsx'
import CreditOverview from '../src/pages/credit-builder/creditoverview/CreditOverview.tsx'
import VendorApplication from '../src/pages/credit-builder/creditvendorapplication/CreditAccounts.tsx'
import CreditResources from '../src/pages/credit-builder/creditresources/CreditResources.tsx'
import CapitalAccess from '../src/pages/capital-access/CapitalAccess.tsx'
import StrategySelection from '../src/pages/capital-access/StrategySelection.tsx'
import PlayOverview from '../src/pages/capital-access/PlayOverview.tsx'
import PreFlightChecklist from '../src/pages/capital-access/PreFlightChecklist.tsx'
import PlayRoadmap from '../src/pages/capital-access/PlayRoadmap.tsx'
import StepDetail from '../src/pages/capital-access/StepDetail.tsx'
import PlayCompletion from '../src/pages/capital-access/PlayCompletion.tsx'
import ResourceHub from '../src/pages/resources/ResourceHub.jsx'
import ResourceDetail from '../src/pages/resources/ResourceDetail.jsx'
import Funding from '../src/pages/funding/Funding.tsx'
import FundingDetail from '../src/pages/funding/components/FundingDetail.tsx'
import FundingRequestWizard from '../src/pages/funding/FundingRequestWizard.tsx'
import FundingRequestList from '../src/pages/funding-requests/FundingRequestList.tsx'
import FundingRequestDetailPage from '../src/pages/funding-requests/FundingRequestDetailPage.tsx'
import NotificationList from './pages/notifications/NotificationList.tsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import GlobalModals from './components/Common/Modals/GlobalModals'
import DownloadAgreement from './pages/agreement/DownloadAgreement.jsx'
import ErrorPage from './pages/Utility/ErrorPage.jsx'
import { fetchBorrowerTheme } from './modules/settings/services'
import { useBrandingStore } from './store/brandingStore'
import { applyBrandTheme } from './utils/brandingTheme'

export default function App() {
  const { setBranding } = useBrandingStore()
  const token = useAuthStore((state) => state.token)

  const loadBranding = () => {
    fetchBorrowerTheme().then(res => {
      if (res?.data?.branding) {
        setBranding(res.data.branding);
        const branding = res.data.branding;

        const pageTitle = branding.meta_title || branding.site_name;
        if (pageTitle) {
          document.title = pageTitle;
        }

        const faviconUrl = branding.favicon_full_url || branding.favicon;
        if (faviconUrl && faviconUrl !== 'null') {
          document.querySelectorAll("link[rel~='icon']").forEach(el => el.remove());
          const link = document.createElement('link');
          link.rel = 'icon';
          link.href = faviconUrl.includes('?') ? `${faviconUrl}&_t=${Date.now()}` : `${faviconUrl}?_t=${Date.now()}`;
          document.head.appendChild(link);
        }

        // Every brand colour, including the derived contrast tokens that keep
        // text readable on a light brand colour.
        applyBrandTheme(branding);
      }
    }).catch(console.error);
  }

  useEffect(() => {
    checkSession();

    const intervalId = setInterval(() => {
      checkSession();
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (token) {
      refreshSubscription();
      loadBranding();
    }
  }, [token]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="login" element={<SignIn />} />
          {/* <Route path="signup" element={<SignUp />} /> */}
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
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetails />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payments/:id" element={<PaymentDetails />} />
            <Route path="billing-details" element={<BillingDetails />} />
            <Route path="change-password" element={<ChangePassword />} />

            <Route path="pre-qualification" element={<PreQualification />} />
            <Route path="fund-application/:id?" element={<FundApplication />} />
            <Route path="my-applications" element={<MyApplication />} />
            <Route path="my-applications/funding/:id" element={<FundingApplicationDetailPage />} />
            <Route path="appointment" element={<Appointments />} />
            <Route path="funding" element={<Funding />} />
            <Route path="funding/:id" element={<FundingDetail />} />
            <Route path="funding/:id/review" element={<FundingRequestWizard />} />
            <Route path="funding-requests" element={<FundingRequestList />} />
            <Route path="funding-requests/:id" element={<FundingRequestDetailPage />} />
            <Route path="notifications" element={<NotificationList />} />

            <Route path="credit-builder">
              <Route index element={<CreditOverview />} />
              <Route path="overview" element={<CreditOverview />} />
              <Route path="guide" element={<CreditGuide />} />
              <Route path="credit-accounts" element={<VendorApplication />} />
              <Route path="resources" element={<CreditResources />} />
            </Route>

            <Route path="capital-access" element={<CapitalAccessGuard />}>
              <Route index element={<CapitalAccess />} />
              <Route path="strategy" element={<StrategySelection />} />
              {/* CapitalAccessStrategyGuard validates the :id against the user's recommended strategy */}
              <Route path=":id" element={<CapitalAccessStrategyGuard />}>
                <Route path="overview" element={<PlayOverview />} />
                <Route path="pre-flight" element={<PreFlightChecklist />} />
                <Route path="roadmap" element={<PlayRoadmap />} />
                <Route path="step/:stepId" element={<StepDetail />} />
                <Route path="completion" element={<PlayCompletion />} />
              </Route>
            </Route>

            <Route path="documents" element={<Documents />} />
            <Route path="profile" element={<Profile />} />
            <Route path="resources" element={<ResourceHub />} />
            <Route path="resources/:id" element={<ResourceDetail />} />
            <Route path="access-denied" element={<ErrorPage status={403} />} />
            <Route path="not-found" element={<ErrorPage status={404} />} />
            <Route path="*" element={<ErrorPage status={404} />} />
          </Route>
        </Route>
      </Routes>
    </>
  )

}
