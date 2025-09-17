const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

export const authAPI = {
  login: (username: string, password: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (userData: any) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

export const serversAPI = {
  getAll: () => apiCall('/servers'),
  create: (server: any) => apiCall('/servers', {
    method: 'POST',
    body: JSON.stringify(server),
  }),
  update: (id: number, server: any) => apiCall(`/servers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(server),
  }),
  delete: (id: number) => apiCall(`/servers/${id}`, {
    method: 'DELETE',
  }),
};

export const monitoringAPI = {
  getStatus: () => apiCall('/monitoring/status'),
  getHistory: (serverId: number, limit?: number) => 
    apiCall(`/monitoring/history/${serverId}${limit ? `?limit=${limit}` : ''}`),
};

export const restartAPI = {
  execute: (serverIds: number[]) => apiCall('/restart', {
    method: 'POST',
    body: JSON.stringify({ serverIds }),
  }),
};

export const logsAPI = {
  getRestartLogs: (page?: number, limit?: number) => 
    apiCall(`/logs/restart?page=${page || 1}&limit=${limit || 20}`),
  getMonitorLogs: (page?: number, limit?: number, serverId?: number) => 
    apiCall(`/logs/monitor?page=${page || 1}&limit=${limit || 50}${serverId ? `&serverId=${serverId}` : ''}`),
};

export const schedulerAPI = {
  getTasks: () => apiCall('/scheduler'),
  createTask: (task: any) => apiCall('/scheduler', {
    method: 'POST',
    body: JSON.stringify(task),
  }),
  cancelTask: (id: number) => apiCall(`/scheduler/${id}`, {
    method: 'DELETE',
  }),
};

export const usersAPI = {
  getAll: () => apiCall('/users'),
  update: (id: number, userData: any) => apiCall(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  }),
};