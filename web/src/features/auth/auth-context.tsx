import { createContext, useContext, useMemo, useState } from "react";
import type { AuthUser, Role } from "./auth-types";
import { clearAuth, loadAuth, saveAuth } from "./auth-storage";
import * as authApi from "./auth-api";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  isAuthed: boolean;
  role: Role | null;
  login: (email: string, password: string) => Promise<void>;
  register: (run: string, email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initial = loadAuth();
  const [token, setToken] = useState<string | null>(initial.token);
  const [user, setUser] = useState<AuthUser | null>(initial.user);

  const value = useMemo<AuthState>(() => {
    return {
      token,
      user,
      isAuthed: !!token && !!user,
      role: user?.role ?? null,
      login: async (email, password) => {
        const { token, user } = await authApi.login(email, password);
        saveAuth(token, user);
        setToken(token);
        setUser(user);
      },
      register: async (run, email, password, fullName) => {
        const { token, user } = await authApi.register(run, email, password, fullName);
        saveAuth(token, user);
        setToken(token);
        setUser(user);
      },
      logout: () => {
        clearAuth();
        setToken(null);
        setUser(null);
      },
    };
  }, [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
