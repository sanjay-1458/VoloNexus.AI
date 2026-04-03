"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { authApi } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  profile_picture?: string;
  preferences?: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isInternalAuthOperation = useRef(false);

  const refreshUser = useCallback(async () => {
    if (isInternalAuthOperation.current) return;

    if (
      typeof window !== "undefined" &&
      !localStorage.getItem("volonexus_session_start")
    ) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await authApi.me();
      setUser(data);
      if (!localStorage.getItem("volonexus_session_start")) {
        localStorage.setItem("volonexus_session_start", Date.now().toString());
      }
    } catch {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("volonexus_session_start");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser, pathname]);

  useEffect(() => {
    const checkSession = () => {
      const sessionStart = localStorage.getItem("volonexus_session_start");
      if (sessionStart && user && !isInternalAuthOperation.current) {
        const timeElapsed = Date.now() - parseInt(sessionStart, 10);
        if (timeElapsed >= SESSION_MAX_AGE_MS) handleUnauthorized();
      }
    };
    checkSession();
    const intervalId = setInterval(checkSession, 60000);
    return () => clearInterval(intervalId);
  }, [user]);

  const handleUnauthorized = useCallback(() => {
    const isAuthPage = pathname === "/login" || pathname === "/register";
    if (isAuthPage) return;

    setUser(null);
    localStorage.removeItem("volonexus_session_start");
    setSessionExpired(true);
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [handleUnauthorized]);

  const login = async (email: string, password: string): Promise<User> => {
    isInternalAuthOperation.current = true;
    try {
      const { data } = await authApi.login({ email, password });
      setUser(data.user);
      localStorage.setItem("volonexus_session_start", Date.now().toString());
      setSessionExpired(false);
      return data.user;
    } finally {
      isInternalAuthOperation.current = false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<User> => {
    isInternalAuthOperation.current = true;
    try {
      const { data } = await authApi.register({ name, email, password });
      setUser(data.user);
      localStorage.setItem("volonexus_session_start", Date.now().toString());
      setSessionExpired(false);
      return data.user;
    } finally {
      isInternalAuthOperation.current = false;
    }
  };

  const logout = async () => {
    isInternalAuthOperation.current = true;
    try {
      await authApi.logout();
    } catch (e) {}

    setUser(null);
    localStorage.removeItem("volonexus_session_start");
    isInternalAuthOperation.current = false;

    router.replace("/login");
  };

  const forceRelogin = () => {
    setSessionExpired(false);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
      {sessionExpired && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Session Expired
            </h2>
            <p className="text-mf-text-secondary mb-8">
              For security, sessions end after 24h. Please re-authenticate.
            </p>
            <button
              onClick={forceRelogin}
              className="w-full py-3.5 bg-mf-accent text-white font-bold rounded-xl active:scale-95 transition-transform"
            >
              Re-login to Continue
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}