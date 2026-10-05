import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Menu, X, Bell, User, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { getInitials } from '../utils/formatters'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const navLinks = [
    { to: '/#how-it-works', label: 'How it works' },
    { to: '/#features', label: 'Features' },
    { to: '/explore', label: 'Explore' },
    { to: '/#pricing', label: 'Pricing' },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/favicon.jpg" alt="Logo" className="w-9 h-9 rounded-xl object-cover shadow-glow-brand" />
            <span className="font-display font-bold text-surface-50 text-lg hidden sm:block">Requora</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <a key={to} href={to} className="px-3 py-2 text-sm text-surface-300 hover:text-surface-50 rounded-lg hover:bg-surface-800 transition-all duration-150">
                {label}
              </a>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {user && profile ? (
              <>
                <Link
                  to={profile.role === 'customer' ? '/dashboard/customer/notifications' : '/dashboard/provider/notifications'}
                  className="relative p-2 rounded-lg text-surface-300 hover:text-surface-50 hover:bg-surface-800 transition-all"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="notif-dot" />}
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-surface-800 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                      ) : getInitials(profile.full_name)}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-surface-200">{profile.full_name.split(' ')[0]}</span>
                    <ChevronDown size={14} className="hidden sm:block text-surface-400" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 glass-card py-2 animate-fade-in z-50">
                      <Link
                        to={profile.role === 'customer' ? '/dashboard/customer' : '/dashboard/provider'}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-surface-200 hover:text-surface-50 hover:bg-surface-800"
                      >
                        <User size={16} />
                        Dashboard
                      </Link>
                      <div className="divider my-1" />
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <LogOut size={16} />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm px-4 py-2">Login</Link>
                <Link to="/signup" className="btn-primary text-sm">Get Started</Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-surface-300 hover:text-surface-50 hover:bg-surface-800"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/8 bg-surface-800/95 backdrop-blur-xl animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label }) => (
              <a
                key={to}
                href={to}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm text-surface-300 hover:text-surface-50 rounded-xl hover:bg-surface-800"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
