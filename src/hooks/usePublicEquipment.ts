import { useQuery } from '@tanstack/react-query';
import { ApiResponse } from '@/types/api.types';
import { PublicEquipmentPayload } from '@/types/equipmentQr.types';
import { publicEquipmentService } from '@/services/publicEquipment.service';

/**
 * Public, no-auth read of `/api/public/equipo/:qrToken`. Gated on token
 * presence via `enabled` (D16 — CSR with a loading skeleton while in flight).
 */
export const usePublicEquipmentByToken = (qrToken: string | undefined) => {
  return useQuery<ApiResponse<PublicEquipmentPayload>, Error>({
    queryKey: ['public-equipment', qrToken ?? ''],
    queryFn: () => publicEquipmentService.getByToken(qrToken as string),
    enabled: !!qrToken,
    retry: false,
    staleTime: 60 * 1000,
  });
};
