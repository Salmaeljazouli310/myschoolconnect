import api from './api'

export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }).then(r => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.post('/notifications/read-all').then(r => r.data),
}