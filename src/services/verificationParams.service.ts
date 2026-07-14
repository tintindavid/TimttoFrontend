import { api } from './api';
import { ApiResponse } from '@/types/api.types';
import { VerificationParam } from '@/types/reporte.types';

export interface VerificationParamsSuggestion {
  suggestions: VerificationParam[];
  source: {
    consecutivo?: string;
    fecha?: string;
  } | null;
}

export interface VerificationMeasurement {
  reporteId: string;
  consecutivo?: string;
  fecha: string;
  magnitud: string;
  unidad?: string;
  valorReferencia: number | null;
  valorMedido: number;
  patron?: string;
}

export const verificationParamsService = {
  /**
   * Fetches the last non-cancelled report of the equipment that has any
   * verification parameters registered, and returns them as a template
   * (with valorMedido stripped) so the technician can re-use magnitudes,
   * references and standards.
   */
  async suggest(equipoId: string, excludeReporteId?: string): Promise<VerificationParamsSuggestion> {
    const response = await api.get<ApiResponse<VerificationParamsSuggestion>>(
      '/reports/verification-params/suggest',
      { params: { equipoId, excludeReporteId } },
    );
    return response.data.data as VerificationParamsSuggestion;
  },

  async history(equipoId: string): Promise<{ measurements: VerificationMeasurement[] }> {
    const response = await api.get<ApiResponse<{ measurements: VerificationMeasurement[] }>>(
      '/reports/verification-params/history',
      { params: { equipoId } },
    );
    return response.data.data as { measurements: VerificationMeasurement[] };
  },
};
