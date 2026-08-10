import api from './api'

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
}