import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Award, Search, Users, RefreshCw, Star, TrendingUp, XCircle, BookOpen, Headphones, Heart, BookMarked, Sparkles, Crown, Target, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PointsTaskNew() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [tasks, setTasks] = useState([])
  const [studentsData, setStudentsData] = useState({})
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [pointsValue, setPointsValue] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [tasksLoading, setTasksLoading] = useState(true)

  // Charger les tâches depuis la BD
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setTasksLoading(true)
        const token = localStorage.getItem('auth_token')
        const res = await fetch('http://localhost:8000/api/v1/teacher/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        
        let tasksList = []
        if (Array.isArray(data)) {
          tasksList = data
        } else if (data?.data?.data) {
          tasksList = data.data.data
        } else if (data?.data) {
          tasksList = data.data
        }
        
        setTasks(tasksList)
        
        if (tasksList.length === 0) {
          toast.error('Aucune tâche trouvée.')
        }
      } catch (err) {
        console.error('Erreur chargement tâches:', err)
        toast.error('Erreur chargement des tâches')
        setTasks([])
      } finally {
        setTasksLoading(false)
      }
    }
    fetchTasks()
  }, [])

  // Charger les classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch('http://localhost:8000/api/v1/teacher/classes', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        
        if (data?.data?.data) setClasses(data.data.data)
        else if (data?.data) setClasses(data.data)
        else if (Array.isArray(data)) setClasses(data)
        else setClasses([])
      } catch (err) { 
        console.error(err) 
        toast.error('Erreur chargement des classes')
        setClasses([])
      }
    }
    fetchClasses()
  }, [])

  // Charger les étudiants
  const fetchStudents = async () => {
    if (!selectedClass) return
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`http://localhost:8000/api/v1/teacher/classes/${selectedClass}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      let studentsList = []
      if (data?.data?.data) studentsList = data.data.data
      else if (data?.data) studentsList = data.data
      else if (Array.isArray(data)) studentsList = data
      
      setStudents(studentsList)
      const dataMap = {}
      
      for (const student of studentsList) {
        const pointsRes = await fetch(`http://localhost:8000/api/v1/teacher/students/${student.id}/task-points`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const pointsData = await pointsRes.json()
        
        if (pointsData?.success) {
          dataMap[student.id] = {
            grand_total: pointsData.grand_total || 0,
            tasks: pointsData.tasks || []
          }
        } else {
          dataMap[student.id] = { grand_total: 0, tasks: [] }
        }
      }
      setStudentsData(dataMap)
    } catch (err) { 
      console.error(err)
      toast.error('Erreur chargement des étudiants')
    }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (selectedClass) {
      fetchStudents()
    }
  }, [selectedClass, refresh])

  const handleAward = (student, task) => {
    const taskData = studentsData[student.id]?.tasks?.find(t => t.task_id === task.id)
    const currentPoints = taskData?.points_obtained || 0
    
    setSelectedStudent(student)
    setSelectedTask(task)
    setPointsValue(currentPoints.toString())
    setComment('')
    setShowModal(true)
  }

  const confirmAward = async () => {
    if (!pointsValue && pointsValue !== '0') {
      toast.error('Entrez un nombre de points')
      return
    }
    
    const newPoints = parseInt(pointsValue)
    if (isNaN(newPoints) || newPoints < 0 || newPoints > 10) {
      toast.error('Les points doivent être entre 0 et 10')
      return
    }
    
    setSubmitting(true)
    try {
      const token = localStorage.getItem('auth_token')
      
      const response = await fetch(`http://localhost:8000/api/v1/teacher/students/${selectedStudent.id}/task-points`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_id: selectedTask.id,
          points: newPoints,
          comment: comment || `Note pour ${selectedTask.name}`
        })
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(`${newPoints} points attribués`)
        setShowModal(false)
        setRefresh(prev => prev + 1)
      } else {
        toast.error(data.message || 'Erreur lors de l\'enregistrement')
      }
    } catch (err) {
      console.error('Erreur:', err)
      toast.error('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  const getTaskIcon = (icon) => {
    const icons = {
      '📚': <BookOpen className="w-5 h-5" />,
      '📖': <BookMarked className="w-5 h-5" />,
      '👂': <Headphones className="w-5 h-5" />,
      '🙋': <Heart className="w-5 h-5" />,
      '⭐': <Star className="w-5 h-5" />
    }
    return icons[icon] || <Star className="w-5 h-5" />
  }

  const getTaskColor = (color) => {
    const colors = {
      'emerald': 'from-emerald-400 to-teal-500',
      'blue': 'from-blue-400 to-indigo-500',
      'cyan': 'from-cyan-400 to-sky-500',
      'yellow': 'from-yellow-400 to-orange-500',
      'purple': 'from-purple-400 to-pink-500'
    }
    return colors[color] || 'from-pink-400 to-purple-500'
  }

  const getPointsLevel = (points) => {
    if (points >= 32) return { label: 'Excellent', color: 'text-amber-500', icon: <Crown className="w-4 h-4" /> }
    if (points >= 24) return { label: 'Très bien', color: 'text-emerald-500', icon: <Star className="w-4 h-4" /> }
    if (points >= 16) return { label: 'Bien', color: 'text-blue-500', icon: <Target className="w-4 h-4" /> }
    if (points >= 8) return { label: 'En progrès', color: 'text-amber-500', icon: <Zap className="w-4 h-4" /> }
    return { label: 'Débutant', color: 'text-gray-400', icon: <Sparkles className="w-4 h-4" /> }
  }

  const filteredStudents = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  )

  if (!selectedClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl text-center border border-white/50">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
              Points par Tâche
            </h2>
            <p className="text-gray-500 mb-6">Sélectionnez une classe pour commencer</p>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full p-3 border-2 border-pink-200 rounded-xl bg-white focus:outline-none focus:border-pink-400"
            >
              <option value="">-- Choisir une classe --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {tasksLoading && (
              <div className="mt-4 flex justify-center">
                <div className="w-6 h-6 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (tasksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pink-500 font-medium">Chargement des tâches...</p>
        </div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl text-center border border-white/50">
            <Award className="w-20 h-20 text-pink-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucune tâche</h2>
            <p className="text-gray-500">Aucune tâche n'est configurée dans la base de données.</p>
            <p className="text-xs text-gray-400 mt-4">Veuillez contacter l'administrateur</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/70 backdrop-blur-md border-b border-pink-100/50 px-6 py-4 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-pink-500" />
              Points par Tâche
            </h1>
            <p className="text-sm text-pink-400 mt-1">
              {classes.find(c => c.id == selectedClass)?.name} • {tasks.length} tâches
            </p>
          </div>
          <button onClick={() => setRefresh(prev => prev + 1)} className="p-2.5 bg-white rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105">
            <RefreshCw className="w-5 h-5 text-pink-500" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Filtres */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-5 py-2.5 border-2 border-pink-200 rounded-xl bg-white focus:outline-none focus:border-pink-400 font-medium text-gray-700"
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un étudiant..."
              className="w-full p-2.5 pl-10 border-2 border-pink-200 rounded-xl bg-white focus:outline-none focus:border-pink-400"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 text-center border border-pink-100">
            <Users className="w-20 h-20 text-pink-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun étudiant trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map(student => {
              const studentInfo = studentsData[student.id]
              const grandTotal = studentInfo?.grand_total || 0
              const percentage = (grandTotal / 40) * 100
              const radius = 45
              const circumference = 2 * Math.PI * radius
              const strokeDashoffset = circumference - (percentage / 100) * circumference
              const pointsLevel = getPointsLevel(grandTotal)

              return (
                <div 
                  key={student.id} 
                  className="group bg-white rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-pink-100"
                >
                  {/* Carte étudiante */}
                  <div className="flex items-center gap-4 mb-4">
                    {/* Cercle de progression */}
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r={radius} stroke="#fce7f3" strokeWidth="6" fill="none" />
                        <circle
                          cx="48"
                          cy="48"
                          r={radius}
                          stroke="url(#gradient)"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-500"
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#f472b6" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-800">{grandTotal}</span>
                        <span className="text-[10px] text-gray-400">/40</span>
                      </div>
                    </div>
                    
                    {/* Infos étudiant */}
                    <div className="flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center shadow-md group-hover:scale-105 transition">
                        <span className="text-lg font-bold text-white">
                          {student.first_name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800 mt-2 line-clamp-1">
                        {student.first_name} {student.last_name}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        {pointsLevel.icon}
                        <span className={`text-xs ${pointsLevel.color}`}>{pointsLevel.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tâches */}
                  <div className="space-y-2 mt-4">
                    {tasks.map(task => {
                      const taskData = studentInfo?.tasks?.find(t => t.task_id === task.id)
                      const pointsObtained = taskData?.points_obtained || 0
                      const maxPoints = task.max_points || 10
                      const taskPercentage = (pointsObtained / maxPoints) * 100
                      
                      return (
                        <div key={task.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-pink-50 transition duration-200">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-r ${getTaskColor(task.color)} flex items-center justify-center text-white shadow-sm`}>
                              {getTaskIcon(task.icon)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">{task.name}</p>
                              <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1">
                                <div 
                                  className={`h-1.5 rounded-full bg-gradient-to-r ${getTaskColor(task.color)}`}
                                  style={{ width: `${taskPercentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-600">
                              {pointsObtained}/{maxPoints}
                            </span>
                            <button
                              onClick={() => handleAward(student, task)}
                              className="w-8 h-8 rounded-full bg-pink-100 text-pink-500 hover:bg-pink-200 hover:scale-110 transition-all duration-200 flex items-center justify-center"
                              title="Modifier les points"
                            >
                              <Award className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Bouton historique */}
                  <button
                    onClick={() => {
                      setSelectedStudent(student)
                      setShowHistoryModal(true)
                    }}
                    className="w-full mt-4 py-2 text-center text-sm font-medium text-pink-500 border-t border-pink-100 pt-3 hover:text-pink-700 transition flex items-center justify-center gap-1 group-hover:gap-2"
                  >
                    <TrendingUp className="w-3 h-3" />
                    Voir l'historique
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal d'attribution */}
        {showModal && selectedStudent && selectedTask && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="text-center mb-4">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${getTaskColor(selectedTask.color)} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                  {getTaskIcon(selectedTask.icon)}
                </div>
                <h3 className="text-xl font-bold text-gray-800">{selectedTask.name}</h3>
                <p className="text-gray-500">{selectedStudent.first_name} {selectedStudent.last_name}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points (0 à 10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={pointsValue}
                    onChange={(e) => setPointsValue(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl text-center text-lg focus:outline-none focus:border-pink-400"
                    placeholder="0-10"
                    autoFocus
                  />
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Commentaire (optionnel)"
                  className="w-full p-3 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-pink-400"
                  rows="3"
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-3 border-2 border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition">
                  Annuler
                </button>
                <button onClick={confirmAward} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:scale-105 transition disabled:opacity-50">
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal d'historique */}
        {showHistoryModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-auto shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  {selectedStudent.first_name}
                </h3>
                <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition">
                  <XCircle className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Total: {studentsData[selectedStudent.id]?.grand_total || 0} / 40 points
              </p>
              {tasks.map(task => {
                const taskData = studentsData[selectedStudent.id]?.tasks?.find(t => t.task_id === task.id)
                const history = taskData?.history || []
                return (
                  <div key={task.id} className="mb-4">
                    <h4 className="font-semibold flex items-center gap-2 mb-2 text-gray-700">
                      {getTaskIcon(task.icon)} {task.name}
                    </h4>
                    {history.length === 0 ? (
                      <p className="text-xs text-gray-400 ml-8">Aucune note</p>
                    ) : (
                      history.map((h, idx) => (
                        <div key={idx} className="ml-8 p-2 bg-pink-50 rounded-lg mb-2">
                          <div className="flex justify-between">
                            <span className="text-pink-600 font-medium">+{h.points} pts</span>
                            <span className="text-xs text-gray-400">{new Date(h.date).toLocaleDateString()}</span>
                          </div>
                          {h.comment && <p className="text-xs text-gray-500 mt-1">{h.comment}</p>}
                        </div>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}