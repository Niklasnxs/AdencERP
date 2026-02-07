// API Service for Backend Communication
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Set token in localStorage
export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Remove token from localStorage
export const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

// API request wrapper with auth
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      removeToken();
      sessionStorage.removeItem('user');
    }
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    apiRequest<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Users API
export const usersAPI = {
  getAll: () => apiRequest<any[]>('/users'),
  getById: (id: string) => apiRequest<any>(`/users/${id}`),
  create: (userData: any) =>
    apiRequest<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  update: (id: string, updates: any) =>
    apiRequest<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  delete: (id: string) =>
    apiRequest<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};

// Projects API
export const projectsAPI = {
  getAll: () => apiRequest<any[]>('/projects'),
  create: (projectData: any) =>
    apiRequest<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    }),
  update: (id: string, updates: any) =>
    apiRequest<any>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
};

// Customers API
export const customersAPI = {
  getAll: () => apiRequest<any[]>('/customers'),
  create: (customerData: any) =>
    apiRequest<any>('/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    }),
  update: (id: string, updates: any) =>
    apiRequest<any>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
};

// Tasks API
export const tasksAPI = {
  getAll: () => apiRequest<any[]>('/tasks'),
  create: (taskData: any) =>
    apiRequest<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
  update: (id: string, updates: any) =>
    apiRequest<any>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
};

// Time Logs API
export const timeLogsAPI = {
  getAll: (params?: { user_id?: string; date?: string; start_date?: string; end_date?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest<any[]>(`/timelogs${queryString}`);
  },
  create: (timeLogData: any) =>
    apiRequest<any>('/timelogs', {
      method: 'POST',
      body: JSON.stringify(timeLogData),
    }),
  update: (id: string, updates: any) =>
    apiRequest<any>(`/timelogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  delete: (id: string) =>
    apiRequest<{ message: string }>(`/timelogs/${id}`, {
      method: 'DELETE',
    }),
};

// Absences API
export const absencesAPI = {
  getAll: (params?: { user_id?: string; date?: string; start_date?: string; end_date?: string }) => {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiRequest<any[]>(`/absences${queryString}`);
  },
  create: (absenceData: any) =>
    apiRequest<any>('/absences', {
      method: 'POST',
      body: JSON.stringify(absenceData),
    }),
  update: (id: string, updates: any) =>
    apiRequest<any>(`/absences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  delete: (id: string) =>
    apiRequest<{ message: string }>(`/absences/${id}`, {
      method: 'DELETE',
    }),
  deleteByUserAndDate: (userId: string, date: string) =>
    apiRequest<{ message: string }>(`/absences/user/${userId}/date/${date}`, {
      method: 'DELETE',
    }),
};

// Notifications API
export const notificationsAPI = {
  getByUserId: (userId: string) => apiRequest<any[]>(`/notifications/${userId}`),
  markAsRead: (id: string) =>
    apiRequest<any>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
};
