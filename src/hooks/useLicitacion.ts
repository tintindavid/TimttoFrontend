import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { licitacionService } from '@/services/licitacion.service';
import type {
  AbrirLicitacionDto,
  AmpliarFechaDto,
  AsignarProveedorDto,
  CompraDirectaDto,
  RegistrarCotizacionDto,
  ReenviarInvitacionDto,
} from '@/types/licitacion.types';

const KEY = 'requisiciones';

/** Every licitacion write changes the requisicion (state, suppliers, timeline) and its comparativo. */
const useInvalidateLicitacion = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries([KEY]);
  };
};

export const useGetComparativo = (id?: string, enabled = true) =>
  useQuery({
    queryKey: [KEY, 'comparativo', id],
    queryFn: () => licitacionService.getComparativo(id as string),
    enabled: !!id && enabled,
  });

export const useAsignarProveedor = () => {
  const invalidate = useInvalidateLicitacion();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AsignarProveedorDto }) => licitacionService.asignarProveedor(id, data),
    onSuccess: invalidate,
  });
};

export const useQuitarProveedor = () => {
  const invalidate = useInvalidateLicitacion();
  return useMutation({
    mutationFn: ({ id, paId }: { id: string; paId: string }) => licitacionService.quitarProveedor(id, paId),
    onSuccess: invalidate,
  });
};

export const useAbrirLicitacion = () => {
  const invalidate = useInvalidateLicitacion();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AbrirLicitacionDto }) => licitacionService.abrir(id, data),
    onSuccess: invalidate,
  });
};

export const useAmpliarFecha = () => {
  const invalidate = useInvalidateLicitacion();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AmpliarFechaDto }) => licitacionService.ampliarFecha(id, data),
    onSuccess: invalidate,
  });
};

export const useReenviarInvitacion = () => {
  const invalidate = useInvalidateLicitacion();
  return useMutation({
    mutationFn: ({ id, paId, data }: { id: string; paId: string; data: ReenviarInvitacionDto }) =>
      licitacionService.reenviar(id, paId, data),
    onSuccess: invalidate,
  });
};

export const useRegistrarCotizacion = () => {
  const invalidate = useInvalidateLicitacion();
  return useMutation({
    mutationFn: ({ id, paId, data }: { id: string; paId: string; data: RegistrarCotizacionDto }) =>
      licitacionService.registrarCotizacion(id, paId, data),
    onSuccess: invalidate,
  });
};

export const useCerrarCotizaciones = () => {
  const invalidate = useInvalidateLicitacion();
  return useMutation({
    mutationFn: (id: string) => licitacionService.cerrar(id),
    onSuccess: invalidate,
  });
};

export const useSeleccionarGanador = () => {
  const invalidate = useInvalidateLicitacion();
  return useMutation({
    mutationFn: ({ id, paId }: { id: string; paId: string }) => licitacionService.seleccionarGanador(id, paId),
    onSuccess: invalidate,
  });
};

export const useCompraDirecta = () => {
  const invalidate = useInvalidateLicitacion();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompraDirectaDto }) => licitacionService.compraDirecta(id, data),
    onSuccess: invalidate,
  });
};
