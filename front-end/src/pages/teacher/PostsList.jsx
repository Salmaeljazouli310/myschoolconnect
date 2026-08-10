import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useApiQuery, useApiMutation } from '../../hooks/useApi'
import { postService } from '../../services/auth'
import { FileText, Plus, Edit2, Trash2, Send, CheckCircle, Clock, XCircle, Image, Users, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function PostsList() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('all')
  const [view, setView] = useState('teacher')

  // Récupérer TOUS les posts (pas de filtre spécifique)
  const { data: postsData, isLoading, refetch } = useApiQuery(
    ['posts-list', { filter }],
    () => postService.getAll({ 
      per_page: 100 
    })
  )
  
  const allPosts = postsData?.data?.data || []

  // Filtrer les posts de l'utilisateur connecté
  const myPosts = allPosts.filter(post => post.author_id === user?.id || post.author?.id === user?.id)
  
  // Pour la vue 'all' - filtrer par statut
  const filteredAllPosts = filter === 'all' 
    ? allPosts 
    : allPosts.filter(post => post.status === filter)
  
  // Pour la vue 'teacher' - filtrer par user ET par statut
  const filteredMyPosts = filter === 'all' 
    ? myPosts 
    : myPosts.filter(post => post.status === filter)

  const posts = view === 'teacher' ? filteredMyPosts : filteredAllPosts

  // Supprimer un post
  const deleteMutation = useApiMutation(
    (id) => postService.delete(id),
    { 
      successMessage: 'Post supprimé ✨', 
      onSuccess: () => refetch(),
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression')
      }
    }
  )

  const submitMutation = useApiMutation(
    (id) => postService.submit(id),
    { 
      successMessage: 'Post soumis pour approbation !', 
      onSuccess: () => refetch()
    }
  )

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

  const handleDelete = (postId, postTitle) => {
    if (window.confirm(`Supprimer le post "${postTitle}" ?`)) {
      deleteMutation.mutate(postId)
    }
  }

  // Compteurs pour les filtres
  const myCounts = {
    all: myPosts.length,
    draft: myPosts.filter(p => p.status === 'draft').length,
    pending: myPosts.filter(p => p.status === 'pending').length,
    approved: myPosts.filter(p => p.status === 'approved').length,
    rejected: myPosts.filter(p => p.status === 'rejected').length,
  }

  const allCounts = {
    all: allPosts.length,
    draft: allPosts.filter(p => p.status === 'draft').length,
    pending: allPosts.filter(p => p.status === 'pending').length,
    approved: allPosts.filter(p => p.status === 'approved').length,
    rejected: allPosts.filter(p => p.status === 'rejected').length,
  }

  const counts = view === 'teacher' ? myCounts : allCounts

  const filtersList = [
    { value: 'all', label: '📋 Tous', count: counts.all },
    { value: 'draft', label: '📝 Brouillons', count: counts.draft },
    { value: 'pending', label: '⏳ En attente', count: counts.pending },
    { value: 'approved', label: '✅ Approuvés', count: counts.approved },
    { value: 'rejected', label: '❌ Rejetés', count: counts.rejected },
  ]

  // Debug - Afficher dans la console
  console.log('Utilisateur connecté:', user?.id, user?.name)
  console.log('Tous les posts:', allPosts.length)
  console.log('Mes posts:', myPosts.length)
  console.log('Posts view:', view)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pink-400">Chargement des posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-20">
      <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-pink-500" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                {view === 'teacher' ? 'Mes Posts' : 'Tous les Posts'}
              </h1>
            </div>
            <Link 
              to="/teacher/posts/new" 
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1.5 rounded-xl text-sm font-medium shadow-md flex items-center gap-1 hover:scale-105 transition"
            >
              <Plus className="w-4 h-4" /> Créer
            </Link>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setView('teacher')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                view === 'teacher'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                  : 'bg-white/60 text-gray-600 hover:bg-white'
              }`}
            >
              <User className="w-4 h-4" />
              Mes Posts ({myPosts.length})
            </button>
            <button
              onClick={() => setView('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                view === 'all'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                  : 'bg-white/60 text-gray-600 hover:bg-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Tous les Posts ({allPosts.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {filtersList.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                filter === f.value
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                  : 'bg-white/80 text-gray-600 hover:bg-white'
              }`}
            >
              {f.label}
              {f.count > 0 && <span className="ml-1 text-xs">({f.count})</span>}
            </button>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun post trouvé</p>
            {view === 'teacher' && (
              <Link 
                to="/teacher/posts/new" 
                className="mt-4 inline-block px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl text-sm"
              >
                Créer mon premier post
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const StatusIcon = getStatusBadge(post.status).icon
              const firstMedia = post.media && post.media.length > 0 ? post.media[0] : null
              const imageUrl = getImageUrl(firstMedia)
              
              return (
                <div key={post.id} className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all border border-pink-100">
                  {imageUrl ? (
                    <div className="mb-3 rounded-xl overflow-hidden bg-gray-100 relative">
                      <img 
                        src={imageUrl} 
                        alt={post.title} 
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mb-3 rounded-xl overflow-hidden bg-gradient-to-r from-pink-50 to-purple-50 h-24 flex items-center justify-center">
                      <Image className="w-8 h-8 text-pink-300" />
                    </div>
                  )}

                  {view === 'all' && post.author && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      <span>{post.author.name}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 flex-1 line-clamp-1">{post.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(post.status).color} flex items-center gap-1 ml-2`}>
                      <StatusIcon className="w-3 h-3" />
                      {getStatusBadge(post.status).text}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.body}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3">
                      {view === 'teacher' && post.status === 'draft' && (
                        <>
                          <Link 
                            to={`/teacher/posts/${post.id}/edit`} 
                            className="text-blue-500 text-xs flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Modifier
                          </Link>
                          <button 
                            onClick={() => submitMutation.mutate(post.id)} 
                            className="text-green-500 text-xs flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> Soumettre
                          </button>
                        </>
                      )}
                      {(view === 'teacher' || user?.role === 'admin') && (
                        <button 
                          onClick={() => handleDelete(post.id, post.title)} 
                          className="text-red-500 text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Supprimer
                        </button>
                      )}
                    </div>
                    
                    <span className="text-xs text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}