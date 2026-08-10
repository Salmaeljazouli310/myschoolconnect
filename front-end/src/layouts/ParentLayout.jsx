import { useState } from 'react'
import { Outlet, useLocation, NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  School, 
  Bus, 
  MessageSquare, 
  LogOut, 
  Home,
  Bell,
  ChevronRight,
  User
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const NAV = [
  { label: 'Dashboard', to: '/parent', icon: Home },
  { label: 'Mes Enfants', to: '/parent/children', icon: Users },
  { label: 'Transport', to: '/parent/transport', icon: Bus },
  { label: 'Messages', to: '/messages', icon: MessageSquare },
]

export default function ParentLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Déconnexion réussie')
  }

  const pageTitle = NAV.find(item => item.to === location.pathname)?.label || 'Mon espace'

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Sidebar - Style pastel */}
      <aside className={`flex flex-col h-full bg-white/80 backdrop-blur-md border-r border-pink-100 transition-all duration-300 shadow-lg ${collapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-pink-100">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
            <School className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <p className="text-sm font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">MySchool Parent</p>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV.map(({ label, to, icon: Icon }) => {
            const isActive = location.pathname === to
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && isActive && <ChevronRight className="w-3 h-3 ml-auto text-white/50" />}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-pink-100 p-3">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl ${!collapsed ? 'mb-2' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 flex items-center justify-center text-xs font-bold text-white shadow-md">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{user?.name}</p>
                <p className="text-[10px] text-gray-400">Parent</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-rose-500 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && 'Déconnexion'}
          </button>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-pink-200 rounded-full flex items-center justify-center hover:bg-pink-50 transition-colors shadow-md"
        >
          <ChevronRight className={`w-3 h-3 text-pink-400 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-pink-100 flex items-center justify-between px-6">
          <h1 className="text-sm font-semibold text-gray-700">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <button className="p-1.5 hover:bg-pink-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4 text-pink-500" />
            </button>
            <div className="px-3 py-1.5 bg-pink-50 rounded-lg border border-pink-200">
              <span className="text-xs font-mono text-pink-500">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}