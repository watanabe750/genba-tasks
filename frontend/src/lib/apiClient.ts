// src/lib/apiClient.ts
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ← トークン注入/保存は AuthContext 側でやる
//    ここでは FormData のときだけ Content-Type を外す
api.interceptors.request.use((config) => {
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if ((config.headers as any)?.["Content-Type"]) {
      delete (config.headers as any)["Content-Type"];
    }
  }
  return config;
});

// レスポンス側でのトークン保存は **削除**
export default api;
