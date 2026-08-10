import { useState } from 'react'
import { Outlet, useLocation, NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  School, 
  FileText, 
  MessageSquare, 
  LogOut, 
  BookOpen, 
  ChevronRight,
  Award
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const NAV = [
  { label: 'Dashboard', to: '/teacher', icon: LayoutDashboard },
  { label: 'Mes Classes', to: '/teacher/classes', icon: School },
  { label: 'Mes Étudiants', to: '/teacher/students', icon: Users },
  { label: 'Mes Posts', to: '/teacher/posts', icon: FileText },
  { label: 'Attribuer Points', to: '/teacher/points', icon: Award },
  { label: 'Messages', to: '/messages', icon: MessageSquare },
]

export default function TeacherLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Déconnexion réussie')
  }

  const pageTitle = NAV.find(item => item.to === location.pathname)?.label || 'Espace Enseignant'

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      {/* Sidebar */}
      <aside className={`flex flex-col h-full bg-navy-800 border-r border-slate-700/40 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/40">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <p className="text-sm font-semibold text-slate-100">MySchool Teacher</p>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV.map(({ label, to, icon: Icon }) => {
            const isActive = location.pathname === to
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-navy-700/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-700/40 p-3">
          <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${!collapsed ? 'mb-2' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500">Enseignant</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && 'Déconnexion'}
          </button>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-navy-700 border border-slate-600 rounded-full flex items-center justify-center hover:bg-navy-600 transition-colors"
        >
          <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-navy-800/80 border-b border-slate-700/40 flex items-center px-6">
          <h1 className="text-sm font-semibold text-slate-200">{pageTitle}</h1>
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