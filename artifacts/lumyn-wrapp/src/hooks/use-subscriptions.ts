import { useQuery, useMutation } from "@tanstack/react-query";
import {
  listPlans,
  getMySubscription,
  createCheckout,
  subscriptionCallback,
} from "@workspace/api-client-react";
import { useSafeAuth } from "./use-safe-auth";

export function usePlans() {
  return useQuery({
    queryKey: ["/api/plans"],
    queryFn: () => listPlans(),
  });
}

export function useMySubscription() {
  const { getToken, isLoaded, isSignedIn } = useSafeAuth();

  return useQuery({
    queryKey: ["/api/subscriptions/me"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return getMySubscription({ headers: { Authorization: `Bearer ${token}` } });
    },
    enabled: isLoaded && !!isSignedIn,
  });
}

export function useCreateCheckout() {
  const { getToken } = useSafeAuth();

  return useMutation({
    mutationFn: async (planId: string) => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return createCheckout({ planId }, { headers: { Authorization: `Bearer ${token}` } });
    },
  });
}

export function useSubscriptionCallback(trackingId?: string, merchantRef?: string) {
  const { getToken } = useSafeAuth();

  return useQuery({
    queryKey: ["/api/subscriptions/callback", trackingId, merchantRef],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No auth token");
      return subscriptionCallback(
        { OrderTrackingId: trackingId, OrderMerchantReference: merchantRef },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    enabled: !!trackingId && !!merchantRef,
  });
}
