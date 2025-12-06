// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react";
import "./index.css";
import { AppRouter } from "./router/AppRouter";
import AuthProvider from "./providers/AuthContext";
import { TaskDrawerProvider } from "./features/drawer/useTaskDrawer";
import { ToastProvider } from "./components/ToastProvider";
import { SidebarProvider } from "./contexts/SidebarContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Sentry初期化
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // パフォーマンス監視のサンプリングレート（本番では0.1-0.3推奨）
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
    // セッションリプレイのサンプリングレート
    replaysSessionSampleRate: 0.1,
    // エラー時のリプレイサンプリングレート
    replaysOnErrorSampleRate: 1.0,
  });
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

// auth:logout でキャッシュ全消し
window.addEventListener("auth:logout", () => {
  queryClient.clear();
});

// auth:refresh で「全アクティブクエリを無効化→即時再取得」
const onAuthRefresh = () => {
  queryClient.invalidateQueries();
  queryClient.refetchQueries();
};
window.addEventListener("auth:refresh", onAuthRefresh);

// グローバルエラーハンドリング
window.addEventListener("error", (event) => {
  console.error("Global error caught:", event.error);
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(event.error);
  }
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(event.reason);
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SidebarProvider>
            <TaskDrawerProvider>
              <ToastProvider>
                <AppRouter />
              </ToastProvider>
            </TaskDrawerProvider>
          </SidebarProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
