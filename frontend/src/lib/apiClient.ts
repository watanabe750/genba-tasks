import axios from "axios";

export const api = axios.create({ baseURL: "/" });

api.interceptors.request.use((config) => {
  // 認証トークンを付与する場合はここ
  // const token = localStorage.getItem("access-token");
  // if (token) config.headers['access-token'] = token;
  return config;
});
