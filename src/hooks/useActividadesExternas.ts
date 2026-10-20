import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { actividadExternaService } from '@/services/actividadExterna.service';
import type { CreateActividadDto, UpdateActividadDto } from '@/types/actividadExterna.types';

const keys = {
  all: ['actividades-externas'] as const,
  listByEquipo: (equipoId: string, filters?: Record<string, unknown>) =>
    filters
      ? ([...keys.all, 'equipo', equipoId, filters] as const)
      : ([...keys.all, 'equipo', equipoId] as const),
  cadenasVigentesPrefix: (equipoId: string) => [...keys.all, 'cadenas-vigentes', equipoId] as const,
  cadenasVigentes: (equipoId: string, tipo: string, tipoCustom?: string) =>
    [...keys.all, 'cadenas-vigentes', equipoId, tipo, tipoCustom ?? null] as const,
};

export const useActividadesExternasPorEquipo = (equipoId: string, filters?: Record<string, unknown>) =>
  useQuery(keys.listByEquipo(equipoId, filters), () => actividadExternaService.listPorEquipo(equipoId, filters), {
    enabled: !!equipoId,
  });

export const useCadenasVigentesPorTipo = (
  equipoId: string,
  tipo: string,
  tipoCustom?: string,
  options?: { enabled?: boolean },
) =>
  useQuery(
    keys.cadenasVigentes(equipoId, tipo, tipoCustom),
    () => actividadExternaService.getCadenasVigentesPorTipo(equipoId, tipo, tipoCustom),
    { enabled: options?.enabled ?? false },
  );

const useInvalidate = (equipoId: string) => {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries(keys.listByEquipo(equipoId)),
      qc.invalidateQueries(keys.cadenasVigentesPrefix(equipoId)),
      // The unified schedule reads the same chains.
      qc.invalidateQueries(['cronograma-actividades-externas']),
      // An activity can change the operative state of the equipment (shown in the record and the schedule).
      qc.invalidateQueries(['equipo-items']),
    ]);
};

export const useCreateActividadExterna = (equipoId: string) => {
  const invalidate = useInvalidate(equipoId);
  return useMutation(
    ({ dto, file }: { dto: CreateActividadDto; file?: File }) => actividadExternaService.create(equipoId, dto, file),
    { onSuccess: invalidate },
  );
};

export const useUpdateActividadExterna = (equipoId: string) => {
  const invalidate = useInvalidate(equipoId);
  return useMutation(
    ({ id, dto, file }: { id: string; dto: UpdateActividadDto; file?: File }) =>
      actividadExternaService.update(equipoId, id, dto, file),
    { onSuccess: invalidate },
  );
};

export const useRemoveActividadExterna = (equipoId: string) => {
  const invalidate = useInvalidate(equipoId);
  return useMutation((id: string) => actividadExternaService.remove(equipoId, id), { onSuccess: invalidate });
};

export const useRemoveEvidencia = (equipoId: string) => {
  const invalidate = useInvalidate(equipoId);
  return useMutation((id: string) => actividadExternaService.removeEvidencia(equipoId, id), {
    onSuccess: invalidate,
  });
};

export const useCerrarCadena = (equipoId: string) => {
  const invalidate = useInvalidate(equipoId);
  return useMutation(
    ({ cadenaId, motivo }: { cadenaId: string; motivo: string }) =>
      actividadExternaService.cerrarCadena(equipoId, cadenaId, motivo),
    { onSuccess: invalidate },
  );
};
