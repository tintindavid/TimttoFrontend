import { useCallback } from 'react';
import Swal from 'sweetalert2';
import { useCreateActividadExterna } from '@/hooks/useActividadesExternas';
import type { CreateActividadDto } from '@/types/actividadExterna.types';
import { ERROR_CODE_MESSAGES } from '@/constants/actividadExterna';

/** Spanish text of an error of the external activities API (known code, message or a generic one). */
export const errorTextActividad = (err: unknown): string => {
  const e = err as { response?: { data?: { code?: string } }; message?: string };
  const code = e?.response?.data?.code;
  return (code && ERROR_CODE_MESSAGES[code]) || e?.message || 'Error desconocido';
};

/**
 * Saves a new external activity (alone or as the successor of a chain) and tells the user.
 * Shared by the external activities tab of the equipment record and by the quick load of the schedule.
 *
 * The order is the one the tab always had: save, then `alGuardar` (close the form), then the success alert.
 * On failure it shows the error alert and resolves `false` so the caller can keep the form open.
 */
export const useGuardarActividadExterna = (equipoId: string) => {
  const createMut = useCreateActividadExterna(equipoId);

  const guardar = useCallback(
    async (
      dto: CreateActividadDto,
      cadenaIdSucesion?: string,
      file?: File,
      opciones: { alGuardar?: () => void } = {},
    ): Promise<boolean> => {
      try {
        await createMut.mutateAsync({ dto: { ...dto, cadenaIdSucesion }, file });
        opciones.alGuardar?.();
        await Swal.fire({
          icon: 'success',
          title: 'Actividad guardada',
          text: cadenaIdSucesion
            ? 'Cadena actualizada: anterior cerrada, nueva vigente.'
            : 'Nueva cadena creada.',
        });
        return true;
      } catch (err) {
        await Swal.fire({ icon: 'error', title: 'No se pudo guardar', text: errorTextActividad(err) });
        return false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createMut.mutateAsync],
  );

  return { guardar, guardando: createMut.isLoading };
};

export default useGuardarActividadExterna;
