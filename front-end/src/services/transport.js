import api from './api'

export const transportService = {
  getBuses: (params) => api.get('/admin/transport/buses', { params }).then(r => r.data),
  createBus: (data) => api.post('/admin/transport/buses', data).then(r => r.data),
  getRoutes: (params) => api.get('/admin/transport/routes', { params }).then(r => r.data),
  createRoute: (data) => api.post('/admin/transport/routes', data).then(r => r.data),
  getTrips: (params) => api.get('/admin/transport/trips', { params }).then(r => r.data),
  createTrip: (data) => api.post('/admin/transport/trips', data).then(r => r.data),
  assignStudent: (data) => api.post('/admin/transport/assign-student', data).then(r => r.data),
}