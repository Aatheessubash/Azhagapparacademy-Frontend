/**
 * API Service
 * Axios configuration and API calls
 */

import axios from 'axios';

type ApiPayload = Record<string, unknown>;

// API base URL
const API_URL =
  import.meta.env.VITE_API_URL || 'https://azhagapparacademy-backend.onrender.com/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  
  getMe: () =>
    api.get('/auth/me'),
  
  updateProfile: (data: { name?: string; email?: string }) =>
    api.put('/auth/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),

  requestPasswordResetOtp: (email: string) =>
    api.post('/auth/forgot-password/request', { email }),

  resetPasswordWithOtp: (data: { email: string; otp: string; newPassword: string }) =>
    api.post('/auth/forgot-password/reset', data),
  
  setupAdmin: (data: { name?: string; email?: string; password?: string }) =>
    api.post('/auth/setup-admin', data)
};

// Course API
export const courseAPI = {
  getAll: (params?: { search?: string; status?: string }) =>
    api.get('/courses', { params }),
  
  getById: (id: string) =>
    api.get(`/courses/${id}`),
  
  create: (data: { title: string; description: string; price: number; quizEnabled?: boolean; youtubeEmbedUrl?: string }) =>
    api.post('/courses', data),
  
  update: (id: string, data: ApiPayload) =>
    api.put(`/courses/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/courses/${id}`),
  
  uploadQRCode: (id: string, file: File, adminPassword: string) => {
    const formData = new FormData();
    formData.append('qrCode', file);
    formData.append('adminPassword', adminPassword);
    return api.post(`/courses/${id}/qr-code`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  uploadThumbnail: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('thumbnail', file);
    return api.post(`/courses/${id}/thumbnail`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Level API
export const levelAPI = {
  getByCourse: (courseId: string) =>
    api.get(`/levels/course/${courseId}`),
  
  getById: (id: string) =>
    api.get(`/levels/${id}`),
  
  create: (data: { courseId: string; title: string; description?: string; levelNumber: number; quizEnabled?: boolean }) =>
    api.post('/levels', data),
  
  update: (id: string, data: ApiPayload) =>
    api.put(`/levels/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/levels/${id}`),
  
  uploadVideo: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post(`/levels/${id}/video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  setVideoLink: (id: string, url: string) =>
    api.put(`/levels/${id}/video-link`, { url }),
  
  getStreamUrl: (id: string) => {
    const token = localStorage.getItem('token');
    const tokenQuery = token ? `?token=${token}` : '';
    return `${API_URL}/levels/${id}/stream${tokenQuery}`;
  }
};

// Quiz API
export const quizAPI = {
  getByLevel: (levelId: string) =>
    api.get(`/quizzes/level/${levelId}`),
  
  create: (data: ApiPayload) =>
    api.post('/quizzes', data),
  
  update: (id: string, data: ApiPayload) =>
    api.put(`/quizzes/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/quizzes/${id}`),
  
  submit: (id: string, answers: { questionId: string; selectedAnswer: number }[]) =>
    api.post(`/quizzes/${id}/submit`, { answers })
};

// Payment API
export const paymentAPI = {
  getMyPayments: () =>
    api.get('/payments/my-payments'),
  
  getPending: () =>
    api.get('/payments/pending'),
  
  getAll: (params?: { status?: string }) =>
    api.get('/payments/all', { params }),
  
  getById: (id: string) =>
    api.get(`/payments/${id}`),
  
  submit: (data: { courseId: string; transactionId: string; amount?: number }, file: File) => {
    const formData = new FormData();
    formData.append('courseId', data.courseId);
    formData.append('transactionId', data.transactionId);
    if (data.amount) formData.append('amount', data.amount.toString());
    formData.append('proof', file);
    return api.post('/payments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  verify: (id: string, data: { status: 'approved' | 'rejected'; notes?: string; rejectionReason?: string }) =>
    api.post(`/payments/${id}/verify`, data),
  
  getStatus: (courseId: string) =>
    api.get(`/payments/course/${courseId}/status`)
};

// Progress API
export const progressAPI = {
  getMyProgress: () =>
    api.get('/progress/my-progress'),
  
  getByCourse: (courseId: string) =>
    api.get(`/progress/course/${courseId}`),
  
  completeLevel: (data: { courseId: string; levelId: string; videoWatchedPercent?: number }) =>
    api.post('/progress/level-complete', data),
  
  getNextLevel: (courseId: string) =>
    api.get(`/progress/course/${courseId}/next-level`)
};

// Admin API
export const adminAPI = {
  getDashboard: () =>
    api.get('/admin/dashboard'),
  
  getStudents: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/students', { params }),
  
  getStudentProgress: (studentId: string) =>
    api.get(`/admin/students/${studentId}/progress`),
  
  updateStudentStatus: (studentId: string, status: string) =>
    api.put(`/admin/students/${studentId}/status`, { status }),

  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    api.get('/admin/users', { params }),

  updateUserRole: (userId: string, role: 'student' | 'admin') =>
    api.put(`/admin/users/${userId}/role`, { role }),

  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`),
  
  getCourseDetails: (courseId: string) =>
    api.get(`/admin/courses/${courseId}/details`),
  
  getRevenue: (params?: { period?: string }) =>
    api.get('/admin/revenue', { params })
};

export default api;
