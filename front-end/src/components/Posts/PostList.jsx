import { useState, useEffect } from 'react'
import { Eye, CheckCircle, XCircle, Trash2, Image, Calendar, User } from 'lucide-react'
import { useApiQuery, useApiMutation } from '../../hooks/useApi'
import { postService } from '../../services/auth'
import { formatRelative } from '../../utils/format'
import { SearchInput, Pagination, EmptyState, ConfirmDialog, ErrorDisplay } from '../UI'
import PostDetailModal from './PostDetailModal'
import RejectModal from './RejectModal'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'rejected', label: 'Rejeté' },
]

// Image par défaut (SVG inline)
const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' viewBox='0 0 400 200'%3E%3Crect width='400' height='200' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%239ca3af' font-size='14' dy='.3em'%3EAucune image%3C/text%3E%3C/svg%3E";

export default function PostList() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [viewPost, setViewPost] = useState(null)
  const [rejectPost, setRejectPost] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data, isLoading, error } = useApiQuery(
    ['posts', { search, status, page }],
    () => postService.getAll({ search, status, page, per_page: 12 }),
  )

  const posts = data?.data?.data || []
  const pagination = data?.data || {}

  // Debug - Afficher la structure des données
  useEffect(() => {
    if (posts.length > 0) {
      console.log('=== DÉBOGAGE POSTS ===')
      console.log('Premier post:', posts[0])
      if (posts[0].media && posts[0].media.length > 0) {
        console.log('Media du premier post:', posts[0].media[0])
        console.log('Toutes les propriétés du media:', Object.keys(posts[0].media[0]))
      }
    }
  }, [posts])

  const approveMutation = useApiMutation(
    (id) => postService.approve(id),
    { successMessage: 'Post approuvé', invalidateKeys: [['posts']] }
  )

  const deleteMutation = useApiMutation(
    (id) => postService.delete(id),
    { successMessage: 'Post supprimé', invalidateKeys: [['posts']], onSuccess: () => setDeleteId(null) }
  )

  const pendingCount = posts.filter(p => p.status === 'pending').length

  // Fonction SIMPLIFIÉE pour obtenir l'URL de l'image
  const getImageUrl = (media) => {
    if (!media) return null
    
    console.log('=== getImageUrl ===')
    console.log('Media reçu:', media)
    
    // Cas 1: media est un string
    if (typeof media === 'string') {
      if (media.startsWith('http')) {
        console.log('URL directe:', media)
        return media
      }
      const cleanPath = media.replace(/^\/?(?:storage\/)?/, '')
      const url = `http://localhost:8000/storage/${cleanPath}`
      console.log('URL construite depuis string:', url)
      return url
    }
    
    // Cas 2: media est un objet
    if (typeof media === 'object') {
      // Essayer différentes propriétés possibles
      const possibleUrls = [
        media.url,
        media.path,
        media.file_path,
        media.original_url,
        media.secure_url
      ]
      
      for (const url of possibleUrls) {
        if (url) {
          console.log('URL trouvée dans propriété:', url)
          if (url.startsWith('http')) {
            return url
          }
          const cleanPath = url.replace(/^\/?(?:storage\/)?/, '')
          const fullUrl = `http://localhost:8000/storage/${cleanPath}`
          console.log('URL complète:', fullUrl)
          return fullUrl
        }
      }
    }
    
    console.log('Aucune URL trouvée')
    return null
  }

  // Gestionnaire d'erreur d'image
  const handleImageError = (e) => {
    console.error('Erreur chargement image:', e.target.src)
    e.target.onerror = null
    e.target.src = DEFAULT_IMAGE
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Approuvé'
      case 'pending': return 'En attente'
      case 'rejected': return 'Rejeté'
      default: return 'Brouillon'
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          {[{ value: '', label: 'Tous' }, ...STATUS_OPTIONS].map(opt => (
            <button
              key={opt.value}
              onClick={() => { setStatus(opt.value); setPage(1) }}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                status === opt.value
                  ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
              {opt.value === 'pending' && pendingCount > 0 && status !== 'pending' && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-amber-200 text-amber-700 rounded-full text-[9px]">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Rechercher..." />
      </div>

      {error ? (
        <ErrorDisplay message="Erreur de chargement" />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-2xl"></div>
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={Image} title="Aucun post" description="Aucun post trouvé" />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => {
              let imageUrl = null
              
              // Chercher l'image dans les différentes sources
              if (post.media && post.media.length > 0) {
                imageUrl = getImageUrl(post.media[0])
              }
              
              if (!imageUrl && post.image) {
                imageUrl = getImageUrl(post.image)
              }
              
              if (!imageUrl && post.featured_image) {
                imageUrl = getImageUrl(post.featured_image)
              }
              
              if (!imageUrl && post.thumbnail) {
                imageUrl = getImageUrl(post.thumbnail)
              }
              
              console.log(`Post ${post.id} - Image URL:`, imageUrl)
              
              return (
                <div key={post.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        onError={handleImageError}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center">
                        <Image className="w-12 h-12 text-rose-300" />
                      </div>
                    )}
                    
                    {post.media && post.media.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        +{post.media.length}
                      </div>
                    )}
                    
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium shadow-md ${getStatusColor(post.status)}`}>
                        {getStatusText(post.status)}
                      </span>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-800 text-lg mb-2 line-clamp-2">{post.title}</h3>
                    <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                      {post.body?.substring(0, 120)}...
                    </p>
                    
                    <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{post.author?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatRelative(post.created_at)}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-xs px-2 py-1 bg-rose-100 text-rose-600 rounded-full">
                        {post.class?.name || '📢 Toute l\'école'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <button 
                        onClick={() => setViewPost(post)} 
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-sm font-medium transition"
                      >
                        <Eye className="w-4 h-4" /> Voir
                      </button>
                      <div className="flex items-center gap-1">
                        {post.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => approveMutation.mutate(post.id)} 
                              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition" 
                              title="Approuver"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setRejectPost(post)} 
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition" 
                              title="Rejeter"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => setDeleteId(post.id)} 
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition" 
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {posts.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-gray-500">
                {pagination.from || 0} - {pagination.to || 0} sur {pagination.total || 0}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={pagination.current_page === 1} 
                  className="px-3 py-1.5 rounded-lg bg-gray-100 disabled:opacity-50 hover:bg-gray-200 transition"
                >
                  Précédent
                </button>
                <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-purple-600 text-white">
                  {pagination.current_page || 1}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(pagination.last_page || 1, p + 1))} 
                  disabled={pagination.current_page === pagination.last_page} 
                  className="px-3 py-1.5 rounded-lg bg-gray-100 disabled:opacity-50 hover:bg-gray-200 transition"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <PostDetailModal post={viewPost} onClose={() => setViewPost(null)} onApprove={(id) => approveMutation.mutate(id)} />
      <RejectModal post={rejectPost} onClose={() => setRejectPost(null)} />
      <ConfirmDialog 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={() => deleteMutation.mutate(deleteId)} 
        loading={deleteMutation.isPending} 
        title="Supprimer" 
        message="Action irréversible" 
        confirmLabel="Supprimer" 
      />
    </div>
  )
}