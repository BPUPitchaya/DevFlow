import axios from 'axios';
import { useAuthStore } from './store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (data: any) => api.post('/api/auth/register', data),
};

export const standupsApi = {
  getStandups: (params?: any) => api.get('/api/standups', { params }),
  createStandup: (data: any) => api.post('/api/standups', data),
  addComment: (standupId: string, content: string) =>
    api.post(`/api/standups/${standupId}/comments`, { content }),
  addReaction: (standupId: string, emoji: string) =>
    api.post(`/api/standups/${standupId}/reactions`, { emoji }),
};

export const analyticsApi = {
  getVelocity: (params: any) => api.get('/api/analytics/velocity', { params }),
  getBottlenecks: (params: any) =>
    api.get('/api/analytics/bottlenecks', { params }),
};

export const teamsApi = {
  getTeams: () => api.get('/api/teams'),
  createTeam: (data: any) => api.post('/api/teams', data),
};
