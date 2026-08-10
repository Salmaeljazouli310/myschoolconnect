import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, School, GraduationCap, FileText, Bus, LogOut, BookOpen, ChevronRight, Upload } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const NAV = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Utilisateurs', to: '/admin/users', icon: Users },
  { label: 'Classes', to: '/admin/classes', icon: School },
  { label: 'Étudiants', to: '/admin/students', icon: GraduationCap },
  { label: 'Importer Étudiants', to: '/admin/students/import', icon: Upload },
  { label: 'Posts', to: '/admin/posts', icon: FileText },
  { label: 'Transport', to: '/admin/transport', icon: Bus },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    toast.success('Déconnexion réussie')
  }

  return (
    <aside className={`flex flex-col h-full bg-navy-900 border-r border-slate-700/40 transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/40">
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-electric">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        {!collapsed && <p className="text-sm font-semibold text-slate-100">MySchool Admin</p>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {NAV.map(({ label, to, icon: Icon }) => {
          const isActive = location.pathname === to
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-navy-700/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && isActive && <ChevronRight className="w-3 h-3 ml-auto text-blue-400/50" />}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer - Logout */}
      <div className="border-t border-slate-700/40 p-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && 'Déconnexion'}
        </button>
      </div>
    </aside>
  )
}