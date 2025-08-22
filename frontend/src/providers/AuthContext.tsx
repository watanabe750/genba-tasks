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
  signIn: (email: string, password: string) => Promise<void>;
  signOut: (silent?: boolean) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

/** リクエスト開始時刻を渡す自前ヘッダ（並行リクエストの競合回避用） */
const REQ_TIME_HEADER = "x-auth-start";

/** AxiosHeaders/素オブジェクト両対応でヘッダから文字列を安全に取得 */
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

  // 古いリクエスト由来なら上書きしない
  if (startedAtMs < lastSavedAtRef.current) return;

  save({ at, client, uid });
  apply({ at, client, uid });
  lastSavedAtRef.current = startedAtMs;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ★ 初期値を localStorage から同期で決定（初回リダイレクトを防ぐ）
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
  }, [saveTokens, applyTokensToAxios]);

  // 初回描画前に axios に同期適用（初回の /api/tasks が 401 にならないように）
  if (initialTokens.at && initialTokens.client && initialTokens.uid) {
    api.defaults.headers.common["access-token"] = initialTokens.at;
    api.defaults.headers.common["client"] = initialTokens.client;
    api.defaults.headers.common["uid"] = initialTokens.uid;
  }

  // 初期化：axios へのヘッダ適用（初回レンダー後に一度だけ）
  useEffect(() => {
    if (initialTokens.at && initialTokens.client && initialTokens.uid) {
      applyTokensToAxios(initialTokens);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const startedAt = Date.now();
      const res = await api.post("/auth/sign_in", { email, password });

      // レスポンスに新トークンが来ていれば保存
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
    },
    [applyTokensToAxios, saveTokens]
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
    // 各リクエストに開始時刻を埋め込む
    const reqId = api.interceptors.request.use((config) => {
      const headers = AxiosHeaders.from(config.headers);
      headers.set(REQ_TIME_HEADER, String(Date.now()));
      config.headers = headers;
      return config;
    });

    const resId = api.interceptors.response.use(
      (res) => {
        // 成功レスポンス時：新トークンがあれば保存（並行競合防止）
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

  // ★ タブ間同期：他タブのログイン/ログアウトに追従
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

  const value = useMemo<AuthContextValue>(
    () => ({ authed, uid, signIn, signOut }),
    [authed, uid, signIn, signOut]
  );

  // ★ 同一タブ内のトークン回転を拾う
  useEffect(() => {
    const onRefresh = () => {
      const t = loadTokens();
      const complete = !!(t.at && t.client && t.uid);
      if (complete) {
        applyTokensToAxios(t);
        setAuthed(true);
        setUid(t.uid ?? null);
      } else {
        // 何かの拍子に欠けていたらクリア
        clearTokens();
      }
    };

    window.addEventListener("auth:refresh", onRefresh);
    // ついでにフォーカス復帰時も再適用しておくと堅い
    window.addEventListener("focus", onRefresh);
    return () => {
      window.removeEventListener("auth:refresh", onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, [applyTokensToAxios, clearTokens, loadTokens]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
