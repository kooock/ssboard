import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth API
export const auth = {
  signup: (username: string, email: string, password: string) =>
    api.post('/api/auth/signup', { username, email, password }),
  
  login: (username: string, password: string) =>
    api.post('/api/auth/login', { username, password }),
};

// User API
export const users = {
  me: () => api.get('/api/users/me'),
  getAll: () => api.get('/api/users'),
  getById: (id: number) => api.get(`/api/users/${id}`),
  delete: (id: number) => api.delete(`/api/users/${id}`),
};

// Post API
export const posts = {
  getAll: (page = 0, size = 10, search?: string) => {
    const params: any = { page, size };
    if (search) params.search = search;
    return api.get('/api/posts', { params });
  },
  
  getById: (id: number) => api.get(`/api/posts/${id}`),
  
  create: (title: string, content: string) =>
    api.post('/api/posts', { title, content }),
  
  update: (id: number, title: string, content: string) =>
    api.put(`/api/posts/${id}`, { title, content }),
  
  delete: (id: number) => api.delete(`/api/posts/${id}`),
};

// Comment API
export const comments = {
  getByPostId: (postId: number) =>
    api.get(`/api/posts/${postId}/comments`),
  
  create: (postId: number, content: string, parentId?: number) =>
    api.post(`/api/posts/${postId}/comments`, { content, parentId }),
  
  delete: (postId: number, commentId: number) =>
    api.delete(`/api/posts/${postId}/comments/${commentId}`),
};

export default api;

