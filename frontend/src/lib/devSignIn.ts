// src/lib/devSignIn.ts
import { api } from "./apiClient";

export async function devSignIn() {
  await api.post("/api/auth/sign_in", {
    email: "dev@example.com",
    password: "password",
  });
  // レスポンスヘッダのトークンは interceptor が自動保存
}
