import { useState } from 'react'
import { Bus, Calendar, UserPlus, MapPin, Users } from 'lucide-react'
import BusList from '/src/components/Transport/BusList'
import TripList from '/src/components/Transport/TripList'
import RouteList from '/src/components/Transport/RouteList'
import AssignStudents from '/src/components/Transport/AssignStudents'
import DriverAssignmentList from '/src/components/Transport/DriverAssignmentList' // ⚠️ À créer

const TABS = [
  { id: 'trips', label: 'Trajets', icon: Calendar },
  { id: 'buses', label: 'Flotte', icon: Bus },
  { id: 'routes', label: 'Itinéraires', icon: MapPin },
  { id: 'assign', label: 'Étudiants → Bus', icon: Users },
  { id: 'drivers', label: 'Chauffeurs', icon: UserPlus }, // ✅ NOUVEAU
]

export default function Transport() {
  const [activeTab, setActiveTab] = useState('trips')

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center">
          <Bus className="w-5 h-5 text-pink-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            Gestion du Transport
          </h2>
          <p className="text-sm text-purple-500">
            Gérez les bus, les chauffeurs et les itinéraires.
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-1 p-1 bg-pink-50/50 border border-pink-100 rounded-xl w-fit flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
              activeTab === id
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                : 'text-gray-500 hover:text-pink-600 hover:bg-pink-100/50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {activeTab === 'trips' && <TripList />}
        {activeTab === 'buses' && <BusList />}
        {activeTab === 'routes' && <RouteList />}
        {activeTab === 'assign' && <AssignStudents />}
        {activeTab === 'drivers' && <DriverAssignmentList />}
      </div>
    </div>
  )
}