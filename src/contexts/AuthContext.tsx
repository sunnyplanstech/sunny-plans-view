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
  signup: (email: string, password1: string, password2: string, turnstileToken?: string) => Promise<void>;
  loginWithGoogle: (code: string) => Promise<void>;
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

  // Session-change sync: fires on cross-tab login/logout AND on same-tab
  // terminal refresh failures (ensureAccessToken clears tokens internally
  // and broadcasts via clearStoredTokens). Reload the profile *and* drop
  // the React Query cache — premium payloads from a previous identity
  // must not survive a session flip.
  useEffect(
    () =>
      subscribeTokenChanges(() => {
        queryClient.clear();
        void reloadUser();
      }),
    [reloadUser, queryClient],
  );

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

  const login = useCallback(
    async (email: string, password: string) => {
      const { tokens, user: profile } = await apiLogin(email, password);
      // Drop any data fetched anonymously — symmetric to logout. Without
      // this, listing queries cached as the anon user (with `****`
      // placeholders) stay live until natural staleness.
      queryClient.clear();
      setSession(tokens);
      setUser(profile);
    },
    [queryClient],
  );

  const signup = useCallback(
    async (email: string, password1: string, password2: string, turnstileToken?: string) => {
      // Discard the tokens dj-rest-auth returns. The user must verify
      // their email and explicitly log in — otherwise Register would
      // silently authenticate them and they'd enter the app with
      // email_verified=false, bypassing the /check-your-email gate.
      await apiSignup(email, password1, password2, turnstileToken);
    },
    [],
  );

  const loginWithGoogle = useCallback(
    async (code: string) => {
      const { tokens, user: profile } = await apiLoginWithGoogle(code);
      queryClient.clear();
      setSession(tokens);
      setUser(profile);
    },
    [queryClient],
  );

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
