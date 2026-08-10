import { useState } from 'react'
import { Edit2, Trash2, ToggleLeft, ToggleRight, Plus, Key, Download } from 'lucide-react'
import { useApiQuery, useApiMutation } from '../../hooks/useApi'
import { userService } from '../../services/auth'
import { formatDate, getRoleBadgeClass, downloadCSV } from '../../utils/format'
import {
  SearchInput, Select, Pagination, TableSkeleton,
  EmptyState, ConfirmDialog, ErrorDisplay,
} from '../UI'
import UserForm from './UserForm'
import InvitationCodeModal from './InvitationCodeModal'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Enseignant' },
  { value: 'parent', label: 'Parent' },
  { value: 'driver', label: 'Chauffeur' },
]

export default function UserList() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const { data, isLoading, error } = useApiQuery(
    ['users', { search, role, page }],
    () => userService.getAll({ search, role, page, per_page: 15 }),
  )

  const users = data?.data?.data || []
  const pagination = data?.data || {}

  const toggleMutation = useApiMutation(
    (id) => userService.toggle(id),
    { successMessage: 'Statut utilisateur mis à jour', invalidateKeys: [['users']] }
  )

  const deleteMutation = useApiMutation(
    (id) => userService.delete(id),
    { successMessage: 'Utilisateur supprimé', invalidateKeys: [['users']], onSuccess: () => setDeleteId(null) }
  )

  const handleExport = () => {
    const rows = users.map(u => ({
      ID: u.id, Nom: u.name, Email: u.email,
      Rôle: u.role?.name, Téléphone: u.phone || '',
      Actif: u.is_active ? 'Oui' : 'Non',
      Inscrit: formatDate(u.created_at),
    }))
    downloadCSV(rows, 'utilisateurs')
  }

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Rechercher..." />
          <Select value={role} onChange={v => { setRole(v); setPage(1) }} options={ROLE_OPTIONS} placeholder="Tous les rôles" className="w-36" />
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={handleExport}><Download className="w-3.5 h-3.5" /> Exporter</button>
          <button className="btn-secondary" onClick={() => setInviteOpen(true)}><Key className="w-3.5 h-3.5" /> Codes</button>
          <button className="btn-primary" onClick={() => { setEditUser(null); setFormOpen(true) }}><Plus className="w-3.5 h-3.5" /> Ajouter</button>
        </div>
      </div>

      {/* Tableau */}
      <div className="card overflow-hidden">
        {error ? (
          <div className="p-4"><ErrorDisplay message="Erreur de chargement" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-700/30 border-b border-slate-700/40">
                <tr>
                  <th className="table-th">Utilisateur</th>
                  <th className="table-th">Rôle</th>
                  <th className="table-th hidden md:table-cell">Téléphone</th>
                  <th className="table-th hidden lg:table-cell">Inscrit</th>
                  <th className="table-th">Statut</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6}><TableSkeleton rows={8} cols={6} /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState title="Aucun utilisateur" description="Ajustez vos filtres" /></td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="table-row">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-violet-600/30 border border-slate-600/30 flex items-center justify-center text-xs font-semibold text-slate-300">
                          {user.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{user.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td"><span className={getRoleBadgeClass(user.role?.name)}>{user.role?.name}</span></td>
                    <td className="table-td hidden md:table-cell text-xs text-slate-400">{user.phone || '—'}</td>
                    <td className="table-td hidden lg:table-cell text-xs text-slate-400">{formatDate(user.created_at)}</td>
                    <td className="table-td">
                      <button onClick={() => toggleMutation.mutate(user.id)} className="flex items-center gap-1.5 text-xs">
                        {user.is_active ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                        <span className={user.is_active ? 'text-emerald-400' : 'text-slate-500'}>{user.is_active ? 'Actif' : 'Inactif'}</span>
                      </button>
                    </td>
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditUser(user); setFormOpen(true) }} className="p-1.5 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 rounded-lg">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(user.id)} className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && users.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/30">
            <p className="text-xs text-slate-500 font-mono">{pagination.total} utilisateurs</p>
            <Pagination currentPage={pagination.current_page || 1} lastPage={pagination.last_page || 1} onPageChange={setPage} />
          </div>
        )}
      </div>

      <UserForm isOpen={formOpen} onClose={() => { setFormOpen(false); setEditUser(null) }} user={editUser} />
      <InvitationCodeModal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending} title="Supprimer" message="Cette action est irréversible." confirmLabel="Supprimer" />
    </div>
  )
}