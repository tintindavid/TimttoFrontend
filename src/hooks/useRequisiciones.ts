import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { requisicionService } from '@/services/requisicion.service';
import {
  AprobarRequisicionDto,
  CambiarEstadoRequisicionDto,
  CancelarRequisicionDto,
  CerrarLineaDto,
  ConfirmarEntregaDto,
  RegistrarRecepcionDto,
  CreateRequisicionDto,
  RechazarRequisicionDto,
  ReasignarAprobadoresDto,
  RequisicionQueryParams,
  UpdateRequisicionDto,
} from '@/types/requisicion.types';

const KEY = 'requisiciones';

/** Every write changes the requisicion (and possibly the committed budget of its area). */
const useInvalidateRequisiciones = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries([KEY]);
    queryClient.invalidateQueries(['presupuestos-area']);
  };
};

export const useGetRequisiciones = (params: RequisicionQueryParams = {}, enabled = true) =>
  useQuery({
    queryKey: [KEY, 'list', params],
    queryFn: () => requisicionService.list(params),
    enabled,
    keepPreviousData: true,
  });

export const useGetRequisicion = (id?: string) =>
  useQuery({
    queryKey: [KEY, 'detail', id],
    queryFn: () => requisicionService.getById(id as string),
    enabled: !!id,
  });

export const useCreateRequisicion = () => {
  const invalidate = useInvalidateRequisiciones();
  return useMutation({
    mutationFn: (data: CreateRequisicionDto) => requisicionService.create(data),
    onSuccess: invalidate,
  });
};

export const useUpdateRequisicion = () => {
  const invalidate = useInvalidateRequisiciones();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRequisicionDto }) => requisicionService.update(id, data),
    onSuccess: invalidate,
  });
};

export const useDeleteRequisicion = () => {
  const invalidate = useInvalidateRequisiciones();
  return useMutation({
    mutationFn: (id: string) => requisicionService.remove(id),
    onSuccess: invalidate,
  });
};

export const useEnviarRequisicion = () => {
  const invalidate = useInvalidateRequisiciones();
  return useMutation({
    mutationFn: (id: string) => requisicionService.enviar(id),
    onSuccess: invalidate,
  });
};

export const useCancelarRequisicion = () => {
  const invalidate = useInvalidateRequisiciones();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CancelarRequisicionDto }) => requisicionService.cancelar(id, data),
    onSuccess: invalidate,
  });
};

/** Retire / reopen: back to Borrador with an observation. */
export const useCambiarEstadoRequisicion = () => {
  const invalidate = useInvalidateRequisiciones();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CambiarEstadoRequisicionDto }) =>
      requisicionService.cambiarEstado(id, data),
    onSuccess: invalidate,
  });
};

export const useAprobarRequisicion = () => {
  const invalidate = useInvalidateRequisiciones();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AprobarRequisicionDto }) => requisicionService.aprobar(id, data),
    onSuccess: invalidate,
  });
};

export const useRechazarRequisicion = () => {
  const invalidate = useInvalidateRequisiciones();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RechazarRequisicionDto }) => requisicionService.rechazar(id, data),
    onSuccess: invalidate,
  });
};

export const useReasignarAprobadores = () => {
  const invalidate = useInvalidateRequisiciones();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReasignarAprobadoresDto }) =>
      requisicionService.reasignarAprobadores(id, data),
    onSuccess: invalidate,
  });
};

/** A reception / confirmation / line closing also moves the linked spare-part requests (and the stock). */
const useInvalidateReception = () => {
  const invalidate = useInvalidateRequisiciones();
  const queryClient = useQueryClient();
  return () => {
    invalidate();
    queryClient.invalidateQueries(['repuestos']);
  };
};

export const useRegistrarRecepcion = () => {
  const invalidate = useInvalidateReception();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RegistrarRecepcionDto }) => requisicionService.registrarRecepcion(id, data),
    onSuccess: invalidate,
  });
};

export const useConfirmarEntrega = () => {
  const invalidate = useInvalidateReception();
  return useMutation({
    mutationFn: ({ id, recepcionId, data }: { id: string; recepcionId: string; data: ConfirmarEntregaDto }) =>
      requisicionService.confirmarEntrega(id, recepcionId, data),
    onSuccess: invalidate,
  });
};

export const useCerrarLinea = () => {
  const invalidate = useInvalidateReception();
  return useMutation({
    mutationFn: ({ id, lineaId, data }: { id: string; lineaId: string; data: CerrarLineaDto }) =>
      requisicionService.cerrarLinea(id, lineaId, data),
    onSuccess: invalidate,
  });
};
