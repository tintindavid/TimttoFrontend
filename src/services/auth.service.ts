import axios, { AxiosInstance, AxiosError } from 'axios';
import api from './api';
import { ApiResponse } from '@/types/api.types';
import { User } from '@/types/user.types';
import { logger } from '@/utils/logger';

interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

class AuthService {
  async login(email: string, password: string, tenantId?: string): Promise<ApiResponse<LoginResponse>> {
    const headers: any = {};
    if (tenantId) headers['x-tenant-id'] = tenantId;
    // Call the backend directly on localhost:3000 (or use VITE_API_URL if provided)
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    const requestHeaders = { 'Content-Type': 'application/json', Accept: 'application/json', ...headers };
    const response = await axios.post<ApiResponse<LoginResponse>>(base + '/auth/login', { email, password }, { headers: requestHeaders });
    // save token/refreshToken if present
    logger.debug('Login response:', response.data);
    const token = response.data.data?.token;
    const refresh = response.data.data?.refreshToken;
    if (token) localStorage.setItem('token', token);
    if (refresh) localStorage.setItem('refreshToken', refresh);
    if (tenantId) localStorage.setItem('tenantId', tenantId);
    return response.data;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tenantId');
    window.location.href = '/login';
  }

  getToken() {
    return localStorage.getItem('token');
  }

  async refreshToken(refreshToken: string): Promise<string> {
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1');
    // Use a fresh axios instance without interceptors to avoid loops
    const client = axios.create({ baseURL: base, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } });
    const res = await client.post<ApiResponse<{ token: string }>>('/auth/refresh-token', { token: refreshToken });
    const newToken = res.data.data?.token;
    if (newToken) localStorage.setItem('token', newToken);
    return newToken;
  }

  async me(): Promise<ApiResponse<User>> {
    // Call backend directly to avoid dev-proxy mismatch on startup
    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const tenant = localStorage.getItem('tenantId');
    if (tenant) headers['x-tenant-id'] = tenant;

    const res = await axios.get<ApiResponse<User>>(base + '/auth/me', { headers });
    return res.data;
  }

  attachInterceptors(apiInstance: AxiosInstance) {
    let isRefreshing = false;
    let failedQueue: Array<{ resolve: (value?: any) => void; reject: (err: any) => void; config: any }> = [];

    const processQueue = (error: any, token: string | null = null) => {
      failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
      });
      failedQueue = [];
    };

    apiInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            this.logout();
            return Promise.reject(error);
          }

          if (isRefreshing) {
            return new Promise(function (resolve, reject) {
              failedQueue.push({ resolve, reject, config: originalRequest });
            })
              .then((token) => {
                originalRequest.headers['Authorization'] = 'Bearer ' + token;
                return apiInstance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          isRefreshing = true;

          try {
            const newToken = await this.refreshToken(refreshToken);
            processQueue(null, newToken);
            originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
            return apiInstance(originalRequest);
          } catch (err) {
            processQueue(err, null);
            this.logout();
            return Promise.reject(err);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }
}

export const authService = new AuthService();
