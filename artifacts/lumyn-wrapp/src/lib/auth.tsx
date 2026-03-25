import { createContext, useContext, ReactNode } from "react";

interface AuthContextType {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null | undefined;
}

const AuthContext = createContext<AuthContextType>({
  isSignedIn: false,
  isLoaded: true,
  userId: null,
});

export function NoAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ isSignedIn: false, isLoaded: true, userId: null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthStatus() {
  return useContext(AuthContext);
}
