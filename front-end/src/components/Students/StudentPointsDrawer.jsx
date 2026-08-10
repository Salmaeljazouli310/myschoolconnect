import { X, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { useApiQuery } from '../../hooks/useApi'
import { studentService } from '../../services/auth'
import { formatRelative } from '../../utils/format'
import { TableSkeleton, EmptyState } from '../UI'

export default function StudentPointsDrawer({ student, onClose }) {
  const { data, isLoading } = useApiQuery(
    ['student-points', student?.id],
    () => studentService.getPoints(student.id),
    { enabled: !!student }
  )

  const points = data?.data?.data || []
  const totalPoints = data?.total_points ?? 0

  if (!student) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-navy-800 border-l border-slate-700/50 z-50 flex flex-col animate-slide-in">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/40">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-xs text-slate-500">{student.student_code}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-navy-600 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Total des points */}
        <div className="px-6 py-4 border-b border-slate-700/30">
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${
            totalPoints >= 0
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-rose-500/10 border-rose-500/20'
          }`}>
            <Star className={`w-5 h-5 ${totalPoints >= 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
            <div>
              <p className="text-xs text-slate-400">Total des points</p>
              <p className={`text-2xl font-semibold font-mono ${totalPoints >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {totalPoints > 0 ? '+' : ''}{totalPoints}
              </p>
            </div>
          </div>
        </div>

        {/* Liste des points */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <TableSkeleton rows={5} cols={3} />
          ) : points.length === 0 ? (
            <EmptyState icon={Star} title="Aucun point" description="Aucun point attribué à cet étudiant" />
          ) : (
            points.map(point => (
              <div key={point.id} className="p-3 bg-navy-700/30 rounded-xl border border-slate-700/20">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {point.points > 0
                      ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      : <TrendingDown className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className="text-xs font-medium text-slate-300">{point.reason}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        par {point.awarded_by?.name} · {formatRelative(point.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className={`font-mono text-sm font-semibold flex-shrink-0 ${
                    point.points > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {point.points > 0 ? '+' : ''}{point.points}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="badge badge-slate text-[10px]">{point.category}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}