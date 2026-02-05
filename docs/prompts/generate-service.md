# Generate Service - Crear Servicio API

Genera un servicio para consumir endpoints del backend.

---

## 📋 Input Requerido
```
Nombre de entidad: {EntityName}
Endpoint base: /{entities}
Métodos necesarios: getAll, getById, create, update, delete, [custom methods]
```

---

## 🔧 Estructura Base
```typescript
// src/services/{entity}.service.ts
import { api } from './api';
import { ApiResponse, QueryParams } from '@/types';
import { 
  {Entity}, 
  Create{Entity}Dto, 
  Update{Entity}Dto 
} from '@/types/{entity}.types';

/**
 * {Entity} Service
 * 
 * Servicio para gestionar operaciones CRUD de {entities}
 */
class {Entity}Service {
  private readonly endpoint = '/{entities}';

  /**
   * Obtener lista paginada de {entities}
   * 
   * @param params - Parámetros de búsqueda y paginación
   * @returns Lista de {entities} con información de paginación
   */
  async getAll(params?: QueryParams): Promise<ApiResponse<{Entity}[]>> {
    const response = await api.get<ApiResponse<{Entity}[]>>(
      this.endpoint,
      { params }
    );
    return response.data;
  }

  /**
   * Obtener un {entity} por ID
   * 
   * @param id - ID del {entity}
   * @param populate - Campos a popular (opcional)
   * @returns {Entity} encontrado
   */
  async getById(
    id: string, 
    populate?: string[]
  ): Promise<ApiResponse<{Entity}>> {
    const params = populate ? { populate: populate.join(',') } : undefined;
    const response = await api.get<ApiResponse<{Entity}>>(
      `${this.endpoint}/${id}`,
      { params }
    );
    return response.data;
  }

  /**
   * Crear un nuevo {entity}
   * 
   * @param data - Datos del nuevo {entity}
   * @returns {Entity} creado
   */
  async create(data: Create{Entity}Dto): Promise<ApiResponse<{Entity}>> {
    const response = await api.post<ApiResponse<{Entity}>>(
      this.endpoint,
      data
    );
    return response.data;
  }

  /**
   * Actualizar un {entity} existente
   * 
   * @param id - ID del {entity}
   * @param data - Datos a actualizar
   * @returns {Entity} actualizado
   */
  async update(
    id: string,
    data: Update{Entity}Dto
  ): Promise<ApiResponse<{Entity}>> {
    const response = await api.put<ApiResponse<{Entity}>>(
      `${this.endpoint}/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Actualización parcial de un {entity}
   * 
   * @param id - ID del {entity}
   * @param data - Datos a actualizar
   * @returns {Entity} actualizado
   */
  async patch(
    id: string,
    data: Partial<Update{Entity}Dto>
  ): Promise<ApiResponse<{Entity}>> {
    const response = await api.patch<ApiResponse<{Entity}>>(
      `${this.endpoint}/${id}`,
      data
    );
    return response.data;
  }

  /**
   * Eliminar un {entity} (soft delete)
   * 
   * @param id - ID del {entity}
   */
  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(
      `${this.endpoint}/${id}`
    );
    return response.data;
  }

  // --- Métodos personalizados (según la entidad) ---

  /**
   * Ejemplo: Buscar {entities} por categoría
   * 
   * @param categoryId - ID de la categoría
   */
  async getByCategory(categoryId: string): Promise<ApiResponse<{Entity}[]>> {
    const response = await api.get<ApiResponse<{Entity}[]>>(
      this.endpoint,
      { params: { categoryId } }
    );
    return response.data;
  }
}

// Exportar instancia singleton
export const {entity}Service = new {Entity}Service();
```

---

## 🔧 Ejemplo Completo: Equipment Service
```typescript
// src/services/equipment.service.ts
import { api } from './api';
import { ApiResponse, QueryParams } from '@/types';
import {
  Equipment,
  CreateEquipmentDto,
  UpdateEquipmentDto,
  CalibrationData,
} from '@/types/equipment.types';

/**
 * Equipment Service
 * 
 * Servicio para gestionar equipos biomédicos
 */
class EquipmentService {
  private readonly endpoint = '/equipment';

  async getAll(params?: QueryParams): Promise<ApiResponse<Equipment[]>> {
    const response = await api.get<ApiResponse<Equipment[]>>(
      this.endpoint,
      { params }
    );
    return response.data;
  }

  async getById(
    id: string,
    populate?: string[]
  ): Promise<ApiResponse<Equipment>> {
    const params = populate ? { populate: populate.join(',') } : undefined;
    const response = await api.get<ApiResponse<Equipment>>(
      `${this.endpoint}/${id}`,
      { params }
    );
    return response.data;
  }

  async create(data: CreateEquipmentDto): Promise<ApiResponse<Equipment>> {
    const response = await api.post<ApiResponse<Equipment>>(
      this.endpoint,
      data
    );
    return response.data;
  }

  async update(
    id: string,
    data: UpdateEquipmentDto
  ): Promise<ApiResponse<Equipment>> {
    const response = await api.put<ApiResponse<Equipment>>(
      `${this.endpoint}/${id}`,
      data
    );
    return response.data;
  }

  async delete(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(
      `${this.endpoint}/${id}`
    );
    return response.data;
  }

  // --- Métodos específicos de Equipment ---

  /**
   * Obtener equipos por categoría
   */
  async getByCategory(categoryId: string): Promise<ApiResponse<Equipment[]>> {
    const response = await api.get<ApiResponse<Equipment[]>>(
      this.endpoint,
      { params: { categoryId } }
    );
    return response.data;
  }

  /**
   * Obtener equipos por ubicación
   */
  async getByLocation(locationId: string): Promise<ApiResponse<Equipment[]>> {
    const response = await api.get<ApiResponse<Equipment[]>>(
      this.endpoint,
      { params: { locationId } }
    );
    return response.data;
  }

  /**
   * Obtener equipos por estado
   */
  async getByStatus(
    status: 'active' | 'inactive' | 'maintenance'
  ): Promise<ApiResponse<Equipment[]>> {
    const response = await api.get<ApiResponse<Equipment[]>>(
      this.endpoint,
      { params: { status } }
    );
    return response.data;
  }

  /**
   * Calibrar equipo
   */
  async calibrate(
    id: string,
    data: CalibrationData
  ): Promise<ApiResponse<Equipment>> {
    const response = await api.post<ApiResponse<Equipment>>(
      `${this.endpoint}/${id}/calibrate`,
      data
    );
    return response.data;
  }

  /**
   * Obtener historial de mantenimiento del equipo
   */
  async getMaintenanceHistory(id: string): Promise<ApiResponse<any[]>> {
    const response = await api.get<ApiResponse<any[]>>(
      `${this.endpoint}/${id}/maintenance-history`
    );
    return response.data;
  }

  /**
   * Exportar equipos a CSV
   */
  async exportToCsv(params?: QueryParams): Promise<Blob> {
    const response = await api.get(
      `${this.endpoint}/export/csv`,
      {
        params,
        responseType: 'blob',
      }
    );
    return response.data;
  }
}

export const equipmentService = new EquipmentService();
```

---

## 🔧 Auth Service (Especial)
```typescript
// src/services/auth.service.ts
import { api } from './api';
import { ApiResponse } from '@/types';
import { User, LoginCredentials, RegisterData } from '@/types/user.types';

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

/**
 * Auth Service
 * 
 * Servicio para autenticación y gestión de sesión
 */
class AuthService {
  private readonly endpoint = '/auth';

  /**
   * Iniciar sesión
   */
  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post<ApiResponse<LoginResponse>>(
      `${this.endpoint}/login`,
      credentials
    );
    
    // Guardar token en localStorage
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
    }
    
    return response.data;
  }

  /**
   * Registrar nuevo usuario
   */
  async register(data: RegisterData): Promise<ApiResponse<LoginResponse>> {
    const response = await api.post<ApiResponse<LoginResponse>>(
      `${this.endpoint}/register`,
      data
    );
    
    // Guardar token en localStorage
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
    }
    
    return response.data;
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(): Promise<ApiResponse<User>> {
    const response = await api.get<ApiResponse<User>>(
      `${this.endpoint}/me`
    );
    return response.data;
  }

  /**
   * Refrescar token
   */
  async refreshToken(
    refreshToken: string
  ): Promise<ApiResponse<{ token: string }>> {
    const response = await api.post<ApiResponse<{ token: string }>>(
      `${this.endpoint}/refresh-token`,
      { refreshToken }
    );
    
    // Actualizar token en localStorage
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
    }
    
    return response.data;
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Verificar si hay sesión activa
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}

export const authService = new AuthService();
```

---

## ✅ Checklist de Service

- [ ] JSDoc en todos los métodos públicos
- [ ] Tipos TypeScript para request y response
- [ ] Manejo de errores delegado a interceptor
- [ ] Endpoints correctos
- [ ] Parámetros tipados
- [ ] Métodos CRUD básicos (getAll, getById, create, update, delete)
- [ ] Métodos custom según funcionalidad
- [ ] Export como singleton
- [ ] Comentarios claros