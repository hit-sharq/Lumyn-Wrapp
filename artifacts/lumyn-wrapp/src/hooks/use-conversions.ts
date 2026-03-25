import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listConversions,
  createConversion,
  getConversion,
  getConversionStatus,
} from "@workspace/api-client-react";
import { useSafeAuth } from "./use-safe-auth";
import type { CreateConversionRequest } from "@workspace/api-client-react/src/generated/api.schemas";

export function useConversions() {
  const { getToken, isLoaded, isSignedIn } = useSafeAuth();

  return useQuery({
    queryKey: ["/api/conversions"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return listConversions({ headers: { Authorization: `Bearer ${token}` } });
    },
    enabled: isLoaded && !!isSignedIn,
  });
}

export function useConversion(id: string) {
  const { getToken, isLoaded, isSignedIn } = useSafeAuth();

  return useQuery({
    queryKey: ["/api/conversions", id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return getConversion(id, { headers: { Authorization: `Bearer ${token}` } });
    },
    enabled: isLoaded && !!isSignedIn && !!id,
  });
}

export function useConversionStatus(id: string) {
  const { getToken, isLoaded, isSignedIn } = useSafeAuth();

  return useQuery({
    queryKey: ["/api/conversions", id, "status"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return getConversionStatus(id, { headers: { Authorization: `Bearer ${token}` } });
    },
    enabled: isLoaded && !!isSignedIn && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "pending" || status === "processing") return 5000;
      return false;
    },
  });
}

export function useCreateConversion() {
  const { getToken } = useSafeAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateConversionRequest) => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return createConversion(data, { headers: { Authorization: `Bearer ${token}` } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversions"] });
    },
  });
}
