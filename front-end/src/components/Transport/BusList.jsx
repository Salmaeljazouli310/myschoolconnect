import { useState, useEffect } from 'react'
import { Plus, Bus, Trash2, X, Save, School } from 'lucide-react'

export default function BusList() {
  const [buses, setBuses] = useState([])
  const [classes, setClasses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    plate_number: '',
    capacity: '',
    model: '',
    name: '',
    class_id: ''
  })

  // Charger les bus au démarrage
  useEffect(() => {
    fetchBuses()
    fetchClasses()
  }, [])

  // Charger les classes
  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:8000/api/v1/admin/classes', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setClasses(data?.data?.data || [])
    } catch (error) {
      console.error('Erreur chargement classes:', error)
    }
  }

  const fetchBuses = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:8000/api/v1/admin/transport/buses', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setBuses(data.data.data || [])
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:8000/api/v1/admin/transport/buses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plate_number: formData.plate_number,
          capacity: parseInt(formData.capacity),
          model: formData.model || null,
          name: formData.name || null,
          class_id: formData.class_id || null
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchBuses()
        setShowModal(false)
        setFormData({
          plate_number: '',
          capacity: '',
          model: '',
          name: '',
          class_id: ''
        })
        alert('Bus ajouté avec succès!')
      } else {
        alert('Erreur: ' + (data.message || 'Erreur inconnue'))
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'ajout du bus')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Supprimer ce bus ?')) {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`http://localhost:8000/api/v1/admin/transport/buses/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        const data = await response.json()
        
        if (data.success) {
          setBuses(buses.filter(bus => bus.id !== id))
          alert('Bus supprimé avec succès!')
        } else {
          alert('Erreur: ' + (data.message || 'Erreur inconnue'))
        }
      } catch (error) {
        console.error('Erreur:', error)
        alert('Erreur lors de la suppression')
      }
    }
  }

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Actif</span>
    }
    return <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">Inactif</span>
  }

  const getClassName = (classId) => {
    const classObj = classes.find(c => c.id === classId)
    return classObj ? classObj.name : '-'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Flotte de bus</h3>
          <p className="text-xs text-slate-500">{buses.length} bus enregistrés</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:scale-105 transition-all shadow-md"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter un bus
        </button>
      </div>

      {/* Liste des bus */}
      {buses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Bus className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-500">Aucun bus</p>
          <p className="text-xs text-slate-400 mt-1">Enregistrez votre premier bus</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buses.map((bus) => (
            <div key={bus.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <Bus className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{bus.name || bus.plate_number}</h4>
                    <p className="text-xs text-gray-500">{bus.plate_number}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(bus.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Modèle:</span>
                  <span className="font-medium text-gray-700">{bus.model || '-'}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Capacité:</span>
                  <span className="font-medium text-gray-700">{bus.capacity} places</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Classe:</span>
                  <span className="font-medium text-gray-700">{getClassName(bus.class_id)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500">Statut:</span>
                  {getStatusBadge(bus.is_active)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'ajout */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Ajouter un bus</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plaque d'immatriculation *
                </label>
                <input
                  type="text"
                  name="plate_number"
                  value={formData.plate_number}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  placeholder="Ex: AB-123-CD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacité (nombre de places) *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  placeholder="Ex: 50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modèle
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  placeholder="Ex: Mercedes, IVECO..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du bus (optionnel)
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  placeholder="Ex: Bus A, Ligne 1..."
                />
              </div>

              {/* ✅ Nouveau champ : Sélection de la classe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classe assignée
                </label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    name="class_id"
                    value={formData.class_id}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                  >
                    <option value="">-- Aucune classe --</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.grade ? `(${cls.grade})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  La classe sera automatiquement assignée à ce bus
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {loading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}