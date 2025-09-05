// src/lib/apiClient.ts
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: false,
  headers: {
    Accept: "application/json",
    // ← Content-Type は基本JSONだが、FormDataのときはインターセプタで消す
    "Content-Type": "application/json",
  },
});

// ---- 認証ヘッダ注入 & multipart調整 ----
api.interceptors.request.use((config) => {
  // Devise Token Auth の各ヘッダをlocalStorageから注入
  const keys = ["access-token", "client", "uid", "token-type", "expiry"] as const;
  config.headers = config.headers ?? {};
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) (config.headers as any)[k] = v;
  }

  // data が FormData のときは Content-Type を削除（boundary 自動付与に任せる）
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if ((config.headers as any)["Content-Type"]) {
      delete (config.headers as any)["Content-Type"];
    }
  }

  return config;
});

// ---- トークンのローテーション反映 ----
api.interceptors.response.use((res) => {
  const keys = ["access-token", "client", "uid", "token-type", "expiry"] as const;
  for (const k of keys) {
    const v = res.headers?.[k];
    if (v) localStorage.setItem(k, v);
  }
  return res;
});

export default api;
