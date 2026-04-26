"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { UserRole } from "@/types/auth";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const decodeJwtExpiry = (token: string): number | null => {
      try {
        const payloadPart = token.split(".")[1];
        if (!payloadPart) return null;

        const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64)) as { exp?: number };

        return typeof payload.exp === "number" ? payload.exp * 1000 : null;
      } catch {
        return null;
      }
    };

    const clearAuth = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    };

    const hydrateAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
          clearAuth();
          return;
        }

        const expiry = decodeJwtExpiry(token);
        if (expiry !== null && expiry <= Date.now()) {
          clearAuth();
          return;
        }

        setUser(JSON.parse(storedUser) as AuthUser);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    const onAuthChanged = () => {
      hydrateAuth();
    };

    hydrateAuth();
    window.addEventListener("auth-changed", onAuthChanged);

    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-changed"));
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
