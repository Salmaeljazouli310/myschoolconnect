import { CheckCircle, User, BookOpen, Calendar } from 'lucide-react'
import { Modal } from '../UI'
import { formatDateTime, getPostStatusBadge } from '../../utils/format'

export default function PostDetailModal({ post, onClose, onApprove }) {
  if (!post) return null

  return (
    <Modal isOpen={!!post} onClose={onClose} title="Détails du post" size="lg">
      <div className="space-y-5">
        {/* Statut + meta */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100 mb-1">{post.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><User className="w-3 h-3" /> {post.author?.name}</span>
              {post.class && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {post.class.name}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDateTime(post.created_at)}</span>
            </div>
          </div>
          <span className={getPostStatusBadge(post.status)}>{post.status}</span>
        </div>

        {/* Corps du post */}
        <div className="p-4 bg-navy-700/30 rounded-xl border border-slate-700/30">
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{post.body}</p>
        </div>

        {/* Médias joints */}
        {post.media?.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Pièces jointes ({post.media.length})</p>
            <div className="flex flex-wrap gap-2">
              {post.media.map(m => (
                <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-navy-700/40 rounded-lg text-xs text-blue-400 hover:text-blue-300 border border-slate-700/30 transition-colors">
                  {m.filename}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Actions si en attente */}
        {post.status === 'pending' && (
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-700/30">
            <button className="btn-secondary" onClick={onClose}>Fermer</button>
            <button className="btn-success" onClick={() => { onApprove(post.id); onClose() }}>
              <CheckCircle className="w-3.5 h-3.5" /> Approuver & Publier
            </button>
          </div>
        )}
      </div>
    </Modal>
  )
}