import api from '../api/axios';

export const getProfile = () => api.get('/auth/me/').then((response) => response.data);
