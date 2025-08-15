// src/providers/AuthContext.tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/apiClient";

type AuthContextValue = {
  authed: boolean;
  uid: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: (silent?: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  // ローカルストレージにあるトークンがあれば axios に復元
  useEffect(() => {
    const at = localStorage.getItem("access-token");
    const client = localStorage.getItem("client");
    const luid = localStorage.getItem("uid");
    if (at && client && luid) {
      api.defaults.headers.common["access-token"] = at;
      api.defaults.headers.common["client"] = client;
      api.defaults.headers.common["uid"] = luid;
      setAuthed(true);
      setUid(luid);
    }
  }, []);

  const clearTokens = () => {
    delete api.defaults.headers.common["access-token"];
    delete api.defaults.headers.common["client"];
    delete api.defaults.headers.common["uid"];
    localStorage.removeItem("access-token");
    localStorage.removeItem("client");
    localStorage.removeItem("uid");
    setAuthed(false);
    setUid(null);
  };

  const signIn = useCallback(async (email: string, password: string) => {
    // devise_token_auth: POST /api/auth/sign_in
    const res = await api.post("/api/auth/sign_in", { email, password });

    // ヘッダー型トークン対応
    const at = res.headers["access-token"];
    const client = res.headers["client"];
    const luid = res.headers["uid"] || email; // header無い場合の保険

    if (at && client && luid) {
      localStorage.setItem("access-token", at);
      localStorage.setItem("client", client);
      localStorage.setItem("uid", String(luid));
      api.defaults.headers.common["access-token"] = at;
      api.defaults.headers.common["client"] = client;
      api.defaults.headers.common["uid"] = String(luid);
    }
    // Cookieベースの場合は withCredentials によりCookieセット済みなのでOK

    setAuthed(true);
    setUid(String(luid));
  }, []);

  const signOut = useCallback(
    async (silent = false) => {
      try {
        // devise_token_auth: DELETE /api/auth/sign_out
        await api.delete("/api/auth/sign_out");
      } catch {
        // ネットワーク落ちなどは握りつぶす
      } finally {
        clearTokens();
        if (!silent) nav("/login", { replace: true });
      }
    },
    [nav]
  );

  // 401で自動ログアウト
  useEffect(() => {
    const id = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error?.response?.status === 401) {
          clearTokens();
          nav("/login", { replace: true, state: { from: location } });
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.response.eject(id);
    };
  }, [nav]);

  const value = useMemo<AuthContextValue>(
    () => ({
      authed,
      uid,
      signIn,
      signOut,
    }),
    [authed, uid, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}