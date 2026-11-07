import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ordenCompraService } from '@/services/ordenCompra.service';
import { requisicionService } from '@/services/requisicion.service';
import type {
  AprobarOrdenCompraDto,
  DevolverEntregablesDto,
  OrdenCompraDto,
  RechazarOrdenCompraDto,
  ReenviarOrdenCompraDto,
} from '@/types/ordenCompra.types';
import { getApiErrorCode } from '@/utils/requisicionErrors';

const KEY = 'requisiciones';

/** Every purchase-order / deliverables write changes the requisicion, the trays and the committed budget. */
const useInvalidateOrdenCompra = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries([KEY]);
    queryClient.invalidateQueries(['presupuestos-area']);
  };
};

/** A stale decision (VERSION_DESACTUALIZADA) reloads the requisicion so the user decides on what is current. */
const useReloadOnStale = () => {
  const queryClient = useQueryClient();
  return (err: unknown) => {
    if (getApiErrorCode(err) === 'VERSION_DESACTUALIZADA') queryClient.invalidateQueries([KEY]);
  };
};

/** Size of the "OC por aprobar" tray (for the tab counter); one row is enough, only the pagination total is read. */
export const useOcPorAprobarCount = (enabled = true) =>
  useQuery({
    queryKey: [KEY, 'oc-por-aprobar-count'],
    queryFn: () => requisicionService.list({ vista: 'oc-por-aprobar', page: 1, limit: 1 }),
    enabled,
    select: (response) => response.pagination?.total ?? response.data?.length ?? 0,
    refetchOnWindowFocus: false,
  });

export const useEmitirOrdenCompra = () => {
  const invalidate = useInvalidateOrdenCompra();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrdenCompraDto }) => ordenCompraService.emitir(id, data),
    onSuccess: invalidate,
  });
};

export const useEditarOrdenCompra = () => {
  const invalidate = useInvalidateOrdenCompra();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrdenCompraDto }) => ordenCompraService.editar(id, data),
    onSuccess: invalidate,
  });
};

export const useAprobarOrdenCompra = () => {
  const invalidate = useInvalidateOrdenCompra();
  const reloadOnStale = useReloadOnStale();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AprobarOrdenCompraDto }) => ordenCompraService.aprobar(id, data),
    onSuccess: invalidate,
    onError: reloadOnStale,
  });
};

export const useRechazarOrdenCompra = () => {
  const invalidate = useInvalidateOrdenCompra();
  const reloadOnStale = useReloadOnStale();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RechazarOrdenCompraDto }) => ordenCompraService.rechazar(id, data),
    onSuccess: invalidate,
    onError: reloadOnStale,
  });
};

export const useEnviarOrdenCompra = () => {
  const invalidate = useInvalidateOrdenCompra();
  return useMutation({
    mutationFn: (id: string) => ordenCompraService.enviar(id),
    onSuccess: invalidate,
  });
};

export const useReenviarOrdenCompra = () => {
  const invalidate = useInvalidateOrdenCompra();
  return useMutation({
    mutationFn: ({ id, correoEnvio }: { id: string } & ReenviarOrdenCompraDto) =>
      ordenCompraService.reenviar(id, correoEnvio ? { correoEnvio } : undefined),
    onSuccess: invalidate,
  });
};

/** Read-only: no cache to invalidate. Resolves with the PDF blob. */
export const useDescargarOrdenCompraPdf = () =>
  useMutation({
    mutationFn: (id: string) => ordenCompraService.descargarPdf(id),
  });

export const useSubirEntregables = () => {
  const invalidate = useInvalidateOrdenCompra();
  return useMutation({
    mutationFn: ({ id, archivos }: { id: string; archivos: File[] }) => ordenCompraService.subirEntregables(id, archivos),
    onSuccess: invalidate,
  });
};

export const useMarcarEntregablesRecibidos = () => {
  const invalidate = useInvalidateOrdenCompra();
  return useMutation({
    mutationFn: (id: string) => ordenCompraService.marcarRecibidos(id),
    onSuccess: invalidate,
  });
};

export const useRevisarEntregables = () => {
  const invalidate = useInvalidateOrdenCompra();
  return useMutation({
    mutationFn: (id: string) => ordenCompraService.revisarEntregables(id),
    onSuccess: invalidate,
  });
};

export const useAceptarEntregables = () => {
  const invalidate = useInvalidateOrdenCompra();
  return useMutation({
    mutationFn: (id: string) => ordenCompraService.aceptarEntregables(id),
    onSuccess: invalidate,
  });
};

export const useDevolverEntregables = () => {
  const invalidate = useInvalidateOrdenCompra();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DevolverEntregablesDto }) =>
      ordenCompraService.devolverEntregables(id, data),
    onSuccess: invalidate,
  });
};
