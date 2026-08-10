import { useRef, useEffect } from 'react'
import { Send, Paperclip, Phone, Info } from 'lucide-react'
import MessageBubble from './MessageBubble'

export default function ChatWindow({ conversation, messages, onSendMessage, currentUserId, isTeacher }) {
  const [messageInput, setMessageInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!messageInput.trim() || isSending) return
    setIsSending(true)
    await onSendMessage(messageInput)
    setMessageInput('')
    setIsSending(false)
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Sélectionnez une conversation</p>
        </div>
      </div>
    )
  }

  const otherPerson = isTeacher ? conversation.parent : conversation.teacher
  const getInitials = (name) => name?.charAt(0)?.toUpperCase() || '?'

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
            <span className="text-sm font-semibold text-emerald-300">
              {getInitials(otherPerson?.name)}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200">{otherPerson?.name}</h3>
            <p className="text-xs text-slate-500">{conversation.class?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-navy-700 rounded-lg transition-colors">
            <Phone className="w-4 h-4 text-slate-400" />
          </button>
          <button className="p-2 hover:bg-navy-700 rounded-lg transition-colors">
            <Info className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-slate-500">Aucun message pour le moment</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-700/40">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-navy-700 rounded-lg transition-colors">
            <Paperclip className="w-4 h-4 text-slate-400" />
          </button>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Écrivez votre message..."
            className="flex-1 input-field"
          />
          <button
            onClick={handleSend}
            disabled={!messageInput.trim() || isSending}
            className="btn-primary p-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}