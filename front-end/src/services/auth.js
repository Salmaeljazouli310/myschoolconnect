import api from './api'

// ============ AUTH SERVICE ============
export const authService = {
  login: async ({ email, password }) => {
    const { data } = await api.post('/auth/login', { email, password })
    return data
  },
  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData)
    return data
  },
  me: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  },
}

// ============ USER SERVICE ============
export const userService = {
  getAll: (params) => api.get('/admin/users', { params }).then(r => r.data),
  getOne: (id) => api.get(`/admin/users/${id}`).then(r => r.data),
  create: (data) => api.post('/admin/users', data).then(r => r.data),
  update: (id, data) => api.put(`/admin/users/${id}`, data).then(r => r.data),
  toggle: (id) => api.patch(`/admin/users/${id}/toggle`).then(r => r.data),
  delete: (id) => api.delete(`/admin/users/${id}`).then(r => r.data),
  generateCodes: (data) => api.post('/admin/users/invitation-codes', data).then(r => r.data),
  updateAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
}

// ============ CLASS SERVICE ============
export const classService = {
  getAll: (params) => api.get('/admin/classes', { params }).then(r => r.data),
  getOne: (id) => api.get(`/admin/classes/${id}`).then(r => r.data),
  create: (data) => api.post('/admin/classes', data).then(r => r.data),
  update: (id, data) => api.put(`/admin/classes/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/admin/classes/${id}`).then(r => r.data),
  getStudents: (id) => api.get(`/admin/classes/${id}/students`).then(r => r.data),
  getMyClasses: () => api.get('/teacher/classes').then(r => r.data),
}

// ============ STUDENT SERVICE ============
export const studentService = {
  getAll: (params) => api.get('/admin/students', { params }).then(r => r.data),
  getOne: (id) => api.get(`/admin/students/${id}`).then(r => r.data),
  create: (data) => api.post('/admin/students', data).then(r => r.data),
  update: (id, data) => api.put(`/admin/students/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/admin/students/${id}`).then(r => r.data),
  getPoints: (id) => api.get(`/parent/students/${id}/points`).then(r => r.data),
  createPoints: (studentId, data) => api.post(`/teacher/students/${studentId}/points`, data).then(r => r.data),
  getStudentsByClass: (classId) => api.get(`/teacher/classes/${classId}/students`).then(r => r.data),
  
  importStudents: async (file, classId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (classId) formData.append('class_id', classId);
    
    const response = await api.post('/admin/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  exportStudents: async (classId = null) => {
    const params = classId ? { class_id: classId } : {};
    const response = await api.get('/admin/students/export', {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  downloadTemplate: async () => {
    try {
      const response = await api.get('/admin/students/template', {
        responseType: 'blob',
        headers: {
          'Accept': 'text/csv, application/octet-stream, */*'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Download template error:', error);
      throw error;
    }
  }
}

// ============ POST SERVICE ============
export const postService = {
  getAll: (params) => api.get('/posts', { params }).then(r => r.data),
  getOne: (id) => api.get(`/posts/${id}`).then(r => r.data),
  create: (formData) => api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
  update: (id, data) => api.put(`/posts/${id}`, data).then(r => r.data),
  approve: (id) => api.patch(`/posts/${id}/approve`).then(r => r.data),
  reject: (id, data) => api.patch(`/posts/${id}/reject`, data).then(r => r.data),
  delete: (id) => api.delete(`/posts/${id}`).then(r => r.data),
  submit: (id) => api.patch(`/posts/${id}/submit`).then(r => r.data),
}

// ============ TRANSPORT SERVICE (UNIQUE) ============
export const transportService = {
  // Admin Transport Management - Assignations
  getDriverAssignments: () => api.get('/admin/transport/driver-assignments').then(r => r.data),
  assignBusToDriver: (data) => api.post('/admin/transport/assign-bus-to-driver', data).then(r => r.data),
  assignClassToDriver: (data) => api.post('/admin/transport/assign-class-to-driver', data).then(r => r.data),
  deleteDriverAssignment: (id) => api.delete(`/admin/transport/driver-assignments/${id}`).then(r => r.data),
  assignStudentsToBus: (data) => api.post('/admin/transport/assign-students-bulk', data).then(r => r.data),
  // Admin Transport Management - Buses
  getBuses: (params) => api.get('/admin/transport/buses', { params }).then(r => r.data),
  createBus: (data) => api.post('/admin/transport/buses', data).then(r => r.data),
  
  // Admin Transport Management - Routes
  getRoutes: (params) => api.get('/admin/transport/routes', { params }).then(r => r.data),
  createRoute: (data) => api.post('/admin/transport/routes', data).then(r => r.data),
  
  // Admin Transport Management - Trips
  getTrips: (params) => api.get('/admin/transport/trips', { params }).then(r => r.data),
  createTrip: (data) => api.post('/admin/transport/trips', data).then(r => r.data),
  
  // Admin Transport Management - Student Assignment
  assignStudent: (data) => api.post('/admin/transport/assign-student', data).then(r => r.data),
  assignStudentsBulk: (data) => api.post('/admin/transport/assign-students-bulk', data).then(r => r.data),
  getAllStudentsTracking: () => api.get('/admin/all-students-tracking').then(r => r.data),
  
  // Admin Transport Management - Utilities
  getBusesWithRoutes: () => api.get('/admin/transport/buses-with-routes').then(r => r.data),
  getRoutesWithBuses: () => api.get('/admin/transport/routes-with-buses').then(r => r.data),
  
  // Driver Methods
  getDriverDashboard: () => api.get('/driver/dashboard').then(r => r.data),
  updateLocation: (data) => api.post('/driver/location', data).then(r => r.data),
  getMyBus: () => api.get('/driver/bus').then(r => r.data),
  getMyRoute: () => api.get('/driver/route').then(r => r.data),
  getMyCurrentTrip: () => api.get('/driver/my-trip').then(r => r.data),
  getDriverTrips: (params) => api.get('/driver/trips', { params }).then(r => r.data),
  updateTripStatus: (tripId, data) => api.patch(`/driver/trips/${tripId}/status`, data).then(r => r.data),
  getAssignedStudents: () => api.get('/driver/assigned-students').then(r => r.data),
  getAssignedStudentsByClass: () => api.get('/driver/assigned-students-by-class').then(r => r.data),
  startStudentTrip: (studentId, data) => api.post(`/driver/start-trip/${studentId}`, data).then(r => r.data),
  startStudentTripWithDetails: (studentId, data) => api.post(`/driver/start-trip/${studentId}`, data).then(r => r.data),
  endStudentTrip: (studentId) => api.post(`/driver/end-trip/${studentId}`).then(r => r.data),
  startClassTrip: () => api.post('/driver/start-class-trip').then(r => r.data),
  
  // Parent Notifications
  getNotifications: () => api.get('/transport/notifications').then(r => r.data),
  markNotificationRead: (id) => api.post(`/transport/notifications/${id}/read`).then(r => r.data),
  markAllNotificationsRead: () => api.post('/transport/notifications/read-all').then(r => r.data),
}

// ============ PARENT SERVICE ============
export const parentService = {
  getMyChildren: async () => {
    const { data } = await api.get('/parent/students')
    return data
  },
  getChildPoints: async (studentId) => {
    const { data } = await api.get(`/parent/students/${studentId}/points`)
    return data
  },
  getChildDetails: async (studentId) => {
    const { data } = await api.get(`/parent/students/${studentId}`)
    return data
  },
  getApprovedPosts: async () => {
    const { data } = await api.get('/posts', { 
      params: { status: 'approved', per_page: 50 } 
    })
    return data
  },
  getNotifications: async () => {
    const { data } = await api.get('/transport/notifications')
    return data
  },
  markNotificationRead: async (notificationId) => {
    const { data } = await api.post(`/transport/notifications/${notificationId}/read`)
    return data
  },
  markAllNotificationsRead: async () => {
    const { data } = await api.post('/transport/notifications/read-all')
    return data
  },
  getStudentTrip: async (studentId) => {
    const { data } = await api.get(`/parent/students/${studentId}/trip`)
    return data
  },
}

// ============ MESSAGING SERVICE ============
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

// ============ NOTIFICATION SERVICE ============
export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }).then(r => r.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.post('/notifications/read-all').then(r => r.data),
}