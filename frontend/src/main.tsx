// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { AppRouter } from "./router/AppRouter";
import AuthProvider from "./providers/AuthContext";
import { TaskDrawerProvider } from "./features/drawer/useTaskDrawer";
import { ToastProvider } from "./components/ToastProvider";
import { SidebarProvider } from "./contexts/SidebarContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

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
  // 本番環境ではエラートラッキングサービスに送信
  // 例: Sentry.captureException(event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // 本番環境ではエラートラッキングサービスに送信
  // 例: Sentry.captureException(event.reason);
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
