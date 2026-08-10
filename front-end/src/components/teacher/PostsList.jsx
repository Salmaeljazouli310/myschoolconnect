import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useApiQuery, useApiMutation } from '../../hooks/useApi'
import { postService, classService } from '../../services/auth'
import { FileText, Plus, Edit2, Trash2, Send, Eye, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function PostsList() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all') // all, draft, pending, approved, rejected

  // Récupérer les classes de l'enseignant
  const { data: classesData } = useApiQuery(
    ['teacher-classes-posts'],
    () => classService.getAll({ teacher_id: user?.id, per_page: 100 })
  )
  const classes = classesData?.data?.data || []

  // Récupérer les posts de l'enseignant
  const { data: postsData, isLoading, refetch } = useApiQuery(
    ['teacher-posts-list', { filter }],
    () => postService.getAll({ author_id: user?.id, status: filter !== 'all' ? filter : undefined, per_page: 50 })
  )

  const posts = postsData?.data?.data || []

  // Mutation pour soumettre un post
  const submitMutation = useApiMutation(
    (id) => postService.submit(id),
    { successMessage: 'Post soumis pour approbation', invalidateKeys: [['teacher-posts-list']] }
  )

  // Mutation pour supprimer un post
  const deleteMutation = useApiMutation(
    (id) => postService.delete(id),
    { successMessage: 'Post supprimé', invalidateKeys: [['teacher-posts-list']] }
  )

  const getStatusBadge = (status) => {
    const config = {
      draft: { icon: Clock, text: 'Brouillon', className: 'badge-slate' },
      pending: { icon: Clock, text: 'En attente', className: 'badge-amber' },
      approved: { icon: CheckCircle, text: 'Approuvé', className: 'badge-green' },
      rejected: { icon: XCircle, text: 'Rejeté', className: 'badge-rose' }
    }
    const { icon: Icon, text, className } = config[status] || config.draft
    return { Icon, text, className }
  }

  const getClassById = (classId) => {
    return classes.find(c => c.id === classId)?.name || 'Toute l\'école'
  }

  // Compteurs par statut
  const counts = {
    all: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    pending: posts.filter(p => p.status === 'pending').length,
    approved: posts.filter(p => p.status === 'approved').length,
    rejected: posts.filter(p => p.status === 'rejected').length
  }

  const filters = [
    { value: 'all', label: 'Tous', count: counts.all },
    { value: 'draft', label: 'Brouillons', count: counts.draft },
    { value: 'pending', label: 'En attente', count: counts.pending },
    { value: 'approved', label: 'Approuvés', count: counts.approved },
    { value: 'rejected', label: 'Rejetés', count: counts.rejected }
  ]

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Mes Posts</h2>
          <p className="text-sm text-slate-400 mt-1">
            Créez, gérez et suivez vos publications
          </p>
        </div>
        <Link to="/teacher/posts/new" className="btn-primary">
          <Plus className="w-3.5 h-3.5" />
          Nouveau Post
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700/40 pb-3">
        {filters.map(filterItem => (
          <button
            key={filterItem.value}
            onClick={() => setFilter(filterItem.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === filterItem.value
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700/50'
            }`}
          >
            {filterItem.label}
            {filterItem.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-navy-700 rounded-full text-[10px]">
                {filterItem.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Liste des posts */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 h-24 animate-pulse bg-navy-700/30" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-8 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Aucun post trouvé</p>
          <p className="text-xs text-slate-500 mt-1">
            Créez votre premier post pour partager avec vos élèves
          </p>
          <Link to="/teacher/posts/new" className="btn-primary mt-4 inline-flex">
            <Plus className="w-3.5 h-3.5" />
            Créer mon premier post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const { Icon, text, className } = getStatusBadge(post.status)
            return (
              <div key={post.id} className="card p-5 hover:border-slate-600/60 transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-sm font-semibold text-slate-200">{post.title}</h3>
                      <span className={`badge ${className} text-[10px]`}>
                        <Icon className="w-3 h-3 inline mr-1" />
                        {text}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {post.body?.substring(0, 150)}...
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
                      <span>🏫 {post.class?.name || 'Toute l\'école'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/teacher/posts/${post.id}/edit`}
                      className="p-1.5 hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                    
                    {post.status === 'draft' && (
                      <button
                        onClick={() => submitMutation.mutate(post.id)}
                        className="p-1.5 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors"
                        title="Soumettre pour approbation"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        if (confirm('Supprimer ce post ?')) {
                          deleteMutation.mutate(post.id)
                        }
                      }}
                      className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Message de rejet si applicable */}
                {post.status === 'rejected' && post.rejection_reason && (
                  <div className="mt-3 p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                    <p className="text-xs text-rose-400">
                      <strong>Raison du rejet :</strong> {post.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}