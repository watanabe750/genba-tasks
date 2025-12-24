/* eslint-disable react-refresh/only-export-components */
import type React from "react";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../lib/apiClient";
import { tokenStorage } from "../lib/tokenStorage";

export type AuthContextValue = {
  authed: boolean;
  uid: string | null;
  name: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  signOut: (silent?: boolean) => Promise<void>;
  guestSignIn: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

/** navigator型の拡張（webdriverプロパティ対応） */
interface ExtendedNavigator {
  webdriver?: boolean;
  userAgent: string;
}

/** E2E 実行中かどうか（Playwright/Headless を検知） */
const IS_E2E =
  typeof navigator !== "undefined" &&
  (((navigator as ExtendedNavigator).webdriver ?? false) ||
    /Playwright|Headless/i.test(navigator.userAgent));

function AuthProvider({ children }: { children: React.ReactNode }) {
  // httpOnly Cookie認証では、初期認証状態はサーバーに問い合わせて確認
  const [authed, setAuthed] = useState<boolean>(false);
  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);

  const clearAuth = useCallback(() => {
    tokenStorage.clear();
    setAuthed(false);
    setUid(null);
    setName(null);
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get("me");
      setName(res.data?.name ?? null);
      if (typeof res.data?.email === "string") {
        setUid(res.data.email);
      }
      setAuthed(true);
    } catch {
      // 認証エラーの場合はクリア
      clearAuth();
    }
  }, [clearAuth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await api.post("auth/sign_in", { email, password });
      // httpOnly Cookieはサーバー側で自動設定される
      setAuthed(true);
      setUid(email);
      await fetchMe();
    },
    [fetchMe]
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string, passwordConfirmation: string) => {
      await api.post("auth", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      // httpOnly Cookieはサーバー側で自動設定される
      setAuthed(true);
      setUid(email);
      setName(name);
      await fetchMe();
    },
    [fetchMe]
  );

  const guestSignIn = useCallback(async () => {
    await api.post("guest/login");
    // httpOnly Cookieはサーバー側で自動設定される
    await fetchMe();
  }, [fetchMe]);

  const signOut = useCallback(
    async (silent = false) => {
      try {
        await api.delete("auth/sign_out");
      } catch {
        /* ignore */
      } finally {
        if (!silent) {
          try {
            const p =
              window.location.pathname +
              window.location.search +
              window.location.hash;
            if (p.startsWith("/") && !p.startsWith("//"))
              sessionStorage.setItem("auth:from", p);
          } catch {
            /* ignore */
          }
        }
        clearAuth();
        try {
          window.dispatchEvent(new Event("auth:logout"));
        } catch {
          /* ignore */
        }
        if (!silent && !IS_E2E) window.location.replace("/login");
      }
    },
    [clearAuth]
  );

  // 初回マウント時に認証状態を確認
  useEffect(() => {
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 明示的リフレッシュ（ゲストログイン/復帰など）----
  useEffect(() => {
    const onRefresh = () => {
      fetchMe();
    };
    window.addEventListener("auth:refresh", onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      window.removeEventListener("auth:refresh", onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, [fetchMe]);

  const value = useMemo<AuthContextValue>(
    () => ({ authed, uid, name, signIn, signUp, signOut, guestSignIn }),
    [authed, uid, name, signIn, signUp, signOut, guestSignIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthProvider };
export default AuthProvider;
