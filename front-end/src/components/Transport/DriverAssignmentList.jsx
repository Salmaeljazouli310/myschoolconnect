import { useState } from 'react'
import { useApiQuery, useApiMutation } from '../../hooks/useApi'
import { userService, transportService } from '../../services/auth'
import { UserPlus, Bus, School, Check, Loader2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DriverAssignmentList() {
  const [selectedDriver, setSelectedDriver] = useState('')
  const [selectedBus, setSelectedBus] = useState('')
  const [selectedClass, setSelectedClass] = useState('')

  // Récupérer les chauffeurs
  const { data: driversData } = useApiQuery(['drivers-list'], () =>
    userService.getAll({ role: 'driver', per_page: 100 })
  )
  const drivers = driversData?.data?.data || []

  // Récupérer les bus
  const { data: busesData } = useApiQuery(['buses-list'], () =>
    transportService.getBuses({ per_page: 100 })
  )
  const buses = busesData?.data?.data || []

  // Récupérer les classes
  const { data: classesData } = useApiQuery(['classes-list'], () =>
    fetch('http://localhost:8000/api/v1/admin/classes', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  )
  const classes = classesData?.data?.data || []

  // Récupérer les assignations existantes
  const { data: assignmentsData, refetch: refetchAssignments } = useApiQuery(['driver-assignments'], () =>
    transportService.getDriverAssignments()
  )
  const assignments = assignmentsData?.data || []

  // Mutation pour assigner un bus
  const assignBusMutation = useApiMutation(
    (data) => transportService.assignBusToDriver(data),
    {
      successMessage: 'Bus assigné au chauffeur',
      onSuccess: () => {
        refetchAssignments()
        setSelectedDriver('')
        setSelectedBus('')
      }
    }
  )

  // Mutation pour assigner une classe
  const assignClassMutation = useApiMutation(
    (data) => transportService.assignClassToDriver(data),
    {
      successMessage: 'Classe assignée au chauffeur',
      onSuccess: () => {
        refetchAssignments()
        setSelectedClass('')
        setSelectedDriver('')
      }
    }
  )

  // Mutation pour supprimer une assignation
  const deleteAssignmentMutation = useApiMutation(
    (id) => transportService.deleteDriverAssignment(id),
    {
      successMessage: 'Assignation supprimée',
      onSuccess: () => refetchAssignments()
    }
  )

  const handleAssignBus = () => {
    if (!selectedDriver || !selectedBus) {
      toast.error('Sélectionnez un chauffeur et un bus')
      return
    }
    assignBusMutation.mutate({ driver_id: selectedDriver, bus_id: selectedBus })
  }

  const handleAssignClass = () => {
    if (!selectedDriver || !selectedClass) {
      toast.error('Sélectionnez un chauffeur et une classe')
      return
    }
    assignClassMutation.mutate({ driver_id: selectedDriver, class_id: selectedClass })
  }

  return (
    <div className="space-y-6">
      {/* Formulaire d'assignation bus */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Bus className="w-4 h-4 text-pink-500" />
          Assigner un bus à un chauffeur
        </h3>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
          >
            <option value="">-- Choisir un chauffeur --</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
            ))}
          </select>
          <select
            value={selectedBus}
            onChange={(e) => setSelectedBus(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500"
          >
            <option value="">-- Choisir un bus --</option>
            {buses.map(b => (
              <option key={b.id} value={b.id}>{b.plate_number} - {b.model || 'Modèle inconnu'}</option>
            ))}
          </select>
          <button
            onClick={handleAssignBus}
            disabled={assignBusMutation.isPending}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 flex items-center gap-2 transition"
          >
            {assignBusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Assigner
          </button>
        </div>
      </div>

      {/* Formulaire d'assignation classe */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-100">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <School className="w-4 h-4 text-purple-500" />
          Assigner une classe à un chauffeur
        </h3>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">-- Choisir un chauffeur --</option>
            {drivers.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.email})</option>
            ))}
          </select>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="">-- Choisir une classe --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.grade})</option>
            ))}
          </select>
          <button
            onClick={handleAssignClass}
            disabled={assignClassMutation.isPending}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2 transition"
          >
            {assignClassMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Assigner
          </button>
        </div>
      </div>

      {/* Liste des assignations existantes */}
      <div className="bg-white rounded-2xl overflow-hidden border border-pink-100">
        <div className="px-5 py-3 bg-pink-50 border-b border-pink-100">
          <h3 className="font-semibold text-gray-800">Assignations existantes</h3>
          <p className="text-xs text-gray-500">Bus et classes assignés aux chauffeurs</p>
        </div>
        
        {assignments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune assignation</p>
            <p className="text-xs mt-1">Utilisez les formulaires ci-dessus</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Chauffeur</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Bus assigné</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Classe assignée</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Assigné le</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignments.map(ass => (
                  <tr key={ass.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{ass.driver_name}</td>
                    <td className="px-4 py-3">
                      {ass.bus_plate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">
                          <Bus className="w-3 h-3" />
                          {ass.bus_plate}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ass.class_name ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          <School className="w-3 h-3" />
                          {ass.class_name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(ass.assigned_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm('Supprimer cette assignation ?')) {
                            deleteAssignmentMutation.mutate(ass.id)
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}