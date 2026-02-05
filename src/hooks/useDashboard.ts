import { useQuery } from '@tanstack/react-query';
import { equipoItemService } from '@/services/equipoItem.service';
import { otService } from '@/services/ot.service';
import { userService } from '@/services/user.service';

export const useDashboardCounts = () => {
  const equipos = useQuery(['dashboard', 'equipos'], async () => {
    const res = await equipoItemService.getAll({ page: 1, limit: 1 });
    return res.pagination?.total ?? (Array.isArray(res.data) ? res.data.length : 0);
  });

  const ots = useQuery(['dashboard', 'ots'], async () => {
    const res = await otService.getAll({ page: 1, limit: 1 });
    return res.pagination?.total ?? (Array.isArray(res.data) ? res.data.length : 0);
  });

  const users = useQuery(['dashboard', 'users'], async () => {
    const res = await userService.getAll({ page: 1, limit: 1 });
    return res.pagination?.total ?? (Array.isArray(res.data) ? res.data.length : 0);
  });

  return {
    equipos,
    ots,
    users,
    isLoading: equipos.isLoading || ots.isLoading || users.isLoading,
    isError: equipos.isError || ots.isError || users.isError,
  };
};

export default useDashboardCounts;
