import axios, { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { ApiErrorResponse } from '@/types/api.types';
import { getUserIdFromToken } from '@/utils/token';

// Default to backend base URL for all environments per backend contract
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 10000,
});

// Request interceptor: attach token, tenant, and userId headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
    
    // Extraer userId del token JWT
    const userId = getUserIdFromToken(token);
    if (userId) {
      config.headers['x-user-id'] = userId;
    }
  }

  const tenant = localStorage.getItem('tenantId');
  if (tenant && config.headers) {
    config.headers['x-tenant-id'] = tenant;
  }

  // Si es FormData, eliminar Content-Type para que Axios lo configure automáticamente
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// Leave response interceptor to authService.attachInterceptors (refresh logic)

export default api;
