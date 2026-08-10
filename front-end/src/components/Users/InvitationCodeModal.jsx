import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Copy, Check, Key } from 'lucide-react'
import { useApiMutation } from '../../hooks/useApi'
import { userService } from '../../services/auth'
import toast from 'react-hot-toast'

const schema = z.object({
  role_id: z.string().min(1, 'Sélectionnez un rôle'),
  count: z.coerce.number().min(1).max(50),
  expires_in_hours: z.coerce.number().min(1).max(720),
})

const roleOptions = [
  { value: '1', label: 'Admin' },
  { value: '2', label: 'Enseignant' },
  { value: '3', label: 'Parent' },
  { value: '4', label: 'Chauffeur' },
]

export default function InvitationCodeModal({ isOpen, onClose }) {
  const [generatedCodes, setGeneratedCodes] = useState([])
  const [copiedId, setCopiedId] = useState(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role_id: '', count: 1, expires_in_hours: 72 },
  })

  const mutation = useApiMutation(
    async (data) => {
      console.log('📤 Sending invitation code request:', data)
      const response = await userService.generateCodes(data)
      console.log('📥 Response:', response)
      return response
    },
    {
      successMessage: 'Codes générés avec succès !',
      onSuccess: (data) => {
        console.log('✅ Success data:', data)
        let codes = []
        if (data?.data) {
          codes = Array.isArray(data.data) ? data.data : [data.data]
        } else if (Array.isArray(data)) {
          codes = data
        } else {
          codes = [data]
        }
        setGeneratedCodes(codes)
        reset()
        toast.success(`${codes.length} code(s) généré(s)`)
      },
      onError: (error) => {
        console.error('❌ Mutation error:', error)
        toast.error(error?.response?.data?.message || 'Erreur lors de la génération')
      }
    }
  )

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    toast.success('Code copié')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCopyAll = () => {
    const text = generatedCodes.map(c => c.code).join('\n')
    navigator.clipboard.writeText(text)
    toast.success(`${generatedCodes.length} codes copiés`)
  }

  const formatDate = (date) => {
    if (!date) return '—'
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return date
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Key className="w-5 h-5 text-pink-500" />
            Codes d'invitation
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="text-xl text-gray-400">✕</span>
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Générateur */}
            <div>
              <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">Générer des codes</p>
              <form onSubmit={handleSubmit((data) => {
                console.log('📝 Form submitted:', data)
                mutation.mutate(data)
              })} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle <span className="text-red-500">*</span>
                  </label>
                  <select 
                    {...register('role_id')} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  >
                    <option value="">Sélectionner</option>
                    {roleOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {errors.role_id && <p className="text-xs text-red-500 mt-1">{errors.role_id.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de codes <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    min={1} 
                    max={50} 
                    {...register('count')} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" 
                  />
                  {errors.count && <p className="text-xs text-red-500 mt-1">{errors.count.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration (heures) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    min={1} 
                    max={720} 
                    {...register('expires_in_hours')} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none" 
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Max 720 heures (30 jours)</p>
                  {errors.expires_in_hours && <p className="text-xs text-red-500 mt-1">{errors.expires_in_hours.message}</p>}
                </div>

                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:scale-105 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      Générer
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Codes générés */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Codes générés</p>
                {generatedCodes.length > 1 && (
                  <button 
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200 transition"
                    onClick={handleCopyAll}
                  >
                    Tout copier
                  </button>
                )}
              </div>

              {generatedCodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                  <Key className="w-6 h-6 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500">Les codes apparaîtront ici</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {generatedCodes.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 group">
                      <div>
                        <p className="font-mono text-sm text-pink-600 tracking-widest">{c.code}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Expire: {formatDate(c.expires_at)}</p>
                      </div>
                      <button 
                        onClick={() => handleCopy(c.code, c.id)} 
                        className="p-1.5 hover:bg-pink-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {copiedId === c.id ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}