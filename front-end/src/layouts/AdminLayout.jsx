import { useState, useEffect } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, School, GraduationCap, 
  FileText, Bus, LogOut, ChevronLeft, ChevronRight,
  Upload, MessageSquare, Bell, Settings, UserCog,
  Home, BookOpen, Award, Calendar, Clock, AlertCircle,
  Menu, X, User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Navigation items for each role
const NAV_ITEMS = {
  admin: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, color: 'rose' },
    { label: 'Utilisateurs', to: '/admin/users', icon: Users, color: 'blue' },
    { label: 'Classes', to: '/admin/classes', icon: School, color: 'emerald' },
    { label: 'Étudiants', to: '/admin/students', icon: GraduationCap, color: 'purple' },
    { label: 'Importer Étudiants', to: '/admin/import-students', icon: Upload, color: 'amber' },
    { label: 'Posts', to: '/admin/posts', icon: FileText, color: 'pink' },
    { label: 'Transport', to: '/admin/transport', icon: Bus, color: 'cyan' },
  ],
  teacher: [
    { label: 'Dashboard', to: '/teacher', icon: LayoutDashboard, color: 'rose' },
    { label: 'Mes Classes', to: '/teacher/classes', icon: School, color: 'emerald' },
    { label: 'Mes Étudiants', to: '/teacher/students', icon: Users, color: 'purple' },
    { label: 'Mes Posts', to: '/teacher/posts', icon: FileText, color: 'pink' },
    { label: 'Points par Tâche', to: '/teacher/task-points', icon: Award, color: 'amber' },
    { label: 'Messages', to: '/messages', icon: MessageSquare, color: 'blue' },
  ],
  parent: [
    { label: 'Dashboard', to: '/parent', icon: Home, color: 'rose' },
    { label: 'Mes Enfants', to: '/parent/children', icon: Users, color: 'purple' },
    { label: 'Transport', to: '/parent/transport', icon: Bus, color: 'cyan' },
    { label: 'Messages', to: '/messages', icon: MessageSquare, color: 'blue' },
  ],
  driver: [
    { label: 'Dashboard', to: '/driver', icon: LayoutDashboard, color: 'rose' },
    { label: 'Mon Bus', to: '/driver/bus', icon: Bus, color: 'cyan' },
    { label: 'Mon Profil', to: '/driver/profile', icon: User, color: 'purple' },
  ],
};

// Color mapping for icons
const ICON_COLORS = {
  rose: 'bg-rose-100 text-rose-600 group-hover:bg-rose-200',
  blue: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
  emerald: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200',
  purple: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
  amber: 'bg-amber-100 text-amber-600 group-hover:bg-amber-200',
  pink: 'bg-pink-100 text-pink-600 group-hover:bg-pink-200',
  cyan: 'bg-cyan-100 text-cyan-600 group-hover:bg-cyan-200',
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get role-based navigation
  const role = user?.role || 'admin';
  const navItems = NAV_ITEMS[role] || NAV_ITEMS.admin;

  // Get current page title
  const pageTitle = navItems.find(item => item.to === location.pathname)?.label || 'Dashboard';

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie 👋');
  };

  // Toggle sidebar on mobile
  const toggleMobile = () => setMobileOpen(!mobileOpen);

  // Get user initials
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-pink-50/30">
      
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={toggleMobile}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:relative z-50 h-full bg-white/90 backdrop-blur-xl border-r border-pink-100/50 
          shadow-2xl shadow-pink-500/5 transition-all duration-300 flex flex-col
          ${collapsed ? 'w-20' : 'w-72'}
          ${mobileOpen ? 'left-0' : '-left-80 md:left-0'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 h-20 border-b border-pink-100/50 flex-shrink-0 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/25 flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                MySchool
              </h1>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Connect</p>
            </div>
          )}
        </div>

        {/* User Profile */}
        {!collapsed && (
          <div className="px-4 py-4 border-b border-pink-100/50 flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ label, to, icon: Icon, color }) => {
            const isActive = location.pathname === to;
            const colorClass = ICON_COLORS[color] || ICON_COLORS.rose;

            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => isMobile && setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-rose-50 to-purple-50 text-rose-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-pink-50/80 hover:text-rose-600'
                  }
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                <div className={`
                  w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 flex-shrink-0
                  ${isActive ? colorClass : 'bg-gray-100/50 text-gray-400 group-hover:bg-pink-100 group-hover:text-rose-500'}
                `}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{label}</span>
                    {isActive && (
                      <div className="w-1.5 h-8 bg-gradient-to-b from-rose-500 to-purple-600 rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-pink-100/50 p-3 flex-shrink-0">
          {!collapsed && (
            <div className="px-3 py-2 mb-2 bg-gradient-to-r from-rose-50 to-purple-50 rounded-xl border border-pink-100/50">
              <p className="text-xs font-medium text-gray-700">🎯 Mon rôle</p>
              <p className="text-xs text-gray-500 capitalize">{role}</p>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 
              hover:text-rose-600 hover:bg-rose-50/80 transition-all duration-200
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>

        {/* Collapse Toggle (Desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-pink-200 
            rounded-full flex items-center justify-center shadow-md hover:shadow-lg 
            transition-all duration-300 hover:scale-110 hidden md:flex
            ${collapsed ? 'rotate-180' : ''}
          `}
        >
          <ChevronLeft className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-pink-100/50 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobile}
              className="p-2 rounded-xl hover:bg-pink-50/80 transition-colors md:hidden"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            <div>
              <h1 className="text-sm font-semibold text-gray-800">{pageTitle}</h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="p-2 rounded-xl hover:bg-pink-50/80 transition-colors relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
            </button>

            {/* Time */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-pink-50/50 rounded-xl border border-pink-100/50">
              <Clock className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-xs font-mono text-gray-600">
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* User Avatar (Mobile) */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md md:hidden">
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-slate-50/50 via-white to-pink-50/20">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}