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

    // Extract userId from JWT for server-side logging
    const userId = getUserIdFromToken(token);
    if (userId) {
      config.headers['x-user-id'] = userId;
    }
  }

  // View-as takes precedence over own tenantId (D1: sessionStorage anti-contamination)
  const viewAsTenantId = sessionStorage.getItem('viewAsTenantId');
  const ownTenantId = localStorage.getItem('tenantId');
  const effectiveTenantId = viewAsTenantId || ownTenantId;
  if (effectiveTenantId && config.headers) {
    config.headers['x-tenant-id'] = effectiveTenantId;
  }

  // Si es FormData, eliminar Content-Type para que Axios lo configure automáticamente
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// Response interceptor: handle 428 MUST_CHANGE_PASSWORD globally
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (
      error.response?.status === 428 &&
      error.response?.data?.error?.code === 'MUST_CHANGE_PASSWORD'
    ) {
      window.location.href = '/change-password';
    }
    return Promise.reject(error);
  }
);

// Leave refresh-token logic to authService.attachInterceptors

export default api;
