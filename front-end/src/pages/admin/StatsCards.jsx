// front-end/src/components/admin/StatsCards.jsx
import React from 'react'
import { classService } from '../../services/class'
import { studentService } from '../../services/student'
import { useApiQuery } from '../../hooks/useApi'

export default function StatsCards() {
  const { data: classesData } = useApiQuery(['admin-classes-stats'], () => classService.getAll({ per_page: 100 }))
  const { data: studentsData } = useApiQuery(['admin-students-stats'], () => studentService.getAll({ per_page: 100 }))
  
  const stats = [
    { label: 'Classes', value: classesData?.data?.length || 0, icon: '🏫', color: 'bg-blue-500' },
    { label: 'Étudiants', value: studentsData?.data?.length || 0, icon: '👨‍🎓', color: 'bg-green-500' },
    { label: 'Enseignants', value: 0, icon: '👨‍🏫', color: 'bg-purple-500' },
    { label: 'Parents', value: 0, icon: '👪', color: 'bg-orange-500' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center text-white text-xl`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}