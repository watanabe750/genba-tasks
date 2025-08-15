// src/lib/devSignIn.ts
import { api } from "./apiClient";

export async function devSignIn() {
    console.log("[devSignIn] click!");
    try {
        const res = await api.post("/auth/sign_in", {
            email: "dev@example.com",
            password: "password",
        });
        console.log("[devSignIn] ok", res.status, res.headers);
        alert("開発用ログイン 成功");
        return res.data;
    } catch (e) {
        console.error("[devSignIn] failed", e);
        alert("開発用ログイン 失敗");
        throw e;
    }
  // レスポンスヘッダのトークンは interceptor が自動保存
}
