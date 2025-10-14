// frontend/src/lib/apiClient.ts
import axios, {
  AxiosHeaders,
  isCancel,
  type AxiosResponseHeaders,
} from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { demoStore } from "./demoStore";

/** ===== Base URL =====
 * .env: VITE_API_BASE_URL="http://localhost:3000"
 * → 実URLは `${VITE_API_BASE_URL}/api`
 * 未設定なら相対 "/api"
 */
const base = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")   // ← /api を足さない
  : "/";

const api = axios.create({
  baseURL: base,
  withCredentials: false,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

/** ===== Flags / Const ===== */
const DEMO = import.meta.env.VITE_DEMO_MODE === "true";

/** 認証不要で通すパス */
const AUTH_WHITELIST = [
  /^\/auth\//,       // /auth/sign_in, /auth/sign_out など
  /^\/omniauth\//,
  /^\/healthz?$/,
  /^\/guest\/login$/, 
];

/** ===== Header helpers ===== */
function getHeader(h: unknown, key: string): string | undefined {
  if (h instanceof AxiosHeaders) {
    const v = h.get(key) ?? h.get(key.toLowerCase());
    return typeof v === "string" ? v : undefined;
  }
  const rec = h as Record<string, unknown> | undefined;
  const v = rec?.[key] ?? rec?.[key.toLowerCase()];
  return typeof v === "string" ? v : undefined;
}

/** 任意の Headers/AxiosResponseHeaders からトークン保存 */
export function saveAuthFromHeaders(headers: AxiosResponseHeaders | Headers) {
  const getter =
    headers instanceof Headers
      ? (k: string) =>
          headers.get(k) ?? headers.get(k.toLowerCase()) ?? undefined
      : (k: string) => getHeader(headers as any, k);

  const at = getter("access-token");
  const client = getter("client");
  const uid = getter("uid");
  const tokenType = getter("token-type");
  const expiry = getter("expiry");

  if (at && client && uid) {
    localStorage.setItem("access-token", at);
    localStorage.setItem("client", client);
    localStorage.setItem("uid", uid);
    if (tokenType) localStorage.setItem("token-type", tokenType);
    if (expiry) localStorage.setItem("expiry", expiry);
  }
}

/** ===== Request interceptor =====
 * - 未認証ブロック（ホワイトリストは許可）
 * - トークン付与
 * - x-auth-start で開始時刻埋め込み
 * - FormData のときは Content-Type を消す
 */
api.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  const urlObj = new URL(config.url!, config.baseURL || window.location.origin);
  const path = urlObj.pathname.replace(/^\/api(\/|$)/, "/");

  const at = localStorage.getItem("access-token");
  const client = localStorage.getItem("client");
  const uid = localStorage.getItem("uid");
  const tokenType = localStorage.getItem("token-type") || "Bearer";
  const authed = !!(at && client && uid);
  const isWhitelisted = AUTH_WHITELIST.some((re) => re.test(path));

  // DEMO はブロックなし。通常は未認証でホワイト以外をブロック
  if (!DEMO && !authed && !isWhitelisted) {
    return Promise.reject(
      new axios.Cancel("unauthenticated: blocked by apiClient"),
    );
  }

  if (!DEMO && authed) {
    headers.set("access-token", at!);
    headers.set("client", client!);
    headers.set("uid", uid!);
    headers.set("token-type", tokenType);
    headers.set("Authorization", `${tokenType} ${at}`);
  }

  headers.set("x-auth-start", String(Date.now()));

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    headers.delete("Content-Type"); // ブラウザに任せる
  }

  config.headers = headers;
  return config;
});

/** ===== Response interceptor =====
 * - 新トークンが来たら保存（DEMOは保存不要）
 */
api.interceptors.response.use(
  (res) => {
    if (!DEMO) saveAuthFromHeaders(res.headers as any);
    return res;
  },
  (error) => {
    if (isCancel(error)) return Promise.reject(error);
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
    const ok = (data: any, status = 200, headers: Record<string, string> = {}): AxiosResponse => ({
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
      return ok(demoStore.list());
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

