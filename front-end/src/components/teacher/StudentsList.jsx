import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useApiQuery } from '../../hooks/useApi'
import { studentService, classService } from '../../services/auth'
import { Users, Search, Star, Award, ChevronRight, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function StudentsList() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)

  // ✅ CORRECTION: Utiliser getMyClasses() au lieu de getAll()
  const { data: classesData, isLoading: classesLoading } = useApiQuery(
    ['teacher-classes-filter'],
    () => classService.getMyClasses(),  // ← Changement ici
    { retry: false }
  )

  // Récupérer les étudiants
  const { data: studentsData, isLoading, refetch } = useApiQuery(
    ['teacher-students-list', { search, class_id: selectedClass }],
    () => studentService.getAll({ search, class_id: selectedClass, per_page: 100 })
  )

  // Récupérer les points d'un étudiant
  const { data: pointsData, isLoading: pointsLoading } = useApiQuery(
    ['student-points-detail', selectedStudent?.id],
    () => studentService.getPoints(selectedStudent?.id),
    { enabled: !!selectedStudent }
  )

  // Extraire les classes correctement
  const classes = classesData?.data?.data || classesData?.data || []
  const students = studentsData?.data?.data || []
  const points = pointsData?.data?.data || pointsData?.data || []
  const totalPoints = pointsData?.total_points || 0

  const classOptions = classes.map(c => ({ value: String(c.id), label: c.name }))

  // Fonction pour obtenir la couleur de badge de points
  const getPointsColor = (points) => {
    if (points >= 100) return 'text-emerald-400 bg-emerald-500/10'
    if (points >= 50) return 'text-blue-400 bg-blue-500/10'
    if (points >= 20) return 'text-amber-400 bg-amber-500/10'
    return 'text-slate-400 bg-slate-500/10'
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Mes Étudiants</h2>
        <p className="text-sm text-slate-400 mt-1">
          Consultez la liste de vos étudiants et gérez leurs points
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou code..."
            className="input-field pl-10"
          />
        </div>
        
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="input-field w-48"
        >
          <option value="">Toutes les classes</option>
          {classesLoading ? (
            <option disabled>Chargement...</option>
          ) : (
            classOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))
          )}
        </select>
      </div>

      {/* Liste des étudiants */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 h-20 animate-pulse bg-navy-700/30" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="card p-8 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Aucun étudiant trouvé</p>
          <p className="text-xs text-slate-500 mt-1">
            Ajustez vos filtres ou vérifiez vos classes
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map(student => (
            <div
              key={student.id}
              className="card p-4 hover:border-emerald-500/30 transition-all cursor-pointer group"
              onClick={() => setSelectedStudent(student)}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-base font-semibold text-emerald-300">
                    {student.first_name?.[0]?.toUpperCase() || student.name?.[0]?.toUpperCase()}
                  </span>
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-200">
                      {student.first_name || student.name} {student.last_name || ''}
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">#{student.student_code}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {student.class?.name || 'Classe non assignée'}
                  </p>
                </div>

                {/* Points */}
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${getPointsColor(student.total_points || 0)}`}>
                    <Star className="w-3 h-3" />
                    <span>{student.total_points || 0} pts</span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal des points de l'étudiant */}
      {selectedStudent && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setSelectedStudent(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-navy-800 border-l border-slate-700/50 z-50 flex flex-col animate-slide-in">
            {/* En-tête */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/40">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  {selectedStudent.first_name || selectedStudent.name} {selectedStudent.last_name || ''}
                </h2>
                <p className="text-xs text-slate-500">{selectedStudent.student_code}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-1.5 hover:bg-navy-600 rounded-lg">
                <span className="text-slate-400 text-xl">✕</span>
              </button>
            </div>

            {/* Total points */}
            <div className="px-6 py-4 border-b border-slate-700/30">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
                <Award className="w-8 h-8 text-emerald-400" />
                <div>
                  <p className="text-xs text-slate-400">Total des points</p>
                  <p className="text-2xl font-bold text-emerald-300">{totalPoints} points</p>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="px-6 py-4 border-b border-slate-700/30">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Actions rapides</h3>
              <div className="flex gap-3">
                <Link
                  to={`/teacher/points?student_id=${selectedStudent.id}`}
                  className="btn-primary flex-1 justify-center"
                >
                  <Award className="w-3.5 h-3.5" />
                  Attribuer des points
                </Link>
              </div>
            </div>

            {/* Historique des points */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Historique des points
              </h3>
              
              {pointsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-navy-700/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : points.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Aucun point attribué</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Commencez à attribuer des points à cet étudiant
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {points.map(point => (
                    <div key={point.id} className="p-3 bg-navy-700/30 rounded-lg border border-slate-700/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-slate-300">{point.reason}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(point.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`font-mono text-sm font-semibold ${point.points > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {point.points > 0 ? '+' : ''}{point.points}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="badge badge-slate text-[10px]">{point.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-700/40 p-4">
              <Link
                to={`/teacher/points?student_id=${selectedStudent.id}`}
                className="btn-secondary w-full justify-center"
              >
                Attribuer des points
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}