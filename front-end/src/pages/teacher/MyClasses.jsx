import { useEffect, useState } from 'react'
import { Users, BookOpen, ChevronDown, ChevronUp, Star } from 'lucide-react'

export default function MyClasses() {
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState({})
  const [studentsPoints, setStudentsPoints] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedClass, setExpandedClass] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        
        // 1. Récupérer les classes
        const classesResponse = await fetch('http://localhost:8000/api/v1/teacher/classes', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        })
        
        const classesData = await classesResponse.json()
        console.log('Classes:', classesData)
        
        if (classesData?.data?.data) {
          const classesList = classesData.data.data
          setClasses(classesList)
          
          // 2. Pour chaque classe, récupérer les étudiants
          const studentsMap = {}
          const pointsMap = {}
          
          for (const classItem of classesList) {
            const studentsResponse = await fetch(`http://localhost:8000/api/v1/teacher/classes/${classItem.id}/students`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            })
            const studentsData = await studentsResponse.json()
            console.log(`Étudiants de ${classItem.name}:`, studentsData)
            
            if (studentsData?.data?.data) {
              const studentsList = studentsData.data.data
              studentsMap[classItem.id] = studentsList
              
              // 3. Pour chaque étudiant, récupérer ses points
              for (const student of studentsList) {
                const pointsResponse = await fetch(`http://localhost:8000/api/v1/teacher/students/${student.id}/task-points`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                  }
                })
                const pointsData = await pointsResponse.json()
                console.log(`Points de ${student.first_name}:`, pointsData)
                
                if (pointsData?.success) {
                  pointsMap[student.id] = pointsData.grand_total || 0
                } else if (student.total_points !== undefined) {
                  pointsMap[student.id] = student.total_points
                } else {
                  pointsMap[student.id] = 0
                }
              }
            } else {
              studentsMap[classItem.id] = []
            }
          }
          setStudents(studentsMap)
          setStudentsPoints(pointsMap)
        }
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const toggleClass = (classId) => {
    if (expandedClass === classId) {
      setExpandedClass(null)
    } else {
      setExpandedClass(classId)
    }
  }

  const getPointsColor = (points) => {
    if (points >= 40) return 'text-emerald-600'
    if (points >= 30) return 'text-blue-600'
    if (points >= 20) return 'text-amber-600'
    if (points >= 10) return 'text-orange-600'
    return 'text-gray-600'
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-500">Chargement des classes...</p>
      </div>
    </div>
  )
  
  if (classes.length === 0) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center bg-white/80 rounded-2xl p-8">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Aucune classe assignée</p>
        <p className="text-xs text-gray-400 mt-2">Contactez l'administrateur</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-6">
          Mes Classes
        </h1>

        <div className="space-y-4">
          {classes.map((classItem) => {
            const classStudents = students[classItem.id] || []
            const isExpanded = expandedClass === classItem.id
            
            return (
              <div key={classItem.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-pink-100">
                {/* En-tête de la classe */}
                <div 
                  className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 cursor-pointer hover:from-pink-100 hover:to-purple-100 transition-all"
                  onClick={() => toggleClass(classItem.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center shadow-md">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-800">{classItem.name}</h2>
                        <p className="text-sm text-gray-500">
                          {classItem.grade} • Année {classItem.academic_year}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3 text-pink-400" />
                          <span className="text-xs text-gray-500">{classStudents.length} étudiants</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-pink-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Liste des étudiants */}
                {isExpanded && (
                  <div className="p-4 border-t border-pink-100">
                    {classStudents.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-400">Aucun étudiant dans cette classe</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {classStudents.map((student) => {
                          const totalPoints = studentsPoints[student.id] !== undefined ? studentsPoints[student.id] : 0
                          return (
                            <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-pink-50 transition-all">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold shadow-sm">
                                  {student.first_name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-800">
                                    {student.first_name} {student.last_name}
                                  </h3>
                                  <p className="text-xs text-gray-400">Code: {student.student_code}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                  <span className={`text-lg font-bold ${getPointsColor(totalPoints)}`}>
                                    {totalPoints}
                                  </span>
                                  <span className="text-xs text-gray-400">pts</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}