// src/lib/apiClient.ts
import axios from "axios";

export const api = axios.create({ baseURL: "/api" }); // Viteのproxyを使う前提

const TOKENS_KEY = "authTokens";
type Tokens = {
  uid: string;
  client: string;
  "access-token": string;
  expiry?: string;
  "token-type"?: string;
};

function saveTokens(h: Record<string, string | undefined>) {
  const t: Tokens = {
    uid: h["uid"] ?? "",
    client: h["client"] ?? "",
    "access-token": h["access-token"] ?? "",
    expiry: h["expiry"],
    "token-type": h["token-type"],
  };
  if (t.uid && t.client && t["access-token"]) {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(t));
  }
}

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem(TOKENS_KEY);
  if (raw) {
    const t = JSON.parse(raw) as Tokens;
    config.headers = {
      ...(config.headers || {}),
      uid: t.uid,
      client: t.client,
      "access-token": t["access-token"],
    };
  }
  return config;
});

api.interceptors.response.use((res) => {
  if (res.headers["access-token"]) saveTokens(res.headers as any);
  return res;
});

// 便利ヘルパ
export async function signIn(email: string, password: string) {
  const res = await api.post("/auth/sign_in", { email, password });
  saveTokens(res.headers as any);
  return res.data;
}

export async function fetchTasks() {
  const res = await api.get("/tasks");
  return res.data;
}
