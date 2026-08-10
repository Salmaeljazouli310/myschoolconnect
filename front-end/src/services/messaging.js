import api from './api'

export const messagingService = {
  getContacts: async () => {
    const { data } = await api.get('/messaging/contacts')
    return data
  },
  getConversations: async () => {
    const { data } = await api.get('/messaging/conversations')
    return data
  },
  getMessages: async (conversationId) => {
    const { data } = await api.get(`/messaging/conversations/${conversationId}/messages`)
    return data
  },
  sendMessage: async (conversationId, messageData) => {
    const { data } = await api.post(`/messaging/conversations/${conversationId}/messages`, messageData)
    return data
  },
  startConversation: async (payload) => {
    const { data } = await api.post('/messaging/conversations', payload)
    return data
  },
  markAsRead: async (conversationId) => {
    const { data } = await api.post(`/messaging/conversations/${conversationId}/read`)
    return data
  },
}