import { Users, School, FileText, Bus, GraduationCap } from 'lucide-react'
import { StatCard, Skeleton } from '../UI'
import { useApiQuery } from '../../hooks/useApi'
import { userService, classService, postService, transportService } from '../../services/auth'

export default function StatsCards() {
  const { data: usersData, isLoading: u } = useApiQuery(['users-stats'], () => userService.getAll({ per_page: 1 }))
  const { data: classesData, isLoading: c } = useApiQuery(['classes-stats'], () => classService.getAll({ per_page: 1 }))
  const { data: postsData, isLoading: p } = useApiQuery(['posts-stats'], () => postService.getAll({ per_page: 1 }))
  const { data: pendingData, isLoading: pp } = useApiQuery(['posts-pending'], () => postService.getAll({ status: 'pending', per_page: 1 }))
  const { data: tripsData, isLoading: t } = useApiQuery(['trips-today'], () => transportService.getTrips({ today: true, per_page: 1 }))

  const total = usersData?.data?.total ?? '…'
  const classes = classesData?.data?.total ?? '…'
  const posts = postsData?.data?.total ?? '…'
  const pending = pendingData?.data?.total ?? 0
  const trips = tripsData?.data?.total ?? '…'

  if (u && c && p && t) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard label="Total Utilisateurs" value={total} icon={Users} color="blue" sub="Tous rôles confondus" />
      <StatCard label="Classes" value={classes} icon={School} color="cyan" sub="Classes actives" />
      <StatCard label="Posts" value={posts} icon={FileText} color="violet" sub={pending > 0 ? `${pending} en attente` : 'À jour'} />
      <StatCard label="Trajets Aujourd'hui" value={trips} icon={Bus} color="amber" sub="Prévus & en cours" />
    </div>
  )
}