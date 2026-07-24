"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { api, setAccessToken, setAuthFailureHandler } from "@/lib/api";
import BrandLogo from "@/components/BrandLogo";

const AuthContext = createContext(null);
let bootstrapPromise;

function loadSession() {
  if (!bootstrapPromise) bootstrapPromise = api("/auth/refresh-token", { method: "POST" });
  return bootstrapPromise;
}

function AuthLoadingScreen() {
  return <main className="grid min-h-screen place-items-center bg-[#f7f6f2] px-6 dark:bg-[#101816]" role="status" aria-live="polite" aria-label="Đang kiểm tra phiên đăng nhập">
    <div className="text-center">
      <BrandLogo priority className="mx-auto h-24 w-24 rounded-[26px] shadow-card ring-1 ring-slate-200 dark:ring-slate-700" />
      <h1 className="mt-5 font-serif text-2xl font-black">ACME Library</h1>
      <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="animate-spin text-emerald-700" size={18} />Đang kiểm tra phiên đăng nhập...</p>
    </div>
  </main>;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setAuthFailureHandler(() => {
      setAccessToken(null);
      if (active) setUser(null);
    });
    loadSession()
      .then((data) => {
        if (!active) return;
        setAccessToken(data.accessToken);
        setUser(data.user);
      })
      .catch(() => {
        if (!active) return;
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      setAuthFailureHandler(null);
    };
  }, []);

  const login = async (values) => {
    setAuthBusy(true);
    try {
      const data = await api("/auth/login", { method: "POST", body: values });
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data;
    } finally {
      setAuthBusy(false);
    }
  };

  const register = async (values) => {
    setAuthBusy(true);
    try {
      const data = await api("/auth/register", { method: "POST", body: values });
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data;
    } finally {
      setAuthBusy(false);
    }
  };

  const logout = async () => {
    setAuthBusy(true);
    try {
      await api("/auth/logout", { method: "POST" }).catch(() => {});
    } finally {
      setAccessToken(null);
      setUser(null);
      setAuthBusy(false);
    }
  };

  const value = { user, setUser, loading, authBusy, login, register, logout, isAdmin: ["ADMIN", "SUPER_ADMIN"].includes(user?.role) };
  return <AuthContext.Provider value={value}>{loading ? <AuthLoadingScreen /> : children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
