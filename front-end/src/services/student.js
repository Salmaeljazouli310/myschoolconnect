import api from './api'

export const studentService = {
  getAll: (params) => api.get('/admin/students', { params }).then(r => r.data),
  getOne: (id) => api.get(`/admin/students/${id}`).then(r => r.data),
  create: (data) => api.post('/admin/students', data).then(r => r.data),
  update: (id, data) => api.put(`/admin/students/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/admin/students/${id}`).then(r => r.data),
  getPoints: (id) => api.get(`/parent/students/${id}/points`).then(r => r.data),
  createPoints: (studentId, data) => api.post(`/teacher/students/${studentId}/points`, data).then(r => r.data),

  // IMPORT/EXPORT
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

  // ✅ FIXED: Download template
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
};