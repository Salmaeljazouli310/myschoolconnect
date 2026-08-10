import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// Données temporaires (à remplacer par les vraies données API)
const MONTHLY_DATA = [
  { month: 'Août', posts: 12, messages: 34 },
  { month: 'Sep', posts: 28, messages: 72 },
  { month: 'Oct', posts: 19, messages: 55 },
  { month: 'Nov', posts: 35, messages: 91 },
  { month: 'Déc', posts: 22, messages: 63 },
  { month: 'Jan', posts: 41, messages: 108 },
]

const ROLE_DATA = [
  { name: 'Enseignants', value: 24, color: '#3b82f6' },
  { name: 'Parents', value: 156, color: '#06b6d4' },
  { name: 'Étudiants', value: 312, color: '#7c3aed' },
  { name: 'Chauffeurs', value: 8, color: '#f59e0b' },
]

const tooltipStyle = {
  backgroundColor: '#111428',
  border: '1px solid rgba(148,163,184,0.15)',
  borderRadius: '10px',
  fontSize: '12px',
  color: '#cbd5e1',
}

export default function Charts() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
      {/* Graphique en aires */}
      <div className="xl:col-span-3 card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-semibold text-slate-200">Activité Mensuelle</p>
            <p className="text-xs text-slate-500">Posts et messages dans le temps</p>
          </div>
          <span className="badge-blue badge">6 derniers mois</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={MONTHLY_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="posts" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="messages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: 'rgba(148,163,184,0.1)', strokeWidth: 1 }} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '12px' }} />
            <Area type="monotone" dataKey="posts" stroke="#3b82f6" strokeWidth={2} fill="url(#posts)" name="Posts" dot={false} />
            <Area type="monotone" dataKey="messages" stroke="#06b6d4" strokeWidth={2} fill="url(#messages)" name="Messages" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique circulaire */}
      <div className="xl:col-span-2 card p-5">
        <div className="mb-5">
          <p className="text-sm font-semibold text-slate-200">Utilisateurs par Rôle</p>
          <p className="text-xs text-slate-500">Distribution par rôle</p>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie
              data={ROLE_DATA}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={65}
              paddingAngle={3}
              dataKey="value"
            >
              {ROLE_DATA.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-3 space-y-2">
          {ROLE_DATA.map(({ name, value, color }) => (
            <div key={name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-slate-400">{name}</span>
              </div>
              <span className="font-mono text-slate-300">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}