import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import MessageBubble  from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import {
  Send, ArrowLeft, Paperclip,
  Loader, MessageSquare, Phone, Video, Info,
} from 'lucide-react';

export default function ChatArea() {
  const {
    activeChat, messages, sendMessage, handleTyping,
    typingUsers, messagesEndRef, setActiveChat, isLoading,
  } = useChat();
  const { user } = useAuth();

  const [newMessage, setNewMessage] = useState('');
  const [isSending,  setIsSending]  = useState(false);
  const inputRef     = useRef(null);
  const fileInputRef = useRef(null);

  // Focus input when conversation opens
  useEffect(() => {
    if (activeChat) inputRef.current?.focus();
  }, [activeChat]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const text = newMessage.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setNewMessage('');
    await sendMessage(text);
    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e) => {
    setNewMessage(e.target.value);
    if (e.target.value) handleTyping();
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <MessageSquare className="text-white" size={40} />
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">Messages</h2>
          <p className="text-gray-500">Sélectionnez une conversation pour commencer</p>
        </div>
      </div>
    );
  }

  const isTyping = typingUsers[activeChat.conversationId]?.isTyping;

  return (
    /*
     * KEY LAYOUT RULE (WhatsApp / Messenger style):
     * The outer div must be `flex flex-col` with a FIXED height (h-full or
     * flex-1 inside a flex parent that has a known height).
     * The messages area gets `flex-1 overflow-y-auto` so it scrolls internally
     * without ever making the page grow vertically.
     * The input bar has `flex-shrink-0` so it is always visible at the bottom.
     */
    <div className="flex-1 flex flex-col overflow-hidden bg-white">

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center gap-4 px-4 py-3
                      bg-white border-b border-gray-100 shadow-sm z-10">
        <button
          onClick={() => setActiveChat(null)}
          className="md:hidden p-2 rounded-xl hover:bg-pink-50 transition"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>

        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500
                            flex items-center justify-center text-white font-bold shadow">
              {activeChat.user?.name?.[0]?.toUpperCase()}
            </div>
            {activeChat.user?.is_online && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400
                               border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-800 leading-tight">{activeChat.user?.name}</p>
            <p className="text-xs text-gray-400">
              {activeChat.user?.role === 'teacher' ? 'Enseignant' : 'Parent'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 rounded-xl hover:bg-pink-50 transition">
            <Phone size={18} className="text-gray-400" />
          </button>
          <button className="p-2 rounded-xl hover:bg-pink-50 transition">
            <Video size={18} className="text-gray-400" />
          </button>
          <button className="p-2 rounded-xl hover:bg-pink-50 transition">
            <Info  size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* ── Messages — scrollable, fills remaining space ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1
                      bg-gradient-to-b from-gray-50/60 to-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="animate-spin text-pink-400" size={28} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center">
              <MessageSquare className="text-pink-400" size={22} />
            </div>
            <p className="text-gray-500 text-sm">Aucun message pour le moment</p>
            <p className="text-gray-400 text-xs">Envoyez le premier message 👋</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              // Use string comparison — avoids int vs string mismatch
              const isOwn      = String(msg.sender_id) === String(user?.id);
              const prevMsg    = messages[index - 1];
              const showAvatar = !isOwn && (
                index === 0 ||
                String(prevMsg?.sender_id) !== String(msg.sender_id)
              );
              return (
                <MessageBubble
                  key={String(msg.id)}
                  message={msg}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                />
              );
            })}
            {isTyping && <TypingIndicator userName={activeChat.user?.name} />}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ── Input — fixed at bottom ── */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-xl hover:bg-pink-100 transition text-gray-400 hover:text-pink-500 flex-shrink-0"
          >
            <Paperclip size={18} />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400
                       outline-none min-w-0"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newMessage.trim() || isSending}
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              !newMessage.trim() || isSending
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow hover:shadow-md hover:scale-105'
            }`}
          >
            {isSending
              ? <Loader size={16} className="animate-spin" />
              : <Send   size={16} />
            }
          </button>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" />
      </div>
    </div>
  );
}