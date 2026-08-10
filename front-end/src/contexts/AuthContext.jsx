import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('auth_user')
      if (storedUser) {
        const parsed = JSON.parse(storedUser)
        // ✅ Normaliser le rôle (peut être string ou objet)
        if (parsed.role && typeof parsed.role === 'object') {
          parsed.role = parsed.role.name
        }
        return parsed
      }
      return null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authService.me()
        .then(({ data }) => {
          // ✅ Normaliser les données utilisateur
          const userData = data.data || data
          const normalizedUser = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role?.name || userData.role, // Supporte les deux formats
            avatar: userData.avatar,
            is_active: userData.is_active
          }
          setUser(normalizedUser)
          localStorage.setItem('auth_user', JSON.stringify(normalizedUser))
        })
        .catch(() => {
          setToken(null)
          setUser(null)
          localStorage.removeItem('auth_token')
          localStorage.removeItem('auth_user')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials)
    // ✅ La réponse peut être dans response.data.data
    const responseData = response.data.data || response.data
    const { token: newToken, user: newUser } = responseData
    
    // ✅ Normaliser l'utilisateur
    const normalizedUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role?.name || newUser.role, // Supporte les deux formats
      avatar: newUser.avatar,
      is_active: newUser.is_active
    }
    
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(normalizedUser))
    setToken(newToken)
    setUser(normalizedUser)
    
    // ✅ Rediriger selon le rôle
    const redirectPath = getDashboardPath(normalizedUser.role)
    window.location.href = redirectPath
    
    return normalizedUser
  }, [])

  const register = useCallback(async (userData) => {
    const response = await authService.register(userData)
    const responseData = response.data.data || response.data
    const { token: newToken, user: newUser } = responseData
    
    const normalizedUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role?.name || newUser.role,
      avatar: newUser.avatar,
      is_active: newUser.is_active
    }
    
    localStorage.setItem('auth_token', newToken)
    localStorage.setItem('auth_user', JSON.stringify(normalizedUser))
    setToken(newToken)
    setUser(normalizedUser)
    
    const redirectPath = getDashboardPath(normalizedUser.role)
    window.location.href = redirectPath
    
    return normalizedUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }
  }, [])

  // ✅ Fonction pour obtenir le dashboard selon le rôle
  const getDashboardPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard'
      case 'teacher':
        return '/teacher/dashboard'
      case 'parent':
        return '/parent/dashboard'
      case 'driver':
        return '/driver/dashboard'
      default:
        return '/dashboard'
    }
  }

  // ✅ Vérifications de rôle simplifiées
  const isAdmin = user?.role === 'admin'
  const isTeacher = user?.role === 'teacher'
  const isParent = user?.role === 'parent'
  const isDriver = user?.role === 'driver'

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      logout,
      isAdmin,
      isTeacher,
      isParent,
      isDriver,
      getDashboardPath
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}