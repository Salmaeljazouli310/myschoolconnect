import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Search, MessageSquare, Users, UserCircle, Loader, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Sidebar() {
  const { conversations, users, activeChat, openChat, loadingUsers } = useChat();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats');

  const filteredConversations = conversations.filter(conv =>
    conv.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSearchPlaceholder = () => {
    if (activeTab === 'chats') {
      return 'Rechercher une conversation...';
    }
    return user?.role === 'parent' ? 'Rechercher un enseignant...' : 'Rechercher un parent...';
  };

  const getContactsHeader = () => {
    return user?.role === 'parent' ? 'Mes Enseignants' : 'Tous les Parents';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-2 p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'chats' 
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md' 
              : 'bg-white/50 text-gray-600 hover:bg-pink-100'
          }`}
        >
          <MessageSquare size={18} />
          <span>Messages</span>
          {conversations.filter(c => c.unread_count > 0).length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {conversations.filter(c => c.unread_count > 0).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'contacts' 
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md' 
              : 'bg-white/50 text-gray-600 hover:bg-pink-100'
          }`}
        >
          <Users size={18} />
          <span>{getContactsHeader()}</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-pink-100 bg-white/40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400" size={18} />
          <input
            type="text"
            placeholder={getSearchPlaceholder()}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/60 backdrop-blur-sm border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTab === 'chats' ? (
          // Conversations List
          filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => openChat(conv.participant, conv.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  activeChat?.conversationId === conv.id
                    ? 'bg-gradient-to-r from-pink-100 to-purple-100 shadow-md'
                    : 'hover:bg-white/60'
                }`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                    {conv.participant?.name?.[0]?.toUpperCase()}
                  </div>
                  {conv.participant?.is_online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800 truncate">{conv.participant?.name}</h4>
                    {conv.latest_message?.created_at && (
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(conv.latest_message.created_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-500 truncate">
                      {conv.latest_message?.body || 'Aucun message'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="px-2 py-0.5 text-xs font-semibold text-white bg-pink-500 rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto text-pink-300 mb-3" size={48} />
              <p className="text-gray-500">Aucune conversation</p>
              <p className="text-xs text-gray-400 mt-1">
                {user?.role === 'teacher' 
                  ? 'Commencez une conversation avec un parent'
                  : 'Commencez une conversation avec un enseignant'}
              </p>
            </div>
          )
        ) : (
          // Contacts Tab
          loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-pink-500" size={32} />
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-2">
              {filteredUsers.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white/60 rounded-xl p-3 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                        {contact.name?.[0]?.toUpperCase()}
                      </div>
                      {contact.is_online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{contact.name}</h4>
                      <p className="text-xs text-gray-500">
                        {user?.role === 'parent' ? 'Enseignant' : 'Parent'}
                      </p>
                      {/* Show children names for teacher view */}
                      {user?.role === 'teacher' && contact.children_names && contact.children_names.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-400">
                            Enfant(s): {contact.children_names.join(', ')}
                          </p>
                        </div>
                      )}
                      {/* Show class name for parent view */}
                      {user?.role === 'parent' && contact.class_name && (
                        <p className="text-xs text-gray-400 mt-1">
                          Classe: {contact.class_name}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => openChat(contact)}
                      className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm rounded-lg hover:scale-105 transition flex items-center gap-1"
                    >
                      <Send size={14} />
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserCircle className="mx-auto text-pink-300 mb-3" size={48} />
              <p className="text-gray-500">Aucun contact trouvé</p>
              <p className="text-xs text-gray-400 mt-1">
                {user?.role === 'parent' 
                  ? 'Aucun enseignant associé à vos enfants. Veuillez contacter l\'administration.'
                  : 'Aucun parent associé à vos élèves. Les parents seront affichés ici lorsque leurs enfants seront dans vos classes.'}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}