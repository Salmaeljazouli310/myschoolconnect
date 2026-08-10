import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  BookOpen, Eye, EyeOff, Mail, Lock, AlertCircle, 
  Sparkles, GraduationCap, TrendingUp, Shield, 
  ArrowRight, CheckCircle, School, Users, Bus
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    setApiError('')
    setIsLoading(true)
    try {
      const user = await login(data)
      toast.success(`Bienvenue ${user.name} ! 👋`)
      
      // Redirect based on role
      if (user?.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (user?.role === 'teacher') {
        navigate('/teacher', { replace: true })
      } else if (user?.role === 'parent') {
        navigate('/parent', { replace: true })
      } else if (user?.role === 'driver') {
        navigate('/driver', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Email ou mot de passe incorrect'
      setApiError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-200/20 rounded-full blur-3xl animate-pulse delay-2000" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 right-20 animate-float opacity-30">
          <GraduationCap className="w-12 h-12 text-rose-400" />
        </div>
        <div className="absolute bottom-20 left-20 animate-float-delayed opacity-30">
          <Users className="w-12 h-12 text-purple-400" />
        </div>
        <div className="absolute top-1/3 left-10 animate-float opacity-20">
          <Bus className="w-8 h-8 text-pink-400" />
        </div>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-5xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50">
        <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[600px]">
          
          {/* LEFT SIDE - Branding & Illustration */}
          <div className="lg:col-span-3 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
            
            {/* Brand */}
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">MySchool</h1>
                  <p className="text-white/70 text-sm">Connect</p>
                </div>
              </div>
              
              <div className="mt-8 space-y-3">
                <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                  Bienvenue chez
                  <br />
                  <span className="text-white/90">MySchool Connect</span>
                </h2>
                <p className="text-white/80 text-lg max-w-sm">
                  La plateforme moderne de gestion et de communication scolaire.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="relative z-10 grid grid-cols-2 gap-3 mt-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <Shield className="w-5 h-5 text-white" />
                <span className="text-white text-sm font-medium">Sécurisé</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <Sparkles className="w-5 h-5 text-white" />
                <span className="text-white text-sm font-medium">Moderne</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <TrendingUp className="w-5 h-5 text-white" />
                <span className="text-white text-sm font-medium">Suivi en temps réel</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <Users className="w-5 h-5 text-white" />
                <span className="text-white text-sm font-medium">Collaboratif</span>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-6">
              <p className="text-white/50 text-xs">
                © 2024 MySchool Connect. Tous droits réservés.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE - Login Form */}
          <div className="lg:col-span-2 p-8 lg:p-12 flex flex-col justify-center bg-white/50 backdrop-blur-sm">
            <div className="max-w-sm mx-auto w-full">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-8 bg-gradient-to-b from-rose-500 to-purple-600 rounded-full" />
                  <h2 className="text-2xl font-bold text-gray-800">Connexion</h2>
                </div>
                <p className="text-gray-500 text-sm">
                  Connectez-vous pour accéder à votre espace.
                </p>
              </div>

              {/* Error Message */}
              {apiError && (
                <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm mb-6 animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Erreur de connexion</p>
                    <p className="text-rose-500/80">{apiError}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Adresse email
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="exemple@email.com"
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none transition-all bg-white/80 text-gray-800 placeholder-gray-400"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mot de passe
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none transition-all bg-white/80 text-gray-800 placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Options */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-400" />
                    <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                      Se souvenir de moi
                    </span>
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    <>
                      Se connecter
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Pas encore de compte ?{' '}
                  <Link 
                    to="/register" 
                    className="text-rose-500 hover:text-rose-600 font-semibold transition-colors hover:underline"
                  >
                    Créer un compte
                  </Link>
                </p>
              </div>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-gray-50/80 rounded-xl border border-gray-200/50">
                <p className="text-xs text-gray-500 text-center">
                  <span className="font-medium">👨‍💻 Comptes de démonstration :</span>
                  <br />
                  Admin: admin@school.com / 123456789
                  <br />
                  Enseignant: teacher@school.com / password123
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 5s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
        .delay-2000 {
          animation-delay: 2000ms;
        }
      `}</style>
    </div>
  )
}