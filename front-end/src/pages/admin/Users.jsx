import UserList from '/src/components/Users/UserList'
import { Users as UsersIcon } from 'lucide-react'

export default function UsersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center">
          <UsersIcon className="w-5 h-5 text-pink-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Gestion des Utilisateurs
          </h2>
          <p className="text-sm text-purple-500">
            Gérez tous les utilisateurs de la plateforme et les codes d'invitation.
          </p>
        </div>
      </div>
      <UserList />
    </div>
  )
}