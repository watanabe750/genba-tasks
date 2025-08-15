// src/lib/apiClient.ts
import axios, {
  AxiosHeaders,
  isAxiosError,
  type AxiosResponseHeaders,
  type RawAxiosResponseHeaders,
} from "axios";

export const api = axios.create({ baseURL: "/api" });

const TOKENS_KEY = "authTokens";

type Tokens = {
  uid: string;
  client: string;
  "access-token": string;
  expiry?: string;
  "token-type"?: string;
};

function getTokens(): Tokens | null {
  const raw = localStorage.getItem(TOKENS_KEY);
  if (!raw) return null;
  try {
    const t = JSON.parse(raw) as Tokens;
    if (t.uid && t.client && t["access-token"]) return t;
  } catch {
    /* ignore JSON parse error */
  }
  return null;
}

export function clearTokens() {
  localStorage.removeItem(TOKENS_KEY);
}

function saveTokensFromHeaders(h: AxiosResponseHeaders | RawAxiosResponseHeaders) {
  const at = h["access-token"];
  const cl = h["client"];
  const uid = h["uid"];
  if (typeof at === "string" && typeof cl === "string" && typeof uid === "string") {
    const t: Tokens = {
      uid,
      client: cl,
      "access-token": at,
      expiry: typeof h["expiry"] === "string" ? h["expiry"] : undefined,
      "token-type": typeof h["token-type"] === "string" ? h["token-type"] : undefined,
    };
    localStorage.setItem(TOKENS_KEY, JSON.stringify(t));
  }
}

// ----- Interceptors -----
api.interceptors.request.use((config) => {
  const t = getTokens();
  if (t) {
    const h = AxiosHeaders.from(config.headers); // 既存を元に生成
    h.set("uid", t.uid);
    h.set("client", t.client);
    h.set("access-token", t["access-token"]);
    config.headers = h; // AxiosHeaders インスタンスを戻す
  }
  return config;
});

api.interceptors.response.use(
  (res) => {
    // 毎回ヘッダ更新があれば保存
    saveTokensFromHeaders(res.headers as AxiosResponseHeaders & RawAxiosResponseHeaders);
    return res;
  },
  (err) => {
    if (isAxiosError(err) && err.response?.status === 401) {
      clearTokens();
      window.dispatchEvent(new Event("auth:logout")); // UIに未ログインを通知
    }
    return Promise.reject(err);
  }
);

// ----- API helpers -----
export async function signIn(email: string, password: string) {
  const res = await api.post("/auth/sign_in", { email, password });
  saveTokensFromHeaders(res.headers as AxiosResponseHeaders & RawAxiosResponseHeaders);
  return res.data;
}
export function signOut() {
  clearTokens();
}
export async function fetchTasks() {
  const res = await api.get("/tasks");
  return res.data;
}
export { isAxiosError }; // 必要なら再エクスポート