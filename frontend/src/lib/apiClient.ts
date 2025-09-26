// frontend/src/lib/apiClient.ts
import axios, {
  AxiosHeaders,
  isCancel,
  type AxiosResponseHeaders,
} from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { demoStore } from "./demoStore";

const base = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")}/api`
  : "/api";

const api = axios.create({
  baseURL: base,
  withCredentials: false,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

// DEMOモード（.envで VITE_DEMO_MODE=true を想定）
const DEMO = import.meta.env.VITE_DEMO_MODE === "true";

const AUTH_WHITELIST = [/^\/auth\//, /^\/omniauth\//, /^\/healthz?$/];

function getHeader(h: unknown, key: string): string | undefined {
  if (h instanceof AxiosHeaders) {
    const v = h.get(key);
    return typeof v === "string" ? v : undefined;
  }
  const rec = h as Record<string, unknown> | undefined;
  const v = rec?.[key] ?? rec?.[key.toLowerCase()];
  return typeof v === "string" ? v : undefined;
}

// どこからでも使える保存ヘルパ
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

// リクエスト前：未認証ブロック＆トークン付与（DEMO時はネットワーク出さない想定）
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

  // DEMO中はブロックしない（そもそも adapter が拾う）
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
    headers.delete("Content-Type");
  }

  config.headers = headers;
  return config;
});

// レスポンスで新トークンが来たら保存
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

// ==== DEMOアダプタ：axiosをネットワークに出さずローカルで返す ====
if (DEMO) {
  api.defaults.adapter = async function demoAdapter(
    cfg: InternalAxiosRequestConfig,
  ): Promise<AxiosResponse> {
    const method = (cfg.method || "get").toLowerCase();
    const u = new URL(cfg.url!, cfg.baseURL || window.location.origin);
    const path = u.pathname.replace(/^\/api(\/|$)/, "/");

    // 共通ヘルパ
    const ok = (data: any, status = 200): AxiosResponse => ({
      data,
      status,
      statusText: "OK",
      headers: {},
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

    // ① ヘルスチェック
    if (method === "get" && (path === "/health" || path === "/healthz")) {
      return ok({ status: "ok", mode: "demo" });
    }

    // ② タスクリスト /tasks
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

    // ③ 個別 /tasks/:id(/image)
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
          // reorder: { after_id } もここで吸収
          const patch = body?.task ?? body ?? {};
          const t = demoStore.update(id, patch);
          return t ? ok(t) : notFound();
        }
        if (method === "delete") {
          demoStore.remove(id);
          return noContent();
        }
      } else if (sub === "image") {
        // デモではNO-OP
        if (method === "post") return ok({ url: null }, 201);
        if (method === "delete") return noContent();
      }
    }

    // ④ 補助API
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
