import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, syncUser } from "@workspace/api-client-react";
import { useSafeAuth } from "./use-safe-auth";
import type { SyncUserRequest } from "@workspace/api-client-react/src/generated/api.schemas";

export function useCurrentUser() {
  const { getToken, isLoaded, isSignedIn } = useSafeAuth();

  return useQuery({
    queryKey: ["/api/users/me"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return getCurrentUser({ headers: { Authorization: `Bearer ${token}` } });
    },
    enabled: isLoaded && !!isSignedIn,
    retry: false,
  });
}

export function useSyncUser() {
  const { getToken } = useSafeAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SyncUserRequest) => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return syncUser(data, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
    },
  });
}
