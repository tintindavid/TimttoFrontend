import { useUser } from "@/hooks/useUsers";
import { useAuth } from "./AuthContext";
import { getUserIdFromToken } from "@/utils/token";

export const useCurrentUserData = () => {
  const { token } = useAuth();
  const userId = token ? getUserIdFromToken(token) : null;
  const { data: userData, isLoading, error, refetch } = useUser(userId || '');

  return userData?.data;
};
