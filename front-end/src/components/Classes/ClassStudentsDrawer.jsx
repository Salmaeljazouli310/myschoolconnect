import { X, GraduationCap } from 'lucide-react'
import { useApiQuery } from '../../hooks/useApi'
import { classService } from '../../services/auth'
import { TableSkeleton, EmptyState } from '../UI'

export default function ClassStudentsDrawer({ class_, onClose }) {
  const { data, isLoading } = useApiQuery(
    ['class-students', class_?.id],
    () => classService.getStudents(class_.id),
    { enabled: !!class_ }
  )

  const students = data?.data?.data || []

  if (!class_) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-navy-800 border-l border-slate-700/50 z-50 flex flex-col animate-slide-in">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/40">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{class_.name}</h2>
            <p className="text-xs text-slate-500">{class_.academic_year} · {students.length} élèves</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-navy-600 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Liste des élèves */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <TableSkeleton rows={6} cols={3} />
          ) : students.length === 0 ? (
            <EmptyState icon={GraduationCap} title="Aucun élève" description="Aucun élève inscrit dans cette classe" />
          ) : (
            <div className="space-y-2">
              {students.map(student => (
                <div key={student.id} className="flex items-center gap-3 p-3 bg-navy-700/30 rounded-xl border border-slate-700/20 hover:border-slate-600/40 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-slate-600/30 flex items-center justify-center text-xs font-semibold text-slate-300">
                    {student.first_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{student.first_name} {student.last_name}</p>
                    <p className="text-xs text-slate-500 font-mono">{student.student_code}</p>
                  </div>
                  <span className={`badge text-[10px] ${student.is_active ? 'badge-green' : 'badge-slate'}`}>
                    {student.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}