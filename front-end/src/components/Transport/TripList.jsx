import { useState, useEffect } from 'react'
import { Plus, Calendar, Clock, Bus as BusIcon } from 'lucide-react'
import { useApiQuery, useApiMutation } from '../../hooks/useApi'
import { transportService, userService } from '../../services/auth'
import { useForm } from 'react-hook-form'
import { formatDateTime, getTripStatusBadge } from '../../utils/format'
import { TableSkeleton, EmptyState, Modal, FormField, Spinner } from '../UI'

function TripForm({ isOpen, onClose, buses, drivers }) {
  // ✅ Date automatique du jour
  const today = new Date().toISOString().split('T')[0];
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { 
      driver_id: '', 
      bus_id: '', 
      type: 'morning',
      date: today  // ✅ Date automatique
    },
  })

  const mutation = useApiMutation(
    (data) => transportService.createTrip(data),
    { 
      successMessage: 'Trajet programmé', 
      invalidateKeys: [['trips']], 
      onSuccess: () => { 
        onClose(); 
        reset({ 
          driver_id: '', 
          bus_id: '', 
          type: 'morning',
          date: new Date().toISOString().split('T')[0]  // ✅ Reset avec date du jour
        });
      } 
    }
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Programmer un trajet" size="sm">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        {/* ✅ Champ date caché - automatique */}
        <input type="hidden" {...register('date')} />

        {/* Chauffeur */}
        <FormField label="CHAUFFEUR" required error={errors.driver_id?.message}>
          <select {...register('driver_id', { required: true })} className="input-field">
            <option value="">Sélectionner</option>
            {drivers && drivers.length > 0 ? (
              drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} - {d.email}
                </option>
              ))
            ) : (
              <option disabled>Aucun chauffeur disponible</option>
            )}
          </select>
        </FormField>

        {/* BUS */}
        <FormField label="BUS" required error={errors.bus_id?.message}>
          <select {...register('bus_id', { required: true })} className="input-field">
            <option value="">Sélectionner un bus</option>
            {buses && buses.length > 0 ? (
              buses.map(b => (
                <option key={b.id} value={b.id}>
                  🚌 {b.name || `Bus ${b.id}`} - {b.plate_number} ({b.capacity} places)
                </option>
              ))
            ) : (
              <option disabled>Aucun bus disponible</option>
            )}
          </select>
        </FormField>

        {/* Type de trajet */}
        <FormField label="TYPE DE TRAJET" required error={errors.type?.message}>
          <select {...register('type')} className="input-field">
            <option value="morning">🌅 Matin</option>
            <option value="afternoon">🌙 Après-midi</option>
          </select>
        </FormField>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner size="sm" />}
            Programmer
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function TripList() {
  const [formOpen, setFormOpen] = useState(false)
  const [todayOnly, setTodayOnly] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  // Fetch trips
  const { data: tripsData, isLoading: tripsLoading, refetch: refetchTrips } = useApiQuery(
    ['trips', { today: todayOnly, status: statusFilter }],
    () => transportService.getTrips({ today: todayOnly ? true : undefined, status: statusFilter, per_page: 20 }),
  )
  
  // Fetch buses
  const { data: busesResponse, isLoading: busesLoading } = useApiQuery(
    ['buses'], 
    () => transportService.getBuses()
  )
  
  // Fetch drivers
  const { data: driversData, isLoading: driversLoading } = useApiQuery(
    ['drivers'], 
    () => userService.getAll({ role: 'driver', per_page: 100 })
  )

  // Extract trips
  const trips = tripsData?.data?.data || tripsData?.data || tripsData || []
  
  // Extract buses
  let buses = [];
  if (busesResponse?.data?.data && Array.isArray(busesResponse.data.data)) {
    buses = busesResponse.data.data;
  } else if (busesResponse?.data && Array.isArray(busesResponse.data)) {
    buses = busesResponse.data;
  } else if (Array.isArray(busesResponse)) {
    buses = busesResponse;
  }
  
  // Extract drivers
  const drivers = driversData?.data?.data || driversData?.data || driversData || []

  const STATUS_OPTIONS = [
    { value: 'scheduled', label: 'Programmé' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' },
  ]

  // Find Bus 1 and Bus 2 for summary cards
  const bus1 = buses?.find(b => b.plate_number === 'BUS-001' || b.id === 2)
  const bus2 = buses?.find(b => b.plate_number === 'BUS-002' || b.id === 3)

  if (busesLoading || tripsLoading || driversLoading) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-gray-500">Chargement des données...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTodayOnly(t => !t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              todayOnly 
                ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' 
                : 'bg-gray-100 border-gray-200 text-gray-600'
            }`}
          >
            <Clock className="w-3 h-3 inline mr-1" />
            Aujourd'hui seulement
          </button>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:scale-105 transition shadow-md" onClick={() => setFormOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> Programmer
        </button>
      </div>

      {/* Bus Summary Cards */}
      {(bus1 || bus2) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {bus1 && (
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-3">
                <BusIcon className="w-8 h-8" />
                <div>
                  <p className="text-sm opacity-90">Bus 1</p>
                  <p className="text-lg font-bold">{bus1.plate_number}</p>
                  <p className="text-xs opacity-80">{bus1.model || 'Mercedes'} • {bus1.capacity} places</p>
                </div>
              </div>
            </div>
          )}
          {bus2 && (
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 text-white">
              <div className="flex items-center gap-3">
                <BusIcon className="w-8 h-8" />
                <div>
                  <p className="text-sm opacity-90">Bus 2</p>
                  <p className="text-lg font-bold">{bus2.plate_number}</p>
                  <p className="text-xs opacity-80">{bus2.model || 'Renault'} • {bus2.capacity} places</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trips Table */}
      {trips.length === 0 ? (
        <EmptyState icon={Calendar} title="Aucun trajet" description="Aucun trajet ne correspond aux filtres" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Chauffeur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bus</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden lg:table-cell">Début</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trips.map(trip => (
                  <tr key={trip.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-700">{trip.driver?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        trip.bus?.plate_number === 'BUS-001' 
                          ? 'bg-rose-100 text-rose-700' 
                          : trip.bus?.plate_number === 'BUS-002'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        <BusIcon className="w-3 h-3" />
                        {trip.bus?.plate_number || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        trip.type === 'morning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {trip.type === 'morning' ? '🌅 Matin' : '🌙 Après-midi'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={getTripStatusBadge(trip.status)}>
                        {trip.status === 'scheduled' ? 'Programmé' :
                         trip.status === 'in_progress' ? 'En cours' :
                         trip.status === 'completed' ? 'Terminé' : 'Annulé'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-500">
                      {trip.started_at ? formatDateTime(trip.started_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TripForm 
        isOpen={formOpen} 
        onClose={() => setFormOpen(false)} 
        buses={buses} 
        drivers={drivers} 
      />
    </div>
  )
}