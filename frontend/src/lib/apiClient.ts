// src/lib/apiClient.ts
import axios, { AxiosHeaders, isCancel, type AxiosResponseHeaders } from "axios";

const base =
  import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")}/api`
    : "/api";

const api = axios.create({
  baseURL: base,
  withCredentials: false,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

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

// 追加：どこからでも使える保存ヘルパ
export function saveAuthFromHeaders(headers: AxiosResponseHeaders | Headers) {
  const getter =
    headers instanceof Headers
      ? (k: string) => headers.get(k) ?? headers.get(k.toLowerCase()) ?? undefined
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

// リクエスト前：未認証の非認証系 API をブロック＆トークン付与
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

  if (!authed && !isWhitelisted) {
    return Promise.reject(new axios.Cancel("unauthenticated: blocked by apiClient"));
  }

  if (authed) {
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
    saveAuthFromHeaders(res.headers as any);
    return res;
  },
  (error) => {
    if (isCancel(error)) return Promise.reject(error);
    return Promise.reject(error);
  }
);

export default api;
