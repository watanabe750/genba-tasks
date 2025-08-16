/* eslint-disable react-refresh/only-export-components */
import type React from "react";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../lib/apiClient";

export type AuthContextValue = {
  authed: boolean;
  uid: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: (silent?: boolean) => Promise<void>;
};

// ★ これを必ず “named export” で出す！
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  const applyTokensToAxios = useCallback((tokens: { at?: string; client?: string; uid?: string }) => {
    const { at, client, uid } = tokens;
    if (at) api.defaults.headers.common["access-token"] = at; else delete api.defaults.headers.common["access-token"];
    if (client) api.defaults.headers.common["client"] = client; else delete api.defaults.headers.common["client"];
    if (uid) api.defaults.headers.common["uid"] = uid; else delete api.defaults.headers.common["uid"];
  }, []);

  const saveTokens = useCallback((tokens: { at?: string; client?: string; uid?: string }) => {
    if (tokens.at) localStorage.setItem("access-token", tokens.at); else localStorage.removeItem("access-token");
    if (tokens.client) localStorage.setItem("client", tokens.client); else localStorage.removeItem("client");
    if (tokens.uid) localStorage.setItem("uid", tokens.uid); else localStorage.removeItem("uid");
  }, []);

  const loadTokens = useCallback(() => {
    const at = localStorage.getItem("access-token") ?? undefined;
    const client = localStorage.getItem("client") ?? undefined;
    const luid = localStorage.getItem("uid") ?? undefined;
    return { at, client, uid: luid };
  }, []);

  const clearTokens = useCallback(() => {
    saveTokens({ at: undefined, client: undefined, uid: undefined });
    applyTokensToAxios({ at: undefined, client: undefined, uid: undefined });
    setAuthed(false);
    setUid(null);
  }, [saveTokens, applyTokensToAxios]);

  // 初期化
  useEffect(() => {
    const t = loadTokens();
    if (t.at && t.client && t.uid) {
      applyTokensToAxios(t);
      setAuthed(true);
      setUid(t.uid);
    }
  }, [loadTokens, applyTokensToAxios]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api.post("/auth/sign_in", { email, password });
    const at = typeof res.headers["access-token"] === "string" ? res.headers["access-token"] : undefined;
    const client = typeof res.headers["client"] === "string" ? res.headers["client"] : undefined;
    const headerUid = typeof res.headers["uid"] === "string" ? res.headers["uid"] : undefined;
    const uidResolved = headerUid ?? email;

    saveTokens({ at, client, uid: uidResolved });
    applyTokensToAxios({ at, client, uid: uidResolved });

    setAuthed(true);
    setUid(uidResolved);
  }, [applyTokensToAxios, saveTokens]);

  const signOut = useCallback(async (silent = false) => {
    try { await api.delete("/auth/sign_out"); } catch { void 0; }    
    finally {
        if (!silent) {
            try {
                const p = window.location.pathname + window.location.search + window.location.hash;
                if (p.startsWith("/") && !p.startsWith("//")) {
                    sessionStorage.setItem("auth:from", p);
                }
            } catch { /* ignore */}
        }
        clearTokens();
        if (!silent) window.location.replace("/login");
    }
  }, [clearTokens]);

  // 401は自動ログアウト
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error?.response?.status === 401) {
            try { 
                // ログイン前にいた場所を保存（相対パスのみ）
                const p = window.location.pathname + window.location.search + window.location.hash;
                if (p.startsWith("/") && !p.startsWith("//")) {
                    sessionStorage.setItem("auth:from", p);
                }
                sessionStorage.setItem("auth:expired", "1");
            } catch {/* ignore */}
            clearTokens();
            window.location.replace("/login");
        }
        return Promise.reject(error);
      }
    );
    return () => { api.interceptors.response.eject(id); };
  }, [clearTokens]);

  // ★ タブ間同期（他タブでログイン/ログアウトしたら追従）
  useEffect(() => {
    const onStorage = () => {
        const t = loadTokens();
        const complete = !!(t.at && t.client && t.uid);
        if (complete) {
            applyTokensToAxios(t);
            setAuthed(true);
            setUid(t.uid ?? null);
        } else {
            clearTokens();
        }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    }, [applyTokensToAxios, clearTokens, loadTokens]);

  const value = useMemo<AuthContextValue>(() => ({ authed, uid, signIn, signOut }), [authed, uid, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
