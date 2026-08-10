import api from './api'

export const classService = {
  getAll: (params) => api.get('/admin/classes', { params }).then(r => r.data),
  getOne: (id) => api.get(`/admin/classes/${id}`).then(r => r.data),
  create: (data) => api.post('/admin/classes', data).then(r => r.data),
  update: (id, data) => api.put(`/admin/classes/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/admin/classes/${id}`).then(r => r.data),
  getStudents: (id) => api.get(`/admin/classes/${id}/students`).then(r => r.data),
  
  // ✅ Méthode pour les enseignants
  getMyClasses: async () => {
    try {
      const response = await api.get('/teacher/classes')
      console.log('getMyClasses response:', response.data)
      return response.data
    } catch (error) {
      console.error('getMyClasses error:', error)
      return { data: [] }
    }
  },
}