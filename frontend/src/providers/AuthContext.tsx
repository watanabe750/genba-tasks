/* eslint-disable react-refresh/only-export-components */
import type React from "react";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { api } from "../lib/apiClient";
import {
  AxiosHeaders,
  type AxiosResponseHeaders,
  type RawAxiosResponseHeaders,
} from "axios";

export type AuthContextValue = {
  authed: boolean;
  uid: string | null;
  name: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: (silent?: boolean) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

/** リクエスト開始時刻（並行競合回避用） */
const REQ_TIME_HEADER = "x-auth-start";

/** AxiosHeaders/素オブジェクト両対応でヘッダから文字列を取得 */
function getHeaderString(h: unknown, key: string): string | undefined {
  if (h instanceof AxiosHeaders) {
    const v = h.get(key);
    return typeof v === "string" ? v : undefined;
  }
  const rec = h as Record<string, unknown> | undefined;
  const v = rec?.[key];
  return typeof v === "string" ? v : undefined;
}

/** レスポンスのトークンを（新しいリクエスト由来のときだけ）保存 */
function saveTokensFromHeaders(
  headers: AxiosResponseHeaders | RawAxiosResponseHeaders,
  startedAtMs: number,
  lastSavedAtRef: React.MutableRefObject<number>,
  apply: (t: { at?: string; client?: string; uid?: string }) => void,
  save: (t: { at?: string; client?: string; uid?: string }) => void
) {
  const at = getHeaderString(headers, "access-token");
  const client = getHeaderString(headers, "client");
  const uid = getHeaderString(headers, "uid");
  if (!at || !client || !uid) return;
  if (startedAtMs < lastSavedAtRef.current) return; // 古いリクエストは破棄
  save({ at, client, uid });
  apply({ at, client, uid });
  lastSavedAtRef.current = startedAtMs;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 初期トークンを同期取得（初回の API を 401 にしない）
  const initialTokens = (() => {
    try {
      const at = localStorage.getItem("access-token") ?? undefined;
      const client = localStorage.getItem("client") ?? undefined;
      const luid = localStorage.getItem("uid") ?? undefined;
      return { at, client, uid: luid };
    } catch {
      return { at: undefined, client: undefined, uid: undefined };
    }
  })();

  const [authed, setAuthed] = useState<boolean>(
    !!(initialTokens.at && initialTokens.client && initialTokens.uid)
  );
  const [uid, setUid] = useState<string | null>(initialTokens.uid ?? null);
  const [name, setName] = useState<string | null>(null);

  const lastSavedAtRef = useRef(0);

  const applyTokensToAxios = useCallback(
    (tokens: { at?: string; client?: string; uid?: string }) => {
      const { at, client, uid } = tokens;
      if (at) api.defaults.headers.common["access-token"] = at;
      else delete api.defaults.headers.common["access-token"];
      if (client) api.defaults.headers.common["client"] = client;
      else delete api.defaults.headers.common["client"];
      if (uid) api.defaults.headers.common["uid"] = uid;
      else delete api.defaults.headers.common["uid"];
    },
    []
  );

  const saveTokens = useCallback(
    (tokens: { at?: string; client?: string; uid?: string }) => {
      if (tokens.at) localStorage.setItem("access-token", tokens.at);
      else localStorage.removeItem("access-token");
      if (tokens.client) localStorage.setItem("client", tokens.client);
      else localStorage.removeItem("client");
      if (tokens.uid) localStorage.setItem("uid", tokens.uid);
      else localStorage.removeItem("uid");
    },
    []
  );

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
    setName(null);
  }, [saveTokens, applyTokensToAxios]);

  // ★ 親の初回実行タイミングで axios に同期適用（子のフックより先に走る）
  if (initialTokens.at && initialTokens.client && initialTokens.uid) {
    api.defaults.headers.common["access-token"] = initialTokens.at;
    api.defaults.headers.common["client"] = initialTokens.client;
    api.defaults.headers.common["uid"] = initialTokens.uid;
  }

  // 初期化：一度だけ defaults を再適用
  useEffect(() => {
    if (initialTokens.at && initialTokens.client && initialTokens.uid) {
      applyTokensToAxios(initialTokens);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // /me 取得
  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get("/me");
      setName(res.data?.name ?? null);
      if (typeof res.data?.email === "string" && !uid) {
        setUid(res.data.email);
      }
    } catch {
      /* 401 等はレスポンス側で処理 */
    }
  }, [uid]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const startedAt = Date.now();
      const res = await api.post("/auth/sign_in", { email, password });

      saveTokensFromHeaders(
        res.headers as AxiosResponseHeaders & RawAxiosResponseHeaders,
        startedAt,
        lastSavedAtRef,
        applyTokensToAxios,
        saveTokens
      );

      const headerUid =
        typeof res.headers["uid"] === "string" ? res.headers["uid"] : undefined;
      setAuthed(true);
      setUid(headerUid ?? email);
      fetchMe();
    },
    [applyTokensToAxios, saveTokens, fetchMe]
  );

  const signOut = useCallback(
    async (silent = false) => {
      try {
        await api.delete("/auth/sign_out");
      } catch {
        /* ignore */
      } finally {
        if (!silent) {
          try {
            const p =
              window.location.pathname +
              window.location.search +
              window.location.hash;
            if (p.startsWith("/") && !p.startsWith("//")) {
              sessionStorage.setItem("auth:from", p);
            }
          } catch {
            /* ignore */
          }
        }
        clearTokens();
        try {
          window.dispatchEvent(new Event("auth:logout"));
        } catch {
          /* ignore */
        }
        if (!silent) window.location.replace("/login");
      }
    },
    [clearTokens]
  );

  // リクエスト/レスポンスのインターセプタ
  useEffect(() => {
    // ★ 各リクエスト直前に localStorage からも再注入（堅牢性UP）
    const reqId = api.interceptors.request.use((config) => {
      const headers = AxiosHeaders.from(config.headers);

      // auth ヘッダを都度同期
      const at = localStorage.getItem("access-token");
      const client = localStorage.getItem("client");
      const luid = localStorage.getItem("uid");
      if (at && client && luid) {
        headers.set("access-token", at);
        headers.set("client", client);
        headers.set("uid", luid);
      }

      // 競合回避用タイムスタンプ
      headers.set(REQ_TIME_HEADER, String(Date.now()));
      config.headers = headers;
      return config;
    });

    const resId = api.interceptors.response.use(
      (res) => {
        const startedAtStr = getHeaderString(
          res.config.headers as unknown,
          REQ_TIME_HEADER
        );
        const startedAtMs = startedAtStr ? Number(startedAtStr) : Date.now();

        saveTokensFromHeaders(
          res.headers as AxiosResponseHeaders & RawAxiosResponseHeaders,
          startedAtMs,
          lastSavedAtRef,
          applyTokensToAxios,
          saveTokens
        );
        return res;
      },
      async (error) => {
        if (error?.response?.status === 401) {
          try {
            const p =
              window.location.pathname +
              window.location.search +
              window.location.hash;
            if (p.startsWith("/") && !p.startsWith("//")) {
              sessionStorage.setItem("auth:from", p);
            }
            sessionStorage.setItem("auth:expired", "1");
          } catch {
            /* ignore */
          }
          clearTokens();
          try {
            window.dispatchEvent(new Event("auth:logout"));
          } catch {
            /* ignore */
          }
          window.location.replace("/login");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, [applyTokensToAxios, saveTokens, clearTokens]);

  // タブ間同期：他タブのログイン/ログアウト
  useEffect(() => {
    const onStorage = () => {
      const t = loadTokens();
      const complete = !!(t.at && t.client && t.uid);
      if (complete) {
        applyTokensToAxios(t);
        setAuthed(true);
        setUid(t.uid ?? null);
        fetchMe();
      } else {
        clearTokens();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [applyTokensToAxios, clearTokens, loadTokens, fetchMe]);

  // 初回：認証済みなら /me
  useEffect(() => {
    if (authed) fetchMe();
  }, [authed, fetchMe]);

  // 同一タブ内のトークン更新
  useEffect(() => {
    const onRefresh = () => {
      const t = loadTokens();
      const complete = !!(t.at && t.client && t.uid);
      if (complete) {
        applyTokensToAxios(t);
        setAuthed(true);
        setUid(t.uid ?? null);
        fetchMe();
      } else {
        clearTokens();
      }
    };
    window.addEventListener("auth:refresh", onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      window.removeEventListener("auth:refresh", onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, [applyTokensToAxios, clearTokens, loadTokens, fetchMe]);

  const value = useMemo<AuthContextValue>(
    () => ({ authed, uid, name, signIn, signOut }),
    [authed, uid, name, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
