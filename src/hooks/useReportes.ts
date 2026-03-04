import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reporteService } from '@/services/reporte.service';
import { sheetworkService } from '@/services/sheetwork.service';
import { Reporte, ActividadRealizada, Evidencia, RepuestoReporte } from '@/types/reporte.types';

// Get reportes by OT
export const useReportes = (params?: { otId?: string }) => {
  return useQuery({
    queryKey: ['reportes', params],
    queryFn: () => {
      if (params?.otId) {
        return reporteService.getReportesByOT(params.otId);
      }
      throw new Error('OT ID is required');
    },
    enabled: !!params?.otId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get reportes by Equipo
export const useReportesByEquipo = (equipoId: string, params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['reportes', 'equipo', equipoId, params],
    queryFn: () => reporteService.getReportesByEquipo(equipoId, params),
    enabled: !!equipoId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get single reporte
export const useReporte = (id: string) => {
  return useQuery({
    queryKey: ['reportes', id],
    queryFn: () => reporteService.getReporte(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Update reporte
export const useUpdateReporte = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Reporte> }) => 
      reporteService.updateReporte(id, data),
    onSuccess: (response, variables) => {
      // Update specific reporte in cache
      queryClient.setQueryData(['reportes', variables.id], response);
      
      // Invalidate reportes list for the OT
      queryClient.invalidateQueries({ 
        queryKey: ['reportes'],
        predicate: (query) => {
          const params = query.queryKey[1] as any;
          return params?.otId !== undefined;
        }
      });
    },
  });
};

// Update equipment snapshot
export const useUpdateEquipoSnapshot = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reporteId, equipoSnapshot }: { reporteId: string; equipoSnapshot: any }) => 
      reporteService.updateEquipoSnapshot(reporteId, equipoSnapshot),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['reportes', variables.reporteId], response);
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
};

// Add actividad
export const useAddActividad = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      reporteId, 
      actividad 
    }: { 
      reporteId: string; 
      actividad: Omit<ActividadRealizada, '_id' | 'fecha'> 
    }) => reporteService.addActividad(reporteId, actividad),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['reportes', variables.reporteId], response);
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
};

// Update actividad
export const useUpdateActividad = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      reporteId, 
      actividadId, 
      data 
    }: { 
      reporteId: string; 
      actividadId: string; 
      data: Partial<ActividadRealizada> 
    }) => reporteService.updateActividad(reporteId, actividadId, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['reportes', variables.reporteId], response);
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
};

// Delete actividad
export const useDeleteActividad = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reporteId, actividadId }: { reporteId: string; actividadId: string }) => 
      reporteService.deleteActividad(reporteId, actividadId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reportes', variables.reporteId] });
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
};

// Add evidencia
export const useAddEvidencia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      reporteId, 
      evidencia 
    }: { 
      reporteId: string; 
      evidencia: Omit<Evidencia, '_id' | 'fechaSubida'> 
    }) => reporteService.addEvidencia(reporteId, evidencia),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['reportes', variables.reporteId], response);
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
};

// Delete evidencia
export const useDeleteEvidencia = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reporteId, evidenciaId }: { reporteId: string; evidenciaId: string }) => 
      reporteService.deleteEvidencia(reporteId, evidenciaId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reportes', variables.reporteId] });
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
};

// Add repuesto
export const useAddRepuesto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      reporteId, 
      repuesto 
    }: { 
      reporteId: string; 
      repuesto: Omit<RepuestoReporte, '_id'> 
    }) => reporteService.addRepuesto(reporteId, repuesto),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['reportes', variables.reporteId], response);
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
};

// Update repuesto
export const useUpdateRepuesto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      reporteId, 
      repuestoId, 
      data 
    }: { 
      reporteId: string; 
      repuestoId: string; 
      data: Partial<RepuestoReporte> 
    }) => reporteService.updateRepuesto(reporteId, repuestoId, data),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['reportes', variables.reporteId], response);
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
};

// Delete repuesto
export const useDeleteRepuesto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reporteId, repuestoId }: { reporteId: string; repuestoId: string }) => 
      reporteService.deleteRepuesto(reporteId, repuestoId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reportes', variables.reporteId] });
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
};

// Mark as processed
export const useMarkAsProcessed = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reporteId: string) => reporteService.markAsProcessed(reporteId, {}),
    onSuccess: (response, reporteId) => {
      queryClient.setQueryData(['reportes', reporteId], response);
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['ots'] }); // Also update OT list
    },
  });
};

// Unmark as processed
export const useUnmarkAsProcessed = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reporteId: string) => reporteService.unmarkAsProcessed(reporteId),
    onSuccess: (response, reporteId) => {
      queryClient.setQueryData(['reportes', reporteId], response);
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
      queryClient.invalidateQueries({ queryKey: ['ots'] });
    },
  });
};

// Create worksheet
export const useCreateWorkSheet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ otId, equiposIds }: { otId: string; equiposIds: string[] }) => 
      reporteService.createWorkSheet(otId, equiposIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ots'] });
      queryClient.invalidateQueries({ queryKey: ['worksheets'] });
    },
  });
};

// Update observations
export const useUpdateObservaciones = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ reporteId, observaciones }: { reporteId: string; observaciones: string }) => 
      reporteService.updateObservaciones(reporteId, observaciones),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['reportes', variables.reporteId], response);
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
};

// Update diagnosis
export const useUpdateDiagnostico = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      reporteId, 
      diagnostico, 
      causaFalla 
    }: { 
      reporteId: string; 
      diagnostico: string; 
      causaFalla?: string 
    }) => reporteService.updateDiagnostico(reporteId, diagnostico, causaFalla),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['reportes', variables.reporteId], response);
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
};

// Get protocolos for equipment
export const useProtocolosEquipo = (equipmentId: string, tipoMantenimiento: string) => {
  return useQuery({
    queryKey: ['protocolos', equipmentId, tipoMantenimiento],
    queryFn: () => reporteService.getProtocolosEquipo(equipmentId, tipoMantenimiento),
    enabled: !!equipmentId && !!tipoMantenimiento,
    staleTime: 30 * 60 * 1000, // 30 minutes - protocols don't change often
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
};

// Update protocol step
export const useUpdateProtocolStep = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      reporteId, 
      protocoloId, 
      stepId, 
      completed 
    }: { 
      reporteId: string; 
      protocoloId: string; 
      stepId: string; 
      completed: boolean 
    }) => reporteService.updateProtocolStep(reporteId, protocoloId, stepId, completed),
    onSuccess: (response, variables) => {
      queryClient.setQueryData(['reportes', variables.reporteId], response);
      queryClient.invalidateQueries({ queryKey: ['reportes'] });
    },
  });
};

// Get worksheets by OT
export const useWorkSheets = (otId: string) => {
  return useQuery({
    queryKey: ['worksheets', otId],
    queryFn: async () => {
      const response = await reporteService.getWorkSheetsByOT(otId);
      return response.data; // Extraer data de ApiResponse
    },
    enabled: !!otId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ============================================
// HOOKS PARA SHEETWORKS (HOJAS DE TRABAJO)
// ============================================

/**
 * Obtener todas las hojas de trabajo con filtros y paginación
 */
export const useAllWorkSheets = (params?: {
  page?: number;
  limit?: number;
  clienteId?: string;
  estado?: string;
  startDate?: string;
  endDate?: string;
  numeroHoja?: string;
}) => {
  return useQuery({
    queryKey: ['worksheets', 'all', params],
    queryFn: () => sheetworkService.getAll(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Obtener una hoja de trabajo por ID
 */
export const useWorkSheet = (id: string) => {
  return useQuery({
    queryKey: ['worksheets', id],
    queryFn: () => sheetworkService.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  });
};

/**
 * Firmar hoja de trabajo
 */
export const useSignWorkSheet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, firmaCliente }: { id: string; firmaCliente: string }) =>
      sheetworkService.sign(id, firmaCliente),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worksheets'] });
    },
  });
};

/**
 * Cerrar hoja de trabajo
 */
export const useCloseWorkSheet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sheetworkService.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worksheets'] });
    },
  });
};

/**
 * Actualizar observaciones de hoja de trabajo
 */
export const useUpdateWorkSheetObservaciones = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, observaciones }: { id: string; observaciones: string }) =>
      sheetworkService.updateObservaciones(id, observaciones),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worksheets'] });
    },
  });
};

// ============================================
// HOOKS PARA REPORTES CERRADOS
// ============================================

/**
 * Obtener reportes cerrados con filtros
 */
export const useClosedReportes = (params?: {
  page?: number;
  limit?: number;
  clienteId?: string;
  equipoId?: string;
  startDate?: string;
  endDate?: string;
  tipoMtto?: string;
  servicio?: string;
}) => {
  return useQuery({
    queryKey: ['reportes', 'closed', params],
    queryFn: () => reporteService.getAll({ ...params, estado: 'Cerrado' }),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};