import { useAuth } from '../../contexts/AuthContext'
import { useApiQuery } from '../../hooks/useApi'
import { parentService } from '../../services/auth'
import { RefreshCw, Award, Star, Trophy, Heart, ChevronDown, ChevronUp, BookOpen, Headphones, BookMarked } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function Children() {
  const { user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [childrenDataPoints, setChildrenDataPoints] = useState({})
  const [expandedChild, setExpandedChild] = useState(null)
  const [loadingPoints, setLoadingPoints] = useState(false)

  // Récupérer les enfants
  const { data: childrenData, isLoading, refetch: refetchChildren } = useApiQuery(
    ['parent-children'],
    () => parentService.getMyChildren()
  )
  const children = childrenData?.data?.data || []

  // Fonction pour récupérer les points
  const fetchChildPoints = async (childId) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8000/api/v1/parent/students/${childId}/task-points`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data?.success) {
        return {
          total: data.grand_total || 0,
          tasks: data.tasks || []
        }
      }
      return { total: 0, tasks: [] }
    } catch (error) {
      console.error('Erreur:', error)
      return { total: 0, tasks: [] }
    }
  }

  // Charger les points
  useEffect(() => {
    const loadAllPoints = async () => {
      if (children.length === 0) return
      setLoadingPoints(true)
      const pointsMap = {}
      for (const child of children) {
        pointsMap[child.id] = await fetchChildPoints(child.id)
      }
      setChildrenDataPoints(pointsMap)
      setLoadingPoints(false)
    }
    loadAllPoints()
  }, [children])

  const handleRefresh = async () => {
    setRefreshing(true)
    await refetchChildren()
    const pointsMap = {}
    for (const child of children) {
      pointsMap[child.id] = await fetchChildPoints(child.id)
    }
    setChildrenDataPoints(pointsMap)
    setRefreshing(false)
    toast.success('Données mises à jour')
  }

  const toggleExpand = (childId) => {
    setExpandedChild(expandedChild === childId ? null : childId)
  }

  const getTaskIcon = (icon) => {
    const icons = {
      '📚': <BookOpen className="w-4 h-4" />,
      '📖': <BookMarked className="w-4 h-4" />,
      '👂': <Headphones className="w-4 h-4" />,
      '🙋': <Heart className="w-4 h-4" />
    }
    return icons[icon] || <Star className="w-4 h-4" />
  }

  const getTaskColor = (color) => {
    const colors = {
      'emerald': 'from-pink-400 to-rose-500',
      'blue': 'from-pink-300 to-purple-400',
      'cyan': 'from-rose-400 to-pink-500',
      'yellow': 'from-pink-200 to-rose-400'
    }
    return colors[color] || 'from-pink-400 to-purple-500'
  }

  const getTaskBg = (color) => {
    const colors = {
      'emerald': 'from-pink-50 to-rose-50',
      'blue': 'from-pink-50 to-purple-50',
      'cyan': 'from-rose-50 to-pink-50',
      'yellow': 'from-pink-50 to-rose-50'
    }
    return colors[color] || 'from-pink-50 to-purple-50'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-pink-600 font-medium">Chargement...</p>
        </div>
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur rounded-2xl p-8 text-center max-w-sm shadow-xl border border-pink-100">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun enfant</h2>
          <p className="text-gray-500">Aucun enfant n'est lié à votre compte parent.</p>
          <p className="text-sm text-gray-400 mt-2">Contactez l'administration</p>
        </div>
      </div>
    )
  }

  const totalClassPoints = Object.values(childrenDataPoints).reduce((sum, data) => sum + (data?.total || 0), 0)
  const averageClass = children.length > 0 ? (totalClassPoints / children.length).toFixed(1) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-8">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-pink-100 sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-pink-500" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  Mes Enfants
                </h1>
              </div>
              <p className="text-xs text-pink-500 mt-1">✨ Suivez les performances de vos enfants ✨</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105"
            >
              <RefreshCw className={`w-5 h-5 text-pink-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Statistique globale */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-4 mb-6 shadow-lg">
          <div className="flex justify-between items-center text-white">
            <div>
              <p className="text-xs opacity-80">Total des points</p>
              <p className="text-2xl font-bold">{totalClassPoints}</p>
            </div>
            <div className="text-center">
              <p className="text-xs opacity-80">Moyenne générale</p>
              <p className="text-2xl font-bold">{averageClass}</p>
              <p className="text-xs">/20</p>
            </div>
            <div>
              <p className="text-xs opacity-80">Enfants</p>
              <p className="text-2xl font-bold">{children.length}</p>
            </div>
          </div>
        </div>

        {/* Liste des enfants */}
        <div className="space-y-4">
          {children.map((child) => {
            const childPoints = childrenDataPoints[child.id]
            const totalPoints = childPoints?.total || 0
            const tasks = childPoints?.tasks || []
            const maxTotal = 40
            const percentage = (totalPoints / maxTotal) * 100
            const average = (totalPoints / maxTotal) * 20
            const isExpanded = expandedChild === child.id

            return (
              <div
                key={child.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-pink-100 overflow-hidden"
              >
                {/* Carte principale */}
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center shadow-md">
                      <span className="text-3xl">
                        {child.first_name?.[0]?.toUpperCase() === 'A' ? '👦' : '👧'}
                      </span>
                    </div>
                    
                    {/* Infos */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">
                        {child.first_name} {child.last_name}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="text-xs px-2 py-1 bg-pink-100 text-pink-700 rounded-full">
                          {child.class?.name || 'Classe'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          Code: {child.student_code}
                        </span>
                      </div>
                    </div>
                    
                    {/* Points */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 bg-pink-100 rounded-full px-3 py-1">
                        <Star className="w-3 h-3 text-pink-500 fill-pink-500" />
                        <span className="font-bold text-pink-700">{totalPoints}</span>
                        <span className="text-xs text-pink-500">/40</span>
                      </div>
                      <button
                        onClick={() => toggleExpand(child.id)}
                        className="mt-2 text-xs text-pink-500 hover:text-pink-700 flex items-center gap-1 mx-auto"
                      >
                        {isExpanded ? '▲ Masquer' : '▼ Voir détails'}
                      </button>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progression</span>
                      <span>{average.toFixed(1)}/20</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Détails expansibles */}
                {isExpanded && (
                  <div className="border-t border-pink-100 bg-gradient-to-br from-pink-50 to-purple-50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-4 h-4 text-pink-500" />
                      <h4 className="font-semibold text-gray-700 text-sm">Détail des points par tâche</h4>
                    </div>
                    
                    {tasks.length === 0 ? (
                      <div className="text-center py-4 text-gray-400 text-sm bg-white/50 rounded-xl">
                        📝 Aucune note pour le moment
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tasks.map((task) => {
                          const obtained = task.points_obtained || 0
                          const maxPoints = task.max_points || 10
                          const pourcentage = (obtained / maxPoints) * 100
                          
                          return (
                            <div 
                              key={task.task_id} 
                              className={`bg-gradient-to-r ${getTaskBg(task.task_color)} rounded-xl p-3 shadow-sm border border-pink-100`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                  <div className={`w-7 h-7 rounded-full bg-gradient-to-r ${getTaskColor(task.task_color)} flex items-center justify-center text-white shadow-sm`}>
                                    {getTaskIcon(task.task_icon)}
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">
                                    {task.task_name}
                                  </span>
                                </div>
                                <span className={`text-sm font-bold ${
                                  obtained >= 8 ? 'text-pink-600' : 
                                  obtained >= 5 ? 'text-purple-600' : 
                                  'text-rose-500'
                                }`}>
                                  {obtained}/{maxPoints}
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full bg-gradient-to-r ${getTaskColor(task.task_color)} rounded-full transition-all duration-500`}
                                  style={{ width: `${pourcentage}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Message d'encouragement */}
                    {totalPoints > 0 && (
                      <div className={`mt-3 text-center text-xs rounded-lg p-2 ${
                        average >= 15 ? 'bg-pink-100 text-pink-700' :
                        average >= 10 ? 'bg-purple-100 text-purple-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {average >= 15 && '🏆 Exceptionnel ! Continue comme ça !'}
                        {average >= 10 && average < 15 && '👍 Bon travail ! Tu progresses bien !'}
                        {average < 10 && '💪 Courage ! Chaque effort compte !'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Loading overlay pour les points */}
        {loadingPoints && (
          <div className="fixed bottom-4 right-4 bg-white rounded-full shadow-lg p-2">
            <div className="w-5 h-5 border-2 border-pink-300 border-t-pink-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  )
}