import { Check, CheckCheck } from 'lucide-react'

export default function MessageBubble({ message, currentUserId }) {
  const isOwn = message.sender_id === currentUserId
  
  const formatTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
        <div className={`rounded-2xl px-4 py-2 ${
          isOwn 
            ? 'bg-emerald-500 text-white' 
            : 'bg-navy-700 text-slate-200'
        }`}>
          <p className="text-sm break-words">{message.body}</p>
        </div>
        <div className={`flex items-center gap-1 mt-1 text-[10px] text-slate-500 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span>{formatTime(message.created_at)}</span>
          {isOwn && (
            message.is_read 
              ? <CheckCheck className="w-3 h-3 text-emerald-400" />
              : <Check className="w-3 h-3" />
          )}
        </div>
      </div>
    </div>
  )
}