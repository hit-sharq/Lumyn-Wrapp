import { useAuth } from "@clerk/clerk-react";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const hasValidClerkKey = !!(clerkPubKey && clerkPubKey.startsWith("pk_"));

interface SafeAuth {
  getToken: () => Promise<string | null>;
  isLoaded: boolean;
  isSignedIn: boolean | null | undefined;
}

function useClerkAuth(): SafeAuth {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  return { getToken, isLoaded, isSignedIn };
}

function useMockAuth(): SafeAuth {
  return {
    getToken: async () => null,
    isLoaded: true,
    isSignedIn: false,
  };
}

export const useSafeAuth: () => SafeAuth = hasValidClerkKey ? useClerkAuth : useMockAuth;
