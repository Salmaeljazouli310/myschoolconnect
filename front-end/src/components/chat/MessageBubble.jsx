import React from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, AlertCircle } from 'lucide-react';

export default function MessageBubble({ message, isOwn, showAvatar }) {
  return (
    <div className={`flex gap-2 animate-fade-in ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
          {message.sender?.name?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      
      <div className={`max-w-[70%] ${!isOwn && !showAvatar ? 'ml-10' : ''}`}>
        {!isOwn && showAvatar && (
          <div className="text-xs font-medium text-gray-500 mb-1 ml-1">
            {message.sender?.name}
          </div>
        )}
        
        <div className={`
          relative px-4 py-2.5 rounded-2xl shadow-sm
          ${isOwn 
            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-br-md' 
            : 'bg-white text-gray-800 rounded-bl-md shadow-md'
          }
          ${message.failed ? 'opacity-70' : ''}
        `}>
          <p className="text-sm leading-relaxed break-words">{message.body || message.content}</p>
          
          <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
            <span className="text-xs">
              {format(new Date(message.created_at), 'HH:mm')}
            </span>
            {isOwn && (
              <span className="text-xs">
                {message.failed ? (
                  <AlertCircle size={12} className="text-red-300" />
                ) : message.is_read ? (
                  <CheckCheck size={12} className="text-green-300" />
                ) : (
                  <Check size={12} />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}