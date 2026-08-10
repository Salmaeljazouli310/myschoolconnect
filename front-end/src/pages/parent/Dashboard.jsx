import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { parentService } from '../../services/auth';
import { 
  Heart, BookOpen, Calendar, User, Eye, 
  Bell, Bus, CheckCircle, Clock, Trophy, 
  Sparkles, TrendingUp, MessageCircle, Share2, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ParentDashboard() {
  const { user, token } = useAuth();
  const [likedPosts, setLikedPosts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);

  // Récupérer les enfants
  const fetchChildren = async () => {
    try {
      const response = await parentService.getMyChildren();
      setChildren(response?.data?.data || []);
    } catch (error) {
      console.error('Erreur chargement enfants:', error);
    }
  };

  // Récupérer les posts approuvés
  const fetchPosts = async () => {
    try {
      const response = await parentService.getApprovedPosts();
      
      let postsData = [];
      if (response?.data?.data) {
        postsData = response.data.data;
      } else if (response?.data) {
        postsData = response.data;
      } else if (Array.isArray(response)) {
        postsData = response;
      }
      
      setPosts(postsData);
    } catch (error) {
      console.error('Erreur chargement posts:', error);
      toast.error('Erreur de chargement des actualités');
    }
  };

  // Récupérer les notifications
  const fetchNotifications = async () => {
    try {
      const response = await parentService.getNotifications();
      setNotifications(response?.data?.notifications?.data || []);
      setUnreadCount(response?.data?.unread_count || 0);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPosts(),
        fetchChildren(),
        fetchNotifications()
      ]);
      setLoading(false);
    };
    
    if (token) {
      loadData();
    }
  }, [token]);

  // ✅ Fonction pour obtenir l'URL de l'image
  const getImageUrl = (media) => {
    if (!media) return null;
    if (media.url) return media.url;
    if (media.path) {
      if (media.path.startsWith('storage/')) {
        return `http://localhost:8000/${media.path}`;
      }
      return `http://localhost:8000/storage/${media.path}`;
    }
    return null;
  };

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  // Get status badge for child trip
  const getTripStatusBadge = (status) => {
    switch(status) {
      case 'in_progress':
        return { color: 'bg-emerald-100 text-emerald-700', text: 'En route', icon: Bus };
      case 'completed':
        return { color: 'bg-blue-100 text-blue-700', text: 'Arrivé', icon: CheckCircle };
      default:
        return { color: 'bg-gray-100 text-gray-600', text: 'En attente', icon: Clock };
    }
  };

  // Gérer le like
  const handleLike = (postId) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    toast.success(!likedPosts[postId] ? '❤️ Post liké !' : '💔 Like retiré');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-300 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-rose-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-rose-100 sticky top-0 z-10 shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-500" />
                Espace Parent
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition">
                  <Bell className="w-5 h-5 text-rose-500" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Children Trip Status Section */}
      {children.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-rose-500 to-purple-600 rounded-full" />
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-rose-500" />
              Suivi des Trajets
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children.map(child => {
              const statusBadge = getTripStatusBadge(child.today_trip_status || 'not_started');
              const StatusIcon = statusBadge.icon;
              
              return (
                <div key={child.id} className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-md border border-rose-100 hover:shadow-lg transition">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                      {child.first_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {child.first_name} {child.last_name}
                      </h3>
                      <p className="text-xs text-gray-500">{child.class?.name}</p>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${statusBadge.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusBadge.text}
                      </div>
                    </div>
                  </div>
                  {child.trip_started_at && (
                    <p className="text-xs text-gray-400 mt-3 pt-2 border-t border-rose-100 text-right">
                      🚌 Départ: {new Date(child.trip_started_at).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-gradient-to-b from-rose-500 to-purple-600 rounded-full" />
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-rose-500" />
            Actualités
            <span className="text-xs bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">{posts.length}</span>
          </h2>
        </div>
        
        {posts.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center border border-rose-100 shadow-md">
            <div className="w-24 h-24 bg-gradient-to-br from-rose-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-12 h-12 text-rose-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune actualité</h3>
            <p className="text-gray-500">Il n'y a pas encore de publications</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const firstMedia = post.media && post.media.length > 0 ? post.media[0] : null;
              const imageUrl = getImageUrl(firstMedia);
              
              return (
                <div 
                  key={post.id} 
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden border border-rose-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* En-tête */}
                  <div className="p-5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {post.author?.name?.[0]?.toUpperCase() || 'E'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800">
                            {post.author?.name || 'Enseignant'}
                          </h3>
                          {post.class?.name && (
                            <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full">
                              {post.class.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(post.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="px-5 pb-3">
                    <h2 className="text-xl font-bold text-gray-800 mb-2 leading-tight">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      {post.body}
                    </p>
                    
                    {/* ✅ Affichage de l'image */}
                    {imageUrl ? (
                      <div className="rounded-xl overflow-hidden mb-3 bg-gray-100 relative group">
                        <img 
                          src={imageUrl} 
                          alt={post.title}
                          className="w-full h-auto max-h-96 object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://placehold.co/800x400/fce7f3/f472b6?text=Image+non+disponible';
                          }}
                        />
                        {post.media?.length > 1 && (
                          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                            +{post.media.length - 1} photos
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-rose-50 to-purple-50 h-32 flex items-center justify-center border border-rose-100">
                        <ImageIcon className="w-8 h-8 text-rose-300" />
                        <span className="text-xs text-gray-400 ml-2">Aucune image</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="border-t border-rose-100 px-5 py-3 flex gap-6">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 text-sm transition-all duration-200 ${
                        likedPosts[post.id] 
                          ? 'text-rose-500' 
                          : 'text-gray-400 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${likedPosts[post.id] ? 'fill-rose-500' : ''}`} />
                      <span>J'aime</span>
                    </button>
                    <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-rose-500 transition">
                      <MessageCircle className="w-5 h-5" />
                      <span>Commenter</span>
                    </button>
                    <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-rose-500 transition">
                      <Share2 className="w-5 h-5" />
                      <span>Partager</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}