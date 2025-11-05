import axios from 'axios';

// 런타임 API URL 저장
let cachedApiUrl: string | null = null;

// 런타임에 설정을 가져오는 함수
async function getConfig(): Promise<string> {
  // 이미 캐시된 값이 있으면 재사용
  if (cachedApiUrl) {
    return cachedApiUrl;
  }

  try {
    const response = await fetch('/api/config', {
      cache: 'no-store', // 항상 최신 설정 가져오기
    });
    const config = await response.json();
    cachedApiUrl = config.apiUrl;
    return cachedApiUrl;
  } catch (error) {
    console.error('Failed to load config, using fallback:', error);
    cachedApiUrl = 'http://localhost:8080';
    return cachedApiUrl;
  }
}

// Axios 인스턴스 생성 (초기 baseURL은 fallback)
const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: 모든 요청 전에 최신 API URL 설정
api.interceptors.request.use(async (config) => {
  // 런타임 API URL 가져오기
  const apiUrl = await getConfig();
  config.baseURL = apiUrl;

  // JWT 토큰 추가
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

