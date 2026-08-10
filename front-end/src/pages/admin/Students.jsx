import StudentList from '../../components/Students/StudentList'
import { GraduationCap } from 'lucide-react'

export default function AdminStudents() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-pink-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Gestion des Étudiants
          </h2>
          <p className="text-sm text-purple-500">
            Suivez les inscriptions, l'historique des points et les affectations de bus.
          </p>
        </div>
      </div>
      <StudentList />
    </div>
  )
}