import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  endSession,
  hasStoredSession,
  loadCurrentUser,
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  revokeSessionOnServer,
  setSession,
  signup as apiSignup,
  subscribeTokenChanges,
  type UserProfile,
} from "@/lib/auth";

export interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password1: string, password2: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-fetch the profile (e.g. after Stripe checkout updates the subscription). */
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  const reloadUser = useCallback(async () => {
    try {
      const profile = await loadCurrentUser();
      if (mounted.current) setUser(profile);
    } catch {
      // Transient error (network, 5xx). Keep prior state — do not log out.
    }
  }, []);

  // Bootstrap.
  useEffect(() => {
    mounted.current = true;
    void (async () => {
      await reloadUser();
      if (mounted.current) setIsLoading(false);
    })();
    return () => {
      mounted.current = false;
    };
  }, [reloadUser]);

  // Cross-tab sync: another tab logged in or out.
  useEffect(() => subscribeTokenChanges(() => void reloadUser()), [reloadUser]);

  // Profile refetch when the user returns to the tab — covers the Stripe
  // checkout round-trip, where `has_active_subscription` flips server-side
  // via webhook while the user is away.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (!hasStoredSession()) return;
      void reloadUser();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [reloadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { tokens, user: profile } = await apiLogin(email, password);
    setSession(tokens);
    setUser(profile);
  }, []);

  const signup = useCallback(
    async (email: string, password1: string, password2: string) => {
      const { tokens, user: profile } = await apiSignup(email, password1, password2);
      setSession(tokens);
      setUser(profile);
    },
    [],
  );

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const { tokens, user: profile } = await apiLoginWithGoogle(idToken);
    setSession(tokens);
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    // Clear local state first so the UI updates immediately and a hung
    // /logout/ call can never trap the user in a logged-in state.
    endSession();
    setUser(null);
    queryClient.clear();
    await revokeSessionOnServer();
  }, [queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        logout,
        refreshUser: reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
