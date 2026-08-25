/**
 * Servicio para cronogramas de mantenimiento
 */
import { api } from './api';
import { getUserIdFromToken } from '@/utils/token';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

interface CronogramaPDFPayload {
  clienteId: string;
  filtros?: {
    sedeIds?: string[];
    servicioIds?: string[];
    meses?: string[];
    ubicaciones?: string[];
    estado?: string;
  };
}

/**
 * Genera y descarga el PDF del cronograma de mantenimiento
 * @param payload - clienteId y filtros opcionales; el backend consulta los equipos en DB
 * @throws Error si la petición falla
 */
export const generarCronogramaPDF = async (payload: CronogramaPDFPayload): Promise<void> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Obtener tenantId del localStorage
    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) {
      throw new Error('TenantId no encontrado. Por favor, inicie sesión nuevamente.');
    }
    
    headers['x-tenant-id'] = tenantId;

    // Añadir token de autenticación
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      
      // Extraer userId del token JWT
      const userId = getUserIdFromToken(token);
      if (userId) {
        headers['x-user-id'] = userId;
      }
    }

    // Hacer la petición al backend
    const response = await fetch(`${API_URL}/cronogramas/pdf`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    // Manejar errores HTTP
    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Si no se puede parsear el JSON, usar el mensaje por defecto
      }
      throw new Error(errorMessage);
    }

    // Verificar que la respuesta es un PDF
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/pdf')) {
      throw new Error('La respuesta no es un archivo PDF');
    }

    // Convertir respuesta a Blob
    const blob = await response.blob();

    // Crear URL temporal y forzar descarga
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Nombre del archivo con fecha (el backend nombra el archivo, pero el header puede no llegar)
    const fecha = new Date().toISOString().split('T')[0];
    a.download = `Cronograma_${fecha}.pdf`;
    
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al generar el PDF del cronograma');
  }
};

/**
 * Genera y descarga el Excel del cronograma de mantenimiento.
 * Mismo payload y contrato que `generarCronogramaPDF`; el backend replica
 * la misma jerarquía Cliente → Servicio → Sede → Equipo en el XLSX.
 * @param payload - clienteId y filtros opcionales; el backend consulta los equipos en DB
 * @throws Error si la petición falla
 */
export const generarCronogramaExcel = async (payload: CronogramaPDFPayload): Promise<void> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const tenantId = localStorage.getItem('tenantId');
    if (!tenantId) {
      throw new Error('TenantId no encontrado. Por favor, inicie sesión nuevamente.');
    }

    headers['x-tenant-id'] = tenantId;

    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;

      const userId = getUserIdFromToken(token);
      if (userId) {
        headers['x-user-id'] = userId;
      }
    }

    const response = await fetch(`${API_URL}/cronogramas/excel`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Si no se puede parsear el JSON, usar el mensaje por defecto
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('spreadsheetml')) {
      throw new Error('La respuesta no es un archivo Excel');
    }

    const blob = await response.blob();

    // Intentar extraer el nombre real del archivo del header Content-Disposition.
    const contentDisposition = response.headers.get('content-disposition');
    const fecha = new Date().toISOString().split('T')[0];
    let filename = `Cronograma_${fecha}.xlsx`;
    const match = contentDisposition?.match(/filename="?([^"]+)"?/);
    if (match?.[1]) {
      filename = match[1];
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al generar el Excel del cronograma');
  }
};

const cronogramaService = {
  generarCronogramaPDF,
  generarCronogramaExcel
};

export default cronogramaService;
