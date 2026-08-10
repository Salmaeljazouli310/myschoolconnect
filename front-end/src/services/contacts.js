// front-end/src/services/contacts.js
import api from './api';

export const getContactsForParent = async () => {
  try {
    console.log('Chargement des contacts pour parent...');
    const response = await api.get('/messaging/contacts');
    console.log('Réponse API:', response.data);
    
    // La réponse est directement un tableau d'enseignants
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Erreur lors du chargement des contacts:', error);
    return [];
  }
};

export const getContactsForTeacher = async () => {
  try {
    console.log('Chargement des contacts pour enseignant...');
    const response = await api.get('/messaging/contacts');
    console.log('Réponse API:', response.data);
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Erreur lors du chargement des contacts:', error);
    return [];
  }
};

export default {
  getContactsForParent,
  getContactsForTeacher
};