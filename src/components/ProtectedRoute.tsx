import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface ProtectedRouteProps {
  children: React.ReactNode
  role?: 'customer' | 'provider'
}

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-900">
        <div className="flex flex-col items-center gap-4">
          <img src="/favicon.jpg" alt="Logo" className="w-12 h-12 rounded-2xl object-cover animate-pulse-slow" />
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If role check needed but profile not yet loaded, keep showing loader.
  // After a few seconds if it's still stuck, the user needs to recreate their account.
  if (role && !profile) {
    return (
      <div className="min-h-screen flex flex-col gap-6 items-center justify-center bg-surface-900">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-surface-300 text-sm mb-4">Setting up your profile...</p>
          <p className="text-surface-400 text-xs mb-4 max-w-xs">If this takes more than a few seconds, your account data might be incomplete due to a database error during signup.</p>
          <button 
            onClick={() => {
              supabase.auth.signOut().then(() => window.location.href = '/')
            }}
            className="text-brand-400 text-sm hover:underline"
          >
            Log out and sign up again
          </button>
        </div>
      </div>
    )
  }

  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === 'customer' ? '/dashboard/customer' : '/dashboard/provider'} replace />
  }

  return <>{children}</>
}
