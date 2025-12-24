// frontend/src/lib/apiClient.ts
import axios, { AxiosHeaders, isCancel } from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { demoStore } from "./demoStore";
import { tokenStorage } from "./tokenStorage";

/** ===== Base URL =====
 * .env: VITE_API_BASE_URL="https://xxxx.execute-api.ap-northeast-1.amazonaws.com/prod"
 * ここでは末尾の / を除くだけ（/api は付けない）
 */
const base = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")
  : "/";

const api = axios.create({
  baseURL: base,
  withCredentials: true,  // Cookie送信を有効化（httpOnly Cookie認証に必須）
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

/** ===== Flags / Const ===== */
const DEMO = import.meta.env.VITE_DEMO_MODE === "true";

/** 認証不要で通すパス */
const AUTH_WHITELIST = [
  /^\/auth(?:\/|$)/, // /auth と /auth/ で始まるパスを許可（登録: POST /auth, ログイン: POST /auth/sign_in）
  /^\/omniauth\//,
  /^\/healthz?$/,
  /\/guest\/login$/, // ← 末尾が /guest/login なら許可（/prod/guest/login も通る）
];

/**
 * httpOnly Cookie認証では、トークンはサーバー側でCookieに自動設定されるため、
 * フロントエンドでのヘッダー処理は不要
 */

/** ===== Request interceptor ===== */
api.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);

  // CSRF トークンをヘッダーに追加（Cookie認証時のCSRF対策）
  if (!DEMO) {
    const csrfToken = tokenStorage.getCsrfToken();
    if (csrfToken) {
      headers.set("X-XSRF-TOKEN", csrfToken);
    }
  }

  headers.set("x-auth-start", String(Date.now()));

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    headers.delete("Content-Type");
  }

  config.headers = headers;
  return config;
});

/** ===== Response interceptor ===== */
api.interceptors.response.use(
  (res) => {
    // httpOnly Cookie認証では、サーバーが自動でCookieを設定するため特別な処理は不要
    return res;
  },
  (error) => {
    if (isCancel(error)) return Promise.reject(error);

    // 401エラーの場合は認証エラーとしてログインページへ誘導
    if (error.response?.status === 401 && !DEMO) {
      // 既にログインページにいる場合はリダイレクトしない
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

/** ===== DEMO adapter =====
 * axios をネットワークに出さず、その場でレスポンスを返す
 */
if (DEMO) {
  api.defaults.adapter = async function demoAdapter(
    cfg: InternalAxiosRequestConfig,
  ): Promise<AxiosResponse> {
    const method = (cfg.method || "get").toLowerCase();
    const u = new URL(cfg.url!, cfg.baseURL || window.location.origin);
    const path = u.pathname.replace(/^\/api(\/|$)/, "/");

    // 共通レスポンス
    const ok = <T = unknown>(data: T, status = 200, headers: Record<string, string> = {}): AxiosResponse<T> => ({
      data,
      status,
      statusText: status === 201 ? "Created" : "OK",
      headers,
      config: cfg,
    });
    const noContent = (status = 204): AxiosResponse => ({
      data: "",
      status,
      statusText: "No Content",
      headers: {},
      config: cfg,
    });
    const notFound = (msg = "Not Found"): AxiosResponse => ({
      data: { error: msg },
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: cfg,
    });

    // ---- 0) 認証系（デモでは成功扱い）----
    if (path === "/auth/sign_in" && method === "post") {
      // 擬似トークンを返却（フロントはこれを保存しないが影響なし）
      const demoHeaders = {
        "access-token": "demo-token",
        client: "demo-client",
        uid: "demo@example.com",
        "token-type": "Bearer",
        expiry: String(Math.floor(Date.now() / 1000) + 3600),
      };
      return ok({ data: { uid: "demo@example.com" } }, 200, demoHeaders);
    }
    if (path === "/auth/sign_out" && method === "delete") {
      return noContent();
    }

    // ---- 1) ヘルスチェック ----
    if (method === "get" && (path === "/health" || path === "/healthz")) {
      return ok({ status: "ok", mode: "demo" });
    }

    // ---- 2) /me ----
    if (path === "/me" && method === "get") {
      return ok({ email: "demo@example.com", name: "Demo User" });
    }

    // ---- 3) タスク一覧／作成 ----
    if (path === "/tasks" && method === "get") {
      // クエリパラメータを取得（axiosのparamsオブジェクトから直接取得）
      console.log("[DEMO] cfg.params:", cfg.params);
      console.log("[DEMO] u.searchParams site:", u.searchParams.get("site"));
      const site = cfg.params?.site || u.searchParams.get("site") || undefined;
      console.log("[DEMO] Fetching tasks with site filter:", site);
      const tasks = demoStore.list({ site });
      console.log("[DEMO] Filtered tasks count:", tasks.length);
      return ok(tasks);
    }
    if (path === "/tasks" && method === "post") {
      const payload =
        cfg.data && typeof cfg.data === "string"
          ? JSON.parse(cfg.data)
          : cfg.data;
      const nested = payload?.task ?? payload ?? {};
      return ok(demoStore.create(nested), 201);
    }

    // ---- 4) 個別タスク／画像 ----
    const mTask = path.match(/^\/tasks\/(\d+)(?:\/(image))?$/);
    if (mTask) {
      const id = Number(mTask[1]);
      const sub = mTask[2]; // "image" or undefined
      if (!sub) {
        if (method === "get") {
          const t = demoStore.get(id);
          return t ? ok(t) : notFound();
        }
        if (method === "patch") {
          const body =
            cfg.data && typeof cfg.data === "string"
              ? JSON.parse(cfg.data)
              : cfg.data;
          const patch = body?.task ?? body ?? {};
          const t = demoStore.update(id, patch);
          return t ? ok(t) : notFound();
        }
        if (method === "delete") {
          demoStore.remove(id);
          return noContent();
        }
      } else if (sub === "image") {
        if (method === "post") return ok({ url: null }, 201);
        if (method === "delete") return noContent();
      }
    }

    // ---- 5) 補助API ----
    if (path === "/tasks/sites" && method === "get") return ok(demoStore.sites());
    if (path === "/tasks/priority" && method === "get")
      return ok(demoStore.priority());

    // 未対応
    return notFound(
      `DEMO adapter has no handler for ${method.toUpperCase()} ${path}`,
    );
  };
}

export default api;

