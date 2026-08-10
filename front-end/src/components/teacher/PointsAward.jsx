import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Award, Search, Star, Users, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PointsAward() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [pointsValue, setPointsValue] = useState('')
  const [reason, setReason] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [refresh, setRefresh] = useState(0)

  // Charger les classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const res = await fetch('/api/v1/teacher/classes', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        if (data?.data?.data) {
          setClasses(data.data.data)
        }
      } catch (err) {
        console.error('Erreur:', err)
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
      const res = await fetch(`/api/v1/teacher/classes/${selectedClass}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data?.data?.data) {
        setStudents(data.data.data)
      }
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [selectedClass, refresh])

  const handleAward = (student) => {
    setSelectedStudent(student)
    setPointsValue('')
    setReason('')
    setShowModal(true)
  }

  const confirmAward = async () => {
    if (!pointsValue || !reason) {
      toast.error('Remplissez tous les champs')
      return
    }
    setSubmitting(true)
    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch(`/api/v1/teacher/students/${selectedStudent.id}/points`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          points: parseInt(pointsValue),
          reason: reason,
          category: 'academic'
        })
      })
      if (res.ok) {
        toast.success(`${pointsValue} points attribués`)
        setShowModal(false)
        setRefresh(prev => prev + 1)
      } else {
        toast.error('Erreur')
      }
    } catch (err) {
      toast.error('Erreur réseau')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredStudents = students.filter(s => {
    if (!search) return true
    return `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  })

  if (!selectedClass) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Attribution des Points
          </h2>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full p-3 border border-pink-200 rounded-xl bg-white"
          >
            <option value="">-- Choisir une classe --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Attribution des Points
          </h2>
          <button onClick={() => setRefresh(prev => prev + 1)} className="p-2 bg-white rounded-full shadow-md">
            <RefreshCw className="w-5 h-5 text-pink-500" />
          </button>
        </div>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full p-3 border border-pink-200 rounded-xl bg-white mb-4"
        >
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {students.length > 0 && (
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un étudiant..."
              className="w-full p-2 pl-10 border border-pink-200 rounded-xl bg-white"
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white/80 rounded-2xl p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun étudiant trouvé</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map(student => (
              <div key={student.id} className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-lg font-bold">
                      {student.first_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">{student.class?.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-gray-700">{student.total_points || 0}</span>
                        <span className="text-xs text-gray-400">points</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAward(student)}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg text-sm hover:scale-105 transition flex items-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    Attribuer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-96">
              <h3 className="text-xl font-bold mb-4">Attribuer des points</h3>
              <p className="mb-4 text-gray-600">{selectedStudent.first_name} {selectedStudent.last_name}</p>
              <input
                type="number"
                value={pointsValue}
                onChange={(e) => setPointsValue(e.target.value)}
                placeholder="Points (ex: 5, -2, 10)"
                className="w-full p-2 border border-gray-300 rounded-lg mb-3"
                autoFocus
              />
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Raison"
                className="w-full p-2 border border-gray-300 rounded-lg mb-4"
              />
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="flex-1 p-2 border border-gray-300 rounded-lg">Annuler</button>
                <button onClick={confirmAward} disabled={submitting} className="flex-1 p-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg">
                  {submitting ? '...' : 'Attribuer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}