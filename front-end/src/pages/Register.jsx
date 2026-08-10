import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  BookOpen, Eye, EyeOff, Mail, Lock, User, Phone, Key, AlertCircle, 
  Sparkles, GraduationCap, Shield, CheckCircle, ArrowRight,
  Users, School, Bus, UserCheck, X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  password_confirmation: z.string(),
  invitation_code: z.string().min(1, 'Le code d\'invitation est requis'),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Les mots de passe ne correspondent pas",
  path: ["password_confirmation"],
})

const ROLES = [
  { id: 'teacher', label: 'Enseignant', icon: School, color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50' },
  { id: 'parent', label: 'Parent', icon: Users, color: 'from-pink-400 to-rose-500', bg: 'bg-pink-50' },
  { id: 'driver', label: 'Chauffeur', icon: Bus, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50' },
]

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const [validatingCode, setValidatingCode] = useState(false)
  const [codeValid, setCodeValid] = useState(false)
  const [codeRole, setCodeRole] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { invitation_code: '' },
  })

  const invitationCode = watch('invitation_code')

  const validateCode = async () => {
    if (!invitationCode || invitationCode.length < 6) {
      toast.error('Veuillez entrer un code valide')
      return
    }
    
    setValidatingCode(true)
    try {
      const response = await api.get(`/auth/invitation-codes/validate/${invitationCode}`)
      if (response.data.valid) {
        setCodeValid(true)
        setCodeRole(response.data.role)
        toast.success(`✅ Code valide pour le rôle : ${response.data.role}`)
      } else {
        setCodeValid(false)
        setCodeRole(null)
        toast.error('❌ Code d\'invitation invalide ou expiré')
      }
    } catch (error) {
      console.error('Erreur validation:', error)
      setCodeValid(false)
      setCodeRole(null)
      toast.error('❌ Code d\'invitation invalide')
    } finally {
      setValidatingCode(false)
    }
  }

  const onSubmit = async (data) => {
    setApiError('')
    setIsLoading(true)
    try {
      const user = await registerUser(data)
      toast.success('🎉 Inscription réussie ! Bienvenue !')
      
      if (user?.role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Erreur lors de l\'inscription'
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
          <Shield className="w-12 h-12 text-purple-400" />
        </div>
      </div>

      {/* Main Container */}
      <div className="relative w-full max-w-5xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 max-h-[95vh] overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[600px]">
          
          {/* LEFT SIDE - Branding & Illustration */}
          <div className="lg:col-span-2 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden min-h-[300px] lg:min-h-0">
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
                <h2 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                  Créer un compte
                  <br />
                  <span className="text-white/90">Rejoignez la communauté</span>
                </h2>
                <p className="text-white/80 text-sm max-w-sm">
                  Inscrivez-vous pour accéder à votre espace personnalisé.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="relative z-10 grid grid-cols-1 gap-2 mt-6">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Inscription sécurisée</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/10">
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Accès selon votre rôle</span>
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 mt-4">
              <p className="text-white/40 text-xs">
                © 2024 MySchool Connect
              </p>
            </div>
          </div>

          {/* RIGHT SIDE - Register Form */}
          <div className="lg:col-span-3 p-6 lg:p-10 flex flex-col justify-center bg-white/50 backdrop-blur-sm">
            <div className="max-w-md mx-auto w-full">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-8 bg-gradient-to-b from-rose-500 to-purple-600 rounded-full" />
                  <h2 className="text-2xl font-bold text-gray-800">Inscription</h2>
                </div>
                <p className="text-gray-500 text-sm">
                  Remplissez le formulaire pour créer votre compte.
                </p>
              </div>

              {/* Error Message */}
              {apiError && (
                <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm mb-4 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Erreur d'inscription</p>
                    <p className="text-rose-500/80">{apiError}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Invitation Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Code d'invitation <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1 group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors">
                        <Key className="w-5 h-5" />
                      </div>
                      <input
                        {...register('invitation_code')}
                        type="text"
                        placeholder="XXXX-XXXX-XXXX"
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all bg-white/80 text-gray-800 placeholder-gray-400 ${
                          codeValid 
                            ? 'border-emerald-400 focus:ring-emerald-100 focus:ring-4' 
                            : 'border-gray-200 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={validateCode}
                      disabled={validatingCode || !invitationCode}
                      className="px-5 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-medium hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {validatingCode ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Vérifier'
                      )}
                    </button>
                  </div>
                  {errors.invitation_code && (
                    <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.invitation_code.message}
                    </p>
                  )}
                  {codeValid && (
                    <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      ✓ Code valide pour : <span className="font-semibold">{codeRole}</span>
                    </p>
                  )}
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nom complet <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      {...register('name')}
                      type="text"
                      placeholder="Jean Dupont"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none transition-all bg-white/80 text-gray-800 placeholder-gray-400"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="jean@email.com"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none transition-all bg-white/80 text-gray-800 placeholder-gray-400"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Téléphone <span className="text-gray-400 text-xs">(optionnel)</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="+212 6XX XXX XXX"
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none transition-all bg-white/80 text-gray-800 placeholder-gray-400"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mot de passe <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none transition-all bg-white/80 text-gray-800 placeholder-gray-400"
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirmer le mot de passe <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      {...register('password_confirmation')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none transition-all bg-white/80 text-gray-800 placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password_confirmation.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isLoading || !codeValid} 
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Inscription en cours...
                    </>
                  ) : (
                    <>
                      Créer mon compte
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-5 text-center">
                <p className="text-sm text-gray-500">
                  Déjà un compte ?{' '}
                  <Link 
                    to="/login" 
                    className="text-rose-500 hover:text-rose-600 font-semibold transition-colors hover:underline"
                  >
                    Se connecter
                  </Link>
                </p>
              </div>

              {/* Demo Info */}
              <div className="mt-4 p-3 bg-gray-50/80 rounded-xl border border-gray-200/50">
                <p className="text-xs text-gray-500 text-center">
                  💡 Un code d'invitation vous a été fourni par l'administration.
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