// src/features/auth/AuthProvider.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { signIn as apiSignIn, signOut as apiSignOut } from "../../lib/apiClient";
// （任意）サインアウト時にキャッシュを消したいなら↓を使う
// import { useQueryClient } from "@tanstack/react-query";

type AuthContextValue = {
    authed: boolean;
    uid: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readUidFromTokens(): string | null {
  try {
    const raw = localStorage.getItem("authTokens");
    if (!raw) return null;
    const obj = JSON.parse(raw) as { uid?: string };
    return typeof obj.uid === "string" ? obj.uid : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  // const qc = useQueryClient(); // ← 使うならコメントアウト解除

  // 初期化：ページ再読み込み後もログイン状態を復元
  useEffect(() => {
    const u = readUidFromTokens();
    if (u) {
      setAuthed(true);
      setUid(u);
    }
    // apiClient 側で 401 を受け取ったら "auth:logout" を投げる実装なら、ここで購読
    const onLogout = () => {
      setAuthed(false);
      setUid(null);
      // qc.clear(); // ← 使いたければ
    };
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await apiSignIn(email, password); // interceptor がトークン保存
    const u = readUidFromTokens();
    setAuthed(true);
    setUid(u);
  }, []);

  const signOut = useCallback(() => {
    apiSignOut();      // トークン破棄（apiClient.signOut は clearTokens を呼ぶ想定）
    setAuthed(false);
    setUid(null);
    // qc.clear();     // ← 必要なら
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ authed, uid, signIn, signOut }),
    [authed, uid, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 別ファイルに出してもOK
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
