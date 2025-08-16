// src/lib/apiClient.ts
import axios from "axios";

// 認証ヘッダの付与/削除と 401 ハンドリングは
// AuthProvider（providers/AuthContext）が担当します。
export const api = axios.create({
  baseURL: "/api",
});

// 必要なら他で使う型ユーティリティだけ再エクスポート
export { isAxiosError } from "axios";
