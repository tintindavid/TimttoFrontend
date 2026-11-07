import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { publicRequisicionService } from '@/services/publicRequisicion.service';
import type { RegistrarCotizacionDto } from '@/types/licitacion.types';

const KEY = 'public-requisicion';

/** Loads the supplier portal data. Never retried: a 404/403 is a final answer and retrying only burns the rate limit. */
export const useGetPublicRequisicion = (token?: string) =>
  useQuery({
    queryKey: [KEY, token],
    queryFn: () => publicRequisicionService.get(token as string),
    enabled: !!token,
    retry: false,
    refetchOnWindowFocus: false,
  });

export const useResponderInvitacion = (token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (aceptar: boolean) => publicRequisicionService.responderInvitacion(token, aceptar),
    onSuccess: () => queryClient.invalidateQueries([KEY, token]),
  });
};

export const useDescargarOrdenCompraPublica = (token: string) =>
  useMutation({
    mutationFn: () => publicRequisicionService.descargarOrdenCompraPdf(token),
  });

export const useSubirEntregablesPublicos = (token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (archivos: File[]) => publicRequisicionService.subirEntregables(token, archivos),
    onSuccess: () => queryClient.invalidateQueries([KEY, token]),
  });
};

export const useEnviarCotizacionPublica = (token: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegistrarCotizacionDto) => publicRequisicionService.enviarCotizacion(token, data),
    onSuccess: () => queryClient.invalidateQueries([KEY, token]),
  });
};
