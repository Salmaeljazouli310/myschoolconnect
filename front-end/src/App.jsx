import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'

// Admin imports
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminClasses from './pages/admin/Classes'
import AdminStudents from './pages/admin/Students'
import AdminPosts from './pages/admin/Posts'
import AdminPostForm from './pages/admin/PostForm'
import AdminTransport from './pages/admin/Transport'
import ImportStudents from './pages/admin/ImportStudents'

// Parent imports
import ParentLayout from './layouts/ParentLayout'
import ParentDashboard from './pages/parent/Dashboard'
import ParentChildren from './pages/parent/Children'
import ParentTransport from './pages/parent/Transport'

// Teacher imports
import TeacherLayout from './layouts/TeacherLayout'
import TeacherDashboard from './pages/teacher/Dashboard'
import TeacherMyClasses from './pages/teacher/MyClasses'
import TeacherStudentsList from './pages/teacher/StudentsList'
import TeacherPostsList from './pages/teacher/PostsList'
import TeacherPostForm from './pages/teacher/PostForm'
import TeacherTaskPointAward from './pages/teacher/PointsTaskNew'

// Driver imports
import DriverLayout from './layouts/DriverLayout'
import DriverDashboard from './pages/driver/Dashboard'
import DriverBus from './pages/driver/Bus'
import DriverRoutePage from './pages/driver/RoutePage'
import DriverProfile from './pages/driver/Profile'

// Shared imports
import Messaging from './pages/shared/Messaging'

const queryClient = new QueryClient()

// Composant de chargement
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin" />
    </div>
  )
}

// Guard pour Parent
function RequireParent({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user || user.role !== 'parent') return <Navigate to="/login" replace />
  return children
}

// Guard pour Admin
function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />
  return children
}

// Guard pour Teacher
function RequireTeacher({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user || user.role !== 'teacher') return <Navigate to="/login" replace />
  return children
}

// Guard pour Driver
function RequireDriver({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user || user.role !== 'driver') return <Navigate to="/login" replace />
  return children
}

// Guard pour utilisateur authentifié (pages partagées)
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const role = user?.role

  if (loading) return <LoadingSpinner />

  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Routes Admin */}
      {role === 'admin' && (
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="classes" element={<AdminClasses />} />
          <Route path="students" element={<AdminStudents />} />
          {/* ✅ TEST ROUTE */}
          <Route path="test" element={
            <div className="p-8 text-center">
              <h1 className="text-3xl font-bold text-pink-500">✅ TEST PAGE WORKS!</h1>
              <p className="text-gray-600 mt-4">If you see this, routing is working correctly.</p>
            </div>
          } />
          <Route path="import-students" element={<ImportStudents />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="posts/new" element={<AdminPostForm />} />
          <Route path="transport" element={<AdminTransport />} />
        </Route>
      )}

      {/* Routes Teacher */}
      {role === 'teacher' && (
        <Route path="/teacher" element={<RequireTeacher><TeacherLayout /></RequireTeacher>}>
          <Route index element={<TeacherDashboard />} />
          <Route path="classes" element={<TeacherMyClasses />} />
          <Route path="students" element={<TeacherStudentsList />} />
          <Route path="posts" element={<TeacherPostsList />} />
          <Route path="posts/new" element={<TeacherPostForm />} />
          <Route path="task-points" element={<TeacherTaskPointAward />} />
        </Route>
      )}

      {/* Routes Parent */}
      {role === 'parent' && (
        <Route path="/parent" element={<RequireParent><ParentLayout /></RequireParent>}>
          <Route index element={<ParentDashboard />} />
          <Route path="children" element={<ParentChildren />} />
          <Route path="transport" element={<ParentTransport />} />
        </Route>
      )}

      {/* Routes Driver */}
      {role === 'driver' && (
        <Route path="/driver" element={<RequireDriver><DriverLayout /></RequireDriver>}>
          <Route index element={<DriverDashboard />} />
          <Route path="bus" element={<DriverBus />} />
          <Route path="route" element={<DriverRoutePage />} />
          <Route path="profile" element={<DriverProfile />} />
        </Route>
      )}

      {/* Routes partagées (tous les rôles authentifiés) */}
      <Route path="/messages" element={<RequireAuth><Messaging /></RequireAuth>} />

      {/* Redirection par défaut */}
      <Route path="*" element={<Navigate to={user ? `/${role}` : '/login'} replace />} />
    </Routes>
  )
}

// Composant principal
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="bottom-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App