import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inventarioMovimientoService } from '@/services/inventarioMovimiento.service';
import {
  CreateInventarioMovimientoDto,
  InventarioMovimientoQueryParams,
} from '@/types/inventarioRepuesto.types';

export const useInventarioMovimientos = (params: InventarioMovimientoQueryParams = {}, enabled = true) => {
  return useQuery({
    queryKey: ['inventario-movimientos', params],
    queryFn: () => inventarioMovimientoService.list(params),
    enabled,
    keepPreviousData: true,
  });
};

export const useCreateInventarioMovimiento = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInventarioMovimientoDto) => inventarioMovimientoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-movimientos'] });
      // The movement changes stockActual of the catalog item.
      queryClient.invalidateQueries({ queryKey: ['inventario-repuestos'] });
    },
  });
};
