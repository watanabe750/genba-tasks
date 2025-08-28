// src/lib/apiClient.ts
import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const at = localStorage.getItem("access-token");
  const client = localStorage.getItem("client");
  const uid = localStorage.getItem("uid");
  config.headers = config.headers ?? {};
  if (at && client && uid) {
    (config.headers as any)["access-token"] = at;
    (config.headers as any)["client"] = client;
    (config.headers as any)["uid"] = uid;
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    const at = res.headers["access-token"];
    const client = res.headers["client"];
    const uid = res.headers["uid"];
    if (at && client && uid) {
      localStorage.setItem("access-token", at);
      localStorage.setItem("client", client);
      localStorage.setItem("uid", uid);
    }
    return res;
  },
  (err) => Promise.reject(err)
);

export { isAxiosError } from "axios";
