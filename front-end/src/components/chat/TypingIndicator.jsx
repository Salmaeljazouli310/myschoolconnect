import React from 'react';

export default function TypingIndicator({ userName }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-2xl w-fit animate-fade-in shadow-sm">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
        <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
      </div>
      <span className="text-xs text-gray-500">{userName} est en train d'écrire...</span>
    </div>
  );
}