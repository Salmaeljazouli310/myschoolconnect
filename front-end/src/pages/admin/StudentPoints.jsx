// front-end/src/pages/admin/StudentPoints.jsx
import { useState, useEffect } from 'react'
import { Users, Search, Star } from 'lucide-react'

export default function StudentPoints() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/v1/admin/students-points', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const result = await res.json()
      setStudents(result.data)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredStudents = students.filter(s =>
    s.student_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          Notes des Étudiants
        </h2>

        <div className="mb-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un étudiant..."
            className="w-full p-2 pl-10 border border-pink-200 rounded-xl bg-white"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map(student => (
              <div key={student.student_id} className="bg-white rounded-2xl p-4 shadow-sm border border-pink-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold">
                      {student.student_name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold">{student.student_name}</h3>
                      <p className="text-xs text-gray-500">{student.class_name}</p>
                    </div>
                  </div>
                  <div className="bg-yellow-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">{student.total_points}</span>
                    <span className="text-gray-400">/{student.max_points}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${(student.total_points / student.max_points) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}