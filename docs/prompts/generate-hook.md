# Generate Hook - Crear Custom Hook con React Query

Genera hooks personalizados para consumir la API con React Query.

---

## 📋 Input Requerido
```
Nombre de entidad: {EntityName}
Service: {entity}Service
Métodos: getAll, getById, create, update, delete, [custom]
```

---

## 🪝 Estructura Base
```typescript
// src/hooks/use{Entity}s.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { {entity}Service } from '@/services/{entity}.service';
import {
  {Entity},
  Create{Entity}Dto,
  Update{Entity}Dto,
} from '@/types/{entity}.types';
import { ApiResponse, QueryParams } from '@/types';

/**
 * Hook para obtener lista de {entities}
 * 
 * @param params - Parámetros de búsqueda y paginación
 * @param options - Opciones adicionales de React Query
 */
export const use{Entity}s = (
  params?: QueryParams,
  options?: UseQueryOptions<ApiResponse<{Entity}[]>>
) => {
  return useQuery({
    queryKey: ['{entities}', params],
    queryFn: () => {entity}Service.getAll(params),
    keepPreviousData: true,
    ...options,
  });
};

/**
 * Hook para obtener un {entity} por ID
 * 
 * @param id - ID del {entity}
 * @param options - Opciones adicionales de React Query
 */
export const use{Entity} = (
  id: string,
  options?: UseQueryOptions<ApiResponse<{Entity}>>
) => {
  return useQuery({
    queryKey: ['{entities}', id],
    queryFn: () => {entity}Service.getById(id),
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook para crear un {entity}
 * 
 * @returns Mutation para crear {entity}
 */
export const useCreate{Entity} = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Create{Entity}Dto) => {entity}Service.create(data),
    onSuccess: () => {
      // Invalidar queries para refrescar lista
      queryClient.invalidateQueries(['{entities}']);
      toast.success('{Entity} creado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear {entity}';
      toast.error(message);
    },
  });
};

/**
 * Hook para actualizar un {entity}
 * 
 * @returns Mutation para actualizar {entity}
 */
export const useUpdate{Entity} = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Update{Entity}Dto }) =>
      {entity}Service.update(id, data),
    onSuccess: (_, variables) => {
      // Invalidar lista y detalle
      queryClient.invalidateQueries(['{entities}']);
      queryClient.invalidateQueries(['{entities}', variables.id]);
      toast.success('{Entity} actualizado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al actualizar {entity}';
      toast.error(message);
    },
  });
};

/**
 * Hook para eliminar un {entity}
 * 
 * @returns Mutation para eliminar {entity}
 */
export const useDelete{Entity} = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {entity}Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['{entities}']);
      toast.success('{Entity} eliminado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al eliminar {entity}';
      toast.error(message);
    },
  });
};
```

---

## 🪝 Ejemplo Completo: useEquipment
```typescript
// src/hooks/useEquipment.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { equipmentService } from '@/services/equipment.service';
import {
  Equipment,
  CreateEquipmentDto,
  UpdateEquipmentDto,
  CalibrationData,
} from '@/types/equipment.types';
import { ApiResponse, QueryParams } from '@/types';

/**
 * Hook para obtener lista de equipos
 */
export const useEquipment = (
  params?: QueryParams,
  options?: UseQueryOptions<ApiResponse<Equipment[]>>
) => {
  return useQuery({
    queryKey: ['equipment', params],
    queryFn: () => equipmentService.getAll(params),
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
    ...options,
  });
};

/**
 * Hook para obtener un equipo por ID
 */
export const useEquipmentItem = (
  id: string,
  options?: UseQueryOptions<ApiResponse<Equipment>>
) => {
  return useQuery({
    queryKey: ['equipment', id],
    queryFn: () => equipmentService.getById(id, ['category', 'location']),
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook para crear equipo
 */
export const useCreateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEquipmentDto) => equipmentService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipment']);
      toast.success('Equipo creado exitosamente');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al crear equipo';
      toast.error(message);
    },
  });
};

/**
 * Hook para actualizar equipo
 */
export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipmentDto }) =>
      equipmentService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['equipment']);
      queryClient.invalidateQueries(['equipment', variables.id]);
      toast.success('Equipo actualizado exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Error al actualizar equipo';
      toast.error(message);
    },
  });
};

/**
 * Hook para eliminar equipo
 */
export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => equipmentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipment']);
      toast.success('Equipo eliminado exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Error al eliminar equipo';
      toast.error(message);
    },
  });
};

// --- Hooks personalizados ---

/**
 * Hook para obtener equipos por categoría
 */
export const useEquipmentByCategory = (
  categoryId: string,
  options?: UseQueryOptions<ApiResponse<Equipment[]>>
) => {
  return useQuery({
    queryKey: ['equipment', 'category', categoryId],
    queryFn: () => equipmentService.getByCategory(categoryId),
    enabled: !!categoryId,
    ...options,
  });
};

/**
 * Hook para obtener equipos por ubicación
 */
export const useEquipmentByLocation = (
  locationId: string,
  options?: UseQueryOptions<ApiResponse<Equipment[]>>
) => {
  return useQuery({
    queryKey: ['equipment', 'location', locationId],
    queryFn: () => equipmentService.getByLocation(locationId),
    enabled: !!locationId,
    ...options,
  });
};

/**
 * Hook para calibrar equipo
 */
export const useCalibrateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CalibrationData }) =>
      equipmentService.calibrate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['equipment']);
      queryClient.invalidateQueries(['equipment', variables.id]);
      toast.success('Equipo calibrado exitosamente');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Error al calibrar equipo';
      toast.error(message);
    },
  });
};

/**
 * Hook para obtener historial de mantenimiento
 */
export const useMaintenanceHistory = (
  equipmentId: string,
  options?: UseQueryOptions<ApiResponse<any[]>>
) => {
  return useQuery({
    queryKey: ['equipment', equipmentId, 'maintenance-history'],
    queryFn: () => equipmentService.getMaintenanceHistory(equipmentId),
    enabled: !!equipmentId,
    ...options,
  });
};
```

---

## 🪝 Hook de Autenticación
```typescript
// src/hooks/useAuth.ts
import { useContext } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import { AuthContext } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import { LoginCredentials, RegisterData } from '@/types/user.types';

/**
 * Hook para acceder al contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};

/**
 * Hook para login
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (response) => {
      toast.success('Sesión iniciada correctamente');
      queryClient.setQueryData(['auth', 'user'], response.data.user);
      navigate('/');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || 'Credenciales inválidas';
      toast.error(message);
    },
  });
};

/**
 * Hook para registro
 */
export const useRegister = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (response) => {
      toast.success('Registro exitoso');
      queryClient.setQueryData(['auth', 'user'], response.data.user);
      navigate('/');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Error al registrarse';
      toast.error(message);
    },
  });
};

/**
 * Hook para logout
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear();
      navigate('/login');
      toast.success('Sesión cerrada');
    },
  });
};

/**
 * Hook para obtener perfil de usuario
 */
export const useProfile = () => {
  return useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: () => authService.getProfile(),
    enabled: authService.isAuthenticated(),
    staleTime: Infinity, // No refetch automático
  });
};
```

---

## ✅ Checklist de Hook

- [ ] JSDoc con descripción clara
- [ ] Tipos TypeScript correctos
- [ ] Query keys descriptivas y consistentes
- [ ] invalidateQueries después de mutations
- [ ] Toast notifications en success/error
- [ ] Manejo de errores apropiado
- [ ] Opciones de React Query (enabled, staleTime, etc.)
- [ ] keepPreviousData para paginación
- [ ] Export nombrado (no default)