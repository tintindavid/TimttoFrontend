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

const cronogramaService = {
  generarCronogramaPDF
};

export default cronogramaService;
