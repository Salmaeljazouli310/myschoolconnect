import api from './api'

export const postService = {
  getAll: (params) => api.get('/posts', { params }).then(r => r.data),
  getOne: (id) => api.get(`/posts/${id}`).then(r => r.data),
  approve: (id) => api.patch(`/posts/${id}/approve`).then(r => r.data),
  reject: (id, data) => api.patch(`/posts/${id}/reject`, data).then(r => r.data),
  delete: (id) => api.delete(`/posts/${id}`).then(r => r.data),
}