import { useState } from 'react'
import { Plus, MapPin, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useApiQuery, useApiMutation } from '../../hooks/useApi'
import { transportService } from '../../services/auth'
import { useForm, useFieldArray } from 'react-hook-form'
import { TableSkeleton, EmptyState, Modal, FormField, Spinner } from '../UI'
import toast from 'react-hot-toast'

function RouteForm({ isOpen, onClose, buses, refetchRoutes }) {
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm({
    defaultValues: { name: '', bus_id: '', stops: [{ name: '', latitude: '', longitude: '' }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'stops' })

  const mutation = useApiMutation(
    (data) => transportService.createRoute(data),
    { 
      successMessage: 'Itinéraire créé', 
      invalidateKeys: [['routes']], 
      onSuccess: () => { 
        onClose(); 
        reset();
        if (refetchRoutes) refetchRoutes();
      } 
    }
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Créer un itinéraire" size="lg">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nom de l'itinéraire" required>
            <input {...register('name', { required: true })} className="input-field" placeholder="Nord" />
          </FormField>
          <FormField label="Bus assigné">
            <select {...register('bus_id')} className="input-field">
              <option value="">Aucun bus</option>
              {buses.map(b => <option key={b.id} value={b.id}>{b.plate_number}</option>)}
            </select>
          </FormField>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label">Arrêts</label>
            <button type="button" onClick={() => append({ name: '', latitude: '', longitude: '' })}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Ajouter un arrêt
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-2 p-3 bg-navy-700/30 rounded-lg border border-slate-700/20">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] text-blue-400 font-mono flex-shrink-0">
                  {i + 1}
                </span>
                <input {...register(`stops.${i}.name`, { required: true })} className="input-field flex-1" placeholder="Nom de l'arrêt" />
                <input {...register(`stops.${i}.latitude`)} className="input-field w-28" placeholder="Latitude" />
                <input {...register(`stops.${i}.longitude`)} className="input-field w-28" placeholder="Longitude" />
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(i)} className="text-slate-500 hover:text-rose-400 transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner size="sm" />} Créer
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default function RouteList() {
  const [formOpen, setFormOpen] = useState(false)
  const [expanded, setExpanded] = useState(null)

  const { data, isLoading, refetch } = useApiQuery(['routes'], () => transportService.getRoutes())
  const { data: busData } = useApiQuery(['buses'], () => transportService.getBuses())
  const routes = data?.data?.data || []
  const buses = busData?.data?.data || []

  // Mutation pour supprimer un itinéraire
  const deleteRouteMutation = useApiMutation(
    (id) => transportService.deleteRoute(id),
    {
      successMessage: 'Itinéraire supprimé avec succès',
      onSuccess: () => {
        refetch();
        setExpanded(null);
      }
    }
  );

  const handleDeleteRoute = (routeId, routeName, e) => {
    e.stopPropagation();
    
    if (window.confirm(`Supprimer l'itinéraire "${routeName}" ? Cette action est irréversible.`)) {
      deleteRouteMutation.mutate(routeId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Itinéraires</h3>
          <p className="text-xs text-slate-500">{routes.length} itinéraires actifs</p>
        </div>
        <button className="btn-primary" onClick={() => setFormOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> Nouvel itinéraire
        </button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={3} cols={3} />
      ) : routes.length === 0 ? (
        <EmptyState icon={MapPin} title="Aucun itinéraire" description="Créez votre premier itinéraire" />
      ) : (
        <div className="space-y-2">
          {routes.map(route => (
            <div key={route.id} className="card overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => setExpanded(expanded === route.id ? null : route.id)}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{route.name}</p>
                    <p className="text-xs text-slate-500">
                      {route.stops?.length || 0} arrêts · Bus: {route.bus?.plate_number || 'Non assigné'}
                    </p>
                  </div>
                </button>
                
                <div className="flex items-center gap-2">
                  <span className={`badge text-[10px] ${route.is_active ? 'badge-green' : 'badge-slate'}`}>
                    {route.is_active ? 'Actif' : 'Inactif'}
                  </span>
                  
                  {/* Bouton supprimer */}
                  <button
                    onClick={(e) => handleDeleteRoute(route.id, route.name, e)}
                    className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Supprimer l'itinéraire"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => setExpanded(expanded === route.id ? null : route.id)}
                    className="p-1 text-slate-400 hover:text-slate-300"
                  >
                    {expanded === route.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {expanded === route.id && route.stops?.length > 0 && (
                <div className="px-4 pb-4 border-t border-slate-700/30 pt-3">
                  <div className="space-y-1">
                    {route.stops.map((stop, idx) => (
                      <div key={stop.id} className="flex items-center gap-3 text-xs">
                        <div className="flex flex-col items-center">
                          <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[9px] text-blue-400 font-mono">
                            {idx + 1}
                          </span>
                          {idx < route.stops.length - 1 && <div className="w-px h-4 bg-slate-700/50 mt-0.5" />}
                        </div>
                        <div className="pb-1">
                          <p className="text-slate-300 font-medium">{stop.name}</p>
                          {stop.latitude && (
                            <p className="text-slate-500 font-mono text-[10px]">{stop.latitude}, {stop.longitude}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <RouteForm 
        isOpen={formOpen} 
        onClose={() => setFormOpen(false)} 
        buses={buses}
        refetchRoutes={refetch}
      />
    </div>
  )
}