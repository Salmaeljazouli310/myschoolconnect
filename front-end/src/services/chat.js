// front-end/src/services/chat.js
import api from './api';

export const getUsers = async () => {
  try {
    const response = await api.get('/messaging/contacts');
    console.log('API getUsers response:', response.data);
    
    // La réponse est directement un tableau
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    // Si la réponse est dans response.data.data
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Get users error:', error);
    return [];
  }
};