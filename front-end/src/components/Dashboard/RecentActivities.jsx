import { Link } from 'react-router-dom'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useApiQuery } from '../../hooks/useApi'
import { postService } from '../../services/auth'
import { formatRelative, getPostStatusBadge } from '../../utils/format'
import { Skeleton, EmptyState } from '../UI'

export default function RecentActivities() {
  const { data, isLoading } = useApiQuery(
    ['recent-posts'],
    () => postService.getAll({ per_page: 5 }),
  )

  const posts = data?.data?.data || []

  return (
    <div className="card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
        <div>
          <p className="text-sm font-semibold text-slate-200">Posts Récents</p>
          <p className="text-xs text-slate-500">Dernières soumissions à modérer</p>
        </div>
        <Link to="/admin/posts" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          Voir tout →
        </Link>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState icon={FileText} title="Aucun post" description="Les posts apparaîtront ici une fois créés." />
      ) : (
        <div className="divide-y divide-slate-700/30">
          {posts.map(post => (
            <div key={post.id} className="flex items-center gap-3 px-5 py-3 hover:bg-navy-700/20 transition-colors">
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                post.status === 'approved' ? 'bg-emerald-500/10' :
                post.status === 'pending' ? 'bg-amber-500/10' :
                post.status === 'rejected' ? 'bg-rose-500/10' : 'bg-slate-500/10'
              }`}>
                {post.status === 'approved' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> :
                 post.status === 'pending' ? <Clock className="w-3.5 h-3.5 text-amber-400" /> :
                 post.status === 'rejected' ? <XCircle className="w-3.5 h-3.5 text-rose-400" /> :
                 <FileText className="w-3.5 h-3.5 text-slate-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">{post.title}</p>
                <p className="text-[10px] text-slate-500">
                  par {post.author?.name} · {formatRelative(post.created_at)}
                </p>
              </div>
              <span className={getPostStatusBadge(post.status)}>{post.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}