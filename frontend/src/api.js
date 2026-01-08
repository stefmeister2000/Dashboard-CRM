import axios from 'axios';

const API_URL = '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, role) => api.post('/auth/register', { email, password, role }),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
  getApiKey: () => api.get('/auth/api-key'),
  generateApiKey: () => api.post('/auth/api-key/generate'),
  revokeApiKey: () => api.post('/auth/api-key/revoke')
};

// Clients API
export const clientsAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`)
};

// Notes API
export const notesAPI = {
  getByClientId: (clientId) => api.get(`/notes/client/${clientId}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`)
};

// Dashboard API
export const dashboardAPI = {
  getMetrics: (params) => api.get('/dashboard/metrics', { params }),
  getTimeline: (clientId) => api.get(`/dashboard/client/${clientId}/timeline`)
};

// Export API
export const exportAPI = {
  exportCSV: (params) => api.get('/export/clients.csv', { params, responseType: 'blob' })
};

// Businesses API
export const businessesAPI = {
  getAll: () => api.get('/businesses'),
  getById: (id) => api.get(`/businesses/${id}`),
  create: (data) => api.post('/businesses', data),
  update: (id, data) => api.put(`/businesses/${id}`, data),
  delete: (id) => api.delete(`/businesses/${id}`)
};

export default api;

