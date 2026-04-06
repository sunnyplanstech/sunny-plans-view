import { createContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
  fetchUserProfile,
  refreshTokens,
  type UserProfile,
  type AuthError,
} from "@/lib/auth";
import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenExpired } from "@/lib/jwt";

export interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password1: string, password2: string) => Promise<void>;
  logout: () => Promise<void>;
  openAuthModal: (tab?: "login" | "signup") => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalTab: "login" | "signup";
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "signup">("login");

  // Bootstrap: check stored tokens on mount
  useEffect(() => {
    (async () => {
      try {
        let access = getAccessToken();
        const refresh = getRefreshToken();

        if (!access && !refresh) return;

        if (!access || isTokenExpired(access)) {
          if (!refresh) {
            clearTokens();
            return;
          }
          const tokens = await refreshTokens(refresh);
          setTokens(tokens.access, tokens.refresh);
          access = tokens.access;
        }

        const profile = await fetchUserProfile(access);
        setUser(profile);
      } catch {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { tokens, user: profile } = await apiLogin({ email, password });
    setTokens(tokens.access, tokens.refresh);
    setUser(profile);
    setAuthModalOpen(false);
  }, []);

  const signup = useCallback(async (email: string, password1: string, password2: string) => {
    const { tokens, user: profile } = await apiSignup({ email, password1, password2 });
    setTokens(tokens.access, tokens.refresh);
    setUser(profile);
    setAuthModalOpen(false);
  }, []);

  const logout = useCallback(async () => {
    const refresh = getRefreshToken();
    if (refresh) await apiLogout(refresh);
    clearTokens();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const openAuthModal = useCallback((tab: "login" | "signup" = "login") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalTab,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
