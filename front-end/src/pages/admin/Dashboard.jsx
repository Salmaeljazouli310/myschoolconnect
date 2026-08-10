import { useAuth } from '../../contexts/AuthContext'
import { useApiQuery } from '../../hooks/useApi'
import { useState, useEffect } from 'react'
import { Users, School, MessageCircle, TrendingUp, Calendar, Bell, Award, Bus, PieChart, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

// Enregistrer les composants Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

export default function Dashboard() {
  const { user } = useAuth()
  const [greeting, setGreeting] = useState('')
  const [currentTime, setCurrentTime] = useState('')

  // Récupérer les statistiques
  const { data: studentsData } = useApiQuery(['dashboard-students'], () =>
    fetch('http://localhost:8000/api/v1/admin/students?per_page=1', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  )
  
  const { data: teachersData } = useApiQuery(['dashboard-teachers'], () =>
    fetch('http://localhost:8000/api/v1/admin/users?role=teacher&per_page=1', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  )
  
  const { data: classesData } = useApiQuery(['dashboard-classes'], () =>
    fetch('http://localhost:8000/api/v1/admin/classes?per_page=100', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  )
  
  const { data: studentsListData } = useApiQuery(['dashboard-students-list'], () =>
    fetch('http://localhost:8000/api/v1/admin/students?per_page=100', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  )

  const { data: postsData } = useApiQuery(['dashboard-posts'], () =>
    fetch('http://localhost:8000/api/v1/posts?per_page=5', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  )

  const { data: unreadCount } = useApiQuery(['dashboard-unread'], () =>
    fetch('http://localhost:8000/api/v1/notifications', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json()).then(data => ({ count: data?.unread_count || 0 }))
  )

  // Mettre à jour l'heure
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const hour = now.getHours()
      const greetingText = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
      setGreeting(greetingText)
      setCurrentTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const totalStudents = studentsData?.data?.total || 0
  const totalTeachers = teachersData?.data?.total || 0
  const totalClasses = classesData?.data?.total || 0
  const unreadMessages = unreadCount?.count || 0
  const recentPosts = postsData?.data?.data?.slice(0, 5) || []
  const classes = classesData?.data?.data || []
  const students = studentsListData?.data?.data || []

  // Calculer la répartition des étudiants par classe
  const studentsByClass = {}
  students.forEach(student => {
    const className = student.class?.name || 'Sans classe'
    studentsByClass[className] = (studentsByClass[className] || 0) + 1
  })

  // Données pour le diagramme circulaire (Pie Chart)
  const pieData = {
    labels: Object.keys(studentsByClass),
    datasets: [
      {
        label: 'Nombre d\'étudiants',
        data: Object.values(studentsByClass),
        backgroundColor: [
          '#f472b6', '#a855f7', '#c084fc', '#e879f9', 
          '#f0abfc', '#fbcfe8', '#fce7f3', '#fae8ff',
          '#d946ef', '#c026d3', '#a21caf', '#86198f'
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  }

  // Données pour le diagramme à barres (Bar Chart)
  const barData = {
    labels: classes.slice(0, 8).map(c => c.name),
    datasets: [
      {
        label: 'Étudiants par classe',
        data: classes.slice(0, 8).map(c => {
          return students.filter(s => s.class_id === c.id).length
        }),
        backgroundColor: 'rgba(244, 114, 182, 0.7)',
        borderColor: 'rgb(244, 114, 182)',
        borderWidth: 2,
        borderRadius: 10,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Répartition des étudiants par classe',
        font: { size: 14, weight: 'bold' },
      },
    },
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Distribution des étudiants',
        font: { size: 14, weight: 'bold' },
      },
    },
  }

  const stats = [
    {
      title: 'Élèves',
      value: totalStudents,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500',
      link: '/admin/students',
      iconBg: 'from-blue-400 to-cyan-400',
      subText: 'inscrits'
    },
    {
      title: 'Enseignants',
      value: totalTeachers,
      icon: School,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-500',
      link: '/admin/users?role=teacher',
      iconBg: 'from-green-400 to-emerald-400',
      subText: 'actifs'
    },
    {
      title: 'Classes',
      value: totalClasses,
      icon: Award,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500',
      link: '/admin/classes',
      iconBg: 'from-purple-400 to-pink-400',
      subText: 'niveaux'
    },
    
  ]

  return (
    <div className="space-y-6">
      {/* Carte de bienvenue */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-2xl p-6 shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">
                {greeting}, {user?.name?.split(' ')[0]} 👋
              </h2>
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs">{currentTime}</span>
            </div>
            <p className="text-white/80 mt-1">
              Voici ce qui se passe dans votre école aujourd'hui.
            </p>
            <div className="mt-3 flex gap-2">
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">🏫 Année scolaire 2024-2025</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">📅 {new Date().toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg">
            <span className="text-3xl">🏫</span>
          </div>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-2">{stat.subText}</p>
              </div>
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stat.iconBg} flex items-center justify-center shadow-md group-hover:scale-110 transition`}>
                <stat.icon className={`w-6 h-6 text-white`} />
              </div>
            </div>
            <div className="mt-3">
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full w-${Math.min(100, stat.value)}% bg-gradient-to-r ${stat.color} rounded-full`} style={{ width: `${Math.min(100, stat.value)}%` }}></div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagramme circulaire - Répartition des étudiants */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-pink-500" />
              <h3 className="font-semibold text-gray-800">Répartition des étudiants</h3>
            </div>
            <span className="text-xs text-gray-400">{totalStudents} étudiants au total</span>
          </div>
          <div className="h-80">
            {Object.keys(studentsByClass).length > 0 ? (
              <Pie data={pieData} options={pieOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* Diagramme à barres - Étudiants par classe */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-gray-800">Top 8 classes par effectif</h3>
            </div>
            <span className="text-xs text-gray-400">{totalClasses} classes au total</span>
          </div>
          <div className="h-80">
            {classes.length > 0 ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deux colonnes : Classes récentes et Actualités */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des classes */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-800">Classes récentes</h3>
            </div>
            <Link to="/admin/classes" className="text-xs text-green-500 hover:text-green-600">Voir tout →</Link>
          </div>
          <div className="space-y-3">
            {classes.slice(0, 5).map((classe, index) => (
              <div key={classe.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-sm transition">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center">
                    <span className="text-lg">📚</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{classe.name}</p>
                    <p className="text-xs text-gray-400">{classe.grade} • {classe.section || 'Section A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-purple-600">
                    {students.filter(s => s.class_id === classe.id).length} élèves
                  </p>
                  <p className="text-xs text-gray-400">
                    Prof: {classe.teacher?.name?.split(' ')[0] || 'Non assigné'}
                  </p>
                </div>
              </div>
            ))}
            {classes.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>Aucune classe créée</p>
              </div>
            )}
          </div>
        </div>

        {/* Actualités récentes */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Actualités récentes</h3>
            </div>
            <Link to="/admin/posts" className="text-xs text-orange-500 hover:text-orange-600">Voir tout →</Link>
          </div>
          <div className="space-y-3">
            {recentPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune actualité récente</p>
              </div>
            ) : (
              recentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-purple-600">
                      {post.author?.name?.[0]?.toUpperCase() || '📢'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{post.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {post.author?.name} • {new Date(post.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    post.status === 'approved' ? 'bg-green-100 text-green-600' :
                    post.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {post.status === 'approved' ? 'Publié' : post.status === 'pending' ? 'En attente' : 'Brouillon'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section résumé rapide */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Résumé rapide</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-pink-500">{totalStudents}</p>
            <p className="text-xs text-gray-500">Étudiants</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{totalTeachers}</p>
            <p className="text-xs text-gray-500">Enseignants</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-500">{totalClasses}</p>
            <p className="text-xs text-gray-500">Classes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">
              {Object.keys(studentsByClass).length}
            </p>
            <p className="text-xs text-gray-500">Groupes</p>
          </div>
        </div>
      </div>
    </div>
  )
}