import React from 'react';
import { ChatProvider } from '../../contexts/ChatContext';
import ChatLayout from '../../components/chat/ChatLayout';

export default function Messaging() {
  return (
    <ChatProvider>
      <div className="h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <ChatLayout />
      </div>
    </ChatProvider>
  );
}