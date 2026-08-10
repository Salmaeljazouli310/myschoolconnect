import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Users, Star, Search, BookOpen, Headphones, Heart, BookMarked, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentsList() {
  const { user } = useAuth()
  const [selectedClass, setSelectedClass] = useState('')
  const [search, setSearch] = useState('')
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [studentsDetails, setStudentsDetails] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Charger les classes de l'enseignant
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch('http://localhost:8000/api/v1/teacher/classes', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        
        const data = await response.json()
        
        let classesData = []
        if (data?.data?.data) {
          classesData = data.data.data
        } else if (data?.data) {
          classesData = data.data
        } else if (Array.isArray(data)) {
          classesData = data
        }
        
        setClasses(classesData)
      } catch (err) {
        console.error('Error loading classes:', err)
        toast.error('Erreur lors du chargement des classes')
      }
    }
    fetchClasses()
  }, [])

  // Charger les étudiants quand une classe est sélectionnée
  useEffect(() => {
    if (!selectedClass) {
      setStudents([])
      setStudentsDetails({})
      return
    }
    
    const fetchStudents = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`http://localhost:8000/api/v1/teacher/classes/${selectedClass}/students`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        
        const data = await response.json()
        
        let studentsList = []
        if (data?.data?.data) {
          studentsList = data.data.data
        } else if (data?.data) {
          studentsList = data.data
        } else if (Array.isArray(data)) {
          studentsList = data
        }
        
        setStudents(studentsList)
        
        // Charger les détails des points pour chaque étudiant
        const detailsMap = {}
        for (const student of studentsList) {
          try {
            const pointsRes = await fetch(`http://localhost:8000/api/v1/teacher/students/${student.id}/task-points`, {
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            })
            const pointsData = await pointsRes.json()
            
            if (pointsData?.success) {
              detailsMap[student.id] = {
                grand_total: pointsData.grand_total || 0,
                tasks: pointsData.tasks || []
              }
            } else {
              detailsMap[student.id] = {
                grand_total: student.total_points || 0,
                tasks: []
              }
            }
          } catch (err) {
            detailsMap[student.id] = {
              grand_total: student.total_points || 0,
              tasks: []
            }
          }
        }
        setStudentsDetails(detailsMap)
        
      } catch (err) {
        console.error('Error loading students:', err)
        toast.error('Erreur lors du chargement des étudiants')
        setStudents([])
      } finally {
        setLoading(false)
      }
    }
    
    fetchStudents()
  }, [selectedClass])

  const getTaskIcon = (icon) => {
    const icons = {
      '📚': <BookOpen className="w-3 h-3" />,
      '📖': <BookMarked className="w-3 h-3" />,
      '👂': <Headphones className="w-3 h-3" />,
      '🙋': <Heart className="w-3 h-3" />
    }
    return icons[icon] || <Star className="w-3 h-3" />
  }

  const getTaskColor = (color) => {
    const colors = {
      'emerald': 'bg-emerald-100 text-emerald-700',
      'blue': 'bg-blue-100 text-blue-700',
      'cyan': 'bg-cyan-100 text-cyan-700',
      'yellow': 'bg-yellow-100 text-yellow-700'
    }
    return colors[color] || 'bg-pink-100 text-pink-700'
  }

  const getPointsColor = (points) => {
    if (points >= 32) return 'text-emerald-600'
    if (points >= 24) return 'text-blue-600'
    if (points >= 16) return 'text-amber-600'
    if (points >= 8) return 'text-orange-600'
    return 'text-gray-600'
  }

  const filteredStudents = students.filter(s => {
    if (!search) return true
    return `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-20">
      <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-10 px-4 py-3">
        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          Mes Étudiants
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Sélection de la classe */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner une classe
          </label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full p-3 border border-pink-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            <option value="">-- Choisir une classe --</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Barre de recherche */}
        {selectedClass && students.length > 0 && (
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un étudiant..."
              className="w-full p-2 pl-10 border border-pink-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
        )}

        {/* Liste des étudiants */}
        {!selectedClass ? (
          <div className="bg-white/80 rounded-2xl p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Veuillez sélectionner une classe</p>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white/80 rounded-2xl p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun étudiant dans cette classe</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map(student => {
              const details = studentsDetails[student.id]
              let totalPoints = details?.grand_total || student.total_points || 0
              if (totalPoints > 40) totalPoints = 40
              
              const tasks = details?.tasks || []
              
              return (
                <div key={student.id} className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                      {student.first_name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {student.first_name} {student.last_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className={`text-lg font-bold ${getPointsColor(totalPoints)}`}>
                          {totalPoints}
                        </span>
                        <span className="text-xs text-gray-400">/40 points</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStudent(student)
                        setShowDetailsModal(true)
                      }}
                      className="p-2 text-pink-500 hover:bg-pink-50 rounded-lg transition"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {tasks.length > 0 && (
                    <div className="border-t border-pink-100 pt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">Points par tâche :</p>
                      <div className="flex flex-wrap gap-2">
                        {tasks.map(task => {
                          let pointsObtained = task.points_obtained || 0
                          if (pointsObtained > task.max_points) pointsObtained = task.max_points
                          
                          return (
                            <div
                              key={task.task_id}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTaskColor(task.task_color)}`}
                            >
                              {getTaskIcon(task.task_icon)}
                              <span>{pointsObtained}/{task.max_points}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Modal des détails */}
        {showDetailsModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedStudent.first_name} {selectedStudent.last_name}
                  </h3>
                  <p className="text-sm text-gray-500">Code: {selectedStudent.student_code}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>

              <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 mb-4 text-center">
                <p className="text-sm text-gray-500">Total général</p>
                <p className="text-3xl font-bold text-pink-600">
                  {studentsDetails[selectedStudent.id]?.grand_total > 40 ? 40 : (studentsDetails[selectedStudent.id]?.grand_total || 0)}
                </p>
                <p className="text-xs text-gray-400">sur 40 points maximum</p>
              </div>

              <h4 className="font-semibold text-gray-700 mb-3">Détail par tâche :</h4>
              <div className="space-y-3">
                {(studentsDetails[selectedStudent.id]?.tasks || []).map(task => {
                  let pointsObtained = task.points_obtained || 0
                  if (pointsObtained > task.max_points) pointsObtained = task.max_points
                  const percentage = (pointsObtained / task.max_points) * 100
                  
                  return (
                    <div key={task.task_id} className="border border-gray-100 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTaskIcon(task.task_icon)}
                          <span className="font-medium text-gray-800">{task.task_name}</span>
                        </div>
                        <span className="text-sm font-bold text-pink-600">
                          {pointsObtained}/{task.max_points}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}