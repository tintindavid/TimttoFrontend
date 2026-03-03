---
applyTo: '**'
---
# GitHub Copilot Instructions - Mantenimiento Biomédico Frontend

## 🎯 Contexto del Proyecto
Sistema frontend para gestión de mantenimiento biomédico multitenant. Consume el backend API REST desarrollado en Node.js + Express + MongoDB.

**Backend API URL**: `http://localhost:3000/api/v1`

## 📋 Stack Tecnológico OBLIGATORIO
- React 18+ con TypeScript
- Vite (build tool)
- React Router DOM v6+
- Bootstrap 5.3+ (CSS framework)
- React Bootstrap (componentes React)
- Axios (HTTP client)
- React Hook Form + Yup (formularios y validación)
- React Query / TanStack Query (cache y estado servidor)
- React Icons
- date-fns (manejo de fechas)
- JWT para autenticación

## 🏗️ Arquitectura del Proyecto
```
src/
 ├── assets/           # Imágenes, logos, íconos
 ├── components/       # Componentes reutilizables
 │   ├── common/       # Componentes comunes (Button, Input, etc.)
 │   ├── layout/       # Layout components (Navbar, Sidebar, Footer)
 │   └── forms/        # Componentes de formularios
 ├── pages/            # Páginas/Vistas principales
 ├── services/         # Servicios API (axios)
 ├── hooks/            # Custom hooks
 ├── context/          # Context API (auth, theme, etc.)
 ├── utils/            # Utilidades
 ├── types/            # Tipos TypeScript
 ├── config/           # Configuración (API URL, constantes)
 ├── routes/           # Configuración de rutas
 ├── App.tsx
 └── main.tsx
```

## 🚨 REGLAS CRÍTICAS

### Comunicación con Backend
- **SIEMPRE** usar el servicio API centralizado
- **NUNCA** hacer fetch/axios directo en componentes
- Todas las llamadas API en `src/services/`
- Token JWT en header `Authorization: Bearer {token}`
- Interceptor de Axios para agregar token automáticamente

### Estructura de Respuestas del Backend
Todas las respuestas siguen este formato:
```typescript
// Success
{
  success: true,
  message: string,
  data: T,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    pages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}

// Error
{
  success: false,
  message: string,
  error: {
    code: string,
    details?: any
  }
}
```

### Componentes React
- **Functional Components** SIEMPRE (no class components)
- **TypeScript** estricto en todos los componentes
- **Props con interfaces** definidas
- **Nombres en PascalCase**: `UserList.tsx`, `EquipmentCard.tsx`
- **Un componente por archivo**
- **Export default** al final del archivo

### Gestión de Estado
- **React Query** para estado del servidor (datos del backend)
- **Context API** para estado global de aplicación (auth, theme)
- **useState** para estado local de componente
- **NO usar Redux** (a menos que sea absolutamente necesario)

### Formularios
- **React Hook Form** para manejo de formularios
- **Yup** para validación de schemas
- **Validación client-side** + validación server-side
- Mostrar errores del backend en formato user-friendly

### Estilos
- **Bootstrap 5** como base
- **React Bootstrap** para componentes
- **Custom CSS Modules** solo cuando sea necesario
- **Responsive design** obligatorio (mobile-first)
- **Tema consistente** con variables CSS

### Rutas
- **React Router v6** con createBrowserRouter
- **Rutas protegidas** con PrivateRoute component
- **Layout compartido** para rutas autenticadas
- **404 page** para rutas no encontradas
- **Lazy loading** para páginas grandes

### Autenticación
- Token JWT almacenado en **localStorage**
- Tenant almacenado en un lugar comun **localStorage**
- Context `AuthContext` para estado de autenticación
- Hook `useAuth()` para acceder al contexto
- Interceptor Axios para agregar token
- Redirect a `/login` si token inválido/expirado
- Logout limpia token y redirect a login

### Manejo de Errores
- Toast notifications para errores
- Error boundaries para errores de React
- Mensajes user-friendly (traducir códigos de error)
- Loading states en todas las operaciones async

### TypeScript Estricto
- `strict: true` en tsconfig
- NO usar `any` (usar `unknown` si es necesario)
- Interfaces para todas las entidades del backend
- Tipos para props, responses, requests

## 🎨 Convenciones de UI/UX

### Páginas Principales
Cada entidad del backend debe tener:
1. **List Page**: Tabla con paginación, búsqueda, filtros
2. **Detail Page**: Vista detallada de un item
3. **Create/Edit Page**: Formulario para crear/editar
4. **Delete**: Modal de confirmación

### Componentes Reutilizables
- `DataTable`: Tabla con paginación, sort, filtros
- `SearchBar`: Barra de búsqueda con debounce
- `Pagination`: Componente de paginación
- `ConfirmModal`: Modal de confirmación
- `LoadingSpinner`: Spinner de carga
- `ErrorAlert`: Alerta de error
- `SuccessToast`: Toast de éxito

### Navegación
```
/                      → Dashboard / Home
/login                 → Login page (pública)
/register              → Register page (pública)

/users                 → Lista de usuarios
/users/:id             → Detalle de usuario
/users/new             → Crear usuario
/users/:id/edit        → Editar usuario

/equipment             → Lista de equipos
/equipment/:id         → Detalle de equipo
/equipment/new         → Crear equipo
/equipment/:id/edit    → Editar equipo

/maintenance-orders    → Lista de órdenes
/maintenance-orders/:id → Detalle de orden
... etc
```

## 🎛️ Componentes Select (react-select)

### Convenciones OBLIGATORIAS para Select con Datos de BD

Todos los `<Select>` de react-select que obtienen opciones desde BD (con `.map()`) DEBEN tener:

#### Props Requeridas
```typescript
<Select
  isSearchable  // ✅ OBLIGATORIO - Permite buscar en opciones
  isClearable   // ✅ OBLIGATORIO - Permite limpiar selección
  // ... resto de props
/>
```

#### Ordenamiento Alfabético
Opciones DEBEN ordenarse alfabéticamente por nombre del objeto original:
```typescript
// ✅ CORRECTO
const itemOptions = useMemo(() => {
  const items = itemsData?.data || [];
  return [...items]
    .sort((a, b) => {
      const nameA = (a.Nombre || '').toUpperCase();
      const nameB = (b.Nombre || '').toUpperCase();
      return nameA.localeCompare(nameB);
    })
    .map(item => ({
      value: item._id,
      label: item.Nombre
    }));
}, [itemsData?.data]);

<Select
  isSearchable
  isClearable
  options={itemOptions}
  // ...
/>
```

#### Excepciones
- Opciones especiales como `CREATE_NEW` van al INICIO (no ordenar)
- Opciones predefinidas (meses, estados) NO necesitan `isSearchable/isClearable`

#### Template Completo
```typescript
<Select
  // OBLIGATORIO para datos de BD
  isSearchable
  isClearable
  
  // Datos
  options={sortedOptions}
  value={selectedValue}
  onChange={handleChange}
  
  // UI/UX
  placeholder="Seleccionar..."
  noOptionsMessage={() => 'No hay opciones disponibles'}
  
  // Posicionamiento (importante para modales)
  menuPortalTarget={document.body}
  menuPosition="fixed"
  styles={{
    menuPortal: (base) => ({ ...base, zIndex: 9999 })
  }}
  
  // Estados
  isLoading={isLoading}
  isDisabled={isDisabled}
/>
```

## 📦 Servicios API

### Estructura de Service
```typescript
// src/services/user.service.ts
import { api } from './api';
import { User, CreateUserDto, UpdateUserDto } from '@/types';

export const userService = {
  getAll: async (params?: any) => {
    const response = await api.get<ApiResponse<User[]>>('/users', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  },
  
  create: async (data: CreateUserDto) => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data;
  },
  
  update: async (id: string, data: UpdateUserDto) => {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<null>>(`/users/${id}`);
    return response.data;
  }
};
```

## 🔧 Configuración de Axios
```typescript
// src/services/api.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 🎯 React Query Setup
```typescript
// src/hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/user.service';

export const useUsers = (params?: any) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userService.getAll(params),
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userService.getById(id),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
```

## 📝 Convenciones de Código

### Nombres de Archivos
- Componentes: `UserList.tsx`, `EquipmentCard.tsx`
- Pages: `UsersPage.tsx`, `LoginPage.tsx`
- Services: `user.service.ts`, `equipment.service.ts`
- Hooks: `useUsers.ts`, `useAuth.ts`
- Types: `user.types.ts`, `equipment.types.ts`

### Imports Ordenados
```typescript
// 1. React y librerías externas
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';

// 2. Servicios y hooks
import { useUsers } from '@/hooks/useUsers';
import { userService } from '@/services/user.service';

// 3. Componentes
import { DataTable } from '@/components/common/DataTable';
import { SearchBar } from '@/components/common/SearchBar';

// 4. Types
import { User } from '@/types';

// 5. Estilos
import './UsersPage.css';
```

## 🔐 Autenticación - AuthContext
```typescript
// src/context/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Implementación
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

## ⚡ Al Generar Código
1. Usa TypeScript estricto
2. Componentes funcionales con hooks
3. Props con interfaces definidas
4. Manejo de errores en todas las operaciones async
5. Loading states
6. Responsive design con Bootstrap
7. Comentarios JSDoc en funciones complejas
8. Nombres descriptivos de variables y funciones