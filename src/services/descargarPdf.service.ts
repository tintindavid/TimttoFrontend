/**
 * Servicio para generación y descarga de PDFs
 * Interactúa con el microservicio de reportes PDF del backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * Interfaz para los parámetros de generación bulk
 */
interface BulkPDFParams {
  reportIds?: string[];
  filters?: Record<string, any>;
  otId?: string;
  sheetworkId?: string;
}

/**
 * Genera y descarga múltiples reportes en formato ZIP
 * @param params - Parámetros de búsqueda (reportIds, filters, otId, sheetworkId)
 * @param tenantId - ID del tenant (opcional)
 * @throws Error si la petición falla
 */
export const generateBulkPDF = async (
  params: BulkPDFParams,
  tenantId?: string
): Promise<void> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Resolve tenantId: use provided or fallback to localStorage
    const resolvedTenantId = tenantId || localStorage.getItem('tenantId') || undefined;
    if (!resolvedTenantId) {
      throw new Error('tenantId is required for PDF generation requests');
    }
    headers['x-tenant-id'] = resolvedTenantId;

    // Añadir token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/pdf-reports/bulk`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
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

    // Verificar que la respuesta es un ZIP
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/zip')) {
      throw new Error('La respuesta no es un archivo ZIP');
    }

    // Convertir respuesta a Blob
    const blob = await response.blob();

    // Crear URL temporal y forzar descarga
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Nombre del archivo con fecha actual
    const fecha = new Date().toISOString().split('T')[0];
    a.download = `reportes_${fecha}.zip`;
    
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al generar PDFs en bulk');
  }
};

/**
 * Genera y descarga un único reporte en formato PDF
 * @param reportId - ID del reporte a generar
 * @param tenantId - ID del tenant (opcional)
 * @throws Error si la petición falla
 */
export const generateSinglePDF = async (
  reportId: string,
  tenantId?: string
): Promise<void> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const resolvedTenantId = tenantId || localStorage.getItem('tenantId') || undefined;
    if (!resolvedTenantId) {
      throw new Error('tenantId is required for PDF generation requests');
    }
    headers['x-tenant-id'] = resolvedTenantId;

    // Añadir token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/pdf-reports/single`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reportId }),
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
    a.download = `${reportId}.pdf`;
    
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al generar PDF');
  }
};

/**
 * Verifica el estado del microservicio de PDFs
 * @returns Objeto con el estado del servicio
 * @throws Error si la petición falla
 */
export const checkPdfMicroservice = async (): Promise<any> => {
  try {
    const headers: HeadersInit = {};

    // Añadir token de autenticación si existe
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/pdf-reports/health`, {
      method: 'GET',
      headers,
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

    // Retornar el JSON
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al verificar el servicio PDF');
  }
};

/* 
 * ============================================
 * EJEMPLOS DE USO
 * ============================================

// 1. Descargar múltiples reportes por IDs
try {
  await generateBulkPDF(
    { reportIds: ['report1', 'report2', 'report3'] },
    'tenant-123'
  );
  console.log('Reportes descargados exitosamente');
} catch (error) {
  console.error('Error:', error.message);
}

// 2. Descargar reportes filtrados por OT
try {
  await generateBulkPDF(
    { otId: 'OT-2024-001' },
    'tenant-123'
  );
} catch (error) {
  console.error('Error:', error.message);
}

// 3. Descargar reportes con filtros personalizados
try {
  await generateBulkPDF(
    {
      filters: {
        fechaInicio: '2024-01-01',
        fechaFin: '2024-12-31',
        estado: 'completado'
      }
    },
    'tenant-123'
  );
} catch (error) {
  console.error('Error:', error.message);
}

// 4. Descargar un reporte individual
try {
  await generateSinglePDF('report-id-123', 'tenant-123');
  console.log('PDF descargado exitosamente');
} catch (error) {
  console.error('Error:', error.message);
}

// 5. Verificar estado del microservicio
try {
  const health = await checkPdfMicroservice();
  console.log('Estado del servicio:', health);
} catch (error) {
  console.error('Error:', error.message);
}

*/