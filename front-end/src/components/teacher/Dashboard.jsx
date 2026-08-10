import { useAuth } from '../../contexts/AuthContext'
import { useApiQuery } from '../../hooks/useApi'
import { classService, studentService, postService } from '../../services/auth'
import { Users, School, FileText, Award, TrendingUp, Clock } from 'lucide-react'

export default function TeacherDashboard() {
  const { user } = useAuth()

  // Récupération des données depuis l'API
  const { data: classesData, isLoading: classesLoading } = useApiQuery(
    ['teacher-classes'],
    () => classService.getAll({ teacher_id: user?.id, per_page: 100 })
  )
  
  const { data: studentsData, isLoading: studentsLoading } = useApiQuery(
    ['teacher-students'],
    () => studentService.getAll({ per_page: 100 })
  )
  
  const { data: postsData, isLoading: postsLoading } = useApiQuery(
    ['teacher-posts'],
    () => postService.getAll({ author_id: user?.id, per_page: 10 })
  )

  const classesCount = classesData?.data?.total || 0
  const studentsCount = studentsData?.data?.total || 0
  const postsCount = postsData?.data?.total || 0
  const recentPosts = postsData?.data?.data || []

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  // Fonction pour obtenir le message du jour
  const getMotivationMessage = () => {
    const messages = [
      "🌟 Excellente journée pour motiver vos élèves !",
      "📚 Chaque point compte pour la réussite de vos étudiants.",
      "💬 N'oubliez pas de consulter vos messages des parents.",
      "🎯 Fixez-vous un objectif de points à attribuer aujourd'hui.",
      "🤝 La communication avec les parents est la clé du succès."
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {getMotivationMessage()}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mes classes */}
        <div className="card p-5 flex items-start gap-4">
          <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <School className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mes Classes</p>
            <p className="text-2xl font-semibold text-slate-100 font-mono">
              {classesLoading ? '...' : classesCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">classes assignées</p>
          </div>
        </div>

        {/* Mes étudiants */}
        <div className="card p-5 flex items-start gap-4">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mes Étudiants</p>
            <p className="text-2xl font-semibold text-slate-100 font-mono">
              {studentsLoading ? '...' : studentsCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">élèves au total</p>
          </div>
        </div>

        {/* Mes posts */}
        <div className="card p-5 flex items-start gap-4">
          <div className="p-2.5 bg-violet-500/10 rounded-xl border border-violet-500/20">
            <FileText className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mes Posts</p>
            <p className="text-2xl font-semibold text-slate-100 font-mono">
              {postsLoading ? '...' : postsCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">posts créés</p>
          </div>
        </div>

        {/* Points attribués */}
        <div className="card p-5 flex items-start gap-4">
          <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Points</p>
            <p className="text-2xl font-semibold text-slate-100 font-mono">0</p>
            <p className="text-xs text-slate-500 mt-1">cette semaine</p>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Actions Rapides</h3>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary">
            <FileText className="w-3.5 h-3.5" />
            Nouveau Post
          </button>
          <button className="btn-secondary">
            <Award className="w-3.5 h-3.5" />
            Attribuer des Points
          </button>
          <button className="btn-secondary">
            <Users className="w-3.5 h-3.5" />
            Voir mes étudiants
          </button>
        </div>
      </div>

      {/* Posts récents */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-200">Mes Posts Récents</h3>
          <button className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            Voir tout →
          </button>
        </div>
        
        {postsLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-navy-700/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : recentPosts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Aucun post créé</p>
            <button className="btn-primary mt-3">Créer mon premier post →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.slice(0, 5).map(post => (
              <div key={post.id} className="flex items-center justify-between p-3 bg-navy-700/30 rounded-lg border border-slate-700/20 hover:border-slate-600/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{post.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {post.status === 'approved' && <span className="text-emerald-400">✓ Approuvé</span>}
                    {post.status === 'pending' && <span className="text-amber-400">⏳ En attente</span>}
                    {post.status === 'rejected' && <span className="text-rose-400">✗ Rejeté</span>}
                    {post.status === 'draft' && <span className="text-slate-500">📝 Brouillon</span>}
                  </p>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}