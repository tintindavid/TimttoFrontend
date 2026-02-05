# API Integration Guide

Este documento explica cómo consumir el backend API desde el frontend React.

---

## 🌐 Configuración Base

### Variables de Entorno
```env
# .env.local
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Mantenimiento Biomédico
```

### Configuración de Axios
```typescript
// src/services/api.ts
import axios, { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Crear instancia de Axios
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Request Interceptor - Agregar token
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

// Response Interceptor - Manejar errores globales
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const { response } = error;

    // Sin respuesta del servidor (red caída, timeout)
    if (!response) {
      toast.error('Error de conexión. Verifica tu internet');
      return Promise.reject(error);
    }

    // Token expirado o inválido
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Sesión expirada. Por favor inicia sesión nuevamente');
      return Promise.reject(error);
    }

    // Forbidden
    if (response.status === 403) {
      toast.error('No tienes permisos para realizar esta acción');
      return Promise.reject(error);
    }

    // Rate limit
    if (response.status === 429) {
      toast.error('Demasiadas solicitudes. Intenta nuevamente en unos minutos');
      return Promise.reject(error);
    }

    // Server error
    if (response.status >= 500) {
      toast.error('Error del servidor. Intenta nuevamente más tarde');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
```

---

## 📝 Tipos TypeScript

### Tipos de Respuesta del Backend
```typescript
// src/types/api.types.ts

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  pagination?: PaginationInfo;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: any;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}
```

### Tipos de Entidades
```typescript
// src/types/user.types.ts
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'user';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'technician' | 'user';
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  role?: 'admin' | 'technician' | 'user';
}

// src/types/equipment.types.ts
export interface Equipment {
  _id: string;
  name: string;
  code: string;
  serialNumber: string;
  category: Category | string;
  location: Location | string;
  status: 'active' | 'inactive' | 'maintenance';
  acquisitionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentDto {
  name: string;
  code: string;
  serialNumber: string;
  categoryId: string;
  locationId: string;
  status: 'active' | 'inactive' | 'maintenance';
  acquisitionDate: string;
}
```

---

## 🔧 Servicios API

### Plantilla Base de Servicio
```typescript
// src/services/base.service.ts
import { api } from './api';
import { ApiResponse, QueryParams } from '@/types';

export class BaseService<T, CreateDto, UpdateDto> {
  constructor(private endpoint: string) {}

  async getAll(params?: QueryParams): Promise<ApiResponse<T[]>> {
    const response = await api.get<ApiResponse<T[]>>(this.endpoint, { params });
    return response.data;
  }

  async getById(id: string, populate?: string[]): Promise<ApiResponse<T>> {
    const params = populate ? { populate: populate.join(',') } : undefined;
    const response = await api.get<ApiResponse<T>>(`${this.endpoint}/${id}`, { params });
    return response.data;
  }

  async create(data: CreateDto): Promise<ApiResponse<T>> {
    const response = await api.post<ApiResponse<T>>(this.endpoint, data);
    return response.data;
  }

  async update(id: string, data: UpdateDto): Promise<ApiResponse<T>> {
    const response = await api.put<ApiResponse<T>>(`${this.endpoint}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`${this.endpoint}/${id}`);
    return response.data;
  }
}
```

### Servicios Específicos
```typescript
// src/services/user.service.ts
import { BaseService } from './base.service';
import { User, CreateUserDto, UpdateUserDto } from '@/types';

class UserService extends BaseService<User, CreateUserDto, UpdateUserDto> {
  constructor() {
    super('/users');
  }

  // Métodos adicionales específicos de usuarios
  async changePassword(id: string, oldPassword: string, newPassword: string) {
    const response = await api.post(`/users/${id}/change-password`, {
      oldPassword,
      newPassword,
    });
    return response.data;
  }

  async resetPassword(id: string) {
    const response = await api.post(`/users/${id}/reset-password`);
    return response.data;
  }
}

export const userService = new UserService();

// src/services/equipment.service.ts
import { BaseService } from './base.service';
import { Equipment, CreateEquipmentDto, UpdateEquipmentDto } from '@/types';

class EquipmentService extends BaseService<Equipment, CreateEquipmentDto, UpdateEquipmentDto> {
  constructor() {
    super('/equipment');
  }

  // Métodos adicionales
  async getByCategory(categoryId: string) {
    const response = await api.get(`/equipment?categoryId=${categoryId}`);
    return response.data;
  }

  async calibrate(id: string, calibrationData: any) {
    const response = await api.post(`/equipment/${id}/calibrate`, calibrationData);
    return response.data;
  }
}

export const equipmentService = new EquipmentService();

// src/services/auth.service.ts
import { api } from './api';
import { ApiResponse } from '@/types';

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

class AuthService {
  async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(data: any): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/register', data);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string }>> {
    const response = await api.post<ApiResponse<{ token: string }>>('/auth/refresh-token', {
      refreshToken,
    });
    return response.data;
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
}

export const authService = new AuthService();
```

---

## 🪝 Custom Hooks con React Query

### Hook Base
```typescript
// src/hooks/useApi.ts
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { ApiResponse, QueryParams } from '@/types';

// Hook genérico para GET lista
export function useGetList<T>(
  queryKey: string[],
  serviceFn: (params?: QueryParams) => Promise<ApiResponse<T[]>>,
  params?: QueryParams,
  options?: UseQueryOptions<ApiResponse<T[]>>
) {
  return useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => serviceFn(params),
    keepPreviousData: true,
    ...options,
  });
}

// Hook genérico para GET by ID
export function useGetById<T>(
  queryKey: string[],
  serviceFn: (id: string) => Promise<ApiResponse<T>>,
  id: string,
  options?: UseQueryOptions<ApiResponse<T>>
) {
  return useQuery({
    queryKey: [...queryKey, id],
    queryFn: () => serviceFn(id),
    enabled: !!id,
    ...options,
  });
}

// Hook genérico para CREATE
export function useCreate<T, CreateDto>(
  queryKey: string[],
  serviceFn: (data: CreateDto) => Promise<ApiResponse<T>>,
  successMessage: string = 'Creado exitosamente'
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: serviceFn,
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);
      toast.success(successMessage);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear';
      toast.error(message);
    },
  });
}

// Hook genérico para UPDATE
export function useUpdate<T, UpdateDto>(
  queryKey: string[],
  serviceFn: (id: string, data: UpdateDto) => Promise<ApiResponse<T>>,
  successMessage: string = 'Actualizado exitosamente'
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDto }) => serviceFn(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(queryKey);
      queryClient.invalidateQueries([...queryKey, variables.id]);
      toast.success(successMessage);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar';
      toast.error(message);
    },
  });
}

// Hook genérico para DELETE
export function useDelete<T>(
  queryKey: string[],
  serviceFn: (id: string) => Promise<ApiResponse<null>>,
  successMessage: string = 'Eliminado exitosamente'
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: serviceFn,
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);
      toast.success(successMessage);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al eliminar';
      toast.error(message);
    },
  });
}
```

### Hooks Específicos
```typescript
// src/hooks/useUsers.ts
import { userService } from '@/services/user.service';
import { User, CreateUserDto, UpdateUserDto } from '@/types';
import { useGetList, useGetById, useCreate, useUpdate, useDelete } from './useApi';
import { QueryParams } from '@/types';

export const useUsers = (params?: QueryParams) => {
  return useGetList<User>(
    ['users'],
    userService.getAll.bind(userService),
    params
  );
};

export const useUser = (id: string) => {
  return useGetById<User>(
    ['users'],
    userService.getById.bind(userService),
    id
  );
};

export const useCreateUser = () => {
  return useCreate<User, CreateUserDto>(
    ['users'],
    userService.create.bind(userService),
    'Usuario creado exitosamente'
  );
};

export const useUpdateUser = () => {
  return useUpdate<User, UpdateUserDto>(
    ['users'],
    userService.update.bind(userService),
    'Usuario actualizado exitosamente'
  );
};

export const useDeleteUser = () => {
  return useDelete<User>(
    ['users'],
    userService.delete.bind(userService),
    'Usuario eliminado exitosamente'
  );
};

// src/hooks/useEquipment.ts
import { equipmentService } from '@/services/equipment.service';
import { Equipment, CreateEquipmentDto, UpdateEquipmentDto } from '@/types';
import { useGetList, useGetById, useCreate, useUpdate, useDelete } from './useApi';

export const useEquipment = (params?: QueryParams) => {
  return useGetList<Equipment>(
    ['equipment'],
    equipmentService.getAll.bind(equipmentService),
    params
  );
};

export const useEquipmentItem = (id: string) => {
  return useGetById<Equipment>(
    ['equipment'],
    equipmentService.getById.bind(equipmentService),
    id
  );
};

export const useCreateEquipment = () => {
  return useCreate<Equipment, CreateEquipmentDto>(
    ['equipment'],
    equipmentService.create.bind(equipmentService),
    'Equipo creado exitosamente'
  );
};

export const useUpdateEquipment = () => {
  return useUpdate<Equipment, UpdateEquipmentDto>(
    ['equipment'],
    equipmentService.update.bind(equipmentService),
    'Equipo actualizado exitosamente'
  );
};

export const useDeleteEquipment = () => {
  return useDelete<Equipment>(
    ['equipment'],
    equipmentService.delete.bind(equipmentService),
    'Equipo eliminado exitosamente'
  );
};
```

---

## 💡 Ejemplos de Uso en Componentes

### Lista con Paginación
```typescript
// pages/Users/UsersPage.tsx
import { useState } from 'react';
import { useUsers, useDeleteUser } from '@/hooks/useUsers';
import { DataTable } from '@/components/common/DataTable';
import { SearchBar } from '@/components/common/SearchBar';
import { Pagination } from '@/components/common/Pagination';

export const UsersPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useUsers({ page, limit: 10, search });
  const deleteMutation = useDeleteUser();

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Error al cargar usuarios" />;

  return (
    <Container>
      <h1>Usuarios</h1>
      <SearchBar value={search} onSearch={setSearch} />
      
      <DataTable
        data={data?.data || []}
        columns={userColumns}
        actions={(user) => (
          <Button size="sm" variant="danger" onClick={() => handleDelete(user._id)}>
            Eliminar
          </Button>
        )}
      />

      {data?.pagination && (
        <Pagination
          {...data.pagination}
          onPageChange={setPage}
        />
      )}
    </Container>
  );
};
```

### Formulario con Validación
```typescript
// pages/Users/UserFormPage.tsx
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useUser, useCreateUser, useUpdateUser } from '@/hooks/useUsers';
import { userSchema } from '@/schemas/user.schema';

export const UserFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const { data: user } = useUser(id || '');
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(userSchema),
  });

  useEffect(() => {
    if (user?.data) {
      reset(user.data);
    }
  }, [user, reset]);

  const onSubmit = async (data: any) => {
    try {
      if (isEditMode) {
        await updateMutation.mutateAsync({ id: id!, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      navigate('/users');
    } catch (error) {
      // Error ya manejado por el hook
    }
  };

  return (
    <Container>
      <h1>{isEditMode ? 'Editar Usuario' : 'Crear Usuario'}</h1>
      <Form onSubmit={handleSubmit(onSubmit)}>
        {/* Campos del formulario */}
        <Button type="submit">
          {isEditMode ? 'Actualizar' : 'Crear'}
        </Button>
      </Form>
    </Container>
  );
};
```

---

## ✅ Checklist de Integración

- [ ] Axios configurado con baseURL
- [ ] Interceptors para token y errores
- [ ] Tipos TypeScript para todas las respuestas
- [ ] Servicios creados para todas las entidades
- [ ] Hooks personalizados con React Query
- [ ] Manejo de errores global
- [ ] Toast notifications configuradas
- [ ] Loading states en todas las requests
- [ ] Validación de formularios client-side
- [ ] Mapeo de códigos de error a mensajes user-friendly