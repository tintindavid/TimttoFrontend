import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reporteExternoService, type CreateReporteExternoDto } from '@/services/reporteExterno.service';

/**
 * A third-party service changes the reports of the equipment, the equipment itself (operative state, completed
 * months, last and next maintenance) and, through the equipment list, the maintenance schedule.
 */
const useRefreshAfterChange = (equipoId: string) => {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries(['reportes', 'equipo', equipoId]),
      qc.invalidateQueries(['reportes']),
      qc.invalidateQueries(['equipo-items']),
      qc.invalidateQueries(['equipo-item']),
    ]);
};

export const useCreateReporteExterno = (equipoId: string) => {
  const refresh = useRefreshAfterChange(equipoId);
  return useMutation(
    ({ dto, file }: { dto: CreateReporteExternoDto; file?: File }) => reporteExternoService.create(equipoId, dto, file),
    { onSuccess: refresh },
  );
};

export const useRemoveReporteExterno = (equipoId: string) => {
  const refresh = useRefreshAfterChange(equipoId);
  return useMutation((id: string) => reporteExternoService.remove(equipoId, id), { onSuccess: refresh });
};
