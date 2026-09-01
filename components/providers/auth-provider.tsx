"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth/session";
import type { SignInInput, SignUpInput } from "@/lib/validations/auth";
import type { ApiResponse } from "@/types/api";

interface AuthContextType {
  user: SessionUser | null;
  isLoading: boolean;
  login: (data: SignInInput) => Promise<{ success: boolean; error?: string }>;
  register: (data: SignUpInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data: ApiResponse<{ user: SessionUser | null }> = await res.json();
      if (data.success && data.data.user) {
        setUser(data.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data: ApiResponse<{ user: SessionUser | null }> = await res.json();
        if (isMounted) {
          if (data.success && data.data.user) {
            setUser(data.data.user);
          } else {
            setUser(null);
          }
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (data: SignInInput) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json: ApiResponse<{ user: SessionUser }> = await res.json();

      if (!json.success) {
        return { success: false, error: json.error.message };
      }

      setUser(json.data.user);
      router.refresh();
      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to connect to authentication service";
      return { success: false, error: message };
    }
  };

  const register = async (data: SignUpInput) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json: ApiResponse<{ user: SessionUser }> = await res.json();

      if (!json.success) {
        return { success: false, error: json.error.message };
      }

      setUser(json.data.user);
      router.refresh();
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to register account";
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, refreshUser: fetchCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
