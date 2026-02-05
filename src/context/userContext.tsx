import { useUser } from "@/hooks/useUsers";
import { useAuth } from "./AuthContext";


const getUserIdFromToken = (token: string): string | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.id || payload.sub;
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

export const useCurrentUserData = () => {
  const { token } = useAuth();
  const userId = token ? getUserIdFromToken(token) : null;
  const { data: userData, isLoading, error, refetch } = useUser(userId || '');

  return userData?.data;
};
