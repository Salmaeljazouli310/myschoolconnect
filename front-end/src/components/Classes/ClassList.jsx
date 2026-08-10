import { useState } from 'react'
import { Edit2, Trash2, Plus, Users, ChevronRight, Download } from 'lucide-react'
import { useApiQuery, useApiMutation } from '../../hooks/useApi'
import { classService } from '../../services/auth'
import { formatDate, downloadCSV } from '../../utils/format'
import { SearchInput, Pagination, TableSkeleton, EmptyState, ConfirmDialog, ErrorDisplay } from '../UI'
import ClassForm from './ClassForm'
import ClassStudentsDrawer from './ClassStudentsDrawer'

export default function ClassList() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editClass, setEditClass] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [viewClass, setViewClass] = useState(null)

  const { data, isLoading, error } = useApiQuery(
    ['classes', { search, page }],
    () => classService.getAll({ search, page, per_page: 15 }),
  )

  const classes = data?.data?.data || []
  const pagination = data?.data || {}

  const deleteMutation = useApiMutation(
    (id) => classService.delete(id),
    { successMessage: 'Classe supprimée', invalidateKeys: [['classes']], onSuccess: () => setDeleteId(null) }
  )

  const handleExport = () => {
    const rows = classes.map(c => ({
      ID: c.id, Nom: c.name, Niveau: c.grade,
      Section: c.section || '', Enseignant: c.teacher?.name || '',
      'Année scolaire': c.academic_year, Active: c.is_active ? 'Oui' : 'Non',
    }))
    downloadCSV(rows, 'classes')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Rechercher..." />
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={handleExport}><Download className="w-3.5 h-3.5" /> Exporter</button>
          <button className="btn-primary" onClick={() => { setEditClass(null); setFormOpen(true) }}>
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card p-5 h-36 animate-pulse bg-navy-700/30" />)}
        </div>
      ) : error ? (
        <ErrorDisplay message="Erreur de chargement" />
      ) : classes.length === 0 ? (
        <div className="card p-8"><EmptyState title="Aucune classe" description="Créez votre première classe" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div key={cls.id} className="card p-5 hover:border-slate-600/60 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">{cls.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{cls.academic_year}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditClass(cls); setFormOpen(true) }} className="p-1.5 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteId(cls.id)} className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="badge-blue badge">{cls.grade}</span>
                  {cls.section && <span className="badge-slate badge">§ {cls.section}</span>}
                </div>
                {cls.teacher && <p className="text-xs text-slate-400"><span className="text-slate-500">Enseignant:</span> {cls.teacher.name}</p>}
              </div>
              <button onClick={() => setViewClass(cls)} className="mt-4 w-full flex items-center justify-between p-2.5 bg-navy-700/30 hover:bg-navy-700/60 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Voir les élèves</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!isLoading && classes.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 font-mono">{pagination.total} classes</p>
          <Pagination currentPage={pagination.current_page || 1} lastPage={pagination.last_page || 1} onPageChange={setPage} />
        </div>
      )}

      <ClassForm isOpen={formOpen} onClose={() => { setFormOpen(false); setEditClass(null) }} class_={editClass} />
      <ClassStudentsDrawer class_={viewClass} onClose={() => setViewClass(null)} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending} title="Supprimer" message="Cette action est irréversible." confirmLabel="Supprimer" />
    </div>
  )
}