// src/providers/AuthContext.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/apiClient";

type AuthContextValue = {
  authed: boolean;
  uid: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: (silent?: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  const applyTokensToAxios = (tokens: { at?: string; client?: string; uid?: string }) => {
    const { at, client, uid } = tokens;
    if (at) api.defaults.headers.common["access-token"] = at; else delete api.defaults.headers.common["access-token"];
    if (client) api.defaults.headers.common["client"] = client; else delete api.defaults.headers.common["client"];
    if (uid) api.defaults.headers.common["uid"] = uid; else delete api.defaults.headers.common["uid"];
  };

  const saveTokens = (tokens: { at?: string; client?: string; uid?: string }) => {
    if (tokens.at) localStorage.setItem("access-token", tokens.at); else localStorage.removeItem("access-token");
    if (tokens.client) localStorage.setItem("client", tokens.client); else localStorage.removeItem("client");
    if (tokens.uid) localStorage.setItem("uid", tokens.uid); else localStorage.removeItem("uid");
  };

  const loadTokens = () => {
    const at = localStorage.getItem("access-token") ?? undefined;
    const client = localStorage.getItem("client") ?? undefined;
    const luid = localStorage.getItem("uid") ?? undefined;
    return { at, client, uid: luid };
  };

  const clearTokens = () => {
    saveTokens({ at: undefined, client: undefined, uid: undefined });
    applyTokensToAxios({ at: undefined, client: undefined, uid: undefined });
    setAuthed(false);
    setUid(null);
  };

  // 初期化
  useEffect(() => {
    const t = loadTokens();
    if (t.at && t.client && t.uid) {
      applyTokensToAxios(t);
      setAuthed(true);
      setUid(t.uid);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api.post("/api/auth/sign_in", { email, password });
    const at = typeof res.headers["access-token"] === "string" ? res.headers["access-token"] : undefined;
    const client = typeof res.headers["client"] === "string" ? res.headers["client"] : undefined;
    const headerUid = typeof res.headers["uid"] === "string" ? res.headers["uid"] : undefined;

    const uidResolved = headerUid ?? email;
    saveTokens({ at, client, uid: uidResolved });
    applyTokensToAxios({ at, client, uid: uidResolved });

    setAuthed(true);
    setUid(uidResolved);
  }, []);

  const signOut = useCallback(async (silent = false) => {
    try { await api.delete("/api/auth/sign_out"); } catch {}
    finally {
      clearTokens();
      if (!silent) window.location.replace("/login");
    }
  }, []);

  // 401で自動ログアウト
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error?.response?.status === 401) {
          clearTokens();
          window.location.replace("/login");
        }
        return Promise.reject(error);
      }
    );
    return () => { api.interceptors.response.eject(id); };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ authed, uid, signIn, signOut }), [authed, uid, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}