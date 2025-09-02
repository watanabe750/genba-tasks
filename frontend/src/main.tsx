// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import { AppRouter } from "./router/AppRouter";
import { AuthProvider } from "./providers/AuthContext";
import { TaskDrawerProvider } from "./features/drawer/useTaskDrawer";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

window.addEventListener("auth:logout", () => {
  queryClient.clear();
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TaskDrawerProvider>
          <AppRouter />
        </TaskDrawerProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
