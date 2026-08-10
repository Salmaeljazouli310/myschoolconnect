import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/users': 'Gestion des Utilisateurs',
  '/admin/classes': 'Gestion des Classes',
  '/admin/students': 'Gestion des Étudiants',
  '/admin/posts': 'Modération des Posts',
  '/admin/transport': 'Gestion du Transport',
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] || 'Administration'

  return (
    <div className="flex h-screen overflow-hidden bg-navy-900">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}