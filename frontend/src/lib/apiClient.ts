// src/lib/apiClient.ts
import axios from "axios";

export const api = axios.create({ baseURL: "/" });

api.interceptors.request.use((config) => {
  const at = localStorage.getItem("access-token");
  const cl = localStorage.getItem("client");
  const uid = localStorage.getItem("uid");
  if (at && cl && uid) {
    config.headers["access-token"] = at;
    config.headers["client"] = cl;
    config.headers["uid"] = uid;
  }
  return config;
});

api.interceptors.response.use((res) => {
  const at = res.headers["access-token"];
  const cl = res.headers["client"];
  const uid = res.headers["uid"];
  if (at && cl && uid) {
    localStorage.setItem("access-token", at);
    localStorage.setItem("client", cl);
    localStorage.setItem("uid", uid);
  }
  return res;
});
