import { useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSyncUser } from "@/hooks/use-users";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const hasValidClerkKey = !!(clerkPubKey && clerkPubKey.startsWith("pk_"));

function AuthSyncInner() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { mutateAsync: syncUser } = useSyncUser();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user && !hasSynced.current) {
      hasSynced.current = true;
      syncUser({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: user.fullName || "Unknown",
        imageUrl: user.imageUrl,
      }).catch(() => {
        hasSynced.current = false;
      });
    }
  }, [isLoaded, isSignedIn, user, syncUser]);

  return null;
}

export function AuthSync() {
  if (!hasValidClerkKey) return null;
  return <AuthSyncInner />;
}
