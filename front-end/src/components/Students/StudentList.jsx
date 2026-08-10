import { useState } from 'react'
import { Edit2, Trash2, Plus, Star, Download, UserPlus, X } from 'lucide-react'
import { useApiQuery, useApiMutation } from '../../hooks/useApi'
import { studentService, classService } from '../../services/auth'
import { formatDate, downloadCSV } from '../../utils/format'
import { SearchInput, Select, Pagination, TableSkeleton, EmptyState, ConfirmDialog, ErrorDisplay } from '../UI'
import StudentForm from './StudentForm'
import StudentPointsDrawer from './StudentPointsDrawer'
import toast from 'react-hot-toast'

export default function StudentList() {
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editStudent, setEditStudent] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [pointStudent, setPointStudent] = useState(null)
  
  const [showAssignParentModal, setShowAssignParentModal] = useState(false)
  const [selectedStudentForParent, setSelectedStudentForParent] = useState(null)
  const [parents, setParents] = useState([])
  const [selectedParentId, setSelectedParentId] = useState('')
  const [loadingParents, setLoadingParents] = useState(false)

  const { data, isLoading, error, refetch } = useApiQuery(
    ['students', { search, class_id: classFilter, page }],
    () => studentService.getAll({ search, class_id: classFilter, page, per_page: 15 }),
  )

  const { data: classesData } = useApiQuery(['classes-for-filter'], () => classService.getAll({ per_page: 100 }))

  const students = data?.data?.data || []
  const pagination = data?.data || {}
  const classOptions = (classesData?.data?.data || []).map(c => ({ value: String(c.id), label: c.name }))

  const deleteMutation = useApiMutation(
    (id) => studentService.delete(id),
    { successMessage: 'Étudiant supprimé', invalidateKeys: [['students']], onSuccess: () => setDeleteId(null) }
  )

  const fetchParents = async () => {
    setLoadingParents(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('http://localhost:8000/api/v1/admin/users?role=parent&per_page=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setParents(data.data?.data || [])
    } catch (error) {
      console.error('Erreur chargement parents:', error)
      toast.error('Erreur lors du chargement des parents')
    } finally {
      setLoadingParents(false)
    }
  }

  const assignParent = async () => {
    if (!selectedParentId) {
      toast.error('Veuillez sélectionner un parent')
      return
    }
    
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8000/api/v1/admin/students/${selectedStudentForParent.id}/assign-parent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ parent_id: selectedParentId })
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success('Parent assigné avec succès')
        setShowAssignParentModal(false)
        setSelectedParentId('')
        refetch()
      } else {
        toast.error(data.message || 'Erreur lors de l\'assignation')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur réseau')
    }
  }

  const openAssignParentModal = (student) => {
    setSelectedStudentForParent(student)
    fetchParents()
    setShowAssignParentModal(true)
  }

  const handleExport = () => {
    const rows = students.map(s => ({
      ID: s.id, Code: s.student_code,
      Prénom: s.first_name, Nom: s.last_name,
      Classe: s.class?.name || '', Genre: s.gender || '',
      'Date naissance': formatDate(s.date_of_birth),
      'Parents': s.parents?.map(p => p.name).join(', ') || '',
      Actif: s.is_active ? 'Oui' : 'Non',
    }))
    downloadCSV(rows, 'etudiants')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Rechercher..." />
          <Select value={classFilter} onChange={v => { setClassFilter(v); setPage(1) }} options={classOptions} placeholder="Toutes les classes" className="w-44" />
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={handleExport}><Download className="w-3.5 h-3.5" /> Exporter</button>
          <button className="btn-primary" onClick={() => { setEditStudent(null); setFormOpen(true) }}>
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {error ? (
          <div className="p-4"><ErrorDisplay message="Erreur de chargement" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-700/30 border-b border-slate-700/40">
                <tr>
                  <th className="table-th">Étudiant</th>
                  <th className="table-th">Code</th>
                  <th className="table-th hidden md:table-cell">Classe</th>
                  <th className="table-th hidden lg:table-cell">Genre</th>
                  <th className="table-th hidden lg:table-cell">Date naiss.</th>
                  <th className="table-th">Parents</th>
                  <th className="table-th">Statut</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="8"><TableSkeleton rows={8} cols={8} /></td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan="8"><EmptyState title="Aucun étudiant" description="Ajustez vos filtres" /></td></tr>
                ) : (
                  students.map(student => (
                    <tr key={student.id} className="table-row">
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-slate-600/30 flex items-center justify-center text-xs font-semibold text-slate-300">
                            {student.first_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{student.first_name} {student.last_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-td font-mono text-slate-400 text-xs">{student.student_code}</td>
                      <td className="table-td hidden md:table-cell text-xs text-slate-400">{student.class?.name || '—'}</td>
                      <td className="table-td hidden lg:table-cell">
                        {student.gender && <span className={`badge text-[10px] ${student.gender === 'male' ? 'badge-blue' : 'badge-violet'}`}>{student.gender}</span>}
                      </td>
                      <td className="table-td hidden lg:table-cell text-xs text-slate-400">{formatDate(student.date_of_birth)}</td>
                      
                      <td className="table-td">
                        <div className="flex flex-wrap items-center gap-1">
                          {student.parents?.slice(0, 2).map(parent => (
                            <span key={parent.id} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                              {parent.name}
                            </span>
                          ))}
                          {student.parents?.length > 2 && (
                            <span className="text-xs text-slate-500">+{student.parents.length - 2}</span>
                          )}
                          <button
                            onClick={() => openAssignParentModal(student)}
                            className="p-1 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 rounded-lg transition"
                            title="Lier un parent"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      
                      <td className="table-td">
                        <span className={`badge text-[10px] ${student.is_active ? 'badge-green' : 'badge-slate'}`}>
                          {student.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="table-td text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setPointStudent(student)} className="p-1.5 hover:bg-amber-500/10 text-slate-400 hover:text-amber-400 rounded-lg" title="Points">
                            <Star className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setEditStudent(student); setFormOpen(true) }} className="p-1.5 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 rounded-lg">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteId(student.id)} className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && students.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/30">
            <p className="text-xs text-slate-500 font-mono">{pagination.total} étudiants</p>
            <Pagination currentPage={pagination.current_page || 1} lastPage={pagination.last_page || 1} onPageChange={setPage} />
          </div>
        )}
      </div>

      <StudentForm isOpen={formOpen} onClose={() => { setFormOpen(false); setEditStudent(null) }} student={editStudent} />
      <StudentPointsDrawer student={pointStudent} onClose={() => setPointStudent(null)} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending} title="Supprimer" message="Cette action est irréversible." confirmLabel="Supprimer" />

      {showAssignParentModal && selectedStudentForParent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Lier un parent</h3>
              <button onClick={() => setShowAssignParentModal(false)} className="p-1 hover:bg-slate-700 rounded-lg transition">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <p className="text-sm text-slate-400 mb-4">
              Étudiant: <span className="font-semibold text-white">{selectedStudentForParent.first_name} {selectedStudentForParent.last_name}</span>
            </p>
            
            {loadingParents ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Sélectionner un parent --</option>
                {parents.map(parent => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name} - {parent.email}
                  </option>
                ))}
              </select>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignParentModal(false)}
                className="flex-1 py-2 border border-slate-600 rounded-lg text-slate-400 hover:bg-slate-700 transition"
              >
                Annuler
              </button>
              <button
                onClick={assignParent}
                className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:scale-105 transition"
              >
                Assigner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}