/* eslint-disable react-refresh/only-export-components */
import type React from "react";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../lib/apiClient";
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

/** リクエスト開始時刻（並行競合対策） */
const REQ_TIME_HEADER = "x-auth-start";

/** E2E 実行中かどうか（Playwright/Headless を検知） */
const IS_E2E =
  typeof navigator !== "undefined" &&
  (((navigator as any).webdriver ?? false) ||
    /Playwright|Headless/i.test(navigator.userAgent));

type TokenBundle = {
  at?: string;
  client?: string;
  uid?: string;
  tokenType?: string;
  expiry?: string;
};

function getHeaderString(h: unknown, key: string): string | undefined {
  if (h instanceof AxiosHeaders) {
    const v = h.get(key) ?? h.get(key.toLowerCase());
    return typeof v === "string" ? v : undefined;
  }
  const rec = h as Record<string, unknown> | undefined;
  const v = rec?.[key] ?? rec?.[key.toLowerCase()];
  return typeof v === "string" ? v : undefined;
}

/** レスポンスヘッダからトークン抽出→保存＆適用（startedAt で競合勝者を決める） */
function saveTokensFromHeaders(
  headers: AxiosResponseHeaders | RawAxiosResponseHeaders,
  startedAtMs: number,
  lastSavedAtRef: React.MutableRefObject<number>,
  apply: (t: TokenBundle) => void,
  save: (t: TokenBundle) => void
) {
  const at = getHeaderString(headers, "access-token");
  const client = getHeaderString(headers, "client");
  const uid = getHeaderString(headers, "uid");
  const tokenType = getHeaderString(headers, "token-type");
  const expiry = getHeaderString(headers, "expiry");

  if (!at || !client || !uid) return;
  if (startedAtMs < lastSavedAtRef.current) return;

  const t: TokenBundle = { at, client, uid, tokenType, expiry };
  save(t);
  apply(t);
  lastSavedAtRef.current = startedAtMs;
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  // ---- 初期トークン読み込み ----
  const initialTokens: TokenBundle = (() => {
    try {
      return {
        at: localStorage.getItem("access-token") ?? undefined,
        client: localStorage.getItem("client") ?? undefined,
        uid: localStorage.getItem("uid") ?? undefined,
        tokenType: localStorage.getItem("token-type") ?? undefined,
        expiry: localStorage.getItem("expiry") ?? undefined,
      };
    } catch {
      return {};
    }
  })();

  const [authed, setAuthed] = useState<boolean>(
    !!(initialTokens.at && initialTokens.client && initialTokens.uid)
  );
  const [uid, setUid] = useState<string | null>(initialTokens.uid ?? null);
  const [name, setName] = useState<string | null>(null);

  const lastSavedAtRef = useRef(0);

  // ---- ユーティリティ ----
  const applyTokensToAxios = useCallback((tokens: TokenBundle) => {
    const { at, client, uid, tokenType } = tokens;
    const type = tokenType || localStorage.getItem("token-type") || "Bearer";

    if (at) {
      (api.defaults.headers.common as any)["access-token"] = at;
      (api.defaults.headers.common as any)["Authorization"] = `${type} ${at}`;
      (api.defaults.headers.common as any)["token-type"] = type;
    } else {
      delete (api.defaults.headers.common as any)["access-token"];
      delete (api.defaults.headers.common as any)["Authorization"];
      delete (api.defaults.headers.common as any)["token-type"];
    }

    if (client) (api.defaults.headers.common as any)["client"] = client;
    else delete (api.defaults.headers.common as any)["client"];

    if (uid) (api.defaults.headers.common as any)["uid"] = uid;
    else delete (api.defaults.headers.common as any)["uid"];
  }, []);

  const saveTokens = useCallback((tokens: TokenBundle) => {
    if (tokens.at) localStorage.setItem("access-token", tokens.at);
    else localStorage.removeItem("access-token");

    if (tokens.client) localStorage.setItem("client", tokens.client);
    else localStorage.removeItem("client");

    if (tokens.uid) localStorage.setItem("uid", tokens.uid);
    else localStorage.removeItem("uid");

    if (tokens.tokenType) localStorage.setItem("token-type", tokens.tokenType);
    else localStorage.removeItem("token-type");

    if (tokens.expiry) localStorage.setItem("expiry", tokens.expiry);
    else localStorage.removeItem("expiry");
  }, []);

  const loadTokens = useCallback((): TokenBundle => {
    return {
      at: localStorage.getItem("access-token") ?? undefined,
      client: localStorage.getItem("client") ?? undefined,
      uid: localStorage.getItem("uid") ?? undefined,
      tokenType: localStorage.getItem("token-type") ?? undefined,
      expiry: localStorage.getItem("expiry") ?? undefined,
    };
  }, []);

  const clearTokens = useCallback(() => {
    saveTokens({});
    applyTokensToAxios({});
    setAuthed(false);
    setUid(null);
    setName(null);
  }, [saveTokens, applyTokensToAxios]);

  // 初期トークンを axios に適用
  useEffect(() => {
    if (initialTokens.at && initialTokens.client && initialTokens.uid) {
      applyTokensToAxios(initialTokens);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get("me");
      setName(res.data?.name ?? null);
      if (typeof res.data?.email === "string" && !uid) setUid(res.data.email);
    } catch {
      /* ignore */
    }
  }, [uid]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const startedAt = Date.now();
      const res = await api.post("auth/sign_in", { email, password });

      saveTokensFromHeaders(
        (res.headers as AxiosResponseHeaders) ||
          (res.headers as RawAxiosResponseHeaders),
        startedAt,
        lastSavedAtRef,
        applyTokensToAxios,
        saveTokens
      );

      const headerUid =
        typeof (res.headers as any)["uid"] === "string"
          ? (res.headers as any)["uid"]
          : undefined;

      setAuthed(true);
      setUid(headerUid ?? email);
      fetchMe();
    },
    [applyTokensToAxios, saveTokens, fetchMe]
  );

  const signOut = useCallback(
    async (silent = false) => {
      try {
        await api.delete("auth/sign_out");
      } catch {
        /* ignore */
      } finally {
        if (!silent) {
          try {
            const p =
              window.location.pathname +
              window.location.search +
              window.location.hash;
            if (p.startsWith("/") && !p.startsWith("//"))
              sessionStorage.setItem("auth:from", p);
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
        if (!silent && !IS_E2E) window.location.replace("/login");
      }
    },
    [clearTokens]
  );

  // ---- Axios インターセプタ（送信前付与 / 受信後保存 / 401ワンショット再送）----
  useEffect(() => {
    const reqId = api.interceptors.request.use((config) => {
      const headers = AxiosHeaders.from(config.headers);

      const at = localStorage.getItem("access-token");
      const client = localStorage.getItem("client");
      const luid = localStorage.getItem("uid");
      const tokenType = localStorage.getItem("token-type") || "Bearer";

      if (at && client && luid) {
        headers.set("access-token", at);
        headers.set("client", client);
        headers.set("uid", luid);
        headers.set("token-type", tokenType);
        headers.set("Authorization", `${tokenType} ${at}`);
      }

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
          (res.headers as AxiosResponseHeaders) ||
            (res.headers as RawAxiosResponseHeaders),
          startedAtMs,
          lastSavedAtRef,
          applyTokensToAxios,
          saveTokens
        );
        return res;
      },
      async (error) => {
        // 401 → 最新トークンで 1 回だけ再送（devise_token_auth のトークンローテ対策）
        const status = error?.response?.status;
        const cfg = error?.config as any;

        if (status === 401 && cfg && !cfg._retry) {
          cfg._retry = true;
          const t = loadTokens();
          if (t.at && t.client && t.uid) {
            if (cfg.headers?.set) {
              cfg.headers.set("access-token", t.at);
              cfg.headers.set("client", t.client);
              cfg.headers.set("uid", t.uid);
              cfg.headers.set("token-type", t.tokenType || "Bearer");
              cfg.headers.set(
                "Authorization",
                `${t.tokenType || "Bearer"} ${t.at}`
              );
            } else {
              cfg.headers = {
                ...(cfg.headers || {}),
                "access-token": t.at,
                client: t.client,
                uid: t.uid,
                "token-type": t.tokenType || "Bearer",
                Authorization: `${t.tokenType || "Bearer"} ${t.at}`,
              };
            }
            try {
              return await api.request(cfg);
            } catch {
              /* fall through */
            }
          }
        }

        if (status === 401) {
          try {
            const p =
              window.location.pathname +
              window.location.search +
              window.location.hash;
            if (p.startsWith("/") && !p.startsWith("//"))
              sessionStorage.setItem("auth:from", p);
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
          if (!IS_E2E) window.location.replace("/login");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, [applyTokensToAxios, saveTokens, clearTokens, loadTokens]);

  // ---- 別タブ更新などの同期 ----
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

  // ---- authed になったら /me を取得 ----
  useEffect(() => {
    if (authed) fetchMe();
  }, [authed, fetchMe]);

  // ---- 明示的リフレッシュ（ゲストログイン/復帰など）----
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

export { AuthProvider };
export default AuthProvider;
