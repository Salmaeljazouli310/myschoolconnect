import { MessageSquare, Users } from 'lucide-react'

export default function ConversationList({ conversations, activeId, onSelect, isTeacher, isParent }) {
  const getInitials = (name) => {
    if (!name) return '?'
    return name.charAt(0).toUpperCase()
  }

  const formatTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const hours = (now - d) / (1000 * 60 * 60)
    
    if (hours < 24) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (hours < 48) {
      return 'Hier'
    } else {
      return d.toLocaleDateString()
    }
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-sm text-slate-400">Aucune conversation</p>
        <p className="text-xs text-slate-500 mt-1">
          {isTeacher 
            ? "Commencer une conversation avec un parent"
            : "Contactez l'enseignant de votre enfant"
          }
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map(conv => {
        const otherPerson = isTeacher ? conv.parent : conv.teacher
        const unreadCount = conv.unread_count || 0
        const isActive = activeId === conv.id
        
        return (
          <div
            key={conv.id}
            onClick={() => onSelect(conv)}
            className={`flex items-center gap-3 p-4 cursor-pointer transition-all hover:bg-navy-700/50 ${
              isActive ? 'bg-navy-700/60 border-l-2 border-emerald-500' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-emerald-300">
                {getInitials(otherPerson?.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {otherPerson?.name}
                </p>
                {conv.latest_message && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatTime(conv.latest_message.created_at)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">{conv.class?.name}</p>
              {conv.latest_message && (
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {conv.latest_message.body}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{unreadCount}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}