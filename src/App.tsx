import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'

import { ErrorBoundary } from './components/ErrorBoundary'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ExploreRequirementsPage from './pages/ExploreRequirementsPage'
import PublicRequirementDetailPage from './pages/PublicRequirementDetailPage'
import ProviderProfilePage from './pages/ProviderProfilePage'

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard'
import MyRequirementsPage from './pages/customer/MyRequirementsPage'
import RequirementDetailPage from './pages/customer/RequirementDetailPage'
import CreateRequirementPage from './pages/customer/CreateRequirementPage'

// Provider Pages
import ProviderDashboard from './pages/provider/ProviderDashboard'
import ProviderOffersPage from './pages/provider/ProviderOffersPage'
import SubmitOfferPage from './pages/provider/SubmitOfferPage'

// Shared Pages
import NotificationsPage from './pages/NotificationsPage'
import ProfileEditPage from './pages/ProfileEditPage'
import OrderDetailPage from './pages/OrderDetailPage'

// v2 — Customer
import CustomerOrdersPage from './pages/customer/CustomerOrdersPage'
import PaymentPage from './pages/customer/PaymentPage'

// v2 — Provider
import ProviderOrdersPage from './pages/provider/ProviderOrdersPage'
import ProviderDeliverPage from './pages/provider/ProviderDeliverPage'

// Guards
import { ProtectedRoute } from './components/ProtectedRoute'

function RoleRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile) return <Navigate to="/login" replace />
  return <Navigate to={profile.role === 'customer' ? '/dashboard/customer' : '/dashboard/provider'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/explore" element={<ExploreRequirementsPage />} />
      <Route path="/requirements/:id" element={<PublicRequirementDetailPage />} />
      <Route path="/providers/:id" element={<ProviderProfilePage />} />

      {/* Auth redirect */}
      <Route path="/dashboard" element={<RoleRedirect />} />

      {/* Customer Routes */}
      <Route path="/dashboard/customer" element={
        <ProtectedRoute role="customer"><CustomerDashboard /></ProtectedRoute>
      } />
      <Route path="/dashboard/customer/requirements" element={
        <ProtectedRoute><MyRequirementsPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/customer/requirements/:id" element={
        <ProtectedRoute><RequirementDetailPage /></ProtectedRoute>
      } />
      <Route path="/requirements/create" element={
        <ProtectedRoute><CreateRequirementPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/customer/notifications" element={
        <ProtectedRoute role="customer"><NotificationsPage role="customer" /></ProtectedRoute>
      } />
      <Route path="/dashboard/customer/profile" element={
        <ProtectedRoute role="customer"><ProfileEditPage role="customer" /></ProtectedRoute>
      } />

      {/* Provider Routes */}
      <Route path="/dashboard/provider" element={
        <ProtectedRoute role="provider"><ProviderDashboard /></ProtectedRoute>
      } />
      <Route path="/dashboard/provider/offers" element={
        <ProtectedRoute role="provider"><ProviderOffersPage /></ProtectedRoute>
      } />
      <Route path="/requirements/:id/submit-offer" element={
        <ProtectedRoute role="provider"><SubmitOfferPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/provider/notifications" element={
        <ProtectedRoute role="provider"><NotificationsPage role="provider" /></ProtectedRoute>
      } />
      <Route path="/dashboard/provider/profile" element={
        <ProtectedRoute role="provider"><ProfileEditPage role="provider" /></ProtectedRoute>
      } />

      {/* v2 — Customer Orders + Payment */}
      <Route path="/dashboard/customer/orders" element={
        <ProtectedRoute role="customer"><CustomerOrdersPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/customer/orders/:id" element={
        <ProtectedRoute role="customer"><OrderDetailPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/customer/orders/:id/pay" element={
        <ProtectedRoute role="customer"><PaymentPage /></ProtectedRoute>
      } />

      {/* v2 — Provider Orders + Delivery */}
      <Route path="/dashboard/provider/orders" element={
        <ProtectedRoute role="provider"><ProviderOrdersPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/provider/orders/:id" element={
        <ProtectedRoute role="provider"><OrderDetailPage /></ProtectedRoute>
      } />
      <Route path="/dashboard/provider/orders/:id/deliver" element={
        <ProtectedRoute role="provider"><ProviderDeliverPage /></ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-surface-900 flex-col gap-4">
          <h1 className="text-4xl font-bold text-surface-50">404</h1>
          <p className="text-surface-400">Page not found</p>
          <a href="/" className="btn-primary">Go Home</a>
        </div>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            },
            success: { iconTheme: { primary: '#00796b', secondary: '#ffffff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
  )
}
