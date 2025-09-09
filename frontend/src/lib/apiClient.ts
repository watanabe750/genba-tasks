// src/lib/apiClient.ts
import axios, { AxiosHeaders, isCancel } from "axios";

// 既存ロジックを尊重して base を作る（VITE_API_BASE_URL があれば /api を付ける）
const base =
  import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")}/api`
    : "/api";

const api = axios.create({
  baseURL: base,
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ★ ここを追加：毎回 localStorage からヘッダを差し込む
api.interceptors.request.use((config) => {
  // FormData のときは Content-Type を外す（既存の処理）
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if ((config.headers as any)?.["Content-Type"]) {
      delete (config.headers as any)["Content-Type"];
    }
  }

  try {
    const at     = localStorage.getItem("access-token");
    const client = localStorage.getItem("client");
    const uid    = localStorage.getItem("uid");
    const type   = localStorage.getItem("token-type") || "Bearer";

    if (at && client && uid) {
      (config.headers as any)["access-token"] = at;
      (config.headers as any)["client"]       = client;
      (config.headers as any)["uid"]          = uid;
      (config.headers as any)["token-type"]   = type;
      (config.headers as any)["Authorization"] = `${type} ${at}`;
    }
  } catch {
    /* ignore */
  }

  return config;
});


// 未ログインでも許可するAPI（認証系だけ）
const AUTH_WHITELIST = [/^\/auth\//, /^\/omniauth\//, /^\/healthz?$/];

// 小物ヘルパ
function getHeader(h: unknown, key: string): string | undefined {
  if (h instanceof AxiosHeaders) {
    const v = h.get(key);
    return typeof v === "string" ? v : undefined;
  }
  const rec = h as Record<string, unknown> | undefined;
  const v = rec?.[key] ?? rec?.[key.toLowerCase()];
  return typeof v === "string" ? v : undefined;
}

// ★ リクエスト前フック
api.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);

  // 絶対URL化して path を取り、/api の有無に影響されないよう判定
  const urlObj = new URL(config.url!, config.baseURL || window.location.origin);
  // 例: /api/tasks -> /tasks に正規化
  const path = urlObj.pathname.replace(/^\/api(\/|$)/, "/");

  const at = localStorage.getItem("access-token");
  const client = localStorage.getItem("client");
  const uid = localStorage.getItem("uid");
  const tokenType = localStorage.getItem("token-type") || "Bearer";
  const authed = !!(at && client && uid);
  const isWhitelisted = AUTH_WHITELIST.some((re) => re.test(path));

  // 未ログインで、認証系以外のAPIはブロック（401の嵐防止）
  if (!authed && !isWhitelisted) {
    return Promise.reject(new axios.Cancel("unauthenticated: blocked by apiClient"));
  }

  // 送るなら token を必ず付ける（あれば）
  if (authed) {
    headers.set("access-token", at!);
    headers.set("client", client!);
    headers.set("uid", uid!);
    headers.set("token-type", tokenType);
    headers.set("Authorization", `${tokenType} ${at}`);
  }

  // 並行競合用タイムスタンプ（AuthContext と整合してOK）
  headers.set("x-auth-start", String(Date.now()));

  // FormData のときは Content-Type を外す（ブラウザに任せる）
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    headers.delete("Content-Type");
  }

  config.headers = headers;
  return config;
});

// ★ レスポンスで新トークンが来たら保存（AuthContext の保存とも競合しない）
api.interceptors.response.use(
  (res) => {
    const h = res.headers;
    const at = getHeader(h, "access-token");
    const client = getHeader(h, "client");
    const uid = getHeader(h, "uid");
    const tokenType = getHeader(h, "token-type");
    const expiry = getHeader(h, "expiry");

    if (at && client && uid) {
      localStorage.setItem("access-token", at);
      localStorage.setItem("client", client);
      localStorage.setItem("uid", uid);
      if (tokenType) localStorage.setItem("token-type", tokenType);
      if (expiry) localStorage.setItem("expiry", expiry);
    }
    return res;
  },
  (error) => {
    // こちらでブロックしただけのケースはそのまま返す
    if (isCancel(error)) return Promise.reject(error);
    return Promise.reject(error);
  }
);

export default api;
