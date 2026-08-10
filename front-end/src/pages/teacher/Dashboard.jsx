import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useApiQuery, useApiMutation } from '../../hooks/useApi'
import { postService } from '../../services/auth'
import { 
  FileText, Heart, Plus, 
  CheckCircle, Clock, XCircle, 
  Eye, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [likedPosts, setLikedPosts] = useState({})

  // Récupérer TOUS les posts
  const { data: allPostsData, isLoading, refetch: refetchAll, error } = useApiQuery(
    ['all-posts', filter, page],
    () => {
      let params = { per_page: perPage, page: page }
      if (filter !== 'all') {
        params.status = filter
      }
      return postService.getAll(params)
    }
  )

  const allPosts = allPostsData?.data?.data || []
  const pagination = allPostsData?.data || {}
  const allCount = pagination.total || 0

  const approveMutation = useApiMutation(
    (id) => postService.approve(id),
    {
      successMessage: 'Post approuvé',
      onSuccess: () => refetchAll()
    }
  )

  const rejectMutation = useApiMutation(
    ({ id, reason }) => postService.reject(id, { rejection_reason: reason }),
    {
      successMessage: 'Post rejeté',
      onSuccess: () => refetchAll()
    }
  )

  const handleLike = (postId) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
    toast.success(likedPosts[postId] ? 'Like retiré' : 'Post aimé !')
  }

  const handleReject = (postId) => {
    const reason = prompt('Motif du rejet :')
    if (reason !== null) {
      rejectMutation.mutate({ id: postId, reason })
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return { icon: CheckCircle, text: 'Approuvé', color: 'bg-green-100 text-green-600' }
      case 'pending':
        return { icon: Clock, text: 'En attente', color: 'bg-yellow-100 text-yellow-600' }
      case 'rejected':
        return { icon: XCircle, text: 'Rejeté', color: 'bg-red-100 text-red-600' }
      default:
        return { icon: FileText, text: 'Brouillon', color: 'bg-gray-100 text-gray-500' }
    }
  }

  const getImageUrl = (media) => {
    if (!media) return null
    if (media.url) return media.url
    if (media.path) {
      if (media.path.startsWith('storage/')) {
        return `http://localhost:8000/${media.path}`
      }
      return `http://localhost:8000/storage/${media.path}`
    }
    return null
  }

  const goToPage = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pink-400">Chargement des posts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600">Erreur de chargement</p>
          <button 
            onClick={() => refetchAll()} 
            className="mt-4 px-4 py-2 bg-pink-500 text-white rounded-xl flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-100 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
              <p className="text-xs text-pink-500 mt-1">Modération des publications</p>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                to="/teacher/posts/new" 
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:scale-105 transition shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nouveau post
              </Link>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4">
        {/* Filtres */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => { setFilter('all'); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              filter === 'all' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-pink-50'
            }`}
          >
            Tous les posts
          </button>
          <button
            onClick={() => { setFilter('pending'); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              filter === 'pending' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-pink-50'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => { setFilter('approved'); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              filter === 'approved' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-pink-50'
            }`}
          >
            Approuvés
          </button>
          <button
            onClick={() => { setFilter('rejected'); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              filter === 'rejected' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-pink-50'
            }`}
          >
            Rejetés
          </button>
        </div>

        {/* Info nombre de posts */}
        <div className="text-xs text-gray-400 text-right mb-3">
          {allCount} post(s) au total • {perPage} posts par page
        </div>

        {/* Liste des posts */}
        {allPosts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Aucune publication</h3>
            <p className="text-gray-500 text-sm">Aucun post trouvé pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {allPosts.map(post => {
              const StatusIcon = getStatusBadge(post.status).icon
              const firstMedia = post.media && post.media.length > 0 ? post.media[0] : null
              const imageUrl = getImageUrl(firstMedia)
              
              return (
                <div key={post.id} className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition border border-pink-100">
                  {/* En-tête */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold text-base shadow-sm">
                        {post.author?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-base">{post.author?.name || 'Auteur inconnu'}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          {post.class?.name && <span>{post.class.name}</span>}
                          {post.class?.name && <span>•</span>}
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(post.status).color} flex items-center gap-1`}>
                        <StatusIcon className="w-3 h-3" />
                        {getStatusBadge(post.status).text}
                      </span>
                      {post.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => approveMutation.mutate(post.id)}
                            className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition"
                            title="Approuver"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(post.id)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                            title="Rejeter"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contenu */}
                  <h3 className="font-semibold text-gray-800 text-xl mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-3">{post.body}</p>

                  {/* Image */}
                  {imageUrl && (
                    <div className="rounded-xl overflow-hidden mb-4 bg-gray-100">
                      <img 
                        src={imageUrl} 
                        alt={post.title} 
                        className="w-full max-h-80 object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-5 pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition"
                    >
                      <Heart className={`w-5 h-5 ${likedPosts[post.id] ? 'fill-pink-500 text-pink-500' : ''}`} />
                      <span className="text-xs">J'aime</span>
                    </button>
                    <Link 
                      to={`/teacher/posts/${post.id}`}
                      className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition"
                    >
                      <Eye className="w-5 h-5" />
                      <span className="text-xs">Voir</span>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <>
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                  let pageNum
                  if (pagination.last_page <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= pagination.last_page - 2) {
                    pageNum = pagination.last_page - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                        page === pageNum
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-pink-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === pagination.last_page}
                className="px-3 py-2 rounded-lg bg-white text-gray-600 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center text-xs text-gray-400 mt-3">
              Page {page} sur {pagination.last_page} • {allCount} post(s) au total
            </div>
          </>
        )}
      </div>
    </div>
  )
}