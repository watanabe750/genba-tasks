// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { AppRouter } from "./router/AppRouter";
import { AuthProvider } from "./providers/AuthContext";

// 追加
import { TaskDrawerProvider } from "./features/drawer/useTaskDrawer";
import { ToastProvider } from "./components/ToastProvider";

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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TaskDrawerProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </TaskDrawerProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
