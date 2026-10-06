import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Search, Bell, User, LogOut, Plus,
  Briefcase, FileText, Menu, X, Package
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import { getInitials } from '../utils/formatters'

interface SidebarLink {
  to: string
  icon: React.ElementType
  label: string
  badge?: number
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth()
  const { unreadCount } = useNotifications()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isCustomer = profile?.role === 'customer'

  const customerLinks: SidebarLink[] = [
    { to: '/dashboard/customer', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/dashboard/customer/requirements', icon: FileText, label: 'My Requirements' },
    { to: '/dashboard/customer/orders', icon: Package, label: 'My Orders' },
    { to: '/dashboard/customer/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
    { to: '/dashboard/customer/profile', icon: User, label: 'Profile' },
  ]

  const providerLinks: SidebarLink[] = [
    { to: '/dashboard/provider', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/explore', icon: Search, label: 'Explore' },
    { to: '/dashboard/customer/requirements', icon: FileText, label: 'My Requirements' },
    { to: '/dashboard/provider/offers', icon: Briefcase, label: 'My Offers' },
    { to: '/dashboard/provider/orders', icon: Package, label: 'My Orders' },
    { to: '/dashboard/provider/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
    { to: '/dashboard/provider/profile', icon: User, label: 'Profile' },
  ]

  const links = isCustomer ? customerLinks : providerLinks

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-surface-700">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/favicon.jpg" alt="Logo" className="w-8 h-8 rounded-xl object-cover" />
          <span className="font-display font-bold text-surface-50 text-lg">Requora</span>
        </Link>
      </div>

      {/* Role Badge */}
      <div className="px-4 py-3">
        <span className={`badge text-xs ${isCustomer ? 'badge-brand' : 'badge-accent'}`}>
          {isCustomer ? 'Customer' : 'Provider'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label, badge }) => {
          const active = location.pathname === to || (to !== '/dashboard/customer' && to !== '/dashboard/provider' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={active ? 'nav-link active' : 'nav-link'}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {badge ? (
                <span className="min-w-[20px] h-5 px-1 rounded-full bg-brand-700 text-white text-xs font-bold flex items-center justify-center">
                  {badge > 99 ? '99+' : badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-surface-700">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-700 transition-colors">
          <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(profile?.full_name || 'U')
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-50 truncate">{profile?.full_name}</p>
            <p className="text-xs text-surface-300 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 px-3 py-2 mt-1 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-surface-900">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-surface-700 fixed left-0 top-0 bottom-0 z-30">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-white border-r border-surface-700">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-surface-700 text-surface-100"
            >
              <X size={18} />
            </button>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar (Mobile) */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b border-surface-700 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-surface-100">
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.jpg" alt="Logo" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-display font-bold text-surface-50">Requora</span>
          </Link>
          <div className="flex-1" />
          <Link to="/requirements/create" className="btn-primary text-xs px-3 py-1.5">
            <Plus size={14} />
            Post
          </Link>
          <Link to={isCustomer ? '/dashboard/customer/notifications' : '/dashboard/provider/notifications'} className="relative p-2 rounded-lg text-surface-100">
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />}
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
