import { useEffect, useState } from 'react'
import { useApiMutation, useApiQuery } from '../../hooks/useApi'
import { userService, classService } from '../../services/auth'
import toast from 'react-hot-toast'

const ROLES = [
  { id: 1, name: 'Administrateur' },
  { id: 2, name: 'Enseignant' },
  { id: 3, name: 'Parent' },
  { id: 4, name: 'Chauffeur' },
]

export default function UserForm({ isOpen, onClose, user }) {
  const isEdit = !!user
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role_id: '',
    assigned_class_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [autoAssignMessage, setAutoAssignMessage] = useState('')

  // Fetch classes for driver assignment
  const { data: classesData } = useApiQuery(
    ['admin-classes'],
    () => classService.getAll({ per_page: 100 }),
    { enabled: isOpen }
  )
  const classes = classesData?.data?.data || []

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role_id: user.role_id || '',
        assigned_class_id: user.assigned_class_id || '',
      })
    } else {
      setFormData({ name: '', email: '', phone: '', role_id: '', assigned_class_id: '' })
      setAutoAssignMessage('')
    }
  }, [user])

  // Handle role change - auto-select first class for drivers
  const handleRoleChange = (roleId) => {
    setFormData({ ...formData, role_id: roleId })
    
    if (roleId == 4) { // Driver role
      if (classes.length > 0) {
        // Auto-select the first available class
        setFormData(prev => ({ ...prev, assigned_class_id: classes[0].id }))
        setAutoAssignMessage(`✅ Classe "${classes[0].name}" sera automatiquement assignée à ce chauffeur`)
      } else {
        setAutoAssignMessage('⚠️ Aucune classe disponible. Une classe par défaut sera créée automatiquement.')
        setFormData(prev => ({ ...prev, assigned_class_id: '' }))
      }
    } else {
      setAutoAssignMessage('')
      setFormData(prev => ({ ...prev, assigned_class_id: '' }))
    }
  }

  const createMutation = useApiMutation(
    async (data) => {
      const submitData = {
        ...data,
        password: 'password123',
        is_active: true
      }
      return await userService.create(submitData)
    },
    {
      successMessage: 'Utilisateur créé avec succès',
      invalidateKeys: [['users']],
      onSuccess: () => onClose(),
    }
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.error('Le nom est requis')
      return
    }
    if (!formData.email) {
      toast.error('L\'email est requis')
      return
    }
    if (!formData.role_id) {
      toast.error('Le rôle est requis')
      return
    }
    
    setLoading(true)
    try {
      await createMutation.mutateAsync(formData)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isEdit ? 'Modifier' : 'Ajouter un utilisateur'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom complet *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rôle *</label>
            <select
              value={formData.role_id}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="">-- Sélectionner --</option>
              {ROLES.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          {/* Show class selection for drivers - but pre-selected automatically */}
          {formData.role_id == 4 && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Classe assignée 
                <span className="text-xs text-green-600 ml-2">(Sélectionnée automatiquement)</span>
              </label>
              <select
                value={formData.assigned_class_id}
                onChange={(e) => setFormData({ ...formData, assigned_class_id: e.target.value })}
                className="w-full p-2 border rounded-lg bg-gray-50"
              >
                {classes.length > 0 ? (
                  classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.grade}) - {cls.students_count || 0} étudiants
                    </option>
                  ))
                ) : (
                  <option value="">Aucune classe disponible - Une classe sera créée automatiquement</option>
                )}
              </select>
              {autoAssignMessage && (
                <p className="text-xs mt-1 text-green-600">{autoAssignMessage}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                💡 Le chauffeur verra automatiquement tous les étudiants de cette classe.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50">
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}