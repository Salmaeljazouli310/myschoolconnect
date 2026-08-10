import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import { LogOut, MessageCircle } from 'lucide-react';

export default function ChatLayout() {
  const { user, logout } = useAuth();
  const { activeChat } = useChat();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Sidebar */}
      <div className={`w-96 bg-white/90 backdrop-blur-xl border-r border-pink-100 flex flex-col transition-all duration-300 z-10 ${activeChat ? 'hidden md:flex' : 'flex w-full md:w-96'}`}>
        {/* User Profile Header */}
        <div className="p-5 border-b border-pink-100 bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white text-lg font-bold shadow-md">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{user?.name}</h3>
                <p className="text-xs text-gray-500">
                  {user?.role === 'parent' ? 'Parent' : user?.role === 'teacher' ? 'Enseignant' : user?.role}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-pink-100 transition-all duration-200 text-gray-500 hover:text-red-500"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
        
        <Sidebar />
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatArea />
      </div>
    </div>
  );
}