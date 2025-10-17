"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { UserSummary } from "@/lib/types";
import { clearSession, getCurrentUser, loadSession, login as loginRequest, logout as logoutRequest, register as registerRequest } from "@/lib/auth";

interface SessionContextValue {
  user: UserSummary | null;
  loading: boolean;
  login: typeof loginRequest;
  register: typeof registerRequest;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const cached = loadSession();
        if (!cancelled && cached) {
          setUser(cached);
        }

        const profile = await getCurrentUser();
        if (!cancelled) {
          setUser(profile);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback<typeof loginRequest>(async (payload) => {
    setLoading(true);
    try {
      const profile = await loginRequest(payload);
      setUser(profile);
      return profile;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback<typeof registerRequest>(async (payload) => {
    setLoading(true);
    try {
      await registerRequest(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutRequest();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getCurrentUser();
      setUser(profile);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}

export function useRequireAuth() {
  const { user, loading } = useSession();
  if (loading) {
    return { authenticated: false, pending: true } as const;
  }
  return { authenticated: Boolean(user), pending: false, user } as const;
}

export function resetSessionCache() {
  clearSession();
}
